'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Play, MoreVertical, Trash2, Smartphone, Zap, MessageSquare, Split, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function AutomationFlowsPage() {
    const router = useRouter();
    const [flows, setFlows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
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

    const toggleStatus = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await fetch(`/api/whatsapp/flows`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, isActive: !currentStatus })
            });
            if (!res.ok) throw new Error('Erro ao atualizar');
            fetchFlows();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    return (
        <div className="pt-16 lg:pt-6 p-4 sm:p-6 min-h-screen bg-[#0a0a0f] text-white">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Automações de Chat</h1>
                    <p className="text-white/40 text-sm">Crie fluxos de atendimento inteligentes e automáticos.</p>
                </div>
                <Button
                    onClick={() => router.push('/whatsapp/flows/new')}
                    className="bg-primary hover:bg-primary/90 text-white rounded-2xl gap-2 px-6 shadow-lg shadow-primary/20 h-12 font-bold"
                >
                    <Plus className="w-5 h-5" /> Novo Fluxo
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : flows.length === 0 ? (
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />
                    <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 border border-primary/30 group-hover:scale-110 transition-transform">
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
                            onClick={() => router.push(`/whatsapp/flows/${flow.id}`)}
                            className="bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all cursor-pointer overflow-hidden group border hover:border-primary/50"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                        <Zap className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                            onClick={(e) => handleDelete(flow.id, e)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1">{flow.name}</h3>
                                <div className="flex items-center gap-4 text-xs text-white/40 mb-6">
                                    <span className="flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" /> 8 Nodes
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Split className="w-3.5 h-3.5" /> 2 Condições
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <Badge className={flow.isActive ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-white/5 text-white/30 border-white/10'}>
                                        {flow.isActive ? 'Ativo' : 'Pausado'}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => toggleStatus(flow.id, flow.isActive, e)}
                                        className={flow.isActive ? 'text-amber-500 hover:bg-amber-500/10' : 'text-green-500 hover:bg-green-500/10'}
                                    >
                                        {flow.isActive ? 'Pausar' : 'Ativar'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
