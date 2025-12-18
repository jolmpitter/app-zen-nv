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
        const { status, role, expiresAt } = body;

        const updatedUser = await prisma.user.update({
            where: { id: params.id },
            data: {
                status: status !== undefined ? status : undefined,
                role: role !== undefined ? role : undefined,
                expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
            },
        });

        // Registrar Log de Auditoria
        await prisma.auditLog.create({
            data: {
                companyId: session.user.companyId || '',
                userId: session.user.id,
                action: 'UPDATE_USER_BY_CIO',
                details: JSON.stringify({ targetUserId: params.id, changes: body })
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    }
}
