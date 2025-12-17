import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SpreadsheetRow {
  date: Date | string;
  valorGasto: number;
  quantidadeLeads: number;
  quantidadeVendas: number;
  valorVendido: number;
  gestor: string;
  atendente: string;
  roi?: number;
  custoPorLead?: number;
  taxaConversao?: number;
  ticketMedio?: number;
  // Novos campos detalhados
  bmName?: string;
  contaAnuncio?: string;
  criativo?: string;
  pagina?: string;
  valorComissao?: number;
  totalCliques?: number;
  cartaoUsado?: string;
}

export interface ProcessingResult {
  success: boolean;
  message: string;
  processedRows: number;
  errorRows: number;
  warnings: string[];
  errors: string[];
  createdMetrics: number;
}

export class SpreadsheetProcessor {
  /**
   * Processa um arquivo Excel e importa para o banco de dados
   */
  static async processExcelFile(
    buffer: Buffer,
    userId: string,
    userRole: string
  ): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      success: false,
      message: '',
      processedRows: 0,
      errorRows: 0,
      warnings: [],
      errors: [],
      createdMetrics: 0,
    };

    try {
      // Ler o arquivo Excel
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Procurar a aba "Dados Diários"
      const sheetName = workbook.SheetNames.find(
        (name) => name === 'Dados Diários' || name === 'Dados Diarios'
      );

      if (!sheetName) {
        result.errors.push('Aba "Dados Diários" não encontrada na planilha.');
        return result;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      if (rawData.length === 0) {
        result.errors.push('Nenhum dado encontrado na aba "Dados Diários".');
        return result;
      }

      // Processar cada linha
      const processedData: SpreadsheetRow[] = [];
      
      for (let i = 0; i < rawData.length; i++) {
        const row: any = rawData[i];
        
        try {
          const processed = await this.processRow(row, i + 2); // +2 porque linha 1 é cabeçalho
          
          if (processed) {
            processedData.push(processed);
            result.processedRows++;
          }
        } catch (error: any) {
          result.errorRows++;
          result.errors.push(`Linha ${i + 2}: ${error.message}`);
        }
      }

      // Importar para o banco de dados
      if (processedData.length > 0) {
        result.createdMetrics = await this.importToDatabase(
          processedData,
          userId,
          userRole,
          result
        );
      }

      result.success = result.createdMetrics > 0;
      result.message = result.success
        ? `${result.createdMetrics} métricas importadas com sucesso!`
        : 'Nenhuma métrica foi importada.';

      return result;
    } catch (error: any) {
      result.errors.push(`Erro ao processar planilha: ${error.message}`);
      return result;
    }
  }

  /**
   * Processa uma linha individual da planilha
   */
  private static async processRow(
    row: any,
    lineNumber: number
  ): Promise<SpreadsheetRow | null> {
    // Extrair valores das colunas (nomes podem variar)
    const dataValue = row['Data'] || row['data'];
    const valorGasto = this.parseNumber(row['Valor Gasto (R$)'] || row['Valor Gasto']);
    const quantidadeLeads = this.parseNumber(row['Quantidade de Leads'] || row['Leads']);
    const quantidadeVendas = this.parseNumber(row['Quantidade de Vendas'] || row['Vendas']);
    const valorVendido = this.parseNumber(row['Valor Vendido (R$)'] || row['Valor Vendido']);
    const gestor = (row['Gestor'] || row['gestor'] || '').toString().trim();
    const atendente = (row['Atendente'] || row['atendente'] || '').toString().trim();
    
    // Novos campos detalhados (opcionais)
    const bmName = (row['BM'] || row['Business Manager'] || '').toString().trim() || undefined;
    const contaAnuncio = (row['Conta de Anúncio'] || row['Conta Anúncio'] || '').toString().trim() || undefined;
    const criativo = (row['Criativo'] || '').toString().trim() || undefined;
    const pagina = (row['Página'] || row['Pagina'] || '').toString().trim() || undefined;
    const valorComissao = this.parseNumber(row['Valor Comissão (R$)'] || row['Valor Total Comissão'] || row['Comissão']);
    const totalCliques = this.parseNumber(row['Total de Cliques'] || row['Cliques']);
    const cartaoUsado = (row['Cartão Usado'] || row['Cartao Usado'] || '').toString().trim() || undefined;

    // Validar campos obrigatórios
    if (!dataValue) {
      throw new Error('Campo "Data" é obrigatório');
    }

    // Converter data
    let data: Date;
    if (typeof dataValue === 'string') {
      // Tentar diferentes formatos de data
      const dateFormats = [
        /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      ];

      let parsed = false;
      for (const format of dateFormats) {
        const match = dataValue.match(format);
        if (match) {
          if (format.source.includes('\\d{4}-')) {
            // YYYY-MM-DD
            data = new Date(dataValue);
          } else {
            // DD/MM/YYYY
            const [, day, month, year] = match;
            data = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          parsed = true;
          break;
        }
      }

      if (!parsed) {
        throw new Error(`Formato de data inválido: ${dataValue}`);
      }
    } else if (dataValue instanceof Date) {
      data = dataValue;
    } else if (typeof dataValue === 'number') {
      // Excel armazena datas como números (dias desde 1900)
      data = this.excelDateToJSDate(dataValue);
    } else {
      throw new Error(`Tipo de data inválido: ${typeof dataValue}`);
    }

    // Se todos os campos operacionais estão vazios, pular linha
    if (
      isNaN(valorGasto) &&
      isNaN(quantidadeLeads) &&
      isNaN(quantidadeVendas) &&
      isNaN(valorVendido)
    ) {
      return null; // Linha vazia, não é erro
    }

    // Valores padrão para campos vazios
    const finalValorGasto = isNaN(valorGasto) ? 0 : valorGasto;
    const finalQuantidadeLeads = isNaN(quantidadeLeads) ? 0 : Math.round(quantidadeLeads);
    const finalQuantidadeVendas = isNaN(quantidadeVendas) ? 0 : Math.round(quantidadeVendas);
    const finalValorVendido = isNaN(valorVendido) ? 0 : valorVendido;

    // Calcular métricas automáticas
    const roi = this.calculateROI(finalValorVendido, finalValorGasto);
    const custoPorLead = this.calculateCPL(finalValorGasto, finalQuantidadeLeads);
    const taxaConversao = this.calculateConversionRate(
      finalQuantidadeVendas,
      finalQuantidadeLeads
    );
    const ticketMedio = this.calculateAverageTicket(
      finalValorVendido,
      finalQuantidadeVendas
    );

    return {
      date: data!,
      valorGasto: finalValorGasto,
      quantidadeLeads: finalQuantidadeLeads,
      quantidadeVendas: finalQuantidadeVendas,
      valorVendido: finalValorVendido,
      gestor,
      atendente,
      roi,
      custoPorLead,
      taxaConversao,
      ticketMedio,
      // Novos campos detalhados
      bmName,
      contaAnuncio,
      criativo,
      pagina,
      valorComissao,
      totalCliques,
      cartaoUsado,
    };
  }

  /**
   * Importa dados processados para o banco de dados
   */
  private static async importToDatabase(
    data: SpreadsheetRow[],
    userId: string,
    userRole: string,
    result: ProcessingResult
  ): Promise<number> {
    let created = 0;

    // Buscar usuário importador
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { atendentes: true },
    });

    if (!user) {
      result.errors.push('Usuário não encontrado.');
      return 0;
    }

    // Cache de mapeamento gestor/atendente → userId
    const userCache = new Map<string, string>();

    // Buscar todos os usuários para mapear nomes
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });

    for (const dbUser of allUsers) {
      if (dbUser.name) {
        userCache.set(dbUser.name.toLowerCase(), dbUser.id);
        userCache.set(dbUser.name.toLowerCase().split(' ')[0], dbUser.id); // Primeiro nome
      }
    }

    // Processar cada linha
    for (const row of data) {
      try {
        // Mapear gestor e atendente para IDs de usuário
        let gestorId: string | null = null;
        let atendenteId: string | null = null;

        // Tentar mapear gestor
        if (row.gestor) {
          const gestorLower = row.gestor.toLowerCase();
          gestorId = userCache.get(gestorLower) || null;

          if (!gestorId) {
            result.warnings.push(
              `Gestor "${row.gestor}" não encontrado. Usando usuário importador.`
            );
          }
        }

        // Tentar mapear atendente
        if (row.atendente) {
          const atendenteLower = row.atendente.toLowerCase();
          atendenteId = userCache.get(atendenteLower) || null;

          if (!atendenteId) {
            result.warnings.push(
              `Atendente "${row.atendente}" não encontrado. Usando usuário importador.`
            );
          }
        }

        // Se não encontrou gestor ou atendente, usar o usuário importador
        if (!atendenteId) {
          if (userRole === 'atendente') {
            atendenteId = userId;
          } else if (userRole === 'gestor' || userRole === 'gerente') {
            // Se gestor/gerente, usar o primeiro atendente disponível
            const firstAtendente = user.atendentes?.[0];
            atendenteId = firstAtendente?.id || userId;
          }
        }

        // Verificar se já existe métrica para esta data e usuário
        const existing = await prisma.dailyMetric.findFirst({
          where: {
            date: row.date as Date,
            userId: atendenteId || userId,
          },
        });

        if (existing) {
          result.warnings.push(
            `Métrica já existe para ${(row.date as Date).toLocaleDateString('pt-BR')} - ${row.atendente || 'usuário'}. Ignorando.`
          );
          continue;
        }

        // Criar métrica
        await prisma.dailyMetric.create({
          data: {
            date: row.date as Date,
            valorGasto: row.valorGasto,
            quantidadeLeads: row.quantidadeLeads,
            quantidadeVendas: row.quantidadeVendas,
            valorVendido: row.valorVendido,
            roi: row.roi || 0,
            custoPorLead: row.custoPorLead || 0,
            taxaConversao: row.taxaConversao || 0,
            ticketMedio: row.ticketMedio || 0,
            userId: atendenteId || userId,
            // Novos campos detalhados
            bmName: row.bmName || null,
            contaAnuncio: row.contaAnuncio || null,
            criativo: row.criativo || null,
            pagina: row.pagina || null,
            valorComissao: row.valorComissao || 0,
            totalCliques: row.totalCliques || 0,
            cartaoUsado: row.cartaoUsado || null,
          },
        });

        created++;
      } catch (error: any) {
        result.errors.push(
          `Erro ao importar métrica de ${(row.date as Date).toLocaleDateString('pt-BR')}: ${error.message}`
        );
      }
    }

    return created;
  }

  /**
   * Utilitários de cálculo
   */
  private static calculateROI(valorVendido: number, valorGasto: number): number {
    if (valorGasto === 0) return 0;
    return ((valorVendido - valorGasto) / valorGasto) * 100;
  }

  private static calculateCPL(valorGasto: number, quantidadeLeads: number): number {
    if (quantidadeLeads === 0) return 0;
    return valorGasto / quantidadeLeads;
  }

  private static calculateConversionRate(
    quantidadeVendas: number,
    quantidadeLeads: number
  ): number {
    if (quantidadeLeads === 0) return 0;
    return (quantidadeVendas / quantidadeLeads) * 100;
  }

  private static calculateAverageTicket(
    valorVendido: number,
    quantidadeVendas: number
  ): number {
    if (quantidadeVendas === 0) return 0;
    return valorVendido / quantidadeVendas;
  }

  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remover símbolos de moeda e converter vírgula para ponto
      const cleaned = value.replace(/[R$\s]/g, '').replace(',', '.');
      return parseFloat(cleaned);
    }
    return NaN;
  }

  private static excelDateToJSDate(serial: number): Date {
    // Excel armazena datas como número de dias desde 1900-01-01
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
  }
}
