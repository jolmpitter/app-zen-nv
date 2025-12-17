import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Listar todos os relatórios agendados do usuário
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (user.role !== 'gerente' && user.role !== 'gestor') {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar relatórios' },
        { status: 403 }
      );
    }

    const reports = await prisma.scheduledReport.findMany({
      where: { userId: user.id },
      include: {
        facebookAdAccount: {
          select: {
            accountName: true,
            accountId: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Erro ao buscar relatórios:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatórios', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Criar novo relatório agendado
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (user.role !== 'gerente' && user.role !== 'gestor') {
      return NextResponse.json(
        { error: 'Você não tem permissão para criar relatórios' },
        { status: 403 }
      );
    }

    const {
      name,
      facebookAdAccountId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      hour,
      recipients,
      includeMetrics,
      includeFunnel,
      includeTimeSeries,
    } = await req.json();

    // Validações
    if (!name || !facebookAdAccountId || !frequency || !recipients) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Verificar se a conta pertence ao usuário
    const account = await prisma.facebookAdAccount.findUnique({
      where: { id: facebookAdAccountId }
    });

    if (!account || account.userId !== user.id) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    // Criar relatório
    const report = await prisma.scheduledReport.create({
      data: {
        userId: user.id,
        facebookAdAccountId,
        name,
        frequency,
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek) : null,
        dayOfMonth: dayOfMonth !== undefined ? parseInt(dayOfMonth) : null,
        hour: hour !== undefined ? parseInt(hour) : 9,
        recipients,
        includeMetrics: includeMetrics !== undefined ? includeMetrics : true,
        includeFunnel: includeFunnel !== undefined ? includeFunnel : true,
        includeTimeSeries: includeTimeSeries !== undefined ? includeTimeSeries : true,
      },
      include: {
        facebookAdAccount: {
          select: {
            accountName: true,
            accountId: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Relatório agendado criado com sucesso',
      report
    });
  } catch (error: any) {
    console.error('Erro ao criar relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao criar relatório', details: error.message },
      { status: 500 }
    );
  }
}
