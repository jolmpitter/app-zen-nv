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
  UserCheck,
  UserX,
  Shield,
  User,
  ArrowLeft,
} from 'lucide-react';
import { fadeInUp, fadeIn, staggerItem } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';
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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  gestorId: string | null;
  gestor?: {
    id: string;
    name: string;
  } | null;
}

export default function UsuariosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [users, setUsers] = useState<User[]>([]);
  const [gestores, setGestores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Hooks de otimização de performance
  const { ref: headerRef, shouldAnimate: shouldAnimateHeader } = useLazyAnimation({ threshold: 0.1, triggerOnce: true });
  const { ref: tableRef, shouldAnimate: shouldAnimateTable } = useLazyAnimation({ threshold: 0.05, triggerOnce: true, delay: 100 });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'atendente',
    gestorId: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'gestor' && session?.user?.role !== 'gerente' && session?.user?.role !== 'cio') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'gestor' || session?.user?.role === 'gerente' || session?.user?.role === 'cio') {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        const usersArray = Array.isArray(data) ? data : [];
        setUsers(usersArray);
        setGestores(usersArray.filter((u: User) => u?.role === 'gestor' || u?.role === 'gerente'));
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        gestorId: user.gestorId || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'atendente',
        gestorId: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'atendente',
      gestorId: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.email || !formData.role) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (!editingUser && !formData.password) {
        toast.error('Senha é obrigatória para novos usuários');
        return;
      }

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingUser ? 'Usuário atualizado com sucesso' : 'Usuário criado com sucesso'
        );
        handleCloseDialog();
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao salvar usuário');
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      const response = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Usuário deletado com sucesso');
        setIsDeleteDialogOpen(false);
        setDeletingUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar usuário');
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao deletar usuário');
    }
  };

  const filteredUsers = users?.filter(
    (user) =>
      user?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      user?.email?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

  // Cálculos de paginação
  const totalPages = Math.ceil((filteredUsers?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers?.slice(startIndex, endIndex) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resetar página ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (status === 'loading' || loading) {
    return (
      <div className="pt-16 lg:pt-6 p-4 sm:p-6">
        <TableSkeleton columns={5} rows={8} showHeader={true} showActions={true} />
      </div>
    );
  }

  if (session?.user?.role !== 'gestor' && session?.user?.role !== 'gerente' && session?.user?.role !== 'cio') {
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
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestão de Usuários
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
            Gerencie gestores e atendentes do sistema
            {filteredUsers?.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                • {filteredUsers.length} usuários
                {filteredUsers.length > itemsPerPage && ` • Página ${currentPage} de ${totalPages}`}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </AnimatedDiv>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <AnimatedDiv
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Gestor Responsável</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                currentUsers?.map((user, index) => (
                  <AnimatedTableRow
                    key={user?.id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={shouldAnimateTable ? staggerItem : undefined}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <TableCell className="font-medium">{user?.name}</TableCell>
                    <TableCell>{user?.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user?.role === 'gerente'
                            ? 'border-orange-600 text-orange-600'
                            : user?.role === 'gestor'
                              ? 'border-purple-600 text-purple-600'
                              : 'border-blue-600 text-blue-600'
                        }
                      >
                        {user?.role === 'gerente' ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Gerente
                          </>
                        ) : user?.role === 'gestor' ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Gestor
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Atendente
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user?.gestor?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(user?.createdAt)?.toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {/* Botão Editar - Gerente pode editar todos, Gestor pode editar apenas atendentes */}
                      {(session?.user?.role === 'gerente' ||
                        (session?.user?.role === 'gestor' && user?.role === 'atendente')) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}

                      {/* Botão Deletar - Apenas Gerente pode excluir usuários */}
                      {session?.user?.role === 'gerente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingUser(user);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </AnimatedTableRow>
                ))
              )}
            </TableBody>
          </Table>

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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Senha {!editingUser && '*'}
                {editingUser && ' (deixe em branco para manter a atual)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="********"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Usuário *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {session?.user?.role === 'gerente' && (
                    <SelectItem value="gerente">Gerente</SelectItem>
                  )}
                  {session?.user?.role === 'gerente' && (
                    <SelectItem value="gestor">Gestor</SelectItem>
                  )}
                  <SelectItem value="atendente">Atendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'atendente' && (
              <div className="space-y-2">
                <Label htmlFor="gestorId">Gestor Responsável</Label>
                <Select
                  value={formData.gestorId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gestorId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {gestores?.filter(gestor => gestor?.id)?.map((gestor) => (
                      <SelectItem key={gestor.id} value={gestor.id}>
                        {gestor?.name || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingUser ? 'Atualizar' : 'Criar'}
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
              Esta ação não pode ser desfeita. O usuário{' '}
              <strong>{deletingUser?.name}</strong> será permanentemente
              deletado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUser(null)}>
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
