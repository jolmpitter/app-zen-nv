import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MetaAdsAPI } from '@/lib/meta-ads';

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
    const currentPeriod = searchParams.get('currentPeriod') || 'last_7d';
    const previousPeriod = searchParams.get('previousPeriod') || 'last_14d';

    // Buscar conta ativa ou específica
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

    let account;
    if (accountId) {
      account = user.facebookAdAccounts.find(acc => acc.id === accountId);
    } else {
      account = user.facebookAdAccounts.find(acc => acc.isActive);
    }

    if (!account) {
      return NextResponse.json(
        { error: 'Nenhuma conta Meta Ads encontrada' },
        { status: 404 }
      );
    }

    const metaAdsAPI = new MetaAdsAPI(account.accessToken, account.accountId);

    // Buscar dados do período atual
    const currentData = await metaAdsAPI.getAccountInsights(currentPeriod);
    
    // Buscar dados do período anterior
    const previousData = await metaAdsAPI.getAccountInsights(previousPeriod);

    // Calcular variações percentuais
    const comparison = {
      current: {
        spend: currentData.total_spend,
        impressions: currentData.total_impressions,
        clicks: currentData.total_clicks,
        conversions: currentData.total_conversions,
        cpc: currentData.avg_cpc,
        cpm: currentData.avg_cpm,
        ctr: currentData.avg_ctr,
        conversionRate: currentData.conversion_rate
      },
      previous: {
        spend: previousData.total_spend,
        impressions: previousData.total_impressions,
        clicks: previousData.total_clicks,
        conversions: previousData.total_conversions,
        cpc: previousData.avg_cpc,
        cpm: previousData.avg_cpm,
        ctr: previousData.avg_ctr,
        conversionRate: previousData.conversion_rate
      },
      changes: {
        spend: calculateChange(currentData.total_spend, previousData.total_spend),
        impressions: calculateChange(currentData.total_impressions, previousData.total_impressions),
        clicks: calculateChange(currentData.total_clicks, previousData.total_clicks),
        conversions: calculateChange(currentData.total_conversions, previousData.total_conversions),
        cpc: calculateChange(currentData.avg_cpc, previousData.avg_cpc),
        cpm: calculateChange(currentData.avg_cpm, previousData.avg_cpm),
        ctr: calculateChange(currentData.avg_ctr, previousData.avg_ctr),
        conversionRate: calculateChange(currentData.conversion_rate, previousData.conversion_rate)
      }
    };

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Erro ao comparar períodos:', error);
    return NextResponse.json(
      { error: 'Erro ao comparar períodos' },
      { status: 500 }
    );
  }
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
