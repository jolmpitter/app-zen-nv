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

        const { searchParams } = new URL(req.url);
        const cycleId = searchParams.get('cycleId');

        const objectives = await prisma.objective.findMany({
            where: {
                companyId: session.user.companyId,
                ...(cycleId ? { cycleId } : {})
            },
            include: {
                keyResults: true,
                user: { select: { name: true, avatarUrl: true } },
                sector: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(objectives);
    } catch (error) {
        console.error('Error fetching objectives:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { title, description, level, cycleId, sectorId, userId, keyResults } = await req.json();

        const objective = await prisma.objective.create({
            data: {
                title,
                description,
                level,
                cycleId,
                companyId: session.user.companyId,
                sectorId: level === 'SECTOR' ? sectorId : null,
                userId: level === 'INDIVIDUAL' ? userId : null,
                keyResults: {
                    create: keyResults.map((kr: any) => ({
                        title: kr.title,
                        targetValue: parseFloat(kr.targetValue),
                        unit: kr.unit,
                        weight: kr.weight ? parseFloat(kr.weight) : 1
                    }))
                }
            },
            include: { keyResults: true }
        });

        return NextResponse.json(objective);
    } catch (error) {
        console.error('Error creating objective:', error);
        return NextResponse.json({ error: 'Erro ao criar objetivo' }, { status: 500 });
    }
}
