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

    // Construir filtro baseado no role
    const where: any = {};

    // Filtro de datas
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Controle de acesso por role
    if (session.user.role === 'atendente') {
      // Atendentes veem apenas seus próprios dados
      where.userId = session.user.id;
    } else if (session.user.role === 'gestor' || session.user.role === 'gerente') {
      // Gestor/Gerente podem filtrar por userId, gestorId ou ver todos
      if (gestorId) {
        // Filtrar por gestor e seus atendentes
        const atendentes = await prisma.user.findMany({
          where: {
            OR: [
              { id: gestorId },
              { gestorId: gestorId },
            ],
          },
          select: { id: true },
        });
        where.userId = { in: atendentes?.map((a) => a?.id || '') };
      } else if (userId) {
        where.userId = userId;
      }
    }
    // Se não houver filtro, gestor/gerente veem todos

    const metrics = await prisma.dailyMetric.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar métricas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      date, 
      userId, 
      valorGasto, 
      quantidadeLeads, 
      quantidadeVendas, 
      valorVendido,
      quantidadeVendasOrganicas,
      valorVendidoOrganico,
      // Novos campos detalhados
      bmName,
      contaAnuncio,
      criativo,
      pagina,
      valorComissao,
      totalCliques,
      cartaoUsado
    } = body;

    // Validações
    if (!date || !userId) {
      return NextResponse.json(
        { error: 'Data e usuário são obrigatórios' },
        { status: 400 }
      );
    }

    if (valorGasto === undefined || quantidadeLeads === undefined || 
        quantidadeVendas === undefined || valorVendido === undefined) {
      return NextResponse.json(
        { error: 'Todos os valores numéricos são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe e se há permissão
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        gestorId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Validar permissão baseada no role
    if (session.user.role === 'atendente') {
      // Atendente só pode criar métricas para si mesmo
      if (userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Você só pode criar métricas para si mesmo' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'gestor') {
      // Gestor só pode criar métricas para seus atendentes
      if (user.gestorId !== session.user.id && userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Você não tem permissão para criar métricas para este usuário' },
          { status: 403 }
        );
      }
    }
    // Gerente pode criar métricas para qualquer usuário

    // Calcular KPIs
    const roi = valorGasto > 0 ? ((valorVendido - valorGasto) / valorGasto) * 100 : 0;
    const custoPorLead = quantidadeLeads > 0 ? valorGasto / quantidadeLeads : 0;
    const taxaConversao = quantidadeLeads > 0 ? (quantidadeVendas / quantidadeLeads) * 100 : 0;
    const ticketMedio = quantidadeVendas > 0 ? valorVendido / quantidadeVendas : 0;

    // Criar métrica
    const metric = await prisma.dailyMetric.create({
      data: {
        date: new Date(date),
        userId,
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
        // Novos campos detalhados
        bmName: bmName || null,
        contaAnuncio: contaAnuncio || null,
        criativo: criativo || null,
        pagina: pagina || null,
        valorComissao: valorComissao || 0,
        totalCliques: totalCliques || 0,
        cartaoUsado: cartaoUsado || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error('Error creating metric:', error);
    return NextResponse.json(
      { error: 'Erro ao criar métrica' },
      { status: 500 }
    );
  }
}
