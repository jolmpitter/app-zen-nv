import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const funnels = await prisma.funnel.findMany({
            where: { companyId: session.user.companyId },
            include: {
                steps: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        return NextResponse.json(funnels);
    } catch (error) {
        console.error('Error fetching funnels:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { name, steps } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const funnel = await prisma.funnel.create({
            data: {
                name,
                companyId: session.user.companyId,
                steps: {
                    create: steps?.map((step: any, index: number) => ({
                        name: step.name,
                        order: index,
                    })) || [
                            { name: 'Novo', order: 0 },
                            { name: 'Em Atendimento', order: 1 },
                            { name: 'Concluído', order: 2 },
                        ],
                },
            },
            include: { steps: true },
        });

        return NextResponse.json(funnel);
    } catch (error) {
        console.error('Error creating funnel:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
