import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { companyId: true },
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
        }

        const tags = await prisma.tag.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ tags });
    } catch (error) {
        console.error('Error fetching tags:', error);
        return NextResponse.json({ error: 'Erro ao buscar etiquetas' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { name, color, description } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { companyId: true },
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
        }

        // Check for duplicate
        const existing = await prisma.tag.findFirst({
            where: {
                companyId: user.companyId,
                name: name,
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'Etiqueta já existe' }, { status: 409 });
        }

        const tag = await prisma.tag.create({
            data: {
                name,
                color: color || '#6366f1',
                description,
                companyId: user.companyId,
            },
        });

        return NextResponse.json({ tag }, { status: 201 });
    } catch (error) {
        console.error('Error creating tag:', error);
        return NextResponse.json({ error: 'Erro ao criar etiqueta' }, { status: 500 });
    }
}
