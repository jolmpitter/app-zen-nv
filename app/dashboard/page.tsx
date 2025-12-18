'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AnimatedDiv, StaggerContainer } from '@/components/animated/motion-components';
import { useLazyAnimation, usePrefersReducedMotion } from '@/hooks/use-lazy-animation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
  Percent,
  TrendingDown,
  Sprout,
  BarChart3,
  LineChart as LineChartIcon,
  Activity,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { DateFilter } from '@/components/date-filter';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { fadeInUp, staggerItem } from '@/lib/animations';
import { MarketingEvolutionChart } from '@/components/dashboard/marketing-evolution-chart';
import { ConversionFunnelFull } from '@/components/dashboard/conversion-funnel-full';
import { CampaignsComparisonChart } from '@/components/dashboard/campaigns-comparison-chart';
import { OriginMixChart } from '@/components/dashboard/origin-mix-chart';
import { PerformanceHeatmap } from '@/components/dashboard/performance-heatmap';
import { MonthlyGoalGauge } from '@/components/dashboard/monthly-goal-gauge';
import { LeadsPipelineTable } from '@/components/dashboard/leads-pipeline-table';
import { CreativePerformanceRadar } from '@/components/dashboard/creative-performance-radar';
import { MonthlyGrowthArea } from '@/components/dashboard/monthly-growth-area';
import { GlobalSearch } from '@/components/dashboard/global-search';

interface MetricsSummary {
  totalGasto: number;
  totalVendido: number;
  totalLeads: number;
  totalVendas: number;
  totalVendasOrganicas: number;
  totalVendidoOrganico: number;
  roiGeral: number;
  custoPorLeadMedio: number;
  taxaConversaoMedia: number;
  ticketMedio: number;
}

interface DailyMetric {
  id: string;
  date: string;
  valorGasto: number;
  valorVendido: number;
  quantidadeLeads: number;
  quantidadeVendas: number;
  roi: number;
  custoPorLead: number;
  taxaConversao: number;
  ticketMedio: number;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface User {
  id: string;
  name: string;
  role: string;
}

// Nova Paleta Moderna de Cores para Gráficos
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#0EA5E9', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function DashboardPage() {
  const { data: session } = useSession() || {};
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('todos');
  const [filterType, setFilterType] = useState<string>('atendente'); // 'atendente' ou 'gestor'
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Hooks de otimização de performance
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref: filterRef, shouldAnimate: shouldAnimateFilters } = useLazyAnimation({ threshold: 0.1, triggerOnce: true });
  const { ref: kpiRef, shouldAnimate: shouldAnimateKpis } = useLazyAnimation({ threshold: 0.1, triggerOnce: true, delay: 100 });

  useEffect(() => {
    fetchData();
  }, [selectedUser, dateRange, filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Construir parâmetros de data
      const summaryParams = new URLSearchParams();
      const metricsParams = new URLSearchParams();

      // Adicionar filtros de data se houver
      if (dateRange?.from) {
        const startDate = startOfDay(dateRange.from).toISOString();
        summaryParams.append('startDate', startDate);
        metricsParams.append('startDate', startDate);
      }
      if (dateRange?.to) {
        const endDate = endOfDay(dateRange.to).toISOString();
        summaryParams.append('endDate', endDate);
        metricsParams.append('endDate', endDate);
      }

      // Aplicar o mesmo filtro do usuário ao sumário
      if (selectedUser !== 'todos') {
        if (filterType === 'gestor') {
          summaryParams.append('gestorId', selectedUser);
          metricsParams.append('gestorId', selectedUser);
        } else {
          summaryParams.append('userId', selectedUser);
          metricsParams.append('userId', selectedUser);
        }
      }

      // Buscar sumário
      const summaryRes = await fetch(`/api/metrics/summary?${summaryParams}`);
      const summaryData = await summaryRes.json();
      setSummary(summaryData && !summaryData.error ? summaryData : null);

      // Buscar métricas detalhadas
      const metricsRes = await fetch(`/api/metrics?${metricsParams}`);
      const metricsData = await metricsRes.json();
      setMetrics(Array.isArray(metricsData) ? metricsData : []);

      // Buscar usuários (gestores e gerente)
      if (session?.user?.role === 'gestor' || session?.user?.role === 'gerente') {
        const usersRes = await fetch('/api/users');
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Preparar dados para os novos gráficos

  // 1. Evolução de CPA, CPL, CPC e ROAS
  const marketingEvolutionData = metrics
    ?.map((m) => ({
      date: new Date(m?.date || '')?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      cpa: m?.quantidadeVendas > 0 ? (m?.valorGasto || 0) / (m?.quantidadeVendas || 1) : 0,
      cpl: m?.quantidadeLeads > 0 ? (m?.valorGasto || 0) / (m?.quantidadeLeads || 1) : 0,
      cpc: m?.quantidadeLeads > 0 ? (m?.valorGasto || 0) / ((m?.quantidadeLeads || 0) * 10) : 0, // Estimativa: 10 cliques por lead
      roas: m?.valorGasto > 0 ? (m?.valorVendido || 0) / (m?.valorGasto || 1) : 0,
    }))
    ?.reverse()
    ?.slice(-30) || []; // Últimos 30 dias

  // 2. Funil de Conversão - Dados agregados
  const funnelData = {
    impressoes: metrics?.reduce((acc, m) => acc + ((m?.quantidadeLeads || 0) * 100), 0) || 0, // Estimativa: 100 impressões por lead
    cliques: metrics?.reduce((acc, m) => acc + ((m?.quantidadeLeads || 0) * 10), 0) || 0, // Estimativa: 10 cliques por lead
    leads: summary?.totalLeads || 0,
    conversas: Math.round((summary?.totalLeads || 0) * 0.6), // 60% dos leads viram conversas
    compras: Math.round((summary?.totalLeads || 0) * 0.3), // 30% dos leads viram compras
    vendas: summary?.totalVendas || 0,
    ltv: (summary?.totalVendido || 0) * 1.5, // LTV estimado: 1.5x o valor vendido
  };

  // 3. Comparação entre Campanhas (Top 5 atendentes como "campanhas")
  const campaignsData = Object.entries(
    metrics?.reduce((acc: any, m) => {
      const userName = m?.user?.name || 'Desconhecido';
      if (!acc[userName]) {
        acc[userName] = { name: userName, gasto: 0, leads: 0, vendas: 0, vendido: 0 };
      }
      acc[userName].gasto += m?.valorGasto || 0;
      acc[userName].leads += m?.quantidadeLeads || 0;
      acc[userName].vendas += m?.quantidadeVendas || 0;
      acc[userName].vendido += m?.valorVendido || 0;
      return acc;
    }, {}) || {}
  )
    .map(([_, data]: any) => ({
      name: data.name.split(' ')[0], // Primeiro nome
      gasto: data.gasto,
      leads: data.leads,
      cpa: data.vendas > 0 ? data.gasto / data.vendas : 0,
      roas: data.gasto > 0 ? data.vendido / data.gasto : 0,
    }))
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 5);

  // 4. Mix de Origens (dados simulados por mês)
  const originMixData = [
    { month: 'Jan', facebook: 15000, google: 8000, tiktok: 3000, organico: 2000 },
    { month: 'Fev', facebook: 18000, google: 9500, tiktok: 4000, organico: 2500 },
    { month: 'Mar', facebook: 22000, google: 11000, tiktok: 5500, organico: 3000 },
    { month: 'Abr', facebook: 19000, google: 10000, tiktok: 4500, organico: 2800 },
    { month: 'Mai', facebook: 25000, google: 13000, tiktok: 6000, organico: 3500 },
    { month: 'Jun', facebook: 28000, google: 15000, tiktok: 7000, organico: 4000 },
  ];

  // 5. Heatmap de Performance (dados simulados)
  const heatmapData = (() => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const data: any[] = [];
    days.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        data.push({
          day,
          hour,
          value: Math.random() * 100,
          metric: 'roi',
        });
      }
    });
    return data;
  })();

  // 6. Metas e KPIs
  const goalsData = {
    metaMensal: 100000,
    valorAtingido: summary?.totalVendido || 0,
    metaDiaria: 3333,
    valorDiario: (summary?.totalVendido || 0) / 30, // Média diária
    ticketMedio: summary?.ticketMedio || 0,
    roasAtual: (summary?.totalGasto || 0) > 0 ? (summary?.totalVendido || 0) / (summary?.totalGasto || 1) : 0,
  };

  // 7. Tabela de Leads (primeiros 10)
  const leadsTableData = metrics
    ?.slice(0, 10)
    ?.map((m, index) => ({
      id: `lead-${index}`,
      nome: `Lead ${index + 1} - ${m?.user?.name?.split(' ')[0] || 'N/A'}`,
      status: ['novo', 'em_contato', 'negociacao', 'concluido', 'perdido'][Math.floor(Math.random() * 5)],
      data: m?.date || new Date().toISOString(),
      origem: ['Facebook', 'Google', 'TikTok', 'Orgânico'][Math.floor(Math.random() * 4)],
      valorPrevisto: (m?.valorVendido || 0) / (m?.quantidadeVendas || 1),
    })) || [];

  // 8. Performance por Criativo (dados simulados)
  const creativesData = [
    { criativo: 'Criativo A', ctr: 2.5, cpc: 1.2, cpm: 15, conversao: 8, roas: 3.2 },
    { criativo: 'Criativo B', ctr: 3.1, cpc: 0.9, cpm: 12, conversao: 10, roas: 4.1 },
    { criativo: 'Criativo C', ctr: 1.8, cpc: 1.5, cpm: 18, conversao: 6, roas: 2.5 },
    { criativo: 'Criativo D', ctr: 2.9, cpc: 1.0, cpm: 14, conversao: 9, roas: 3.8 },
  ];

  // 9. Crescimento Mensal
  const monthlyGrowthData = [
    { month: 'Jan', vendas: 45, leads: 180 },
    { month: 'Fev', vendas: 52, leads: 210 },
    { month: 'Mar', vendas: 61, leads: 245 },
    { month: 'Abr', vendas: 58, leads: 230 },
    { month: 'Mai', vendas: 70, leads: 280 },
    { month: 'Jun', vendas: 78, leads: 310 },
  ];

  if (loading) {
    return (
      <div className="pt-16 lg:pt-6 p-4 sm:p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-6 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
            Bem-vindo, {session?.user?.name || 'Usuário'}
          </p>
        </div>

        <div className="flex-1 max-w-md hidden md:block">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs sm:text-sm px-3 py-1">
            {session?.user?.role === 'gerente' ? 'Gerente' : session?.user?.role === 'gestor' ? 'Gestor' : 'Atendente'}
          </Badge>
        </div>
      </div>

      {/* Filtros - Seção Compacta */}
      <AnimatedDiv
        ref={filterRef}
        className="bg-[#111827] p-5 rounded-[20px] border border-[#1f2937] shadow-[0_4px_24px_rgba(0,0,0,0.45)] transition-all duration-300"
        variants={shouldAnimateFilters && !prefersReducedMotion ? fadeInUp : undefined}
        initial="hidden"
        animate="visible"
      >
        <div className="mb-3">
          <h2 className="text-white text-[1.5rem] font-bold tracking-tight mb-1">Filtros</h2>
          <p className="text-gray-300 text-[0.9rem]">
            Filtre os dados por período e usuário
          </p>
        </div>
        <div className="space-y-3">
          {/* Filtro de Data */}
          <div>
            <label className="text-gray-200 text-[0.95rem] font-semibold mb-1.5 block">Período</label>
            <DateFilter value={dateRange} onChange={setDateRange} />
          </div>

          {/* Filtros de Usuário (apenas para gestores e gerentes) */}
          {(session?.user?.role === 'gestor' || session?.user?.role === 'gerente') && users?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-200 text-[0.95rem] font-semibold mb-1.5 block">Tipo de Filtro</label>
                <Select value={filterType} onValueChange={(value) => {
                  setFilterType(value);
                  setSelectedUser('todos');
                }}>
                  <SelectTrigger className="h-[40px] bg-[rgba(255,255,255,0.06)] text-[#f1f5f9] border border-[rgba(255,255,255,0.08)] px-3 rounded-[10px] text-[0.95rem] font-medium backdrop-blur-sm hover:bg-[rgba(255,255,255,0.08)] transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-[#1e293b]">
                    <SelectItem value="atendente" className="text-slate-200 focus:bg-slate-700">Por Atendente</SelectItem>
                    <SelectItem value="gestor" className="text-slate-200 focus:bg-slate-700">Gestor e seus Atendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-gray-200 text-[0.95rem] font-semibold mb-1.5 block">
                  {filterType === 'gestor' ? 'Gestor' : 'Atendente'}
                </label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-[40px] bg-[rgba(255,255,255,0.06)] text-[#f1f5f9] border border-[rgba(255,255,255,0.08)] px-3 rounded-[10px] text-[0.95rem] font-medium backdrop-blur-sm hover:bg-[rgba(255,255,255,0.08)] transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f172a] border-[#1e293b]">
                    <SelectItem value="todos" className="text-slate-200 focus:bg-slate-700">Todos</SelectItem>
                    {users
                      ?.filter((user) =>
                        user?.id && (
                          filterType === 'gestor'
                            ? user?.role === 'gestor'
                            : user?.role === 'atendente'
                        )
                      )
                      ?.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="text-slate-200 focus:bg-slate-700">
                          {user?.name || 'Sem nome'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </AnimatedDiv>

      {/* KPIs - Cards com Frosted Glass */}
      <StaggerContainer
        ref={kpiRef}
        className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 mt-4"
        variants={shouldAnimateKpis && !prefersReducedMotion ? undefined : {}}
        initial="hidden"
        animate="visible"
        delay={0.1}
      >
        <AnimatedDiv variants={shouldAnimateKpis && !prefersReducedMotion ? staggerItem : undefined}>
          <Card className="border border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] backdrop-blur-md hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-2.5">
              <div className="icon-3d icon-green mb-2.5">
                <DollarSign strokeWidth={2.5} />
              </div>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Total Vendido
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-2xl font-bold text-white break-all">
                R$ {(summary?.totalVendido || 0)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </AnimatedDiv>

        <AnimatedDiv variants={shouldAnimateKpis && !prefersReducedMotion ? staggerItem : undefined}>
          <Card className="border border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] backdrop-blur-md hover:shadow-2xl hover:shadow-red-500/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-2.5">
              <div className="icon-3d icon-red mb-2.5">
                <TrendingDown strokeWidth={2.5} />
              </div>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Total Gasto
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-2xl font-bold text-white break-all">
                R$ {(summary?.totalGasto || 0)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </AnimatedDiv>

        <AnimatedDiv variants={shouldAnimateKpis && !prefersReducedMotion ? staggerItem : undefined}>
          <Card className="border border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] backdrop-blur-md hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-2.5">
              <div className="icon-3d icon-yellow mb-2.5">
                <TrendingUp strokeWidth={2.5} />
              </div>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Lucro Líquido
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-2xl font-bold text-white break-all">
                R$ {((summary?.totalVendido || 0) - (summary?.totalGasto || 0))?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </AnimatedDiv>

        <AnimatedDiv variants={shouldAnimateKpis && !prefersReducedMotion ? staggerItem : undefined}>
          <Card className="border border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] backdrop-blur-md hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-2.5">
              <div className="icon-3d icon-blue mb-2.5">
                <Users strokeWidth={2.5} />
              </div>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Total de Leads
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-2xl font-bold text-white">{summary?.totalLeads || 0}</p>
            </CardContent>
          </Card>
        </AnimatedDiv>

        <AnimatedDiv variants={shouldAnimateKpis && !prefersReducedMotion ? staggerItem : undefined}>
          <Card className="border border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] backdrop-blur-md hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-2.5">
              <div className="icon-3d icon-purple mb-2.5">
                <ShoppingCart strokeWidth={2.5} />
              </div>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Total de Vendas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-2xl font-bold text-white">{summary?.totalVendas || 0}</p>
            </CardContent>
          </Card>
        </AnimatedDiv>

        <AnimatedDiv variants={shouldAnimateKpis && !prefersReducedMotion ? staggerItem : undefined}>
          <Card className="border border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] backdrop-blur-md hover:shadow-2xl hover:shadow-pink-500/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-2.5">
              <div className="icon-3d icon-pink mb-2.5">
                <Percent strokeWidth={2.5} />
              </div>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Taxa de Conversão
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-2xl font-bold text-white">
                {(summary?.taxaConversaoMedia || 0)?.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </AnimatedDiv>

        <AnimatedDiv variants={shouldAnimateKpis && !prefersReducedMotion ? staggerItem : undefined}>
          <Card className="border border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] backdrop-blur-md hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-2.5">
              <div className="icon-3d icon-green mb-2.5">
                <Sprout strokeWidth={2.5} />
              </div>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Vendas Orgânicas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-2xl font-bold text-white">
                {summary?.totalVendasOrganicas || 0} vendas
              </p>
              <p className="text-xs text-slate-400 mt-1">
                R$ {(summary?.totalVendidoOrganico || 0)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </AnimatedDiv>

        <AnimatedDiv variants={shouldAnimateKpis && !prefersReducedMotion ? staggerItem : undefined}>
          <Card className="border border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] backdrop-blur-md hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-2.5">
              <div className="icon-3d icon-orange mb-2.5">
                <Target strokeWidth={2.5} />
              </div>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Custo por Lead
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-2xl font-bold text-white">
                R$ {(summary?.custoPorLeadMedio || 0)?.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </AnimatedDiv>

        <AnimatedDiv variants={shouldAnimateKpis && !prefersReducedMotion ? staggerItem : undefined}>
          <Card className="border border-[rgba(255,255,255,0.12)] bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)] backdrop-blur-md hover:shadow-2xl hover:shadow-cyan-500/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300">
            <CardHeader className="pb-2.5">
              <div className="icon-3d icon-cyan mb-2.5">
                <DollarSign strokeWidth={2.5} />
              </div>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Ticket Médio
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <p className="text-2xl font-bold text-white">
                R$ {(summary?.ticketMedio || 0)?.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </AnimatedDiv>
      </StaggerContainer>

      {/* Seção de Métricas Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Métricas Principais
          </CardTitle>
          <CardDescription>Resumo detalhado de performance e resultados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Total Vendido */}
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Vendido</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                R$ {(summary?.totalVendido || 0)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Gasto Total */}
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Gasto Total</span>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                R$ {(summary?.totalGasto || 0)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* ROI */}
            <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">ROI</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(summary?.roiGeral || 0)?.toFixed(1)}%
              </p>
            </div>

            {/* Total de Leads */}
            <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total de Leads</span>
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {summary?.totalLeads || 0}
              </p>
            </div>

            {/* Total de Vendas */}
            <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-pink-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total de Vendas</span>
              </div>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {summary?.totalVendas || 0}
              </p>
            </div>

            {/* Custo por Lead */}
            <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Custo por Lead</span>
              </div>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                R$ {(summary?.custoPorLeadMedio || 0)?.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Gráficos de Marketing Digital */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-100">Análise de Marketing Digital</h2>
          <Badge variant="outline" className="text-xs">9 Gráficos Avançados</Badge>
        </div>

        {/* Grid de Gráficos - Seguindo ordem de prioridade */}
        <div className="space-y-6">
          {/* 1. Evolução de CPA, CPL, CPC e ROAS */}
          <MarketingEvolutionChart data={marketingEvolutionData} />

          {/* 2. Funil de Conversão Completo */}
          <ConversionFunnelFull
            impressoes={funnelData.impressoes}
            cliques={funnelData.cliques}
            leads={funnelData.leads}
            conversas={funnelData.conversas}
            compras={funnelData.compras}
            vendas={funnelData.vendas}
            ltv={funnelData.ltv}
          />

          {/* 3 e 4. Comparação de Campanhas e Mix de Origens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CampaignsComparisonChart data={campaignsData} />
            <OriginMixChart data={originMixData} />
          </div>

          {/* 5 e 6. Heatmap e Metas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceHeatmap data={heatmapData} metric="roi" />
            <MonthlyGoalGauge
              metaMensal={goalsData.metaMensal}
              valorAtingido={goalsData.valorAtingido}
              metaDiaria={goalsData.metaDiaria}
              valorDiario={goalsData.valorDiario}
              ticketMedio={goalsData.ticketMedio}
              roasAtual={goalsData.roasAtual}
            />
          </div>

          {/* 7. Tabela Dinâmica de Leads */}
          <LeadsPipelineTable leads={leadsTableData} />

          {/* 8 e 9. Radar de Criativos e Área de Crescimento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CreativePerformanceRadar data={creativesData} />
            <MonthlyGrowthArea data={monthlyGrowthData} />
          </div>
        </div>
      </div>
    </div>
  );
}
