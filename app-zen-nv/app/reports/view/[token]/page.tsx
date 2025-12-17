'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Download, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConversionFunnel } from '@/components/meta-ads/conversion-funnel';
import { TimeSeriesChart } from '@/components/meta-ads/time-series-chart';

interface ReportData {
  accountName: string;
  period: string;
  metrics: {
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    total_reach: number;
    avg_ctr: number;
    avg_cpc: number;
    avg_cpm: number;
    total_leads: number;
    total_purchases: number;
    total_conversions: number;
    roas: number;
    conversion_rate: number;
  };
  timeSeriesData?: Array<{
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    leads: number;
    purchases: number;
  }>;
  includeMetrics: boolean;
  includeFunnel: boolean;
  includeTimeSeries: boolean;
}

interface ReportInfo {
  viewCount: number;
  createdAt: string;
  expiresAt?: string;
}

export default function PublicReportPage() {
  const params = useParams();
  const token = params?.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportInfo, setReportInfo] = useState<ReportInfo | null>(null);

  useEffect(() => {
    if (token) {
      loadReport();
    }
  }, [token]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/public/${token}`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao carregar relatório');
      }

      const data = await res.json();
      setReportData(data.reportData);
      setReportInfo({
        viewCount: data.viewCount,
        createdAt: data.createdAt,
        expiresAt: data.expiresAt,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`/api/reports/public/${token}/pdf`);
      
      if (!res.ok) {
        throw new Error('Erro ao baixar PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-meta-ads-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatPeriod = (period: string) => {
    const periodMap: Record<string, string> = {
      today: 'Hoje',
      yesterday: 'Ontem',
      last_7d: 'Últimos 7 dias',
      last_14d: 'Últimos 14 dias',
      last_30d: 'Últimos 30 dias',
      this_month: 'Este mês',
      last_month: 'Mês passado',
    };
    return periodMap[period] || period;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  const { metrics, timeSeriesData } = reportData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">📈 GESTÃO ZEN</h1>
          <p className="text-lg opacity-90">Relatório de Meta Ads</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded">
              <strong>Conta:</strong> {reportData.accountName}
            </span>
            <span className="bg-white/20 px-3 py-1 rounded">
              <strong>Período:</strong> {formatPeriod(reportData.period)}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {reportInfo?.viewCount} visualizações
                </span>
                <span>
                  Gerado em {format(new Date(reportInfo?.createdAt || ''), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
                {reportInfo?.expiresAt && (
                  <span className="text-orange-600">
                    Expira em {format(new Date(reportInfo.expiresAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                )}
              </div>
              <Button onClick={handleDownloadPDF} variant="default">
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Metrics */}
        {reportData.includeMetrics && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Métricas Principais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Investimento Total</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    R$ {metrics.total_spend.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CPC médio: R$ {metrics.avg_cpc.toFixed(2)}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Impressões</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {metrics.total_impressions.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CPM: R$ {metrics.avg_cpm.toFixed(2)}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cliques</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {metrics.total_clicks.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CTR: {metrics.avg_ctr.toFixed(2)}%</p>
                </div>

                <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-4 rounded-lg border border-pink-200 dark:border-pink-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Conversões</p>
                  <p className="text-2xl font-bold text-pink-700 dark:text-pink-400">
                    {(metrics.total_leads + metrics.total_conversions + metrics.total_purchases).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Taxa: {metrics.conversion_rate.toFixed(2)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversion Funnel */}
        {reportData.includeFunnel && (
          <Card>
            <CardHeader>
              <CardTitle>🎯 Funil de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <ConversionFunnel
                impressions={metrics.total_impressions}
                clicks={metrics.total_clicks}
                leads={metrics.total_leads}
                conversions={metrics.total_conversions + metrics.total_purchases}
              />
            </CardContent>
          </Card>
        )}

        {/* Time Series Charts */}
        {reportData.includeTimeSeries && timeSeriesData && timeSeriesData.length > 0 && (
          <>
            <TimeSeriesChart
              data={timeSeriesData}
              title="📈 Gasto e Conversões"
              showSpend
              showConversions
            />
            <TimeSeriesChart
              data={timeSeriesData}
              title="🎯 Leads e Compras"
              showLeads
              showPurchases
            />
          </>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
          <p>Este relatório foi gerado automaticamente pelo sistema GESTÃO ZEN</p>
          <p className="mt-1">© {new Date().getFullYear()} - Sistema de Gestão de Tráfego Pago</p>
        </div>
      </div>
    </div>
  );
}
