import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar leads que têm mensagens ou foram criados recentemente, 
        // priorizando os que têm interação
        const leads = await prisma.lead.findMany({
            where: {
                companyId: session.user.companyId,
                // Somente leads do WhatsApp ou que já tiveram alguma interação
                OR: [
                    { source: 'WhatsApp' },
                    { messages: { some: {} } }
                ]
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 50
        });

        // Formatar para o componente de chat
        const chats = leads.map(lead => ({
            id: lead.id,
            name: lead.name,
            lastMessage: lead.messages[0]?.content || 'Sem mensagens ainda',
            time: lead.messages[0]?.createdAt
                ? new Date(lead.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : new Date(lead.createdAt).toLocaleDateString(),
            unread: 0,
            status: 'online',
            avatar: undefined // Poderia ser URL de avatar se disponível
        }));

        return NextResponse.json(chats);
    } catch (error) {
        console.error('Error fetching chats:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
