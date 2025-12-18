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

    // Controle de acesso detalhado por role
    if (session.user.role === 'atendente') {
      where.userId = session.user.id;
    } else if (session.user.role === 'gestor') {
      // Gestores veem seus dados + de seus atendentes vinculados
      if (gestorId === session.user.id || !gestorId && !userId) {
        const atendentes = await prisma.user.findMany({
          where: { OR: [{ id: session.user.id }, { gestorId: session.user.id }] },
          select: { id: true },
        });
        where.userId = { in: atendentes.map((a: { id: string }) => a.id) };
      } else if (userId) {
        // Valida se o userId pertence ao gestor
        const target = await prisma.user.findUnique({ where: { id: userId }, select: { gestorId: true } });
        if (target?.gestorId !== session.user.id && userId !== session.user.id) {
          where.userId = 'NONE'; // Bloqueia consulta
        } else {
          where.userId = userId;
        }
      }
    } else if (session.user.role === 'gerente' || session.user.role === 'cio') {
      if (userId) {
        where.userId = userId;
      } else if (gestorId) {
        // Filtro por gestor: buscar métricas do gestor + seus atendentes
        const atendentes = await prisma.user.findMany({
          where: { OR: [{ id: gestorId }, { gestorId: gestorId }] },
          select: { id: true },
        });
        where.userId = { in: atendentes.map((a: { id: string }) => a.id) };
      }
    }

    // Buscar todas as métricas
    const metrics = await prisma.dailyMetric.findMany({
      where,
    });

    // Calcular totais
    const totalGasto = metrics?.reduce((sum: number, m: any) => sum + (m?.valorGasto || 0), 0);
    const totalVendido = metrics?.reduce((sum: number, m: any) => sum + (m?.valorVendido || 0), 0);
    const totalLeads = metrics?.reduce((sum: number, m: any) => sum + (m?.quantidadeLeads || 0), 0);
    const totalVendas = metrics?.reduce((sum: number, m: any) => sum + (m?.quantidadeVendas || 0), 0);
    const totalVendasOrganicas = metrics?.reduce((sum: number, m: any) => sum + (m?.quantidadeVendasOrganicas || 0), 0);
    const totalVendidoOrganico = metrics?.reduce((sum: number, m: any) => sum + (m?.valorVendidoOrganico || 0), 0);

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
