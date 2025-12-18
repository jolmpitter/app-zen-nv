import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId || session.user.role !== 'cio') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const logs = await prisma.auditLog.findMany({
            where: { companyId: session.user.companyId },
            include: {
                user: { select: { name: true, role: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
