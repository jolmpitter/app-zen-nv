import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: Visualizar relatório público
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

    // Incrementar contador de visualizações
    await prisma.reportLink.update({
      where: { token },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      }
    });

    // Parsear dados do relatório
    const reportData = JSON.parse(reportLink.reportData);

    return NextResponse.json({
      reportData,
      viewCount: reportLink.viewCount + 1,
      createdAt: reportLink.createdAt,
      expiresAt: reportLink.expiresAt,
    });
  } catch (error: any) {
    console.error('Erro ao buscar relatório público:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatório', details: error.message },
      { status: 500 }
    );
  }
}
