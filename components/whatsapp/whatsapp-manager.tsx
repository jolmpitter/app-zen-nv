'use client';

import { useState, useEffect } from 'react';
import {
    QrCode,
    RefreshCcw,
    Smartphone,
    CheckCircle2,
    AlertCircle,
    Plus,
    Zap,
    Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface WhatsAppInstance {
    id: string;
    name: string;
    status: string;
    qrCode?: string;
    phone?: string;
    flowId?: string;
}

interface AutomationFlow {
    id: string;
    name: string;
    isActive: boolean;
}

export function WhatsAppManager() {
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [flows, setFlows] = useState<AutomationFlow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInstances();
        fetchFlows();
    }, []);

    const fetchInstances = async () => {
        try {
            const res = await fetch('/api/whatsapp/instances');
            const data = await res.json();
            setInstances(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFlows = async () => {
        try {
            const res = await fetch('/api/whatsapp/flows');
            const data = await res.json();
            setFlows(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching flows:', error);
        }
    };

    const createInstance = async () => {
        try {
            const res = await fetch('/api/whatsapp/instances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `Conexão ${instances.length + 1}` }),
            });
            if (res.ok) {
                toast.success('Instância criada! Escaneie o QR Code.');
                fetchInstances();
            }
        } catch (error) {
            toast.error('Erro ao criar instância');
        }
    };

    const linkFlowToInstance = async (instanceId: string, flowId: string) => {
        try {
            const res = await fetch('/api/whatsapp/instances', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: instanceId, flowId: flowId === 'none' ? null : flowId }),
            });
            if (res.ok) {
                toast.success('Fluxo vinculado com sucesso!');
                // Update local state
                setInstances(instances.map(inst =>
                    inst.id === instanceId ? { ...inst, flowId: flowId === 'none' ? undefined : flowId } : inst
                ));
            } else {
                toast.error('Erro ao vincular fluxo');
            }
        } catch (error) {
            toast.error('Erro ao vincular fluxo');
        }
    };

    const deleteInstance = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta rota?')) return;

        try {
            const res = await fetch(`/api/whatsapp/instances?id=${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                toast.success('Instância excluída');
                fetchInstances();
            }
        } catch (error) {
            toast.error('Erro ao excluir instância');
        }
    };

    const getFlowName = (flowId?: string) => {
        if (!flowId) return null;
        const flow = flows.find(f => f.id === flowId);
        return flow?.name || 'Fluxo não encontrado';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Canais do WhatsApp</h2>
                    <p className="text-white/40">Gerencie suas conexões e vincule fluxos de automação.</p>
                </div>
                <Button onClick={createInstance} className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Nova Conexão
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map((instance) => (
                    <Card key={instance.id} className="glass-card group hover:border-primary/50 transition-all duration-300">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={`w-2 h-2 rounded-full ${instance.status === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
                                        <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">{instance.name}</CardTitle>
                                    </div>
                                    <CardDescription className="text-white/40">{instance.phone || 'Sem número vinculado'}</CardDescription>
                                </div>
                                <Badge className={instance.status === 'CONNECTED' ? 'bg-green-500/20 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/10'}>
                                    {instance.status === 'CONNECTED' ? 'Online' : 'Offline'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {instance.status === 'DISCONNECTED' || instance.status === 'INITIALIZING' ? (
                                <div className="flex flex-col items-center justify-center p-6 bg-black/20 rounded-2xl border-2 border-dashed border-white/10 group-hover:border-primary/50 transition-colors">
                                    {instance.qrCode ? (
                                        <div className="bg-white p-2 rounded-xl shadow-lg mb-4">
                                            <img src={instance.qrCode} alt="WhatsApp QR Code" className="w-32 h-32" />
                                        </div>
                                    ) : (
                                        <QrCode className="w-32 h-32 text-primary opacity-20 mb-4" />
                                    )}
                                    <p className="text-sm text-center text-white/40 mb-4">
                                        Escaneie para conectar seu WhatsApp
                                    </p>
                                    <div className="flex gap-2 w-full">
                                        <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                                            <RefreshCcw className="w-4 h-4 mr-2" />
                                            Recarregar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 bg-green-500/5 rounded-2xl border-2 border-green-500/20">
                                    <Smartphone className="w-20 h-20 text-green-500 mb-4" />
                                    <p className="text-sm font-semibold text-green-500 mb-4">Dispositivo Conectado</p>

                                    {/* FLOW SELECTOR */}
                                    <div className="w-full space-y-3">
                                        <div className="flex items-center gap-2 text-xs text-white/50 font-semibold uppercase">
                                            <LinkIcon className="w-3 h-3" />
                                            Vincular Fluxo de Automação
                                        </div>
                                        <Select
                                            value={instance.flowId || 'none'}
                                            onValueChange={(value) => linkFlowToInstance(instance.id, value)}
                                        >
                                            <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                                                <SelectValue placeholder="Selecione um fluxo" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                                <SelectItem value="none" className="hover:bg-white/5">
                                                    <span className="text-white/40">Nenhum fluxo</span>
                                                </SelectItem>
                                                {flows.map((flow) => (
                                                    <SelectItem key={flow.id} value={flow.id} className="hover:bg-white/5">
                                                        <div className="flex items-center gap-2">
                                                            <Zap className={`w-3 h-3 ${flow.isActive ? 'text-green-500' : 'text-white/30'}`} />
                                                            {flow.name}
                                                            {flow.isActive && <Badge className="ml-2 text-[10px] bg-green-500/20 text-green-500">Ativo</Badge>}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        {instance.flowId && (
                                            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl border border-primary/20">
                                                <Zap className="w-4 h-4 text-primary" />
                                                <span className="text-xs text-primary font-medium">
                                                    Vinculado: {getFlowName(instance.flowId)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteInstance(instance.id)}
                                    className="text-white/20 hover:text-red-500 hover:bg-red-500/10 h-8"
                                >
                                    Excluir Instância
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {instances.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
                        <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40">Nenhuma conexão configurada.</p>
                        <Button onClick={createInstance} variant="link" className="text-primary mt-2">
                            Criar minha primeira rota
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
