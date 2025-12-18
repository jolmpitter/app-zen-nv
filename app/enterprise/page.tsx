'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, History, UserPlus, Link as LinkIcon, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { AnimatedDiv } from '@/components/animated/motion-components';
import { fadeIn, fadeInUp } from '@/lib/animations';

export default function EnterpriseManagement() {
    const router = useRouter();
    const { data: session } = useSession() || {};
    const [logs, setLogs] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allCompanies, setAllCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');

    const isCIO = session?.user?.role === 'cio';

    useEffect(() => {
        fetchData();
        if (isCIO) {
            fetchCIOData();
        }
    }, [isCIO]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsRes, invitesRes] = await Promise.all([
                fetch('/api/enterprise/audit-logs'),
                fetch('/api/enterprise/invitations')
            ]);
            const logsData = await logsRes.json();
            const invitesData = await invitesRes.json();
            setLogs(Array.isArray(logsData) ? logsData : []);
            setInvites(Array.isArray(invitesData) ? invitesData : []);
        } catch (err) {
            toast.error('Erro ao carregar dados enterprise');
        } finally {
            setLoading(false);
        }
    };

    const fetchCIOData = async () => {
        try {
            const [usersRes, companiesRes] = await Promise.all([
                fetch('/api/enterprise/users'),
                fetch('/api/enterprise/companies')
            ]);
            const usersData = await usersRes.json();
            const companiesData = await companiesRes.json();
            setAllUsers(Array.isArray(usersData) ? usersData : []);
            setAllCompanies(Array.isArray(companiesData) ? companiesData : []);
        } catch (err) {
            console.error('Erro ao carregar dados de CIO');
        }
    };

    const handleUpdateUser = async (userId: string, data: any) => {
        try {
            const res = await fetch(`/api/enterprise/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                toast.success('Usuário atualizado!');
                fetchCIOData();
            }
        } catch (err) {
            toast.error('Erro ao atualizar usuário');
        }
    };

    const handleUpdateCompany = async (companyId: string, data: any) => {
        try {
            const res = await fetch(`/api/enterprise/companies/${companyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                toast.success('Empresa atualizada!');
                fetchCIOData();
            }
        } catch (err) {
            toast.error('Erro ao atualizar empresa');
        }
    };

    const handleCreateInvite = async () => {
        if (!inviteEmail) return;
        try {
            const res = await fetch('/api/enterprise/invitations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, role: 'atendente' })
            });
            const data = await res.json();
            if (data.invitation) {
                toast.success('Convite gerado com sucesso!');
                setInviteEmail('');
                fetchData();
                if (typeof window !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(data.inviteLink);
                    toast.success('Link copiado para a área de transferência');
                }
            }
        } catch (err) {
            toast.error('Erro ao gerar convite');
        }
    };

    if (session?.user?.role !== 'cio' && session?.user?.role !== 'gerente') {
        return <div className="p-20 text-center">Acesso restrito ao nível executivo.</div>;
    }

    return (
        <div className="pt-16 lg:pt-6 p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
            <AnimatedDiv variants={fadeIn}>
                <div className="flex items-center gap-4 mb-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard')}
                        className="rounded-full hover:bg-muted"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Centro de Comando Enterprise</h1>
                    </div>
                </div>
                <p className="text-muted-foreground ml-12">Gestão de compliance, auditoria e expansão da organização.</p>
            </AnimatedDiv>

            <Tabs defaultValue="audit" className="w-full">
                <TabsList className="bg-card/50 border border-border">
                    <TabsTrigger value="audit" className="flex gap-2">
                        <History className="w-4 h-4" /> Auditoria
                    </TabsTrigger>
                    {isCIO && (
                        <>
                            <TabsTrigger value="users" className="flex gap-2">
                                <ShieldCheck className="w-4 h-4" /> Usuários (CIO)
                            </TabsTrigger>
                            <TabsTrigger value="companies" className="flex gap-2">
                                <ShieldCheck className="w-4 h-4" /> Empresas (CIO)
                            </TabsTrigger>
                        </>
                    )}
                    <TabsTrigger value="invitations" className="flex gap-2">
                        <UserPlus className="w-4 h-4" /> Convites Pro
                    </TabsTrigger>
                </TabsList>

                {isCIO && (
                    <>
                        <TabsContent value="users" className="mt-6">
                            <Card className="bg-card/50 backdrop-blur-sm border-border">
                                <CardHeader>
                                    <CardTitle>Gestão de Usuários</CardTitle>
                                    <CardDescription>Gerencie todos os acessos do sistema.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {allUsers.map((user) => (
                                            <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50">
                                                <div className="flex-1">
                                                    <p className="font-bold text-lg">{user.name} <Badge variant="outline">{user.role.toUpperCase()}</Badge></p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    <p className="text-xs text-primary">Empresa: {user.company?.name || 'Sem Empresa'}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <select
                                                        className="bg-background border rounded px-2 py-1 text-sm"
                                                        value={user.status}
                                                        onChange={(e) => handleUpdateUser(user.id, { status: e.target.value })}
                                                    >
                                                        <option value="ATIVO">Ativo</option>
                                                        <option value="BLOQUEADO">Bloqueado</option>
                                                        <option value="PENDIENTE">Pendente</option>
                                                    </select>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => handleUpdateUser(user.id, { status: 'BLOQUEADO' })}
                                                    >
                                                        Bloquear
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="companies" className="mt-6">
                            <Card className="bg-card/50 backdrop-blur-sm border-border">
                                <CardHeader>
                                    <CardTitle>Gestão de Empresas & Limites</CardTitle>
                                    <CardDescription>Defina limites de assentos e controle o status das empresas.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {allCompanies.map((company) => (
                                            <div key={company.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/50">
                                                <div className="flex-1">
                                                    <p className="font-bold text-lg">{company.name}</p>
                                                    <p className="text-sm text-muted-foreground">Usuários: {company._count.users} / Limite: {company.userLimit}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Limite de Seats</label>
                                                        <input
                                                            type="number"
                                                            className="w-20 bg-background border rounded px-2 py-1 text-sm text-center"
                                                            defaultValue={company.userLimit}
                                                            onBlur={(e) => handleUpdateCompany(company.id, { userLimit: e.target.value })}
                                                        />
                                                    </div>
                                                    <select
                                                        className="bg-background border rounded px-2 py-1 text-sm mt-4"
                                                        value={company.status}
                                                        onChange={(e) => handleUpdateCompany(company.id, { status: e.target.value })}
                                                    >
                                                        <option value="ACTIVE">Ativa</option>
                                                        <option value="SUSPENDED">Suspensa</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </>
                )}

                <TabsContent value="audit" className="mt-6">
                    <Card className="bg-card/50 backdrop-blur-sm border-border">
                        <CardHeader>
                            <CardTitle>Logs de Atividade</CardTitle>
                            <CardDescription>Rastro completo de ações críticas realizadas por usuários.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex items-start justify-between p-3 rounded-lg bg-secondary/20 border border-border/50">
                                        <div className="flex gap-3">
                                            <div className="p-2 rounded-full bg-primary/10">
                                                <History className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    <span className="text-primary">{log.user?.name}</span> executou <span className="font-bold">{log.action}</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                                                {log.details && (
                                                    <pre className="text-[10px] mt-2 p-2 bg-black/20 rounded overflow-x-auto max-w-md">
                                                        {log.details.startsWith('{') ? JSON.stringify(JSON.parse(log.details), null, 2) : log.details}
                                                    </pre>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">{log.ipAddress || 'Sistemas'}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invitations" className="mt-6 space-y-6">
                    <Card className="bg-card/50 backdrop-blur-sm border-border">
                        <CardHeader>
                            <CardTitle>Novo Convite Corporativo</CardTitle>
                            <CardDescription>Gere um link de cadastro seguro vinculado à sua empresa.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex gap-4">
                            <Input
                                placeholder="email@empresa.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="max-w-md"
                            />
                            <Button onClick={handleCreateInvite} className="gap-2">
                                <LinkIcon className="w-4 h-4" /> Gerar Link
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-border">
                        <CardHeader>
                            <CardTitle>Histórico de Convites</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {invites.map((invite) => (
                                    <div key={invite.id} className="p-4 rounded-xl bg-secondary/20 border border-border/50 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <Badge variant={invite.status === 'PENDING' ? 'secondary' : 'default'}>
                                                {invite.status === 'PENDING' ? 'Pendente' : 'Aceito'}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">{new Date(invite.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="font-semibold truncate">{invite.email}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            {invite.status === 'ACCEPTED' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Clock className="w-3 h-3" />}
                                            {invite.status === 'PENDING' ? `Expira em ${new Date(invite.expiresAt).toLocaleDateString()}` : 'Cadastro concluído'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
