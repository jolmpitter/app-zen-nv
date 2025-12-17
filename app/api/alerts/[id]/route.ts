import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * PATCH /api/alerts/[id]
 * Atualiza um alerta (marcar como lido, resolvido, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { isRead, isResolved } = body;

    // Verificar se o alerta pertence ao usuário
    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alerta não encontrado' },
        { status: 404 }
      );
    }

    if (alert.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para editar este alerta' },
        { status: 403 }
      );
    }

    // Atualizar alerta
    const updateData: any = {};

    if (typeof isRead === 'boolean') {
      updateData.isRead = isRead;
    }

    if (typeof isResolved === 'boolean') {
      updateData.isResolved = isResolved;
      if (isResolved) {
        updateData.resolvedAt = new Date();
      }
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedAlert,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao atualizar alerta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar alerta',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/alerts/[id]
 * Deleta um alerta
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verificar se o alerta pertence ao usuário
    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alerta não encontrado' },
        { status: 404 }
      );
    }

    if (alert.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar este alerta' },
        { status: 403 }
      );
    }

    // Deletar alerta
    await prisma.alert.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Alerta deletado com sucesso',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao deletar alerta:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao deletar alerta',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
