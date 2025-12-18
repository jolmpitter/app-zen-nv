import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params?.id },
      include: {
        atendente: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        history: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (session.user.role === 'atendente' && lead.atendenteId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    if (session.user.role === 'gestor') {
      const atendente = await prisma.user.findUnique({
        where: { id: lead.atendenteId },
      });
      if (atendente?.gestorId !== session.user.id) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
    }
    // Gerente tem acesso total a todos os leads

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lead' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params?.id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (session.user.role === 'atendente' && lead.atendenteId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, status, source, valorPotencial, valorFechado, notes } = body;

    // Preparar dados de atualização
    const updateData: any = {};
    const changes: string[] = [];

    if (name !== undefined && name !== lead.name) {
      updateData.name = name;
      changes.push(`Nome alterado de "${lead.name}" para "${name}"`);
    }
    if (email !== undefined && email !== lead.email) {
      updateData.email = email;
      changes.push(`Email alterado`);
    }
    if (phone !== undefined && phone !== lead.phone) {
      updateData.phone = phone;
      changes.push(`Telefone alterado`);
    }
    if (source !== undefined && source !== lead.source) {
      updateData.source = source;
      changes.push(`Origem alterada`);
    }
    if (valorPotencial !== undefined) {
      updateData.valorPotencial = valorPotencial ? parseFloat(valorPotencial) : null;
      changes.push(`Valor potencial alterado`);
    }
    if (valorFechado !== undefined) {
      updateData.valorFechado = valorFechado ? parseFloat(valorFechado) : null;
      changes.push(`Valor fechado alterado`);
    }
    if (notes !== undefined && notes !== lead.notes) {
      updateData.notes = notes;
      changes.push(`Notas atualizadas`);
    }
    if (status !== undefined && status !== lead.status) {
      updateData.status = status;
      updateData.closedAt = (status === 'concluido' || status === 'perdido') ? new Date() : null;
      changes.push(`Status alterado de "${lead.status}" para "${status}"`);

      // Criar histórico de mudança de status
      await prisma.leadHistory.create({
        data: {
          leadId: params?.id || '',
          userId: session.user.id,
          action: 'status_change',
          description: `Status alterado de "${lead.status}" para "${status}"`,
          oldValue: lead.status,
          newValue: status,
        },
      });
    }

    const updatedLead = await prisma.lead.update({
      where: { id: params?.id },
      data: updateData,
      include: {
        atendente: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Auditoria Enterprise
    await prisma.auditLog.create({
      data: {
        companyId: session.user.companyId || '',
        userId: session.user.id,
        action: 'LEAD_UPDATED',
        details: JSON.stringify({ leadId: params?.id, changes })
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar lead' },
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

    const lead = await prisma.lead.findUnique({
      where: { id: params?.id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    }

    // Verificar permissão (apenas gestores e gerentes podem deletar)
    if (session.user.role !== 'gestor' && session.user.role !== 'gerente') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    await prisma.lead.delete({
      where: { id: params?.id },
    });

    // Auditoria Enterprise
    await prisma.auditLog.create({
      data: {
        companyId: session.user.companyId || '',
        userId: session.user.id,
        action: 'LEAD_DELETED',
        details: JSON.stringify({ leadId: params?.id, name: lead.name })
      }
    });

    return NextResponse.json({ message: 'Lead deletado com sucesso' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar lead' },
      { status: 500 }
    );
  }
}
