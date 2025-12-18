import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (session?.user?.role !== 'cio') {
            return NextResponse.json({ error: 'Acesso restrito ao CIO' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            include: {
                company: { select: { name: true } },
                gerente: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
    }
}
