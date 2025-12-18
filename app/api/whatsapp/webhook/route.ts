import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import axios from 'axios';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { from, text, instanceId, companyId } = body;

        if (!from || !instanceId || !companyId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Verificar se a instância existe
        const instance = await prisma.whatsAppInstance.findUnique({
            where: { id: instanceId },
        });

        if (!instance) {
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
        }

        // 2. Buscar ou criar o Lead
        let lead = await prisma.lead.findFirst({
            where: {
                phone: from,
                companyId: companyId
            },
        });

        if (!lead) {
            // Criar novo lead automaticamente
            // Buscar o primeiro funil da empresa para colocar o lead no passo 'Novo'
            const funnel = await prisma.funnel.findFirst({
                where: { companyId },
                include: { steps: { orderBy: { order: 'asc' } } }
            });

            // Buscar um atendente/gerente padrão para a empresa
            const fallbackUser = await prisma.user.findFirst({
                where: { companyId, role: { in: ['gerente', 'cio'] } }
            });

            if (!fallbackUser) {
                console.error(`[WEBHOOK] Erro: Nenhum usuário (gerente/cio) encontrado para a empresa ${companyId}`);
                return NextResponse.json({ error: 'Company owner not found' }, { status: 404 });
            }

            lead = await prisma.lead.create({
                data: {
                    name: `Novo Lead (${from})`,
                    phone: from,
                    status: 'novo',
                    source: 'WhatsApp',
                    companyId: companyId,
                    funnelId: funnel?.id,
                    stepId: funnel?.steps[0]?.id,
                    atendenteId: fallbackUser.id,
                    gerenteId: fallbackUser.role === 'gerente' ? fallbackUser.id : undefined
                }
            });
        }

        // 3. Registrar a mensagem
        await prisma.message.create({
            data: {
                whatsappId: instanceId,
                leadId: lead.id,
                content: text || '',
                fromMe: false,
                type: 'text',
                status: 'received'
            }
        });

        // 3.1 Notificar servidor de socket para atualização em tempo real
        try {
            await axios.post('http://localhost:3001/emit', {
                room: `company_${companyId}`,
                event: 'new_message',
                data: {
                    leadId: lead.id,
                    content: text || '',
                    from: from,
                    timestamp: new Date()
                }
            });
        } catch (err: any) {
            console.error('Socket notification failed:', err.message);
        }

        // 4. Registrar no histórico do lead
        await prisma.leadHistory.create({
            data: {
                leadId: lead.id,
                userId: lead.atendenteId, // Usa o atendente vinculado ao lead
                action: 'message_received',
                description: `Mensagem recebida via WhatsApp: ${text?.substring(0, 50)}${text?.length > 50 ? '...' : ''}`,
            }
        });

        return NextResponse.json({ success: true, leadId: lead.id });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET para validação de webhook (comum em APIs como Meta)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === 'polodash_secret_token') {
        return new Response(challenge, { status: 200 });
    }

    return NextResponse.json({ message: 'WhatsApp Webhook Active' });
}
