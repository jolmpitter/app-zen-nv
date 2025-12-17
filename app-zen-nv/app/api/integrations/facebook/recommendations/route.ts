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

    // Buscar dados
    const insights = await metaAdsAPI.getAccountInsights('last_30d');
    const campaigns = await metaAdsAPI.getCampaigns();

    // Gerar recomendações baseadas em IA/análise
    const recommendations = [];

    // Análise de performance geral
    if (insights.avg_ctr > 2) {
      recommendations.push({
        category: 'Performance',
        priority: 'high',
        title: 'Excelente Taxa de Cliques',
        description: `Seu CTR de ${insights.avg_ctr.toFixed(2)}% está acima da média do mercado`,
        action: 'Considere aumentar o orçamento para maximizar resultados',
        impact: 'Potencial aumento de 30-50% em conversões',
        icon: '🎯'
      });
    }

    if (insights.conversion_rate < 1) {
      recommendations.push({
        category: 'Conversão',
        priority: 'critical',
        title: 'Taxa de Conversão Baixa',
        description: 'Apenas ' + insights.conversion_rate.toFixed(2) + '% dos cliques estão convertendo',
        action: 'Revise sua landing page, processo de checkout e oferta',
        impact: 'Pode dobrar ou triplicar suas conversões',
        icon: '⚠️'
      });
    }

    // Análise de orçamento
    if (insights.total_spend > 0 && insights.total_conversions > 0) {
      const costPerConversion = insights.total_spend / insights.total_conversions;
      if (costPerConversion > 100) {
        recommendations.push({
          category: 'Orçamento',
          priority: 'high',
          title: 'Custo por Conversão Elevado',
          description: `R$ ${costPerConversion.toFixed(2)} por conversão está acima do ideal`,
          action: 'Teste novos públicos e criativos para reduzir custos',
          impact: 'Redução de 20-40% no custo de aquisição',
          icon: '💰'
        });
      }
    }

    // Análise de campanhas
    if (campaigns.length > 5) {
      recommendations.push({
        category: 'Estrutura',
        priority: 'medium',
        title: 'Muitas Campanhas Ativas',
        description: `Você tem ${campaigns.length} campanhas rodando simultaneamente`,
        action: 'Consolide campanhas similares para melhor performance',
        impact: 'Melhor controle e otimização do orçamento',
        icon: '📊'
      });
    }

    // Análise de horários (sugestão genérica)
    recommendations.push({
      category: 'Timing',
      priority: 'medium',
      title: 'Otimização de Horários',
      description: 'Identifique os melhores horários para seus anúncios',
      action: 'Use o relatório de desempenho por horário do Meta Ads',
      impact: 'Aumento de 15-25% na eficiência do orçamento',
      icon: '⏰'
    });

    // Recomendação de testes A/B
    if (campaigns.length >= 1) {
      recommendations.push({
        category: 'Otimização',
        priority: 'medium',
        title: 'Teste A/B de Criativos',
        description: 'Teste diferentes versões de anúncios para encontrar o melhor desempenho',
        action: 'Crie variações de títulos, imagens e chamadas para ação',
        impact: 'Melhoria de 20-60% nas métricas principais',
        icon: '🔬'
      });
    }

    // Recomendação de retargeting
    recommendations.push({
      category: 'Público',
      priority: 'high',
      title: 'Implementar Retargeting',
      description: 'Alcance pessoas que já interagiram com sua marca',
      action: 'Configure o Pixel do Meta e crie campanhas de retargeting',
      impact: 'Taxa de conversão 2-3x maior que campanhas frias',
      icon: '🎪'
    });

    return NextResponse.json({
      recommendations,
      summary: {
        totalRecommendations: recommendations.length,
        critical: recommendations.filter(r => r.priority === 'critical').length,
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length
      },
      metrics: insights
    });
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar recomendações' },
      { status: 500 }
    );
  }
}
