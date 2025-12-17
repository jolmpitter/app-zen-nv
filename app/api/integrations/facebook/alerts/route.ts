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

    // Buscar conta ativa
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

    // Buscar dados dos últimos 7 dias
    const insights = await metaAdsAPI.getAccountInsights('last_7d');

    // Analisar e gerar alertas
    const alerts = [];

    // Alerta: CTR muito baixo
    if (insights.avg_ctr < 1) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        metric: 'CTR',
        message: 'CTR está abaixo de 1%',
        recommendation: 'Considere revisar seus criativos e segmentação de público',
        currentValue: insights.avg_ctr,
        threshold: 1
      });
    }

    // Alerta: Taxa de conversão muito baixa
    if (insights.conversion_rate < 2) {
      alerts.push({
        type: 'warning',
        severity: 'high',
        metric: 'Taxa de Conversão',
        message: 'Taxa de conversão está abaixo de 2%',
        recommendation: 'Revise sua landing page e processo de checkout',
        currentValue: insights.conversion_rate,
        threshold: 2
      });
    }

    // Alerta: CPC muito alto
    if (insights.avg_cpc > 5) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        metric: 'CPC',
        message: 'Custo por clique está acima de R$ 5,00',
        recommendation: 'Otimize suas palavras-chave e segmentação',
        currentValue: insights.avg_cpc,
        threshold: 5
      });
    }

    // Alerta: Gasto muito alto sem conversões proporcionais
    if (insights.total_spend > 1000 && insights.total_conversions < 10) {
      alerts.push({
        type: 'critical',
        severity: 'high',
        metric: 'ROI',
        message: 'Alto investimento com baixo retorno',
        recommendation: 'Pause campanhas de baixo desempenho e reavalie estratégia',
        currentValue: insights.total_conversions,
        threshold: 10
      });
    }

    // Alerta: Impressões baixas
    if (insights.total_impressions < 1000) {
      alerts.push({
        type: 'info',
        severity: 'low',
        metric: 'Impressões',
        message: 'Baixo alcance de impressões',
        recommendation: 'Considere aumentar orçamento ou ampliar público',
        currentValue: insights.total_impressions,
        threshold: 1000
      });
    }

    return NextResponse.json({ alerts, metrics: insights });
  } catch (error) {
    console.error('Erro ao gerar alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar alertas' },
      { status: 500 }
    );
  }
}
