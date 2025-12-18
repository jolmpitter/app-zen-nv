import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId || (session.user.role !== 'cio' && session.user.role !== 'gerente')) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { email, role } = await req.json();

        // Verificar limite de usuários da empresa (exceto CIO HQ)
        const company = await prisma.company.findUnique({
            where: { id: session.user.companyId },
            include: { _count: { select: { users: true } } }
        });

        if (company && company.userLimit > 0 && company._count.users >= company.userLimit) {
            return NextResponse.json({
                error: `Limite de usuários atingido (${company.userLimit}). Aumente o plano para adicionar mais.`
            }, { status: 403 });
        }
        const token = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

        const invitation = await prisma.invitation.create({
            data: {
                email,
                role,
                token,
                companyId: session.user.companyId,
                expiresAt
            }
        });

        const inviteLink = `${process.env.NEXTAUTH_URL}/signup/invite?token=${token}`;

        return NextResponse.json({ invitation, inviteLink });
    } catch (error) {
        console.error('Error creating invitation:', error);
        return NextResponse.json({ error: 'Erro ao criar convite' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const invitations = await prisma.invitation.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(invitations);
    } catch (error) {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
