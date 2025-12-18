import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { evolutionApi } from '@/lib/whatsapp/evolution';

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

        // Criar na Evolution API primeiro
        const evolutionInstance = await evolutionApi.createInstance(name.replace(/\s+/g, '_').toLowerCase());

        const qrCode = evolutionInstance?.qrcode?.base64 || null;

        const instance = await prisma.whatsAppInstance.create({
            data: {
                name,
                type: type || 'QR',
                companyId: session.user.companyId,
                status: 'DISCONNECTED',
                qrCode: qrCode,
            },
        });

        return NextResponse.json(instance);
    } catch (error) {
        console.error('Error creating whatsapp instance:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!session?.user?.companyId || !id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const instance = await prisma.whatsAppInstance.findUnique({
            where: { id },
        });

        if (!instance || instance.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Instância não encontrada' }, { status: 404 });
        }

        // Deletar na Evolution API
        await evolutionApi.deleteInstance(instance.name.replace(/\s+/g, '_').toLowerCase());

        // Deletar no banco
        await prisma.whatsAppInstance.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting whatsapp instance:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
