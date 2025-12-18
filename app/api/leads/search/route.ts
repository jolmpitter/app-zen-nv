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

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json([]);
        }

        const leads = await prisma.lead.findMany({
            where: {
                companyId: session.user.companyId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 10,
            include: {
                user: { select: { name: true } },
                funnel: { select: { name: true } },
                step: { select: { name: true } },
            },
        });

        return NextResponse.json(leads);
    } catch (error) {
        console.error('Lead search error:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
