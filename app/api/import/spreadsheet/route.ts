import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SpreadsheetProcessor } from '@/lib/spreadsheet-processor';

/**
 * POST /api/import/spreadsheet
 * Importa planilha Excel com dados diários
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificação de permissão (apenas gerente e gestor podem importar)
    if (session.user.role !== 'gerente' && session.user.role !== 'gestor') {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para importar planilhas' },
        { status: 403 }
      );
    }

    // Extrair arquivo do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de arquivo inválido. Envie um arquivo .xls ou .xlsx',
        },
        { status: 400 }
      );
    }

    // Converter arquivo para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Processar planilha
    const result = await SpreadsheetProcessor.processExcelFile(
      buffer,
      session.user.id,
      session.user.role
    );

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          data: {
            processedRows: result.processedRows,
            errorRows: result.errorRows,
            createdMetrics: result.createdMetrics,
            warnings: result.warnings,
            errors: result.errors,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Erro ao processar planilha',
          data: {
            processedRows: result.processedRows,
            errorRows: result.errorRows,
            warnings: result.warnings,
            errors: result.errors,
          },
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao importar planilha:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao processar planilha',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
