import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const gestorId = searchParams.get('gestorId');

    const where: any = {};

    // Isolamento Multi-tenant
    if (session.user.role !== 'cio') {
      const currentGerenteId = session.user.role === 'gerente' ? session.user.id : session.user.gerenteId;
      where.gerenteId = currentGerenteId;
    }

    // Filtro de datas
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Controle de acesso detalhado por role dentro da equipe
    if (session.user.role === 'atendente') {
      where.userId = session.user.id;
    } else if (session.user.role === 'gestor') {
      if (gestorId === session.user.id) {
        const atendentes = await prisma.user.findMany({
          where: { OR: [{ id: session.user.id }, { gestorId: session.user.id }] },
          select: { id: true },
        });
        where.userId = { in: atendentes.map(a => a.id) };
      } else if (userId) {
        // Valida se o userId pertence ao gestor
        const target = await prisma.user.findUnique({ where: { id: userId }, select: { gestorId: true } });
        if (target?.gestorId !== session.user.id && userId !== session.user.id) {
          where.userId = 'NONE'; // Bloqueia consulta
        } else {
          where.userId = userId;
        }
      } else {
        // Por padrão, gestor vê seus dados + seus atendentes
        const atendentes = await prisma.user.findMany({
          where: { OR: [{ id: session.user.id }, { gestorId: session.user.id }] },
          select: { id: true },
        });
        where.userId = { in: atendentes.map(a => a.id) };
      }
    } else if (session.user.role === 'gerente' || session.user.role === 'cio') {
      if (userId) where.userId = userId;
      else if (gestorId) {
        const atendentes = await prisma.user.findMany({
          where: { OR: [{ id: gestorId }, { gestorId: gestorId }] },
          select: { id: true },
        });
        where.userId = { in: atendentes.map(a => a.id) };
      }
    }

    const metrics = await prisma.dailyMetric.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const currentGerenteId = session.user.role === 'gerente' ? session.user.id : session.user.gerenteId;

    if (!currentGerenteId && session.user.role !== 'cio') {
      return NextResponse.json({ error: 'Gerente da equipe não identificado' }, { status: 400 });
    }

    const body = await req.json();
    const {
      date, userId, valorGasto, quantidadeLeads, quantidadeVendas, valorVendido,
      quantidadeVendasOrganicas, valorVendidoOrganico, bmName, contaAnuncio,
      criativo, pagina, valorComissao, totalCliques, cartaoUsado
    } = body;

    if (!date || !userId) {
      return NextResponse.json({ error: 'Data e usuário são obrigatórios' }, { status: 400 });
    }

    // Calcular KPIs
    const roi = valorGasto > 0 ? ((valorVendido - valorGasto) / valorGasto) * 100 : 0;
    const custoPorLead = quantidadeLeads > 0 ? valorGasto / quantidadeLeads : 0;
    const taxaConversao = quantidadeLeads > 0 ? (quantidadeVendas / quantidadeLeads) * 100 : 0;
    const ticketMedio = quantidadeVendas > 0 ? valorVendido / quantidadeVendas : 0;

    const metric = await prisma.dailyMetric.create({
      data: {
        date: new Date(date),
        userId,
        gerenteId: currentGerenteId,
        valorGasto,
        quantidadeLeads,
        quantidadeVendas,
        valorVendido,
        quantidadeVendasOrganicas: quantidadeVendasOrganicas || 0,
        valorVendidoOrganico: valorVendidoOrganico || 0,
        roi,
        custoPorLead,
        taxaConversao,
        ticketMedio,
        bmName: bmName || null,
        contaAnuncio: contaAnuncio || null,
        criativo: criativo || null,
        pagina: pagina || null,
        valorComissao: valorComissao || 0,
        totalCliques: totalCliques || 0,
        cartaoUsado: cartaoUsado || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error('Error creating metric:', error);
    return NextResponse.json({ error: 'Erro ao criar métrica' }, { status: 500 });
  }
}
