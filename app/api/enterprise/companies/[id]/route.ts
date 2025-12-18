import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (session?.user?.role !== 'cio') {
            return NextResponse.json({ error: 'Acesso restrito ao CIO' }, { status: 403 });
        }

        const body = await req.json();
        const { status, userLimit } = body;

        const updatedCompany = await prisma.company.update({
            where: { id: params.id },
            data: {
                status: status !== undefined ? status : undefined,
                userLimit: userLimit !== undefined ? parseInt(userLimit) : undefined,
            },
        });

        // Registrar Log de Auditoria
        await prisma.auditLog.create({
            data: {
                companyId: session.user.companyId || '',
                userId: session.user.id,
                action: 'UPDATE_COMPANY_BY_CIO',
                details: JSON.stringify({ targetCompanyId: params.id, changes: body })
            }
        });

        return NextResponse.json(updatedCompany);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Erro ao atualizar empresa' }, { status: 500 });
    }
}
