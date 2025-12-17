import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportMetrics {
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
}

interface TimeSeriesData {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  leads: number;
  purchases: number;
}

interface ReportOptions {
  accountName: string;
  period: string;
  metrics: ReportMetrics;
  timeSeriesData?: TimeSeriesData[];
  includeMetrics?: boolean;
  includeFunnel?: boolean;
  includeTimeSeries?: boolean;
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Gera relatório completo de Meta Ads
   */
  generateReport(options: ReportOptions): Buffer {
    const {
      accountName,
      period,
      metrics,
      timeSeriesData,
      includeMetrics = true,
      includeFunnel = true,
      includeTimeSeries = true,
    } = options;

    // Cabeçalho
    this.addHeader(accountName, period);

    // Métricas principais
    if (includeMetrics) {
      this.addMetricsSection(metrics);
    }

    // Funil de conversão
    if (includeFunnel) {
      this.addFunnelSection(metrics);
    }

    // Dados temporais
    if (includeTimeSeries && timeSeriesData && timeSeriesData.length > 0) {
      this.addTimeSeriesSection(timeSeriesData);
    }

    // Rodapé
    this.addFooter();

    // Retornar PDF como Buffer
    const pdfOutput = this.doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  }

  /**
   * Adiciona cabeçalho do relatório
   */
  private addHeader(accountName: string, period: string) {
    // Logo/Título
    this.doc.setFontSize(24);
    this.doc.setTextColor(34, 139, 34); // Verde
    this.doc.text('GESTÃO ZEN', this.margin, this.currentY);

    // Subtítulo
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 10;
    this.doc.text('Relatório de Meta Ads', this.margin, this.currentY);

    // Informações da conta
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.currentY += 7;
    this.doc.text(`Conta: ${accountName}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`Período: ${this.formatPeriod(period)}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(
      `Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`,
      this.margin,
      this.currentY
    );

    // Linha separadora
    this.currentY += 8;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  /**
   * Adiciona seção de métricas principais
   */
  private addMetricsSection(metrics: ReportMetrics) {
    this.checkPageBreak(60);

    // Título da seção
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('📊 Métricas Principais', this.margin, this.currentY);
    this.currentY += 8;

    // Cards de métricas em grid 2x2
    const cardWidth = (this.pageWidth - 3 * this.margin) / 2;
    const cardHeight = 20;
    const gap = 5;

    const metricsData = [
      {
        label: 'Investimento Total',
        value: `R$ ${metrics.total_spend.toFixed(2)}`,
        subtitle: `CPC médio: R$ ${metrics.avg_cpc.toFixed(2)}`,
        color: [34, 139, 34], // Verde
      },
      {
        label: 'Impressões',
        value: metrics.total_impressions.toLocaleString('pt-BR'),
        subtitle: `CPM: R$ ${metrics.avg_cpm.toFixed(2)}`,
        color: [59, 130, 246], // Azul
      },
      {
        label: 'Cliques',
        value: metrics.total_clicks.toLocaleString('pt-BR'),
        subtitle: `CTR: ${metrics.avg_ctr.toFixed(2)}%`,
        color: [147, 51, 234], // Roxo
      },
      {
        label: 'Conversões',
        value: (metrics.total_leads + metrics.total_conversions + metrics.total_purchases).toString(),
        subtitle: `Taxa: ${metrics.conversion_rate.toFixed(2)}%`,
        color: [236, 72, 153], // Rosa
      },
    ];

    let row = 0;
    let col = 0;

    metricsData.forEach((metric) => {
      const x = this.margin + col * (cardWidth + gap);
      const y = this.currentY + row * (cardHeight + gap);

      // Fundo do card
      this.doc.setFillColor(245, 245, 245);
      this.doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');

      // Label
      this.doc.setFontSize(9);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(metric.label, x + 3, y + 5);

      // Valor principal
      this.doc.setFontSize(14);
      this.doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      this.doc.text(metric.value, x + 3, y + 12);

      // Subtítulo
      this.doc.setFontSize(8);
      this.doc.setTextColor(120, 120, 120);
      this.doc.text(metric.subtitle, x + 3, y + 17);

      col++;
      if (col === 2) {
        col = 0;
        row++;
      }
    });

    this.currentY += (cardHeight + gap) * 2 + 10;
  }

  /**
   * Adiciona seção do funil de conversão
   */
  private addFunnelSection(metrics: ReportMetrics) {
    this.checkPageBreak(80);

    // Título da seção
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('🎯 Funil de Conversão', this.margin, this.currentY);
    this.currentY += 8;

    const funnelStages = [
      {
        name: 'Impressões',
        value: metrics.total_impressions,
        color: [59, 130, 246],
        rate: null,
      },
      {
        name: 'Cliques',
        value: metrics.total_clicks,
        color: [34, 139, 34],
        rate: metrics.avg_ctr,
        rateLabel: 'CTR',
      },
      {
        name: 'Leads',
        value: metrics.total_leads,
        color: [245, 158, 11],
        rate: metrics.total_clicks > 0 ? (metrics.total_leads / metrics.total_clicks) * 100 : 0,
        rateLabel: 'Taxa de Lead',
      },
      {
        name: 'Conversões',
        value: metrics.total_conversions + metrics.total_purchases,
        color: [236, 72, 153],
        rate: metrics.conversion_rate,
        rateLabel: 'Taxa de Conversão',
      },
    ];

    const barMaxWidth = this.pageWidth - 2 * this.margin - 60;
    const barHeight = 12;
    const gap = 10;

    funnelStages.forEach((stage, index) => {
      const percentage =
        index === 0 ? 100 : (stage.value / funnelStages[0].value) * 100;
      const barWidth = (barMaxWidth * percentage) / 100;

      // Barra
      this.doc.setFillColor(stage.color[0], stage.color[1], stage.color[2]);
      this.doc.roundedRect(
        this.margin,
        this.currentY,
        Math.max(barWidth, 20),
        barHeight,
        2,
        2,
        'F'
      );

      // Nome da etapa
      this.doc.setFontSize(10);
      this.doc.setTextColor(255, 255, 255);
      this.doc.text(stage.name, this.margin + 3, this.currentY + 8);

      // Valor
      this.doc.setFontSize(12);
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(
        stage.value.toLocaleString('pt-BR'),
        this.margin + barMaxWidth + 5,
        this.currentY + 8
      );

      // Taxa de conversão
      if (stage.rate !== null) {
        this.doc.setFontSize(8);
        this.doc.setTextColor(100, 100, 100);
        this.doc.text(
          `${stage.rateLabel}: ${stage.rate.toFixed(2)}%`,
          this.margin + barMaxWidth + 5,
          this.currentY + 12
        );
      }

      this.currentY += barHeight + gap;
    });

    this.currentY += 5;
  }

  /**
   * Adiciona seção de dados temporais (tabela)
   */
  private addTimeSeriesSection(data: TimeSeriesData[]) {
    this.checkPageBreak(80);

    // Título da seção
    this.doc.setFontSize(14);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('📈 Evolução Diária', this.margin, this.currentY);
    this.currentY += 5;

    // Preparar dados da tabela
    const tableData = data.slice(-10).map((day) => [
      format(new Date(day.date), 'dd/MM/yyyy'),
      `R$ ${day.spend.toFixed(2)}`,
      day.impressions.toLocaleString('pt-BR'),
      day.clicks.toLocaleString('pt-BR'),
      day.conversions.toString(),
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Data', 'Gasto', 'Impressões', 'Cliques', 'Conversões']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: this.margin, right: this.margin },
    });

    // @ts-ignore - autoTable modifica a posição Y
    this.currentY = this.doc.lastAutoTable.finalY + 10;
  }

  /**
   * Adiciona rodapé em todas as páginas
   */
  private addFooter() {
    const pageCount = this.doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Linha separadora
      this.doc.setDrawColor(200, 200, 200);
      this.doc.line(
        this.margin,
        this.pageHeight - 15,
        this.pageWidth - this.margin,
        this.pageHeight - 15
      );

      // Texto do rodapé
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(
        'GESTÃO ZEN - Sistema de Gestão de Tráfego Pago',
        this.margin,
        this.pageHeight - 10
      );

      // Número da página
      this.doc.text(
        `Página ${i} de ${pageCount}`,
        this.pageWidth - this.margin - 20,
        this.pageHeight - 10
      );
    }
  }

  /**
   * Verifica se é necessário quebrar página
   */
  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - 25) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  /**
   * Formata período para exibição
   */
  private formatPeriod(period: string): string {
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
  }
}
