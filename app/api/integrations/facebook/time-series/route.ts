import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MetaAdsAPI } from '@/lib/meta-ads';

// GET: Buscar dados temporais (time series) das campanhas
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        facebookAdAccounts: {
          where: { isActive: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (user.role !== 'gerente' && user.role !== 'gestor') {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar as integrações' },
        { status: 403 }
      );
    }

    // Obter parâmetros da query
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Determinar qual conta usar
    let activeAccount;
    
    if (accountId) {
      // Buscar conta específica
      activeAccount = await prisma.facebookAdAccount.findUnique({
        where: { id: accountId }
      });
      
      if (!activeAccount || activeAccount.userId !== user.id) {
        return NextResponse.json(
          { error: 'Conta não encontrada ou sem permissão' },
          { status: 404 }
        );
      }
    } else {
      // Usar conta ativa
      activeAccount = user.facebookAdAccounts[0];
    }

    if (!activeAccount) {
      return NextResponse.json(
        { error: 'Nenhuma conta de Meta Ads conectada' },
        { status: 400 }
      );
    }

    // Buscar insights diários
    const metaApi = new MetaAdsAPI(
      activeAccount.accessToken,
      activeAccount.accountId
    );

    const dailyInsights = await metaApi.getTimeSeriesInsights(
      startDate || undefined,
      endDate || undefined
    );

    return NextResponse.json(dailyInsights);
  } catch (error: any) {
    console.error('Erro ao buscar dados temporais:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados temporais', details: error.message },
      { status: 500 }
    );
  }
}
