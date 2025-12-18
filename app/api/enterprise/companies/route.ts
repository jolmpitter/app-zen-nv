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

        const companies = await prisma.company.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });

        return NextResponse.json(companies);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Erro ao buscar empresas' }, { status: 500 });
    }
}
