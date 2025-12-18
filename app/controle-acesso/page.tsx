'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    UserCheck,
    UserX,
    ShieldAlert,
    Search,
    Filter,
    MoreVertical,
    Calendar,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function AccessControlPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos');

    // Modal de Plano
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [customDays, setCustomDays] = useState('30');

    useEffect(() => {
        fetchUsers();
    }, [statusFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                status: statusFilter,
                search: search
            }).toString();
            const res = await fetch(`/api/users/access-control?${query}`);
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, action: string, extra = {}) => {
        try {
            const res = await fetch('/api/users/access-control', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action, ...extra }),
            });

            if (!res.ok) throw new Error();

            toast.success('Ação realizada com sucesso');
            fetchUsers();
            setIsPlanModalOpen(false);
        } catch (error) {
            toast.error('Erro ao realizar ação');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ATIVO': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Ativo</Badge>;
            case 'PENDIENTE': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">Pendente</Badge>;
            case 'BLOQUEADO': return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Bloqueado</Badge>;
            case 'REJEITADO': return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Rejeitado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPlanBadge = (plan: string, status: string) => {
        if (status === 'EXPIRED') return <Badge variant="destructive">Expirado</Badge>;
        if (plan === 'TRIAL') return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Trial</Badge>;
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {plan}</Badge>;
    };

    const openPlanModal = (user: any) => {
        setSelectedUser(user);
        setSelectedPlan(user.subscriptionPlan || 'MENSAL');
        setIsPlanModalOpen(true);
    };

    const confirmPlan = () => {
        let days = 30;
        if (selectedPlan === 'TRIMESTRAL') days = 90;
        if (selectedPlan === 'SEMESTRAL') days = 180;
        if (selectedPlan === 'ANUAL') days = 365;

        const expiry = new Date();
        expiry.setDate(expiry.getDate() + days);

        handleAction(selectedUser.id, 'SET_PLAN', {
            plan: selectedPlan,
            expiresAt: expiry.toISOString()
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white font-display">
                        Controle de Acesso
                    </h1>
                    <p className="text-white/60 mt-2">
                        Gerencie aprovações, planos e assinaturas da plataforma POLODASH.
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        className="pl-10 bg-white/5 border-white/10 focus:border-emerald-500/50 transition-all rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                        <SelectValue placeholder="Filtrar por Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-emerald-950 border-white/10 text-white">
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="PENDIENTE">Pendentes de Aprovação</SelectItem>
                        <SelectItem value="ATIVO">Usuários Ativos</SelectItem>
                        <SelectItem value="BLOQUEADO">Usuários Bloqueados</SelectItem>
                        <SelectItem value="REJEITADO">Usuários Rejeitados</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    onClick={fetchUsers}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-900/20 transition-all"
                >
                    Aplicar Filtros
                </Button>
            </div>

            {/* Tabela */}
            <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-md shadow-2xl">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/10">
                            <TableHead className="text-white/70 font-semibold py-5 px-6">Usuário</TableHead>
                            <TableHead className="text-white/70 font-semibold">Role</TableHead>
                            <TableHead className="text-white/70 font-semibold">Status</TableHead>
                            <TableHead className="text-white/70 font-semibold">Plano / Expiração</TableHead>
                            <TableHead className="text-white/70 font-semibold text-right pr-6">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 text-white/40">
                                    Carregando usuários...
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 text-white/40">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors uppercase">{user.name}</span>
                                            <span className="text-xs text-white/40 lowercase">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize border-white/20 text-white/80">
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(user.status)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {getPlanBadge(user.subscriptionPlan || 'TRIAL', user.subscriptionStatus)}
                                            {user.expiresAt && (
                                                <span className="text-[10px] text-white/40 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(user.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-10 w-10 p-0 hover:bg-white/10 rounded-xl">
                                                    <MoreVertical className="w-5 h-5 text-white/60" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52 bg-emerald-950 border-white/10 text-white p-2 rounded-2xl shadow-2xl">
                                                <DropdownMenuLabel className="text-white/40 text-[10px] uppercase px-3 py-2">Gestão de Usuário</DropdownMenuLabel>

                                                {user.status === 'PENDIENTE' && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleAction(user.id, 'APPROVE')}
                                                        className="hover:bg-emerald-500/20 text-emerald-400 focus:bg-emerald-500/20 focus:text-emerald-400 rounded-xl px-3 py-2.5 cursor-pointer"
                                                    >
                                                        <UserCheck className="mr-2 w-4 h-4" /> Aprovar Acesso
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem
                                                    onClick={() => openPlanModal(user)}
                                                    className="hover:bg-blue-500/20 text-blue-400 focus:bg-blue-500/20 focus:text-blue-400 rounded-xl px-3 py-2.5 cursor-pointer"
                                                >
                                                    <CreditCard className="mr-2 w-4 h-4" /> Definir Plano
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator className="bg-white/10 my-1" />

                                                {user.status === 'ATIVO' ? (
                                                    <DropdownMenuItem
                                                        onClick={() => handleAction(user.id, 'BLOCK')}
                                                        className="hover:bg-red-500/20 text-red-400 focus:bg-red-500/20 focus:text-red-400 rounded-xl px-3 py-2.5 cursor-pointer"
                                                    >
                                                        <ShieldAlert className="mr-2 w-4 h-4" /> Bloquear Usuário
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => handleAction(user.id, 'UNBLOCK')}
                                                        className="hover:bg-emerald-500/20 text-emerald-400 focus:bg-emerald-500/20 focus:text-emerald-400 rounded-xl px-3 py-2.5 cursor-pointer"
                                                    >
                                                        <UserCheck className="mr-2 w-4 h-4" /> Desbloquear
                                                    </DropdownMenuItem>
                                                )}

                                                {user.status === 'PENDIENTE' && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleAction(user.id, 'REJECT')}
                                                        className="hover:bg-red-500/20 text-red-400 focus:bg-red-500/20 focus:text-red-400 rounded-xl px-3 py-2.5 cursor-pointer"
                                                    >
                                                        <UserX className="mr-2 w-4 h-4" /> Rejeitar
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal de Plano */}
            <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
                <DialogContent className="bg-emerald-950 border-white/10 text-white rounded-3xl max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-display">Definir Plano para {selectedUser?.name}</DialogTitle>
                        <DialogDescription className="text-white/60">
                            Escolha o período da assinatura. Isso atualizará o acesso e a data de expiração.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                                <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                            <SelectContent className="bg-emerald-950 border-white/10 text-white">
                                <SelectItem value="MENSAL">Mensal (30 dias)</SelectItem>
                                <SelectItem value="TRIMESTRAL">Trimestral (90 dias)</SelectItem>
                                <SelectItem value="SEMESTRAL">Semestral (180 dias)</SelectItem>
                                <SelectItem value="ANUAL">Anual (365 dias)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsPlanModalOpen(false)} className="hover:bg-white/10 rounded-xl">
                            Cancelar
                        </Button>
                        <Button onClick={confirmPlan} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">
                            Confirmar Plano
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
