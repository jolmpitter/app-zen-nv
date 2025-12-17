'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  RefreshCcw,
  Loader2,
  Plus,
  Settings,
  BarChart3,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeSeriesChart } from '@/components/meta-ads/time-series-chart';
import { ConversionFunnel } from '@/components/meta-ads/conversion-funnel';
import { ComparisonCard } from '@/components/meta-ads/comparison-card';
import { AlertCard } from '@/components/meta-ads/alert-card';
import { RecommendationCard } from '@/components/meta-ads/recommendation-card';
import { toast } from 'sonner';
import { MetaAdsSkeleton } from '@/components/skeletons/meta-ads-skeleton';
import { AnimatedDiv, StaggerContainer } from '@/components/animated/motion-components';
import { useLazyAnimation, usePrefersReducedMotion } from '@/hooks/use-lazy-animation';
import { fadeInUp, fadeIn, staggerItem } from '@/lib/animations';

interface MetricData {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  cpm: number;
  ctr: number;
  conversionRate: number;
  leads?: number;
  purchases?: number;
}

interface TimeSeriesData {
  date: string;
  spend: number;
  conversions: number;
  leads: number;
  purchases: number;
}

interface FacebookAdAccount {
  id: string;
  accountName: string;
  accountId: string;
  isActive: boolean;
}

export default function MetaAdsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [accounts, setAccounts] = useState<FacebookAdAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [period, setPeriod] = useState('last_30d');

  // Novos estados para análise avançada
  const [comparison, setComparison] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Animation hooks
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref: headerRef, shouldAnimate: shouldAnimateHeader } = useLazyAnimation<HTMLDivElement>();
  const { ref: filtersRef, shouldAnimate: shouldAnimateFilters } = useLazyAnimation<HTMLDivElement>();
  const { ref: metricsRef, shouldAnimate: shouldAnimateMetrics } = useLazyAnimation<HTMLDivElement>();
  const { ref: chartsRef, shouldAnimate: shouldAnimateCharts } = useLazyAnimation<HTMLDivElement>();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (session?.user?.role !== 'gerente' && session?.user?.role !== 'gestor') {
      router.push('/dashboard');
      return;
    }
    fetchAccounts();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedAccount) {
      fetchData();
    }
  }, [selectedAccount, period]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/integrations/facebook/accounts');
      const data = await res.json();
      if (data.facebookAdAccounts) {
        setAccounts(data.facebookAdAccounts);
        const active = data.facebookAdAccounts.find((acc: FacebookAdAccount) => acc.isActive);
        if (active) {
          setSelectedAccount(active.id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast.error('Erro ao carregar contas');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchTimeSeries()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/integrations/facebook/insights?period=${period}&accountId=${selectedAccount}`);
      const data = await res.json();
      if (!data.error) {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };

  const fetchTimeSeries = async () => {
    try {
      const res = await fetch(`/api/integrations/facebook/time-series?accountId=${selectedAccount}`);
      const data = await res.json();
      if (!data.error) {
        setTimeSeriesData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar séries temporais:', error);
    }
  };

  const fetchComparison = async () => {
    setLoadingComparison(true);
    try {
      const currentPeriod = period;
      const previousPeriod = period === 'last_7d' ? 'last_14d' : 'last_60d';
      const res = await fetch(`/api/integrations/facebook/comparison?accountId=${selectedAccount}&currentPeriod=${currentPeriod}&previousPeriod=${previousPeriod}`);
      const data = await res.json();
      if (!data.error) {
        setComparison(data);
      }
    } catch (error) {
      console.error('Erro ao buscar comparação:', error);
      toast.error('Erro ao carregar comparação');
    } finally {
      setLoadingComparison(false);
    }
  };

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`/api/integrations/facebook/alerts?accountId=${selectedAccount}`);
      const data = await res.json();
      if (!data.error) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      toast.error('Erro ao carregar alertas');
    } finally {
      setLoadingAlerts(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const res = await fetch(`/api/integrations/facebook/recommendations?accountId=${selectedAccount}`);
      const data = await res.json();
      if (!data.error) {
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      toast.error('Erro ao carregar recomendações');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'comparison' && !comparison) {
      fetchComparison();
    } else if (tab === 'alerts' && alerts.length === 0) {
      fetchAlerts();
    } else if (tab === 'recommendations' && recommendations.length === 0) {
      fetchRecommendations();
    }
  };

  if (status === 'loading' || !session || loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 pt-16 lg:pt-6 max-w-7xl">
        <MetaAdsSkeleton />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="container mx-auto p-4 sm:p-6 pt-16 lg:pt-6 max-w-7xl">
        <div className="max-w-3xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Meta Ads não configurado</CardTitle>
              <p className="text-muted-foreground mt-2">
                Conecte sua conta do Meta Ads para começar a monitorar e otimizar suas campanhas
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Benefícios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-semibold mb-1">Métricas em Tempo Real</h3>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe ROI, conversões e gastos atualizados
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold mb-1">Alertas Automáticos</h3>
                  <p className="text-xs text-muted-foreground">
                    Receba avisos sobre problemas de desempenho
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold mb-1">Recomendações IA</h3>
                  <p className="text-xs text-muted-foreground">
                    Sugestões inteligentes de otimização
                  </p>
                </div>
              </div>

              {/* Funcionalidades */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-center">🚀 O que você poderá fazer:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Monitorar gastos e conversões</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Gerenciar campanhas ativas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Comparar períodos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Visualizar funil de conversão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Gerar relatórios em PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Pausar/ativar campanhas</span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => router.push('/integracoes')}
                  className="flex-1"
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Conectar Conta Meta Ads
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Voltar ao Dashboard
                </Button>
              </div>

              {/* Nota de segurança */}
              <p className="text-xs text-center text-muted-foreground">
                🔒 Suas credenciais são armazenadas de forma segura e criptografada
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 pt-16 lg:pt-6 max-w-7xl">
      <AnimatedDiv 
        ref={headerRef}
        variants={shouldAnimateHeader ? fadeInUp : undefined}
        initial="initial"
        animate="animate"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-bold">📊 Meta Ads</h1>
          <p className="text-muted-foreground mt-1">Análise completa de campanhas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/integracoes')}>
            <Settings className="w-4 h-4 mr-2" />
            Gerenciar Contas
          </Button>
          <Button variant="outline" onClick={() => router.push('/meta-ads/campanhas')}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Campanhas
          </Button>
          <Button onClick={fetchData}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </AnimatedDiv>

      {/* Seleção de Conta e Período */}
      <AnimatedDiv
        ref={filtersRef}
        variants={shouldAnimateFilters ? fadeIn : undefined}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conta de Anúncios</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountName} {account.isActive && '(Ativa)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="last_7d">Últimos 7 dias</SelectItem>
                <SelectItem value="last_30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </AnimatedDiv>

      {/* Abas principais */}
      <Tabs defaultValue="overview" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        {/* Aba: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Cards de Métricas */}
              <StaggerContainer
                ref={metricsRef}
                shouldAnimate={shouldAnimateMetrics}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <AnimatedDiv
                  variants={shouldAnimateMetrics ? staggerItem : undefined}
                >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Gasto Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {metrics?.spend?.toFixed(2) || '0.00'}
                    </div>
                  </CardContent>
                </Card>
                </AnimatedDiv>

                <AnimatedDiv
                  variants={shouldAnimateMetrics ? staggerItem : undefined}
                >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Impressões
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics?.impressions?.toLocaleString('pt-BR') || '0'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      CPM: R$ {metrics?.cpm?.toFixed(2) || '0.00'}
                    </p>
                  </CardContent>
                </Card>
                </AnimatedDiv>

                <AnimatedDiv
                  variants={shouldAnimateMetrics ? staggerItem : undefined}
                >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MousePointerClick className="w-4 h-4" />
                      Cliques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics?.clicks?.toLocaleString('pt-BR') || '0'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      CTR: {metrics?.ctr?.toFixed(2) || '0.00'}% | CPC: R$ {metrics?.cpc?.toFixed(2) || '0.00'}
                    </p>
                  </CardContent>
                </Card>
                </AnimatedDiv>

                <AnimatedDiv
                  variants={shouldAnimateMetrics ? staggerItem : undefined}
                >
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Conversões
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics?.conversions?.toLocaleString('pt-BR') || '0'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Taxa: {metrics?.conversionRate?.toFixed(2) || '0.00'}%
                    </p>
                  </CardContent>
                </Card>
                </AnimatedDiv>
              </StaggerContainer>

              {/* Funil de Conversão */}
              <AnimatedDiv
                variants={shouldAnimateCharts ? fadeIn : undefined}
                initial="initial"
                animate="animate"
              >
              <ConversionFunnel
                impressions={metrics?.impressions || 0}
                clicks={metrics?.clicks || 0}
                leads={metrics?.leads || 0}
                conversions={metrics?.conversions || 0}
              />
              </AnimatedDiv>

              {/* Gráficos Temporais */}
              {timeSeriesData.length > 0 && (
                <AnimatedDiv
                  ref={chartsRef}
                  variants={shouldAnimateCharts ? fadeIn : undefined}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  <TimeSeriesChart
                    data={timeSeriesData}
                    title="Gasto & Conversões"
                    showSpend
                    showConversions
                  />
                  <TimeSeriesChart
                    data={timeSeriesData}
                    title="Leads & Compras"
                    showLeads
                    showPurchases
                  />
                </AnimatedDiv>
              )}
            </>
          )}
        </TabsContent>

        {/* Aba: Comparação */}
        <TabsContent value="comparison" className="space-y-6">
          {loadingComparison ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : comparison ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Comparação de Períodos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Comparando o período atual com o anterior
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ComparisonCard
                  title="Gasto"
                  currentValue={comparison.current.spend}
                  previousValue={comparison.previous.spend}
                  change={comparison.changes.spend}
                  format="currency"
                  inverted
                />
                <ComparisonCard
                  title="Impressões"
                  currentValue={comparison.current.impressions}
                  previousValue={comparison.previous.impressions}
                  change={comparison.changes.impressions}
                />
                <ComparisonCard
                  title="Cliques"
                  currentValue={comparison.current.clicks}
                  previousValue={comparison.previous.clicks}
                  change={comparison.changes.clicks}
                />
                <ComparisonCard
                  title="Conversões"
                  currentValue={comparison.current.conversions}
                  previousValue={comparison.previous.conversions}
                  change={comparison.changes.conversions}
                />
                <ComparisonCard
                  title="CPC"
                  currentValue={comparison.current.cpc}
                  previousValue={comparison.previous.cpc}
                  change={comparison.changes.cpc}
                  format="currency"
                  inverted
                />
                <ComparisonCard
                  title="CTR"
                  currentValue={comparison.current.ctr}
                  previousValue={comparison.previous.ctr}
                  change={comparison.changes.ctr}
                  format="percentage"
                />
                <ComparisonCard
                  title="CPM"
                  currentValue={comparison.current.cpm}
                  previousValue={comparison.previous.cpm}
                  change={comparison.changes.cpm}
                  format="currency"
                  inverted
                />
                <ComparisonCard
                  title="Taxa de Conversão"
                  currentValue={comparison.current.conversionRate}
                  previousValue={comparison.previous.conversionRate}
                  change={comparison.changes.conversionRate}
                  format="percentage"
                />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Clique na aba para carregar a comparação</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Alertas */}
        <TabsContent value="alerts" className="space-y-6">
          {loadingAlerts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : alerts.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Alertas Automáticos ({alerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Métricas que precisam de atenção
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {alerts.map((alert, index) => (
                  <AlertCard key={index} alert={alert} />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-green-600 mb-4">✅</div>
                <p className="font-medium">Nenhum alerta no momento</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Suas campanhas estão performando bem!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Recomendações */}
        <TabsContent value="recommendations" className="space-y-6">
          {loadingRecommendations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : recommendations.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Recomendações de IA ({recommendations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Ações sugeridas para melhorar performance
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {recommendations.map((rec, index) => (
                  <RecommendationCard key={index} recommendation={rec} />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Clique na aba para carregar recomendações</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
