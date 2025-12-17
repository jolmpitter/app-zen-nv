'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatedDiv, AnimatedTableRow } from '@/components/animated/motion-components';
import { useLazyAnimation } from '@/hooks/use-lazy-animation';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  Calendar,
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Upload,
  FileText,
  CreditCard,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { fadeInUp, fadeIn, staggerItem } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Metric {
  id: string;
  date: string;
  userId: string;
  valorGasto: number;
  quantidadeLeads: number;
  quantidadeVendas: number;
  valorVendido: number;
  quantidadeVendasOrganicas?: number;
  valorVendidoOrganico?: number;
  roi: number;
  custoPorLead: number;
  taxaConversao: number;
  ticketMedio: number;
  // Novos campos detalhados
  bmName?: string | null;
  contaAnuncio?: string | null;
  criativo?: string | null;
  pagina?: string | null;
  valorComissao?: number;
  totalCliques?: number;
  cartaoUsado?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function MetricasPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Hooks de otimização de performance
  const { ref: headerRef, shouldAnimate: shouldAnimateHeader } = useLazyAnimation({ threshold: 0.1, triggerOnce: true });
  const { ref: tableRef, shouldAnimate: shouldAnimateTable } = useLazyAnimation({ threshold: 0.05, triggerOnce: true, delay: 100 });
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [deletingMetric, setDeletingMetric] = useState<Metric | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    userId: '',
    valorGasto: '',
    quantidadeLeads: '',
    quantidadeVendas: '',
    valorVendido: '',
    quantidadeVendasOrganicas: '',
    valorVendidoOrganico: '',
    // Novos campos detalhados
    bmName: '',
    contaAnuncio: '',
    criativo: '',
    pagina: '',
    valorComissao: '',
    totalCliques: '',
    cartaoUsado: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'gestor' && session?.user?.role !== 'gerente') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'gestor' || session?.user?.role === 'gerente') {
      fetchMetrics();
      fetchUsers();
    }
  }, [session]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleOpenDialog = (metric?: Metric) => {
    if (metric) {
      setEditingMetric(metric);
      setFormData({
        date: new Date(metric.date).toISOString().split('T')[0],
        userId: metric.userId,
        valorGasto: metric.valorGasto.toString(),
        quantidadeLeads: metric.quantidadeLeads.toString(),
        quantidadeVendas: metric.quantidadeVendas.toString(),
        valorVendido: metric.valorVendido.toString(),
        quantidadeVendasOrganicas: (metric.quantidadeVendasOrganicas || 0).toString(),
        valorVendidoOrganico: (metric.valorVendidoOrganico || 0).toString(),
        // Novos campos detalhados
        bmName: metric.bmName || '',
        contaAnuncio: metric.contaAnuncio || '',
        criativo: metric.criativo || '',
        pagina: metric.pagina || '',
        valorComissao: (metric.valorComissao || 0).toString(),
        totalCliques: (metric.totalCliques || 0).toString(),
        cartaoUsado: metric.cartaoUsado || '',
      });
    } else {
      setEditingMetric(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        userId: '',
        valorGasto: '',
        quantidadeLeads: '',
        quantidadeVendas: '',
        valorVendido: '',
        quantidadeVendasOrganicas: '0',
        valorVendidoOrganico: '0',
        // Novos campos detalhados
        bmName: '',
        contaAnuncio: '',
        criativo: '',
        pagina: '',
        valorComissao: '0',
        totalCliques: '0',
        cartaoUsado: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMetric(null);
    setFormData({
      date: '',
      userId: '',
      valorGasto: '',
      quantidadeLeads: '',
      quantidadeVendas: '',
      valorVendido: '',
      quantidadeVendasOrganicas: '0',
      valorVendidoOrganico: '0',
      // Novos campos detalhados
      bmName: '',
      contaAnuncio: '',
      criativo: '',
      pagina: '',
      valorComissao: '0',
      totalCliques: '0',
      cartaoUsado: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (
        !formData.date ||
        !formData.userId ||
        formData.valorGasto === '' ||
        formData.quantidadeLeads === '' ||
        formData.quantidadeVendas === '' ||
        formData.valorVendido === ''
      ) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const payload = {
        date: formData.date,
        userId: formData.userId,
        valorGasto: parseFloat(formData.valorGasto),
        quantidadeLeads: parseInt(formData.quantidadeLeads),
        quantidadeVendas: parseInt(formData.quantidadeVendas),
        valorVendido: parseFloat(formData.valorVendido),
        quantidadeVendasOrganicas: parseInt(formData.quantidadeVendasOrganicas || '0'),
        valorVendidoOrganico: parseFloat(formData.valorVendidoOrganico || '0'),
        // Novos campos detalhados
        bmName: formData.bmName || null,
        contaAnuncio: formData.contaAnuncio || null,
        criativo: formData.criativo || null,
        pagina: formData.pagina || null,
        valorComissao: parseFloat(formData.valorComissao || '0'),
        totalCliques: parseInt(formData.totalCliques || '0'),
        cartaoUsado: formData.cartaoUsado || null,
      };

      const url = editingMetric
        ? `/api/metrics/${editingMetric.id}`
        : '/api/metrics';
      const method = editingMetric ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(
          editingMetric
            ? 'Métrica atualizada com sucesso'
            : 'Métrica criada com sucesso'
        );
        handleCloseDialog();
        fetchMetrics();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao salvar métrica');
      }
    } catch (error) {
      console.error('Erro ao salvar métrica:', error);
      toast.error('Erro ao salvar métrica');
    }
  };

  const handleDelete = async () => {
    if (!deletingMetric) return;

    try {
      const response = await fetch(`/api/metrics/${deletingMetric.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Métrica deletada com sucesso');
        setIsDeleteDialogOpen(false);
        setDeletingMetric(null);
        fetchMetrics();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar métrica');
      }
    } catch (error) {
      console.error('Erro ao deletar métrica:', error);
      toast.error('Erro ao deletar métrica');
    }
  };

  // Função para exportar métricas para Excel
  const handleExportExcel = () => {
    try {
      // Preparar dados para exportação
      const exportData = metrics?.map((metric) => ({
        Data: new Date(metric?.date).toLocaleDateString('pt-BR'),
        Usuário: metric?.user?.name || 'N/A',
        Email: metric?.user?.email || 'N/A',
        'BM': metric?.bmName || '',
        'Conta de Anúncio': metric?.contaAnuncio || '',
        'Criativo': metric?.criativo || '',
        'Página': metric?.pagina || '',
        'Total de Cliques': metric?.totalCliques || 0,
        'Valor Gasto (R$)': metric?.valorGasto || 0,
        'Quantidade de Leads': metric?.quantidadeLeads || 0,
        'Custo por Lead (R$)': metric?.custoPorLead?.toFixed(2) || 0,
        'Quantidade de Vendas': metric?.quantidadeVendas || 0,
        'Valor Vendido (R$)': metric?.valorVendido || 0,
        'Valor Comissão (R$)': metric?.valorComissao || 0,
        'ROI (%)': metric?.roi?.toFixed(2) || 0,
        'Taxa de Conversão (%)': metric?.taxaConversao?.toFixed(2) || 0,
        'Ticket Médio (R$)': metric?.ticketMedio?.toFixed(2) || 0,
        'Vendas Orgânicas': metric?.quantidadeVendasOrganicas || 0,
        'Valor Vendido Orgânico (R$)': metric?.valorVendidoOrganico || 0,
        'Cartão Usado': metric?.cartaoUsado || '',
      }));

      // Criar worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData || []);

      // Definir largura das colunas
      const columnWidths = [
        { wch: 12 }, // Data
        { wch: 20 }, // Usuário
        { wch: 25 }, // Email
        { wch: 25 }, // BM
        { wch: 20 }, // Conta de Anúncio
        { wch: 20 }, // Criativo
        { wch: 20 }, // Página
        { wch: 16 }, // Total de Cliques
        { wch: 18 }, // Valor Gasto
        { wch: 20 }, // Quantidade de Leads
        { wch: 20 }, // Custo por Lead
        { wch: 22 }, // Quantidade de Vendas
        { wch: 20 }, // Valor Vendido
        { wch: 20 }, // Valor Comissão
        { wch: 12 }, // ROI
        { wch: 22 }, // Taxa de Conversão
        { wch: 18 }, // Ticket Médio
        { wch: 18 }, // Vendas Orgânicas
        { wch: 28 }, // Valor Vendido Orgânico
        { wch: 25 }, // Cartão Usado
      ];
      worksheet['!cols'] = columnWidths;

      // Criar workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Métricas');

      // Gerar arquivo e download
      const fileName = `metricas_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success('Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      toast.error('Erro ao exportar Excel');
    }
  };

  // Função para importar métricas de Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          let successCount = 0;
          let errorCount = 0;

          // Processar cada linha do Excel
          for (const row of jsonData as any[]) {
            try {
              // Buscar usuário por email
              const usersResponse = await fetch('/api/users');
              const users = await usersResponse.json();
              const user = users?.find((u: any) => u?.email === row['Email']);

              if (!user) {
                console.warn(`Usuário não encontrado: ${row['Email']}`);
                errorCount++;
                continue;
              }

              // Converter data
              const dateParts = row['Data']?.split('/');
              let date;
              if (dateParts && dateParts.length === 3) {
                date = new Date(
                  parseInt(dateParts[2]), 
                  parseInt(dateParts[1]) - 1, 
                  parseInt(dateParts[0])
                ).toISOString();
              } else {
                console.warn(`Data inválida: ${row['Data']}`);
                errorCount++;
                continue;
              }

              // Criar métrica
              const metricData = {
                date,
                userId: user.id,
                valorGasto: parseFloat(row['Valor Gasto (R$)'] || 0),
                quantidadeLeads: parseInt(row['Quantidade de Leads'] || 0),
                quantidadeVendas: parseInt(row['Quantidade de Vendas'] || 0),
                valorVendido: parseFloat(row['Valor Vendido (R$)'] || 0),
                quantidadeVendasOrganicas: parseInt(row['Vendas Orgânicas'] || 0),
                valorVendidoOrganico: parseFloat(row['Valor Vendido Orgânico (R$)'] || 0),
                // Novos campos detalhados
                bmName: row['BM'] || null,
                contaAnuncio: row['Conta de Anúncio'] || null,
                criativo: row['Criativo'] || null,
                pagina: row['Página'] || null,
                valorComissao: parseFloat(row['Valor Comissão (R$)'] || 0),
                totalCliques: parseInt(row['Total de Cliques'] || 0),
                cartaoUsado: row['Cartão Usado'] || null,
              };

              const response = await fetch('/api/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metricData),
              });

              if (response.ok) {
                successCount++;
              } else {
                errorCount++;
                console.error('Erro ao criar métrica:', await response.text());
              }
            } catch (rowError) {
              console.error('Erro ao processar linha:', rowError);
              errorCount++;
            }
          }

          // Atualizar lista
          fetchMetrics();

          // Mostrar resultado
          if (successCount > 0) {
            toast.success(`${successCount} métrica(s) importada(s) com sucesso!`);
          }
          if (errorCount > 0) {
            toast.error(`${errorCount} métrica(s) com erro ao importar`);
          }

          // Limpar input
          e.target.value = '';
        } catch (parseError) {
          console.error('Erro ao processar Excel:', parseError);
          toast.error('Erro ao processar arquivo Excel');
        }
      };

      reader.onerror = () => {
        toast.error('Erro ao ler arquivo');
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Erro ao importar Excel:', error);
      toast.error('Erro ao importar Excel');
    }
  };

  const filteredMetrics = metrics?.filter(
    (metric) =>
      metric?.user?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      metric?.user?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      new Date(metric?.date)
        .toLocaleDateString('pt-BR')
        .includes(searchTerm)
  );

  // Cálculos de paginação
  const totalPages = Math.ceil((filteredMetrics?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMetrics = filteredMetrics?.slice(startIndex, endIndex) || [];
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resetar página ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value?.toFixed(2)}%`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="pt-16 lg:pt-6 p-4 sm:p-6">
        <TableSkeleton columns={12} rows={10} showHeader={true} showActions={true} />
      </div>
    );
  }

  if (session?.user?.role !== 'gestor' && session?.user?.role !== 'gerente') {
    return null;
  }

  return (
    <div className="pt-16 lg:pt-6 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard')}
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {/* Header */}
      <AnimatedDiv 
        ref={headerRef}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        variants={shouldAnimateHeader ? fadeInUp : undefined}
        initial="hidden"
        animate="visible"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestão de Métricas
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
            Adicione e gerencie dados diários de performance
            {filteredMetrics?.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                • {filteredMetrics.length} registros
                {filteredMetrics.length > itemsPerPage && ` • Página ${currentPage} de ${totalPages}`}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Métrica
          </Button>
          
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
          
          <Button
            onClick={() => document.getElementById('excel-upload')?.click()}
            variant="outline"
            className="border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar Excel
          </Button>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportExcel}
            className="hidden"
          />
        </div>
      </AnimatedDiv>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar por usuário ou data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Metrics Table */}
      <AnimatedDiv
        ref={tableRef}
        variants={shouldAnimateTable ? fadeIn : undefined}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Data</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Gasto</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Valor Vendido</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead>Custo/Lead</TableHead>
                <TableHead>Taxa Conv.</TableHead>
                <TableHead>Ticket Médio</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMetrics?.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    Nenhuma métrica encontrada
                  </TableCell>
                </TableRow>
              ) : (
                currentMetrics?.map((metric, index) => (
                  <AnimatedTableRow
                    key={metric?.id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={staggerItem}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <TableCell className="font-medium">
                      {new Date(metric?.date)?.toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{metric?.user?.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {metric?.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-red-600 font-semibold">
                      {formatCurrency(Number(metric?.valorGasto))}
                    </TableCell>
                    <TableCell>{metric?.quantidadeLeads}</TableCell>
                    <TableCell>{metric?.quantidadeVendas}</TableCell>
                    <TableCell className="text-green-600 font-semibold">
                      {formatCurrency(Number(metric?.valorVendido))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          Number(metric?.roi) >= 0
                            ? 'border-green-600 text-green-600'
                            : 'border-red-600 text-red-600'
                        }
                      >
                        {formatPercentage(Number(metric?.roi))}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(metric?.custoPorLead))}
                    </TableCell>
                    <TableCell>
                      {formatPercentage(Number(metric?.taxaConversao))}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(metric?.ticketMedio))}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(metric)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingMetric(metric);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </AnimatedTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="py-4 flex justify-center border-t border-border">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {/* Páginas */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Mostrar apenas páginas próximas à página atual
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
      </AnimatedDiv>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMetric ? 'Editar Métrica' : 'Nova Métrica'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userId">
                <Users className="w-4 h-4 inline mr-1" />
                Usuário *
              </Label>
              <Select
                value={formData.userId}
                onValueChange={(value) =>
                  setFormData({ ...formData, userId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users?.filter(user => user?.id)?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user?.name || 'Sem nome'} ({user?.role || 'Sem role'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorGasto">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor Gasto (R$) *
              </Label>
              <Input
                id="valorGasto"
                type="number"
                step="0.01"
                min="0"
                value={formData.valorGasto}
                onChange={(e) =>
                  setFormData({ ...formData, valorGasto: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidadeLeads">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                Quantidade de Leads *
              </Label>
              <Input
                id="quantidadeLeads"
                type="number"
                min="0"
                value={formData.quantidadeLeads}
                onChange={(e) =>
                  setFormData({ ...formData, quantidadeLeads: e.target.value })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidadeVendas">
                <ShoppingCart className="w-4 h-4 inline mr-1" />
                Quantidade de Vendas *
              </Label>
              <Input
                id="quantidadeVendas"
                type="number"
                min="0"
                value={formData.quantidadeVendas}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantidadeVendas: e.target.value,
                  })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorVendido">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor Vendido (R$) *
              </Label>
              <Input
                id="valorVendido"
                type="number"
                step="0.01"
                min="0"
                value={formData.valorVendido}
                onChange={(e) =>
                  setFormData({ ...formData, valorVendido: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            {/* Campos de Vendas Orgânicas */}
            <div className="col-span-2 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Vendas Orgânicas (Disparos para Base)
              </h4>
              <p className="text-xs text-green-700 dark:text-green-400 mb-3">
                Registre vendas de leads que já estavam na base (sem custo de tráfego)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantidadeVendasOrganicas" className="text-green-800 dark:text-green-300">
                    <ShoppingCart className="w-4 h-4 inline mr-1" />
                    Vendas Orgânicas
                  </Label>
                  <Input
                    id="quantidadeVendasOrganicas"
                    type="number"
                    min="0"
                    value={formData.quantidadeVendasOrganicas}
                    onChange={(e) =>
                      setFormData({ ...formData, quantidadeVendasOrganicas: e.target.value })
                    }
                    placeholder="0"
                    className="border-green-300 dark:border-green-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorVendidoOrganico" className="text-green-800 dark:text-green-300">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Valor Vendido Orgânico (R$)
                  </Label>
                  <Input
                    id="valorVendidoOrganico"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorVendidoOrganico}
                    onChange={(e) =>
                      setFormData({ ...formData, valorVendidoOrganico: e.target.value })
                    }
                    placeholder="0.00"
                    className="border-green-300 dark:border-green-700"
                  />
                </div>
              </div>
            </div>

            {/* Campos Detalhados de Campanha */}
            <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Detalhes da Campanha (Opcional)
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-400 mb-3">
                Informações adicionais sobre a campanha e forma de pagamento
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bmName" className="text-blue-800 dark:text-blue-300">
                    Business Manager (BM)
                  </Label>
                  <Input
                    id="bmName"
                    type="text"
                    value={formData.bmName}
                    onChange={(e) =>
                      setFormData({ ...formData, bmName: e.target.value })
                    }
                    placeholder="Nome do BM"
                    className="border-blue-300 dark:border-blue-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contaAnuncio" className="text-blue-800 dark:text-blue-300">
                    Conta de Anúncio
                  </Label>
                  <Input
                    id="contaAnuncio"
                    type="text"
                    value={formData.contaAnuncio}
                    onChange={(e) =>
                      setFormData({ ...formData, contaAnuncio: e.target.value })
                    }
                    placeholder="ID ou nome da conta"
                    className="border-blue-300 dark:border-blue-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="criativo" className="text-blue-800 dark:text-blue-300">
                    Criativo
                  </Label>
                  <Input
                    id="criativo"
                    type="text"
                    value={formData.criativo}
                    onChange={(e) =>
                      setFormData({ ...formData, criativo: e.target.value })
                    }
                    placeholder="Nome do criativo"
                    className="border-blue-300 dark:border-blue-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pagina" className="text-blue-800 dark:text-blue-300">
                    Página
                  </Label>
                  <Input
                    id="pagina"
                    type="text"
                    value={formData.pagina}
                    onChange={(e) =>
                      setFormData({ ...formData, pagina: e.target.value })
                    }
                    placeholder="Página da campanha"
                    className="border-blue-300 dark:border-blue-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalCliques" className="text-blue-800 dark:text-blue-300">
                    Total de Cliques
                  </Label>
                  <Input
                    id="totalCliques"
                    type="number"
                    min="0"
                    value={formData.totalCliques}
                    onChange={(e) =>
                      setFormData({ ...formData, totalCliques: e.target.value })
                    }
                    placeholder="0"
                    className="border-blue-300 dark:border-blue-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorComissao" className="text-blue-800 dark:text-blue-300">
                    Valor Comissão (R$)
                  </Label>
                  <Input
                    id="valorComissao"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorComissao}
                    onChange={(e) =>
                      setFormData({ ...formData, valorComissao: e.target.value })
                    }
                    placeholder="0.00"
                    className="border-blue-300 dark:border-blue-700"
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="cartaoUsado" className="text-blue-800 dark:text-blue-300">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Cartão Usado para Pagamento
                  </Label>
                  <Input
                    id="cartaoUsado"
                    type="text"
                    value={formData.cartaoUsado}
                    onChange={(e) =>
                      setFormData({ ...formData, cartaoUsado: e.target.value })
                    }
                    placeholder="Ex: Nubank **** 1234"
                    className="border-blue-300 dark:border-blue-700"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Os KPIs (ROI, Custo por Lead, Taxa de
              Conversão e Ticket Médio) serão calculados automaticamente.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingMetric ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A métrica do dia{' '}
              <strong>
                {deletingMetric &&
                  new Date(deletingMetric.date).toLocaleDateString('pt-BR')}
              </strong>{' '}
              para <strong>{deletingMetric?.user?.name}</strong> será
              permanentemente deletada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingMetric(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
