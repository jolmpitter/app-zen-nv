import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const metricId = params.id;
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

    // Verificar se métrica existe e se o usuário tem permissão
    const metric = await prisma.dailyMetric.findUnique({
      where: { id: metricId },
      include: {
        user: {
          select: {
            id: true,
            gestorId: true,
          },
        },
      },
    });

    if (!metric) {
      return NextResponse.json(
        { error: 'Métrica não encontrada' },
        { status: 404 }
      );
    }

    // Validar permissão de acesso
    if (session.user.role === 'atendente') {
      // Atendente só pode editar suas próprias métricas
      if (metric.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Você não tem permissão para editar esta métrica' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'gestor') {
      // Gestor só pode editar métricas dos seus atendentes
      if (metric.user?.gestorId !== session.user.id && metric.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Você não tem permissão para editar esta métrica' },
          { status: 403 }
        );
      }
    }
    // Gerente pode editar métricas de qualquer usuário

    // Verificar se usuário existe (se userId foi fornecido)
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (date !== undefined) updateData.date = new Date(date);
    if (userId !== undefined) updateData.userId = userId;
    if (valorGasto !== undefined) updateData.valorGasto = valorGasto;
    if (quantidadeLeads !== undefined) updateData.quantidadeLeads = quantidadeLeads;
    if (quantidadeVendas !== undefined) updateData.quantidadeVendas = quantidadeVendas;
    if (valorVendido !== undefined) updateData.valorVendido = valorVendido;
    if (quantidadeVendasOrganicas !== undefined) updateData.quantidadeVendasOrganicas = quantidadeVendasOrganicas;
    if (valorVendidoOrganico !== undefined) updateData.valorVendidoOrganico = valorVendidoOrganico;
    // Novos campos detalhados
    if (bmName !== undefined) updateData.bmName = bmName || null;
    if (contaAnuncio !== undefined) updateData.contaAnuncio = contaAnuncio || null;
    if (criativo !== undefined) updateData.criativo = criativo || null;
    if (pagina !== undefined) updateData.pagina = pagina || null;
    if (valorComissao !== undefined) updateData.valorComissao = valorComissao || 0;
    if (totalCliques !== undefined) updateData.totalCliques = totalCliques || 0;
    if (cartaoUsado !== undefined) updateData.cartaoUsado = cartaoUsado || null;

    // Recalcular KPIs se valores foram atualizados
    const finalValorGasto = valorGasto !== undefined ? valorGasto : Number(metric.valorGasto);
    const finalQuantidadeLeads = quantidadeLeads !== undefined ? quantidadeLeads : metric.quantidadeLeads;
    const finalQuantidadeVendas = quantidadeVendas !== undefined ? quantidadeVendas : metric.quantidadeVendas;
    const finalValorVendido = valorVendido !== undefined ? valorVendido : Number(metric.valorVendido);

    const roi = finalValorGasto > 0 ? ((finalValorVendido - finalValorGasto) / finalValorGasto) * 100 : 0;
    const custoPorLead = finalQuantidadeLeads > 0 ? finalValorGasto / finalQuantidadeLeads : 0;
    const taxaConversao = finalQuantidadeLeads > 0 ? (finalQuantidadeVendas / finalQuantidadeLeads) * 100 : 0;
    const ticketMedio = finalQuantidadeVendas > 0 ? finalValorVendido / finalQuantidadeVendas : 0;

    updateData.roi = roi;
    updateData.custoPorLead = custoPorLead;
    updateData.taxaConversao = taxaConversao;
    updateData.ticketMedio = ticketMedio;

    // Atualizar métrica
    const updatedMetric = await prisma.dailyMetric.update({
      where: { id: metricId },
      data: updateData,
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

    return NextResponse.json(updatedMetric);
  } catch (error) {
    console.error('Error updating metric:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar métrica' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const metricId = params.id;

    // Verificar se métrica existe e se o usuário tem permissão
    const metric = await prisma.dailyMetric.findUnique({
      where: { id: metricId },
      include: {
        user: {
          select: {
            id: true,
            gestorId: true,
          },
        },
      },
    });

    if (!metric) {
      return NextResponse.json(
        { error: 'Métrica não encontrada' },
        { status: 404 }
      );
    }

    // Validar permissão de acesso
    if (session.user.role === 'atendente') {
      // Atendente só pode deletar suas próprias métricas
      if (metric.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Você não tem permissão para deletar esta métrica' },
          { status: 403 }
        );
      }
    } else if (session.user.role === 'gestor') {
      // Gestor só pode deletar métricas dos seus atendentes
      if (metric.user?.gestorId !== session.user.id && metric.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Você não tem permissão para deletar esta métrica' },
          { status: 403 }
        );
      }
    }
    // Gerente pode deletar métricas de qualquer usuário

    // Deletar métrica
    await prisma.dailyMetric.delete({
      where: { id: metricId },
    });

    return NextResponse.json({ message: 'Métrica deletada com sucesso' });
  } catch (error) {
    console.error('Error deleting metric:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar métrica' },
      { status: 500 }
    );
  }
}