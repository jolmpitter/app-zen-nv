'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatedDiv, AnimatedTableRow } from '@/components/animated/motion-components';
import { useLazyAnimation, useProgressiveLoad } from '@/hooks/use-lazy-animation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  DollarSign,
  Clock,
  User,
  ArrowRightLeft,
  LayoutGrid,
  List,
  ArrowLeft,
} from 'lucide-react';
import { KanbanBoard } from '@/components/crm/kanban-board';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { fadeInUp, fadeIn, staggerItem } from '@/lib/animations';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  valorPotencial: number | null;
  valorFechado: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  atendente: {
    id: string;
    name: string;
    email: string;
  };
  history?: any[];
}

interface User {
  id: string;
  name: string;
  role: string;
}

const statusConfig = {
  novo: { label: 'Novo', color: 'bg-blue-500' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-500' },
  concluido: { label: 'Concluído', color: 'bg-green-500' },
  perdido: { label: 'Perdido', color: 'bg-red-500' },
};

export default function CRMPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [funnels, setFunnels] = useState<any[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<any>(null);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Hooks de otimização de performance
  const { ref: headerRef, shouldAnimate: shouldAnimateHeader } = useLazyAnimation({ threshold: 0.1, triggerOnce: true });
  const { ref: tableRef, shouldAnimate: shouldAnimateTable } = useLazyAnimation({ threshold: 0.05, triggerOnce: true, delay: 100 });

  // Estados dos diálogos
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState('');
  const [transferAtendenteId, setTransferAtendenteId] = useState('');

  // Formulário de novo lead
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    valorPotencial: '',
    notes: '',
    atendenteId: '',
  });

  useEffect(() => {
    fetchLeads();
    fetchFunnels();
    if (session?.user?.role === 'gestor' || session?.user?.role === 'gerente') {
      fetchUsers();
    }
  }, []);

  const fetchFunnels = async () => {
    try {
      const res = await fetch('/api/funnels');
      const data = await res.json();
      setFunnels(data);
      if (data.length > 0) setSelectedFunnel(data[0]);
    } catch (error) {
      console.error('Error fetching funnels:', error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [leads, searchTerm, statusFilter]);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      const usersArray = Array.isArray(data) ? data : [];
      setUsers(usersArray.filter((u: User) => u?.role === 'atendente'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const applyFilters = () => {
    let filtered = leads;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered?.filter((lead) =>
        lead?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        lead?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        lead?.phone?.includes(searchTerm)
      );
    }

    // Filtro de status
    if (statusFilter !== 'todos') {
      filtered = filtered?.filter((lead) => lead?.status === statusFilter);
    }

    setFilteredLeads(filtered);
    setCurrentPage(1); // Resetar página ao filtrar
  };

  // Cálculos de paginação
  const totalPages = Math.ceil((filteredLeads?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads?.slice(startIndex, endIndex) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error?.error || 'Erro ao criar lead');
        return;
      }

      toast.success('Lead criado com sucesso!');
      setIsCreateOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: '',
        valorPotencial: '',
        notes: '',
        atendenteId: '',
      });
      fetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Erro ao criar lead');
    }
  };

  const handleUpdateLead = async (leadId: string, updates: any) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error?.error || 'Erro ao atualizar lead');
        return;
      }

      toast.success('Lead atualizado com sucesso!');
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar lead');
    }
  };

  const handleOpenDeleteDialog = (lead: Lead) => {
    setDeletingLead(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;

    try {
      const res = await fetch(`/api/leads/${deletingLead.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error?.error || 'Erro ao deletar lead');
        return;
      }

      toast.success('Lead deletado com sucesso!');
      setIsDeleteDialogOpen(false);
      setDeletingLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao deletar lead');
    }
  };

  const handleOpenTransferDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setTransferAtendenteId(lead.atendente.id);
    setIsTransferOpen(true);
  };

  const handleTransferLead = async () => {
    if (!selectedLead || !transferAtendenteId) {
      toast.error('Selecione um atendente');
      return;
    }

    if (transferAtendenteId === selectedLead.atendente.id) {
      toast.error('Lead já pertence a este atendente');
      return;
    }

    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          atendenteId: transferAtendenteId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error?.error || 'Erro ao transferir lead');
        return;
      }

      toast.success('Lead transferido com sucesso!');
      setIsTransferOpen(false);
      setSelectedLead(null);
      setTransferAtendenteId('');
      fetchLeads();
    } catch (error) {
      console.error('Error transferring lead:', error);
      toast.error('Erro ao transferir lead');
    }
  };

  const handleViewLead = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();
      setSelectedLead(data);
      setIsViewOpen(true);
    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast.error('Erro ao carregar detalhes do lead');
    }
  };

  const handleAddNote = async () => {
    if (!selectedLead || !newNote.trim()) return;

    try {
      const res = await fetch(`/api/leads/${selectedLead.id}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'note_added',
          description: newNote,
        }),
      });

      if (!res.ok) {
        toast.error('Erro ao adicionar nota');
        return;
      }

      toast.success('Nota adicionada!');
      setNewNote('');
      handleViewLead(selectedLead.id);
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Erro ao adicionar nota');
    }
  };

  if (loading) {
    return (
      <div className="pt-16 lg:pt-6 p-4 sm:p-6">
        <TableSkeleton columns={7} rows={8} showHeader={true} showActions={true} />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-6 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <AnimatedDiv
        ref={headerRef}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        variants={shouldAnimateHeader ? fadeInUp : undefined}
        initial="hidden"
        animate="visible"
      >
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="rounded-full hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">CRM</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Gerencie seus leads e clientes</p>
            {funnels.length > 1 && (
              <Select value={selectedFunnel?.id} onValueChange={(v) => setSelectedFunnel(funnels.find(f => f.id === v))}>
                <SelectTrigger className="h-7 w-auto border-none bg-transparent font-semibold text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {funnels.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-muted rounded-lg p-1 border border-border">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4 mr-2" />
              Tabela
            </Button>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Lead</DialogTitle>
                <DialogDescription>
                  Preencha as informações do novo lead
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLead}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData?.name}
                      onChange={(e) => setFormData({ ...formData, name: e?.target?.value || '' })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData?.email}
                      onChange={(e) => setFormData({ ...formData, email: e?.target?.value || '' })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData?.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e?.target?.value || '' })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Origem</Label>
                    <Input
                      id="source"
                      placeholder="Facebook Ads, Google, etc."
                      value={formData?.source}
                      onChange={(e) => setFormData({ ...formData, source: e?.target?.value || '' })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorPotencial">Valor Potencial (R$)</Label>
                    <Input
                      id="valorPotencial"
                      type="number"
                      step="0.01"
                      value={formData?.valorPotencial}
                      onChange={(e) => setFormData({ ...formData, valorPotencial: e?.target?.value || '' })}
                    />
                  </div>
                  {(session?.user?.role === 'gestor' || session?.user?.role === 'gerente') && users?.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="atendente">Atendente</Label>
                      <Select
                        value={formData?.atendenteId}
                        onValueChange={(value) => setFormData({ ...formData, atendenteId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um atendente" />
                        </SelectTrigger>
                        <SelectContent>
                          {users?.filter(user => user?.id)?.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user?.name || 'Sem nome'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData?.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e?.target?.value || '' })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Criar Lead
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedDiv>

      {/* Filtros */}
      <AnimatedDiv
        variants={fadeIn}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e?.target?.value || '')}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </AnimatedDiv>

      {/* Tabela de Leads */}
      <AnimatedDiv
        ref={tableRef}
        variants={shouldAnimateTable ? fadeIn : undefined}
        initial="hidden"
        animate="visible"
      >
        {viewMode === 'table' ? (
          <Card>
            <CardHeader>
              <CardTitle>Leads ({filteredLeads?.length || 0})</CardTitle>
              <CardDescription>
                {statusFilter !== 'todos'
                  ? `Exibindo leads com status "${statusConfig[statusFilter as keyof typeof statusConfig]?.label}"`
                  : 'Exibindo todos os leads'}
                {filteredLeads?.length > itemsPerPage && (
                  <span className="ml-2 text-muted-foreground">
                    • Página {currentPage} de {totalPages}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Atendente</TableHead>
                    <TableHead>Valor Potencial</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentLeads?.map((lead, index) => (
                      <AnimatedTableRow
                        key={lead?.id}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        variants={staggerItem}
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <TableCell className="font-medium">{lead?.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {lead?.email && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Mail className="w-3 h-3 mr-1" />
                                {lead?.email}
                              </div>
                            )}
                            {lead?.phone && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <Phone className="w-3 h-3 mr-1" />
                                {lead?.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${statusConfig[lead?.status as keyof typeof statusConfig]?.color} text-white`}
                          >
                            {statusConfig[lead?.status as keyof typeof statusConfig]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <User className="w-3 h-3 mr-1" />
                            {lead?.atendente?.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead?.valorPotencial ? (
                            <div className="flex items-center text-sm">
                              <DollarSign className="w-3 h-3" />
                              {lead?.valorPotencial?.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(lead?.createdAt || '')?.toLocaleDateString('pt-BR')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewLead(lead?.id || '')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(session?.user?.role === 'gestor' || session?.user?.role === 'gerente') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenTransferDialog(lead)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <ArrowRightLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenDeleteDialog(lead)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </AnimatedTableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
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
            </CardContent>
          </Card>
        ) : (
          <KanbanBoard
            funnel={selectedFunnel}
            leads={filteredLeads}
          />
        )}
      </AnimatedDiv>

      {/* Diálogo de Visualização/Edição */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLead?.name}</DialogTitle>
            <DialogDescription>
              Lead criado em {new Date(selectedLead?.createdAt || '')?.toLocaleDateString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Informações</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Email</Label>
                    <p className="text-sm">{selectedLead?.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Telefone</Label>
                    <p className="text-sm">{selectedLead?.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Origem</Label>
                    <p className="text-sm">{selectedLead?.source || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Atendente</Label>
                    <p className="text-sm">{selectedLead?.atendente?.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Status</Label>
                    <div className="mt-1">
                      <Select
                        value={selectedLead?.status}
                        onValueChange={(value) => {
                          handleUpdateLead(selectedLead?.id || '', { status: value });
                          setSelectedLead({ ...selectedLead, status: value });
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="perdido">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Valor Potencial</Label>
                    <p className="text-sm">
                      {selectedLead?.valorPotencial
                        ? `R$ ${selectedLead?.valorPotencial?.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {selectedLead?.notes && (
                <div>
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Observações</Label>
                  <p className="text-sm mt-1">{selectedLead?.notes}</p>
                </div>
              )}

              {/* Histórico */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Histórico</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedLead?.history?.map((item: any) => (
                    <div key={item?.id} className="border-l-2 border-blue-500 pl-3 py-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item?.user?.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{item?.description}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(item?.createdAt || '')?.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adicionar Nota */}
              <div>
                <Label htmlFor="newNote">Adicionar Nota</Label>
                <div className="flex gap-2 mt-2">
                  <Textarea
                    id="newNote"
                    placeholder="Digite uma nota sobre este lead..."
                    value={newNote}
                    onChange={(e) => setNewNote(e?.target?.value || '')}
                    rows={2}
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Lead Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Lead</DialogTitle>
            <DialogDescription>
              Transfira o lead {selectedLead?.name} para outro atendente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Atendente Atual</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">{selectedLead?.atendente?.name}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-atendente">Transferir para *</Label>
              <Select
                value={transferAtendenteId}
                onValueChange={setTransferAtendenteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um atendente" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    ?.filter((u) => u?.id && u.id !== selectedLead?.atendente?.id)
                    ?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user?.name || 'Sem nome'} ({user?.role || 'Sem role'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-start gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Ação Importante</p>
                  <p className="text-sm text-blue-800">
                    Esta ação irá transferir o lead para outro atendente e registrar a mudança no histórico do sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleTransferLead}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transferir Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o lead <span className="font-semibold text-white">{deletingLead?.name}</span>?
              <br />
              <span className="text-red-400 mt-2 block">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setDeletingLead(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
