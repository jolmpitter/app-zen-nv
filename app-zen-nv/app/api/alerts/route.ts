import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { subDays } from 'date-fns';

/**
 * GET /api/alerts
 * Retorna alertas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir filtro
    const where: any = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    // Buscar alertas
    const alerts = await prisma.alert.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Contar alertas não lidos
    const unreadCount = await prisma.alert.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          alerts,
          unreadCount,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao buscar alertas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar alertas',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts/generate
 * Gera alertas automáticos baseados em métricas
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Apenas gerente/gestor podem gerar alertas
    if (session.user.role !== 'gerente' && session.user.role !== 'gestor') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão' },
        { status: 403 }
      );
    }

    const alertsCreated: string[] = [];

    // 1. Alertas de ROI negativo (últimos 7 dias)
    const last7Days = subDays(new Date(), 7);
    const negativeROIMetrics = await prisma.dailyMetric.findMany({
      where: {
        date: { gte: last7Days },
        roi: { lt: 0 },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    for (const metric of negativeROIMetrics) {
      // Verificar se alerta já existe
      const existing = await prisma.alert.findFirst({
        where: {
          userId: metric.userId,
          type: 'roi_negativo',
          isResolved: false,
          createdAt: { gte: subDays(new Date(), 1) }, // Últimas 24h
        },
      });

      if (!existing) {
        await prisma.alert.create({
          data: {
            userId: metric.userId,
            type: 'roi_negativo',
            severity: 'critica',
            title: 'ROI Negativo Detectado',
            message: `Seu ROI de ${metric.roi.toFixed(2)}% está negativo no dia ${new Date(
              metric.date
            ).toLocaleDateString('pt-BR')}. Revise suas campanhas urgentemente.`,
            data: JSON.stringify({
              metricId: metric.id,
              date: metric.date,
              roi: metric.roi,
              valorGasto: metric.valorGasto,
              valorVendido: metric.valorVendido,
            }),
          },
        });
        alertsCreated.push('roi_negativo');
      }
    }

    // 2. Alertas de conversão baixa (< 10%)
    const lowConversionMetrics = await prisma.dailyMetric.findMany({
      where: {
        date: { gte: last7Days },
        taxaConversao: { lt: 10, gt: 0 },
        quantidadeLeads: { gt: 5 }, // Apenas se tiver leads suficientes
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    for (const metric of lowConversionMetrics) {
      const existing = await prisma.alert.findFirst({
        where: {
          userId: metric.userId,
          type: 'conversao_baixa',
          isResolved: false,
          createdAt: { gte: subDays(new Date(), 1) },
        },
      });

      if (!existing) {
        await prisma.alert.create({
          data: {
            userId: metric.userId,
            type: 'conversao_baixa',
            severity: 'alta',
            title: 'Taxa de Conversão Baixa',
            message: `Sua taxa de conversão de ${metric.taxaConversao.toFixed(
              2
            )}% está abaixo de 10%. Melhore o atendimento dos leads.`,
            data: JSON.stringify({
              metricId: metric.id,
              date: metric.date,
              taxaConversao: metric.taxaConversao,
              quantidadeLeads: metric.quantidadeLeads,
              quantidadeVendas: metric.quantidadeVendas,
            }),
          },
        });
        alertsCreated.push('conversao_baixa');
      }
    }

    // 3. Alertas de gasto excessivo sem vendas
    const highSpendNoSales = await prisma.dailyMetric.findMany({
      where: {
        date: { gte: last7Days },
        valorGasto: { gt: 500 }, // Gastou mais de R$ 500
        quantidadeVendas: 0,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    for (const metric of highSpendNoSales) {
      const existing = await prisma.alert.findFirst({
        where: {
          userId: metric.userId,
          type: 'gasto_excessivo',
          isResolved: false,
          createdAt: { gte: subDays(new Date(), 1) },
        },
      });

      if (!existing) {
        await prisma.alert.create({
          data: {
            userId: metric.userId,
            type: 'gasto_excessivo',
            severity: 'alta',
            title: 'Gasto Sem Retorno',
            message: `Você gastou R$ ${metric.valorGasto.toFixed(
              2
            )} no dia ${new Date(
              metric.date
            ).toLocaleDateString('pt-BR')} sem realizar nenhuma venda. Revise suas campanhas.`,
            data: JSON.stringify({
              metricId: metric.id,
              date: metric.date,
              valorGasto: metric.valorGasto,
              quantidadeLeads: metric.quantidadeLeads,
            }),
          },
        });
        alertsCreated.push('gasto_excessivo');
      }
    }

    // 4. Alertas de leads não contatados (> 24h)
    const oldLeads = await prisma.lead.findMany({
      where: {
        status: 'novo',
        createdAt: { lt: subDays(new Date(), 1) },
      },
      include: {
        atendente: { select: { id: true, name: true } },
      },
    });

    for (const lead of oldLeads) {
      const existing = await prisma.alert.findFirst({
        where: {
          userId: lead.atendenteId,
          type: 'lead_nao_contatado',
          data: { contains: lead.id },
          isResolved: false,
        },
      });

      if (!existing) {
        await prisma.alert.create({
          data: {
            userId: lead.atendenteId,
            type: 'lead_nao_contatado',
            severity: 'media',
            title: 'Lead Sem Contato',
            message: `O lead "${lead.name}" está há mais de 24 horas sem contato. Entre em contato urgentemente!`,
            data: JSON.stringify({
              leadId: lead.id,
              leadName: lead.name,
              createdAt: lead.createdAt,
            }),
          },
        });
        alertsCreated.push('lead_nao_contatado');
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `${alertsCreated.length} novos alertas criados`,
        data: {
          alertsCreated: alertsCreated.length,
          types: [...new Set(alertsCreated)],
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao gerar alertas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar alertas',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
