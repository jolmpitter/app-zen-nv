import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const leadId = searchParams.get('leadId');

        if (!session?.user?.id || !leadId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const messages = await prisma.message.findMany({
            where: { leadId },
            orderBy: { timestamp: 'asc' },
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
