import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import axios from 'axios';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Formato Evolution API: { event: 'messages.upsert', instance: 'name', data: { ... } }
        const { event, instance: instanceName, data } = body;

        if (!event || !instanceName || !data) {
            // Pode ser um teste ou outro formato, vamos logar
            console.log('[WEBHOOK] Formato desconhecido:', body);
            return NextResponse.json({ message: 'Payload format not recognized' });
        }

        // 1. Verificar se a instância existe no nosso banco (buscando pelo nome sanitizado ou original)
        // O nome no banco pode estar com espaços, mas na Evolution foi sanitizado
        const instance = await prisma.whatsAppInstance.findFirst({
            where: {
                OR: [
                    { name: instanceName },
                    { name: instanceName.replace(/_/g, ' ') }
                ]
            },
            include: { company: true }
        });

        if (!instance) {
            console.error(`[WEBHOOK] Instância não encontrada no banco: ${instanceName}`);
            return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
        }

        // 2. Processar apenas mensagens recebidas (MESSAGES_UPSERT)
        if (event !== 'messages.upsert') {
            return NextResponse.json({ message: 'Event ignored' });
        }

        const messageData = data.message;
        const key = data.key;

        if (!messageData || key.fromMe) {
            return NextResponse.json({ message: 'Outgoing message or empty data ignored' });
        }

        const from = key.remoteJid.split('@')[0];
        const text = messageData.conversation || messageData.extendedTextMessage?.text || '';
        const companyId = instance.companyId;

        // 3. Buscar ou criar o Lead
        let lead = await prisma.lead.findFirst({
            where: {
                phone: from,
                companyId: companyId
            },
        });

        if (!lead) {
            // Criar novo lead automaticamente
            const funnel = await prisma.funnel.findFirst({
                where: { companyId },
                include: { steps: { orderBy: { order: 'asc' } } }
            });

            const fallbackUser = await prisma.user.findFirst({
                where: { companyId, role: { in: ['gerente', 'cio'] } }
            });

            if (!fallbackUser) {
                console.error(`[WEBHOOK] Erro: Nenhum usuário responsável para a empresa ${companyId}`);
                return NextResponse.json({ error: 'Company owner not found' }, { status: 404 });
            }

            lead = await prisma.lead.create({
                data: {
                    name: `Lead WhatsApp (${from})`,
                    phone: from,
                    status: 'novo',
                    source: 'WhatsApp',
                    companyId: companyId,
                    funnelId: funnel?.id,
                    stepId: funnel?.steps[0]?.id,
                    atendenteId: fallbackUser.id
                }
            });
        }

        // 4. Registrar a mensagem
        await prisma.message.create({
            data: {
                whatsappId: instance.id,
                leadId: lead.id,
                content: text || 'Mensagem de mídia ou outro tipo',
                fromMe: false,
                type: 'text',
                status: 'received'
            }
        });

        // 5. Notificar Socket Server para update em tempo real
        try {
            const socketUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            await axios.post(`${socketUrl}/api/socket/emit`, {
                event: 'new_message',
                data: {
                    leadId: lead.id,
                    from: lead.name,
                    content: text,
                    timestamp: new Date()
                }
            });
        } catch (e) {
            console.error('Socket notification skiped');
        }

        // 6. Processar Fluxos de Automação
        try {
            const { FlowProcessor } = await import('@/lib/whatsapp/flow-processor');
            await FlowProcessor.processMessage(instance.id, lead.id, text);
        } catch (e) {
            console.error('Error in flow processing:', e);
        }

        // 7. Histórico do lead
        await prisma.leadHistory.create({
            data: {
                leadId: lead.id,
                userId: lead.atendenteId,
                action: 'message_received',
                description: `Mensagem via WhatsApp: ${text?.substring(0, 50)}`,
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
