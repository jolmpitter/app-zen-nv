import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Nenhuma empresa vinculada' }, { status: 404 });
        }

        const company = await prisma.company.findUnique({
            where: { id: session.user.companyId },
            select: {
                id: true,
                name: true,
                logoUrl: true,
                themeSettings: true,
                status: true,
            },
        });

        if (!company) {
            return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('Error fetching company settings:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
