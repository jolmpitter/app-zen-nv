import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const cycles = await prisma.cycle.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { startDate: 'desc' },
            include: {
                _count: {
                    select: { objectives: true }
                }
            }
        });

        return NextResponse.json(cycles);
    } catch (error) {
        console.error('Error fetching cycles:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId || (session.user.role !== 'cio' && session.user.role !== 'gerente')) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { name, startDate, endDate } = await req.json();

        const cycle = await prisma.cycle.create({
            data: {
                name,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                companyId: session.user.companyId,
            },
        });

        return NextResponse.json(cycle);
    } catch (error) {
        console.error('Error creating cycle:', error);
        return NextResponse.json({ error: 'Erro ao criar ciclo' }, { status: 500 });
    }
}
