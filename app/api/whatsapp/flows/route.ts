import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        if (id) {
            const flow = await prisma.automationFlow.findUnique({
                where: { id, companyId: session.user.companyId }
            });
            return NextResponse.json(flow);
        }

        const flows = await prisma.automationFlow.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(flows);
    } catch (error) {
        console.error('Error fetching flows:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { name, nodes, edges } = body;

        const flow = await prisma.automationFlow.create({
            data: {
                name: name || 'Novo Fluxo',
                companyId: session.user.companyId,
                flowContext: JSON.stringify({ nodes, edges }),
                isActive: false
            }
        });

        return NextResponse.json(flow);
    } catch (error) {
        console.error('Error creating flow:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { id, name, nodes, edges, isActive } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (nodes !== undefined && edges !== undefined) {
            updateData.flowContext = JSON.stringify({ nodes, edges });
        }
        if (isActive !== undefined) updateData.isActive = isActive;

        const flow = await prisma.automationFlow.update({
            where: { id, companyId: session.user.companyId },
            data: updateData
        });

        return NextResponse.json(flow);
    } catch (error) {
        console.error('Error updating flow:', error);
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

        await prisma.automationFlow.delete({
            where: { id, companyId: session.user.companyId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting flow:', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
