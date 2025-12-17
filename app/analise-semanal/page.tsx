'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Download,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AnalysisSkeleton } from '@/components/skeletons/analysis-skeleton';
import { Bar, Line } from 'react-chartjs-2';
import { DateRange } from 'react-day-picker';
import { DateFilter } from '@/components/date-filter';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import { AnimatedDiv, StaggerContainer } from '@/components/animated/motion-components';
import { useLazyAnimation, usePrefersReducedMotion } from '@/hooks/use-lazy-animation';
import { fadeInUp, fadeIn, staggerItem } from '@/lib/animations';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import * as XLSX from 'xlsx';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeeklyMetrics {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalGasto: number;
  totalLeads: number;
  totalVendas: number;
  totalVendido: number;
  roiMedio: number;
  custoPorLeadMedio: number;
  taxaConversaoMedia: number;
  ticketMedio: number;
  daysWithData: number;
}

interface WeeklyData {
  weeks: WeeklyMetrics[];
  comparisons: any[];
  summary: {
    totalWeeks: number;
    bestWeek: {
      weekNumber: number;
      weekLabel: string;
      roi: number;
    };
    worstWeek: {
      weekNumber: number;
      weekLabel: string;
      roi: number;
    };
    overallMetrics: {
      totalGasto: number;
      totalLeads: number;
      totalVendas: number;
      totalVendido: number;
    };
  };
}

export default function AnaliseSemanalPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Iniciar como false
  const [data, setData] = useState<WeeklyData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedGestorId, setSelectedGestorId] = useState<string>('all');
  const [users, setUsers] = useState<any[]>([]);
  const [gestores, setGestores] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(startOfDay(new Date()), 34), // Últimas 5 semanas (35 dias)
    to: endOfDay(new Date()),
  });

  // Hooks de animação lazy-loaded
  const { ref: headerRef, shouldAnimate: shouldAnimateHeader } = useLazyAnimation({ threshold: 0.1 });
  const { ref: filtersRef, shouldAnimate: shouldAnimateFilters } = useLazyAnimation({ threshold: 0.1 });
  const { ref: summaryRef, shouldAnimate: shouldAnimateSummary } = useLazyAnimation({ threshold: 0.1 });
  const { ref: chartsRef, shouldAnimate: shouldAnimateCharts } = useLazyAnimation({ threshold: 0.1 });
  const { ref: tableRef, shouldAnimate: shouldAnimateTable } = useLazyAnimation({ threshold: 0.1 });
  const prefersReducedMotion = usePrefersReducedMotion();

  // Redirecionar se não autenticado
  useEffect(() => {
    if (status === 'loading') return; // Aguardar carregamento
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Buscar usuários para filtro
  useEffect(() => {
    if (session?.user?.role === 'gerente' || session?.user?.role === 'gestor') {
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => {
          if (data.users) {
            setUsers(data.users.filter((u: any) => u.role === 'atendente'));
            setGestores(data.users.filter((u: any) => u.role === 'gestor'));
          }
        })
        .catch(console.error);
    }
  }, [session]);

  // Buscar dados semanais
  useEffect(() => {
    if (status === 'loading') return; // Aguardar carregamento da sessão
    if (!session?.user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedUserId && selectedUserId !== 'all') params.append('userId', selectedUserId);
        if (selectedGestorId && selectedGestorId !== 'all') params.append('gestorId', selectedGestorId);
        
        // Adicionar filtro de data
        if (dateRange?.from) {
          params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'));
        }
        if (dateRange?.to) {
          params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'));
        }

        const response = await fetch(`/api/metrics/weekly?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Erro na resposta da API: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          console.error('Erro na resposta:', result);
          toast.error('Erro ao carregar dados', {
            description: result.error || 'Dados inválidos retornados pela API',
          });
          setData(null);
        }
      } catch (error: any) {
        console.error('Erro ao buscar dados semanais:', error);
        toast.error('Erro ao carregar dados', {
          description: error.message || 'Erro ao conectar com o servidor',
        });
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, session, selectedUserId, selectedGestorId, dateRange]);

  const exportToExcel = () => {
    if (!data?.weeks) return;

    const ws = XLSX.utils.json_to_sheet(
      data.weeks.map((w) => ({
        Semana: w.weekLabel,
        'Período': `${w.startDate} - ${w.endDate}`,
        'Total Gasto (R$)': w.totalGasto.toFixed(2),
        'Total de Leads': w.totalLeads,
        'Total de Vendas': w.totalVendas,
        'Total Vendido (R$)': w.totalVendido.toFixed(2),
        'ROI Médio (%)': w.roiMedio.toFixed(2),
        'Custo por Lead (R$)': w.custoPorLeadMedio.toFixed(2),
        'Taxa de Conversão (%)': w.taxaConversaoMedia.toFixed(2),
        'Ticket Médio (R$)': w.ticketMedio.toFixed(2),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Análise Semanal');
    XLSX.writeFile(wb, `analise-semanal-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast.success('Excel exportado com sucesso!');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-4 sm:p-6 pt-16 lg:pt-6">
        <div className="max-w-7xl mx-auto">
          <AnalysisSkeleton />
        </div>
      </div>
    );
  }

  if (!data || !data.weeks || data.weeks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-4 sm:p-6 pt-16 lg:pt-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Análise Semanal
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Consolidação de métricas por semana
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado disponível para análise semanal.</p>
                <p className="text-sm mt-2">Adicione métricas para visualizar a análise.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Preparar dados para gráficos
  const chartLabels = data.weeks.map((w) => w.weekLabel);

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Gasto (R$)',
        data: data.weeks.map((w) => w.totalGasto),
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: 'Vendido (R$)',
        data: data.weeks.map((w) => w.totalVendido),
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
    ],
  };

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'ROI (%)',
        data: data.weeks.map((w) => w.roiMedio),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const conversionChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Taxa de Conversão (%)',
        data: data.weeks.map((w) => w.taxaConversaoMedia),
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-4 sm:p-6 pt-16 lg:pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <AnimatedDiv
          ref={headerRef}
          variants={!prefersReducedMotion && shouldAnimateHeader ? fadeInUp : undefined}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Análise Semanal
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Consolidação de métricas por semana
              </p>
            </div>
          </div>

          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </AnimatedDiv>

        {/* Filtros */}
        <AnimatedDiv
          ref={filtersRef}
          variants={!prefersReducedMotion && shouldAnimateFilters ? fadeIn : undefined}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtrar dados por período, usuário ou gestor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {/* Filtro de Período */}
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <DateFilter value={dateRange} onChange={setDateRange} />
            </div>

            {/* Filtros de Usuário (apenas para gestores e gerentes) */}
            {(session?.user?.role === 'gerente' || session?.user?.role === 'gestor') && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Atendente</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os atendentes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os atendentes</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {session?.user?.role === 'gerente' && (
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Gestor</label>
                    <Select value={selectedGestorId} onValueChange={setSelectedGestorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os gestores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os gestores</SelectItem>
                        {gestores.map((gestor) => (
                          <SelectItem key={gestor.id} value={gestor.id}>
                            {gestor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        </AnimatedDiv>

        {/* Cards de Resumo */}
        <StaggerContainer
          ref={summaryRef}
          variants={!prefersReducedMotion && shouldAnimateSummary ? undefined : {}}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <AnimatedDiv
            variants={!prefersReducedMotion && shouldAnimateSummary ? staggerItem : undefined}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Semanas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalWeeks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Período analisado
                </p>
              </CardContent>
            </Card>
          </AnimatedDiv>

          <AnimatedDiv
            variants={!prefersReducedMotion && shouldAnimateSummary ? staggerItem : undefined}
          >
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Melhor Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.bestWeek.weekLabel}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ROI: {data.summary.bestWeek.roi.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </AnimatedDiv>

          <AnimatedDiv
            variants={!prefersReducedMotion && shouldAnimateSummary ? staggerItem : undefined}
          >
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Pior Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.worstWeek.weekLabel}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ROI: {data.summary.worstWeek.roi.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </AnimatedDiv>

          <AnimatedDiv
            variants={!prefersReducedMotion && shouldAnimateSummary ? staggerItem : undefined}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Investido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {data.summary.overallMetrics.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Todas as semanas
                </p>
              </CardContent>
            </Card>
          </AnimatedDiv>
        </StaggerContainer>

        {/* Gráficos */}
        <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatedDiv
            variants={!prefersReducedMotion && shouldAnimateCharts ? fadeIn : undefined}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardHeader>
                <CardTitle>Gasto vs Vendido por Semana</CardTitle>
                <CardDescription>Comparação de investimento e retorno</CardDescription>
              </CardHeader>
              <CardContent>
                <Bar
                  data={barChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `R$ ${value}`,
                        },
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </AnimatedDiv>

          <AnimatedDiv
            variants={!prefersReducedMotion && shouldAnimateCharts ? fadeIn : undefined}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardHeader>
                <CardTitle>Evolução do ROI</CardTitle>
                <CardDescription>ROI médio por semana</CardDescription>
              </CardHeader>
              <CardContent>
                <Line
                  data={lineChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `${value}%`,
                        },
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </AnimatedDiv>

          <AnimatedDiv
            variants={!prefersReducedMotion && shouldAnimateCharts ? fadeIn : undefined}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Conversão</CardTitle>
                <CardDescription>Evolução semanal da conversão</CardDescription>
              </CardHeader>
              <CardContent>
                <Line
                  data={conversionChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `${value}%`,
                        },
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </AnimatedDiv>
        </div>

        {/* Tabela de Semanas */}
        <AnimatedDiv
          ref={tableRef}
          variants={!prefersReducedMotion && shouldAnimateTable ? fadeIn : undefined}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <CardHeader>
              <CardTitle>Detalhes por Semana</CardTitle>
              <CardDescription>
                Todas as métricas consolidadas por período semanal
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Semana</th>
                    <th className="text-left p-2">Período</th>
                    <th className="text-right p-2">Gasto</th>
                    <th className="text-right p-2">Leads</th>
                    <th className="text-right p-2">Vendas</th>
                    <th className="text-right p-2">Vendido</th>
                    <th className="text-right p-2">ROI</th>
                    <th className="text-right p-2">Taxa Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.weeks.map((week) => (
                    <tr key={week.weekNumber} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{week.weekLabel}</td>
                      <td className="p-2 text-muted-foreground text-xs">
                        {week.startDate} - {week.endDate}
                      </td>
                      <td className="p-2 text-right">
                        R$ {week.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right">{week.totalLeads}</td>
                      <td className="p-2 text-right">{week.totalVendas}</td>
                      <td className="p-2 text-right">
                        R$ {week.totalVendido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right">
                        <Badge
                          variant={week.roiMedio >= 100 ? 'default' : 'secondary'}
                          className={
                            week.roiMedio >= 100
                              ? 'bg-green-500 hover:bg-green-600'
                              : week.roiMedio >= 0
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : 'bg-red-500 hover:bg-red-600'
                          }
                        >
                          {week.roiMedio >= 0 && '+'}
                          {week.roiMedio.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="p-2 text-right">
                        {week.taxaConversaoMedia.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </AnimatedDiv>
      </div>
    </div>
  );
}
