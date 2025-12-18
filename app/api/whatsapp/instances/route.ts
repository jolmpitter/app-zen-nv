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

        const instances = await prisma.whatsAppInstance.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(instances);
    } catch (error) {
        console.error('Error fetching whatsapp instances:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { name, type } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const instance = await prisma.whatsAppInstance.create({
            data: {
                name,
                type: type || 'QR',
                companyId: session.user.companyId,
                status: 'DISCONNECTED',
            },
        });

        return NextResponse.json(instance);
    } catch (error) {
        console.error('Error creating whatsapp instance:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
