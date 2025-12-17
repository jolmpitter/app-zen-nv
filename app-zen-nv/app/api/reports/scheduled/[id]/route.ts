import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PATCH: Atualizar relatório agendado
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Você não tem permissão para atualizar relatórios' },
        { status: 403 }
      );
    }

    const reportId = params.id;

    // Verificar se o relatório existe e pertence ao usuário
    const existingReport = await prisma.scheduledReport.findUnique({
      where: { id: reportId }
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
    }

    if (existingReport.userId !== user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para atualizar este relatório' },
        { status: 403 }
      );
    }

    const data = await req.json();

    // Atualizar relatório
    const updatedReport = await prisma.scheduledReport.update({
      where: { id: reportId },
      data: {
        ...data,
        dayOfWeek: data.dayOfWeek !== undefined ? parseInt(data.dayOfWeek) : undefined,
        dayOfMonth: data.dayOfMonth !== undefined ? parseInt(data.dayOfMonth) : undefined,
        hour: data.hour !== undefined ? parseInt(data.hour) : undefined,
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
      message: 'Relatório atualizado com sucesso',
      report: updatedReport
    });
  } catch (error: any) {
    console.error('Erro ao atualizar relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar relatório', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Remover relatório agendado
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Você não tem permissão para remover relatórios' },
        { status: 403 }
      );
    }

    const reportId = params.id;

    // Verificar se o relatório existe e pertence ao usuário
    const report = await prisma.scheduledReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 });
    }

    if (report.userId !== user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para remover este relatório' },
        { status: 403 }
      );
    }

    // Deletar relatório
    await prisma.scheduledReport.delete({
      where: { id: reportId }
    });

    return NextResponse.json({ message: 'Relatório removido com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao remover relatório', details: error.message },
      { status: 500 }
    );
  }
}
