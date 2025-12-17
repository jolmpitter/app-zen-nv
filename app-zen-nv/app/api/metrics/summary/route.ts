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
    const userId = searchParams.get('userId'); // Filtro por atendente específico
    const gestorId = searchParams.get('gestorId'); // Filtro por gestor e seus atendentes

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
      // Atendente vê apenas suas próprias métricas
      where.userId = session.user.id;
    } else if (session.user.role === 'gestor' || session.user.role === 'gerente') {
      // Aplicar filtros adicionais quando fornecidos
      if (userId) {
        // Filtro por atendente específico
        where.userId = userId;
      } else if (gestorId) {
        // Filtro por gestor: buscar métricas do gestor + seus atendentes
        const gestorUser = await prisma.user.findUnique({
          where: { id: gestorId },
          include: {
            atendentes: { select: { id: true } }
          }
        });

        if (gestorUser) {
          const atendenteIds = gestorUser.atendentes?.map((a: any) => a.id) || [];
          // Incluir métricas do gestor + atendentes
          where.userId = {
            in: [gestorId, ...atendenteIds]
          };
        }
      }
      // Se não houver filtros, gestor/gerente veem todas as métricas (comportamento padrão mantido)
    }

    // Buscar todas as métricas
    const metrics = await prisma.dailyMetric.findMany({
      where,
    });

    // Calcular totais
    const totalGasto = metrics?.reduce((sum, m) => sum + (m?.valorGasto || 0), 0);
    const totalVendido = metrics?.reduce((sum, m) => sum + (m?.valorVendido || 0), 0);
    const totalLeads = metrics?.reduce((sum, m) => sum + (m?.quantidadeLeads || 0), 0);
    const totalVendas = metrics?.reduce((sum, m) => sum + (m?.quantidadeVendas || 0), 0);
    const totalVendasOrganicas = metrics?.reduce((sum, m) => sum + (m?.quantidadeVendasOrganicas || 0), 0);
    const totalVendidoOrganico = metrics?.reduce((sum, m) => sum + (m?.valorVendidoOrganico || 0), 0);

    const roiGeral = totalGasto > 0 ? ((totalVendido - totalGasto) / totalGasto) * 100 : 0;
    const custoPorLeadMedio = totalLeads > 0 ? totalGasto / totalLeads : 0;
    const taxaConversaoMedia = totalLeads > 0 ? (totalVendas / totalLeads) * 100 : 0;
    const ticketMedio = totalVendas > 0 ? totalVendido / totalVendas : 0;

    return NextResponse.json({
      totalGasto: parseFloat(totalGasto?.toFixed(2) || '0'),
      totalVendido: parseFloat(totalVendido?.toFixed(2) || '0'),
      totalLeads,
      totalVendas,
      totalVendasOrganicas,
      totalVendidoOrganico: parseFloat(totalVendidoOrganico?.toFixed(2) || '0'),
      roiGeral: parseFloat(roiGeral?.toFixed(2) || '0'),
      custoPorLeadMedio: parseFloat(custoPorLeadMedio?.toFixed(2) || '0'),
      taxaConversaoMedia: parseFloat(taxaConversaoMedia?.toFixed(2) || '0'),
      ticketMedio: parseFloat(ticketMedio?.toFixed(2) || '0'),
    });
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar resumo de métricas' },
      { status: 500 }
    );
  }
}
