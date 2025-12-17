import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// DELETE: Remover uma conta de Facebook Ads
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
        { error: 'Você não tem permissão para remover contas' },
        { status: 403 }
      );
    }

    const accountId = params.id;

    // Verificar se a conta existe e pertence ao usuário
    const account = await prisma.facebookAdAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    if (account.userId !== user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para remover esta conta' },
        { status: 403 }
      );
    }

    // Deletar a conta
    await prisma.facebookAdAccount.delete({
      where: { id: accountId }
    });

    // Se a conta deletada era ativa, ativar a primeira conta disponível
    if (account.isActive) {
      const firstAccount = await prisma.facebookAdAccount.findFirst({
        where: { userId: user.id }
      });

      if (firstAccount) {
        await prisma.facebookAdAccount.update({
          where: { id: firstAccount.id },
          data: { isActive: true }
        });
      }
    }

    return NextResponse.json({ message: 'Conta removida com sucesso' });
  } catch (error: any) {
    console.error('Erro ao remover conta:', error);
    return NextResponse.json(
      { error: 'Erro ao remover conta', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Ativar/desativar uma conta de Facebook Ads
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
        { error: 'Você não tem permissão para modificar contas' },
        { status: 403 }
      );
    }

    const accountId = params.id;
    const { isActive } = await req.json();

    // Verificar se a conta existe e pertence ao usuário
    const account = await prisma.facebookAdAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    if (account.userId !== user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para modificar esta conta' },
        { status: 403 }
      );
    }

    // Se ativar esta conta, desativar todas as outras
    if (isActive) {
      await prisma.facebookAdAccount.updateMany({
        where: {
          userId: user.id,
          id: { not: accountId }
        },
        data: { isActive: false }
      });
    }

    // Atualizar a conta
    const updatedAccount = await prisma.facebookAdAccount.update({
      where: { id: accountId },
      data: { isActive }
    });

    return NextResponse.json({
      message: 'Conta atualizada com sucesso',
      account: {
        id: updatedAccount.id,
        accountName: updatedAccount.accountName,
        accountId: updatedAccount.accountId,
        isActive: updatedAccount.isActive
      }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar conta:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar conta', details: error.message },
      { status: 500 }
    );
  }
}
