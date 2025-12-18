import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['cio', 'gerente'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const where: any = {};

        // Filtro de equipe para gerentes
        if (session.user.role === 'gerente') {
            where.gerenteId = session.user.id;
        }

        if (status && status !== 'todos') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
            ];
        }

        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                subscriptionPlan: true,
                subscriptionStatus: true,
                expiresAt: true,
                createdAt: true,
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['cio', 'gerente'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { userId, action, plan, expiresAt } = body;

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // Gerentes só podem gerenciar sua própria equipe
        if (session.user.role === 'gerente' && targetUser.gerenteId !== session.user.id) {
            return NextResponse.json({ error: 'Não autorizado a gerenciar este usuário' }, { status: 401 });
        }

        let updateData: any = {};

        switch (action) {
            case 'APPROVE':
                updateData = {
                    status: 'ATIVO',
                    subscriptionStatus: 'ACTIVE',
                    // Ao aprovar, se for gerente aprovando gestor/atendente, mantém role existente ou define
                };
                break;
            case 'REJECT':
                updateData = { status: 'REJEITADO' };
                break;
            case 'BLOCK':
                updateData = { status: 'BLOQUEADO' };
                break;
            case 'UNBLOCK':
                updateData = { status: 'ATIVO' };
                break;
            case 'SET_PLAN':
                updateData = {
                    subscriptionPlan: plan,
                    expiresAt: expiresAt ? new Date(expiresAt) : null,
                    subscriptionStatus: 'ACTIVE'
                };
                break;
            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
    }
}
