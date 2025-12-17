import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PDFGenerator } from '@/lib/pdf-generator';

// GET: Baixar PDF do relatório público
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    // Buscar relatório pelo token
    const reportLink = await prisma.reportLink.findUnique({
      where: { token }
    });

    if (!reportLink) {
      return NextResponse.json(
        { error: 'Relatório não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o link expirou
    if (reportLink.expiresAt && new Date() > reportLink.expiresAt) {
      return NextResponse.json(
        { error: 'Este link expirou' },
        { status: 410 }
      );
    }

    // Parsear dados do relatório
    const reportData = JSON.parse(reportLink.reportData);

    // Gerar PDF
    const pdfGenerator = new PDFGenerator();
    const pdfBuffer = pdfGenerator.generateReport({
      accountName: reportData.accountName,
      period: reportData.period,
      metrics: reportData.metrics,
      timeSeriesData: reportData.timeSeriesData || [],
      includeMetrics: reportData.includeMetrics,
      includeFunnel: reportData.includeFunnel,
      includeTimeSeries: reportData.includeTimeSeries,
    });

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-meta-ads-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar PDF público:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PDF', details: error.message },
      { status: 500 }
    );
  }
}
