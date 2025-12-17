'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowLeft, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    processedRows: number;
    errorRows: number;
    createdMetrics: number;
    warnings: string[];
    errors: string[];
  };
}

export default function ImportarPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Carregando sessão
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirecionar se não autenticado
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Verificar permissão
  if (session?.user?.role !== 'gerente' && session?.user?.role !== 'gestor') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Apenas gerentes e gestores podem importar planilhas.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar extensão
      const validExtensions = ['.xls', '.xlsx'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        toast.error('Arquivo inválido', {
          description: 'Por favor, selecione um arquivo Excel (.xls ou .xlsx)',
        });
        return;
      }

      // Validar tamanho (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB em bytes
      if (selectedFile.size > maxSize) {
        toast.error('Arquivo muito grande', {
          description: 'O arquivo deve ter no máximo 10MB',
        });
        return;
      }

      // Validar tamanho mínimo (100 bytes)
      if (selectedFile.size < 100) {
        toast.error('Arquivo muito pequeno', {
          description: 'O arquivo parece estar vazio',
        });
        return;
      }

      setFile(selectedFile);
      setResult(null); // Limpar resultado anterior
      toast.success('Arquivo selecionado!', {
        description: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`,
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }

    setLoading(true);
    setResult(null);

    const uploadToast = toast.loading('Processando planilha...', {
      description: 'Isso pode levar alguns segundos',
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/spreadsheet', {
        method: 'POST',
        body: formData,
      });

      const data: ImportResult = await response.json();

      setResult(data);
      toast.dismiss(uploadToast);

      if (data.success) {
        const metricsCreated = data.data?.createdMetrics || 0;
        toast.success('Importação concluída com sucesso!', {
          description: `${metricsCreated} métricas foram importadas`,
        });
      } else {
        toast.error('Erro na importação', {
          description: data.message || 'Verifique os detalhes abaixo',
        });
      }
    } catch (error: any) {
      toast.dismiss(uploadToast);
      toast.error('Erro ao importar planilha', {
        description: error.message || 'Erro desconhecido ao processar o arquivo',
      });
      setResult({
        success: false,
        message: 'Erro ao processar planilha',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-4 sm:p-6 pt-16 lg:pt-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/metricas')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Importar Planilha
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Importe dados diários de uma planilha Excel
            </p>
          </div>
        </div>

        {/* Instruções */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Formato esperado:</strong> A planilha deve ter uma aba chamada <strong>"Dados Diários"</strong> com as seguintes colunas:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Data (obrigatório)</li>
              <li>Valor Gasto (R$)</li>
              <li>Quantidade de Leads</li>
              <li>Quantidade de Vendas</li>
              <li>Valor Vendido (R$)</li>
              <li>Gestor (opcional)</li>
              <li>Atendente (opcional)</li>
            </ul>
            <p className="mt-2 text-sm">
              <strong>Nota:</strong> As métricas calculadas (ROI, Custo por Lead, Taxa de Conversão, Ticket Médio) serão <strong>automaticamente preenchidas</strong>.
            </p>
          </AlertDescription>
        </Alert>

        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Selecionar Arquivo
            </CardTitle>
            <CardDescription>
              Escolha uma planilha Excel (.xls ou .xlsx) para importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 hover:border-green-500 transition-colors">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-center"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Clique para selecionar
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  ou arraste o arquivo aqui
                </p>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {file && (
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  <strong>Arquivo selecionado:</strong> {file.name}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Tamanho: {(file.size / 1024).toFixed(2)} KB
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Planilha
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        {result && (
          <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                {result.success ? 'Importação Concluída' : 'Erro na Importação'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{result.message}</p>

              {result.data && (
                <div className="space-y-3">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Linhas Processadas</p>
                      <p className="text-lg font-bold">{result.data.processedRows}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Linhas com Erro</p>
                      <p className="text-lg font-bold">{result.data.errorRows}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Métricas Criadas</p>
                      <p className="text-lg font-bold">{result.data.createdMetrics}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Avisos</p>
                      <p className="text-lg font-bold">{result.data.warnings.length}</p>
                    </div>
                  </div>

                  {/* Avisos */}
                  {result.data.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        Avisos ({result.data.warnings.length})
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {result.data.warnings.map((warning, index) => (
                          <p key={index} className="text-xs text-muted-foreground">
                            • {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Erros */}
                  {result.data.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
                        Erros ({result.data.errors.length})
                      </h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {result.data.errors.map((error, index) => (
                          <p key={index} className="text-xs text-muted-foreground">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.success && (
                <Button
                  onClick={() => router.push('/metricas')}
                  className="w-full"
                  variant="outline"
                >
                  Ver Métricas Importadas
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
