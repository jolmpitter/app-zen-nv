'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Zap,
    MessageSquare,
    Split,
    ChevronRight,
    MoreVertical,
    Pencil,
    Trash2,
    Link as LinkIcon,
    Bot,
    Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GPTConfigModal } from '@/components/whatsapp/gpt-config-modal';
import { CommandCards } from '@/components/automation/command-cards';

export default function AutomationFlowsPage() {
    const router = useRouter();
    const [flows, setFlows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [gptModalOpen, setGptModalOpen] = useState(false);
    const [selectedFlow, setSelectedFlow] = useState<any>(null);

    useEffect(() => {
        fetchFlows();
    }, []);

    const fetchFlows = async () => {
        try {
            const res = await fetch('/api/whatsapp/flows');
            const data = await res.json();
            setFlows(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching flows:', error);
            // Fallback data for preview if API fails or is empty during dev
            if (process.env.NODE_ENV === 'development') {
                setFlows([
                    { id: '1', name: 'Fluxo de Boas-Vindas', nodes: 8, conditions: 2, isActive: true },
                    { id: '2', name: 'Recuperação de Carrinho', nodes: 5, conditions: 1, isActive: false },
                    { id: '3', name: 'Agendamento Automático', nodes: 12, conditions: 4, isActive: true },
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;

        try {
            const res = await fetch(`/api/whatsapp/flows?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Erro ao excluir');
            toast.success('Fluxo excluído');
            fetchFlows();
        } catch (error) {
            toast.error('Erro ao excluir fluxo');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            const res = await fetch(`/api/whatsapp/flows`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !currentStatus })
            });
            if (!res.ok) throw new Error('Erro ao atualizar');

            // Optimistic update
            setFlows(flows.map(f => f.id === id ? { ...f, isActive: !currentStatus } : f));
            toast.success(`Fluxo ${!currentStatus ? 'ativado' : 'pausado'}`);
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleOpenGPT = (flow: any, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedFlow(flow);
        setGptModalOpen(true);
    };

    return (
        <div className="pt-16 lg:pt-6 p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Automações de Chat"
                subtitle="Crie fluxos de atendimento inteligentes e automáticos."
            />

            {/* Command Cards */}
            <div className="mb-2">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> Comandos Rápidos
                </h2>
                <CommandCards />
            </div>

            <div className="flex justify-end">
                <Button
                    onClick={() => router.push('/whatsapp/flows/new')}
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 px-6 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all h-12 font-bold"
                >
                    <Plus className="w-5 h-5" /> Novo Fluxo
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : flows.length === 0 ? (
                <Card className="glass-card p-12 text-center flex flex-col items-center justify-center group">
                    <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 border border-primary/30 group-hover:scale-110 transition-transform duration-300">
                        <Zap className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum fluxo criado</h3>
                    <p className="text-white/40 max-w-sm mb-8 text-sm">Comece a automatizar seu atendimento criando seu primeiro fluxo de conversa.</p>
                    <Button
                        onClick={() => router.push('/whatsapp/flows/new')}
                        variant="ghost"
                        className="text-primary hover:text-primary hover:bg-primary/10 rounded-xl"
                    >
                        Criar primeiro fluxo <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flows.map((flow) => (
                        <Card
                            key={flow.id}
                            className="glass-card group hover:border-primary/50 transition-all duration-300 relative"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all">
                                        <Zap className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-lg">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-white/10 text-white">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/whatsapp/flows/${flow.id}`)} className="cursor-pointer hover:bg-white/5">
                                                    <Pencil className="w-4 h-4 mr-2" /> Editar Visual
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => router.push(`/whatsapp/flows/${flow.id}/connect`)} className="cursor-pointer hover:bg-white/5">
                                                    <LinkIcon className="w-4 h-4 mr-2" /> Conectar Instância
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleOpenGPT(flow, e)} className="cursor-pointer hover:bg-white/5 text-purple-400">
                                                    <Bot className="w-4 h-4 mr-2" /> Configurar IA
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-white/10" />
                                                <DropdownMenuItem onClick={(e) => handleDelete(flow.id, e)} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                                    <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">{flow.name}</h3>
                                <div className="flex items-center gap-4 text-xs text-white/40 mb-6">
                                    <span className="flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> {flow.nodes || 0} Nodes
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Split className="w-3.5 h-3.5 text-amber-400" /> {flow.conditions || 0} Condições
                                    </span>
                                    {flow.gptEnabled && (
                                        <span className="flex items-center gap-1.5 text-purple-400 font-semibold shadow-[0_0_10px_rgba(168,85,247,0.2)] px-2 py-0.5 rounded-full bg-purple-500/10">
                                            <Bot className="w-3.5 h-3.5" /> IA Ativa
                                        </span>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <Button
                                        variant="outline"
                                        className="border-white/10 bg-white/5 hover:bg-white/10 text-white h-9 text-xs"
                                        onClick={() => router.push(`/whatsapp/flows/${flow.id}`)}
                                    >
                                        <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                                    </Button>
                                    <Button
                                        className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 hover:border-primary/50 h-9 text-xs"
                                        onClick={() => router.push(`/whatsapp/flows/${flow.id}/connect`)}
                                    >
                                        <LinkIcon className="w-3.5 h-3.5 mr-2" /> Conectar
                                    </Button>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Badge className={flow.isActive ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/20'}>
                                            {flow.isActive ? 'Ativo' : 'Pausado'}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => toggleStatus(flow.id, flow.isActive, e)}
                                        className={flow.isActive ? 'text-amber-500 hover:bg-amber-500/10' : 'text-green-500 hover:bg-green-500/10'}
                                    >
                                        <Play className={`w-3.5 h-3.5 mr-1.5 ${flow.isActive ? 'rotate-90' : ''}`} />
                                        {flow.isActive ? 'Pausar' : 'Ativar'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {selectedFlow && (
                <GPTConfigModal
                    isOpen={gptModalOpen}
                    onClose={() => setGptModalOpen(false)}
                    flowName={selectedFlow.name}
                    flowId={selectedFlow.id}
                />
            )}
        </div>
    );
}
