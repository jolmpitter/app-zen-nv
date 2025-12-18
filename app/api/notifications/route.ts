import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Buscar alertas (notificações) do usuário logado
        const alerts = await prisma.alert.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 20,
        });

        // Mapear para o formato do componente de notificações
        const notifications = alerts.map(a => ({
            id: a.id,
            title: a.title,
            message: a.message,
            type: a.severity === 'alta' || a.severity === 'critica' ? 'error' :
                a.severity === 'media' ? 'warning' : 'info',
            isRead: a.isRead,
            createdAt: a.createdAt,
        }));

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
    }
}
