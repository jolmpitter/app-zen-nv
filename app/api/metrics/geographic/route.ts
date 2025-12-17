import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface GeographicData {
  estado: string;
  cidade?: string;
  totalLeads: number;
  totalVendas: number;
  valorTotal: number;
  taxaConversao: number;
}

/**
 * GET /api/metrics/geographic
 * Retorna dados geográficos de leads e vendas
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
    const groupBy = searchParams.get('groupBy') || 'estado'; // 'estado' ou 'cidade'
    const estado = searchParams.get('estado'); // Filtro por estado específico
    const userId = searchParams.get('userId');
    const gestorId = searchParams.get('gestorId');

    // Construir filtro de usuário
    let userFilter: any = {};

    if (session.user.role === 'atendente') {
      // Atendente vê apenas seus próprios dados
      userFilter = { atendenteId: session.user.id };
    } else if (session.user.role === 'gestor' || session.user.role === 'gerente') {
      // Gestor/Gerente pode filtrar
      if (userId) {
        userFilter = { atendenteId: userId };
      } else if (gestorId) {
        // Buscar todos os atendentes deste gestor
        const gestor = await prisma.user.findUnique({
          where: { id: gestorId },
          include: { atendentes: { select: { id: true } } },
        });

        if (gestor) {
          const atendenteIds = gestor.atendentes.map((a) => a.id);
          if (atendenteIds.length > 0) {
            userFilter = { atendenteId: { in: atendenteIds } };
          }
        }
      }
      // Gestor sem filtro vê seus atendentes
      else if (session.user.role === 'gestor') {
        const gestor = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: { atendentes: { select: { id: true } } },
        });

        if (gestor) {
          const atendenteIds = gestor.atendentes.map((a) => a.id);
          if (atendenteIds.length > 0) {
            userFilter = {
              atendenteId: { in: [session.user.id, ...atendenteIds] },
            };
          }
        }
      }
      // Gerente sem filtro vê tudo (sem userFilter)
    }

    // Filtro por estado (se fornecido)
    let estadoFilter: any = {};
    if (estado) {
      estadoFilter = { estado: estado.toUpperCase() };
    }

    // Buscar todos os leads com localização
    const leads = await prisma.lead.findMany({
      where: {
        ...userFilter,
        ...estadoFilter,
        estado: { not: null }, // Apenas leads com estado definido
      },
      select: {
        id: true,
        estado: true,
        cidade: true,
        status: true,
        valorFechado: true,
      },
    });

    if (leads.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: 'Nenhum lead com localização encontrado',
        },
        { status: 200 }
      );
    }

    // Agrupar dados
    const grouped = new Map<string, GeographicData>();

    for (const lead of leads) {
      const key =
        groupBy === 'cidade' && lead.cidade
          ? `${lead.cidade}-${lead.estado}`
          : lead.estado || 'Desconhecido';

      if (!grouped.has(key)) {
        grouped.set(key, {
          estado: lead.estado || 'Desconhecido',
          cidade: groupBy === 'cidade' ? lead.cidade || undefined : undefined,
          totalLeads: 0,
          totalVendas: 0,
          valorTotal: 0,
          taxaConversao: 0,
        });
      }

      const data = grouped.get(key)!;
      data.totalLeads++;

      // Contabilizar vendas (status = 'concluido' com valorFechado)
      if (lead.status === 'concluido' && lead.valorFechado && lead.valorFechado > 0) {
        data.totalVendas++;
        data.valorTotal += lead.valorFechado;
      }
    }

    // Calcular taxa de conversão para cada grupo
    const result: GeographicData[] = [];

    for (const data of grouped.values()) {
      data.taxaConversao =
        data.totalLeads > 0 ? (data.totalVendas / data.totalLeads) * 100 : 0;
      result.push(data);
    }

    // Ordenar por total de leads (decrescente)
    result.sort((a, b) => b.totalLeads - a.totalLeads);

    // Calcular totais gerais
    const totals = {
      totalLeads: result.reduce((sum, d) => sum + d.totalLeads, 0),
      totalVendas: result.reduce((sum, d) => sum + d.totalVendas, 0),
      valorTotal: result.reduce((sum, d) => sum + d.valorTotal, 0),
      regioes: result.length,
    };

    // Identificar top 5 regiões
    const top5ByLeads = [...result].slice(0, 5);
    const top5ByVendas = [...result].sort((a, b) => b.totalVendas - a.totalVendas).slice(0, 5);
    const top5ByValor = [...result].sort((a, b) => b.valorTotal - a.valorTotal).slice(0, 5);

    return NextResponse.json(
      {
        success: true,
        data: {
          regions: result,
          totals,
          top5: {
            byLeads: top5ByLeads,
            byVendas: top5ByVendas,
            byValor: top5ByValor,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao buscar dados geográficos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar dados geográficos',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
