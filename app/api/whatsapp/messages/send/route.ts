import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { evolutionApi } from '@/lib/whatsapp/evolution';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { leadId, text, instanceId } = await req.json();

        if (!leadId || !text || !instanceId) {
            return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
        }

        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
        });

        const instance = await prisma.whatsAppInstance.findUnique({
            where: { id: instanceId },
        });

        if (!lead || !instance || lead.companyId !== session.user.companyId || instance.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Lead ou Instância não encontrada' }, { status: 404 });
        }

        // Enviar via Evolution API
        // Sanitizar nome da instância (mesma lógica usada na criação)
        const instanceName = instance.name.replace(/\s+/g, '_').toLowerCase();

        const evolutionRes = await evolutionApi.sendMessage(
            instanceName,
            lead.phone,
            text
        );

        if (evolutionRes) {
            // Salvar no banco
            const message = await prisma.message.create({
                data: {
                    whatsappId: instanceId,
                    leadId: leadId,
                    content: text,
                    fromMe: true,
                    type: 'text',
                    status: 'sent',
                },
            });

            // Registrar no histórico do lead
            await prisma.leadHistory.create({
                data: {
                    leadId: leadId,
                    userId: session.user.id,
                    action: 'message_sent',
                    description: `Mensagem enviada via WhatsApp: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
                }
            });

            return NextResponse.json(message);
        }

        return NextResponse.json({ error: 'Erro ao enviar mensagem via WhatsApp' }, { status: 500 });

    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
