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
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

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
                // Em um app real, aqui enviaríamos o email
                console.log('Link de convite:', data.inviteLink);
                navigator.clipboard.writeText(data.inviteLink);
                toast.success('Link copiado para a área de transferência');
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
                    <TabsTrigger value="invitations" className="flex gap-2">
                        <UserPlus className="w-4 h-4" /> Convites Pro
                    </TabsTrigger>
                </TabsList>

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
                                                        {JSON.stringify(JSON.parse(log.details), null, 2)}
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
