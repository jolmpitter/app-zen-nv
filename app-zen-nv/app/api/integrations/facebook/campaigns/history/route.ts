import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'gerente' && session.user.role !== 'gestor') {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const campaignId = searchParams.get('campaignId');

    // Buscar usuário e verificar conta
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { facebookAdAccounts: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Filtros para a busca
    const filters: any = {
      userId: session.user.id
    };

    if (accountId) {
      // Verificar se a conta pertence ao usuário
      const account = user.facebookAdAccounts.find(acc => acc.id === accountId);
      if (!account) {
        return NextResponse.json(
          { error: 'Conta não encontrada' },
          { status: 404 }
        );
      }
      filters.facebookAdAccountId = accountId;
    }

    if (campaignId) {
      filters.campaignId = campaignId;
    }

    // Buscar histórico
    const history = await prisma.campaignChangeLog.findMany({
      where: filters,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        facebookAdAccount: {
          select: {
            accountName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limitar a 50 registros mais recentes
    });

    // Formatar dados
    const formattedHistory = history.map(entry => ({
      id: entry.id,
      campaignId: entry.campaignId,
      changeType: entry.changeType,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
      changedBy: entry.user.name,
      accountName: entry.facebookAdAccount.accountName,
      createdAt: entry.createdAt
    }));

    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    );
  }
}
