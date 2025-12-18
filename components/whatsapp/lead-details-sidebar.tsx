'use client';

import { useState, useEffect } from 'react';
import {
    X,
    User,
    Phone,
    Mail,
    Tag,
    LayoutGrid,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Save,
    Plus,
    History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LeadDetailsSidebarProps {
    leadId: string | null;
    onClose: () => void;
}

export function LeadDetailsSidebar({ leadId, onClose }: LeadDetailsSidebarProps) {
    const [lead, setLead] = useState<any>(null);
    const [funnels, setFunnels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        if (leadId) {
            fetchLeadDetails();
            fetchFunnels();
        }
    }, [leadId]);

    const fetchLeadDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/leads/${leadId}`);
            const data = await res.json();
            setLead(data);
        } catch (error) {
            console.error('Error fetching lead:', error);
            toast.error('Erro ao carregar detalhes do lead');
        } finally {
            setLoading(true); // Verifying later
            setLoading(false);
        }
    };

    const fetchFunnels = async () => {
        try {
            const res = await fetch('/api/funnels');
            const data = await res.json();
            setFunnels(data);
        } catch (error) {
            console.error('Error fetching funnels:', error);
        }
    };

    const handleUpdateLead = async (updates: any) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (res.ok) {
                toast.success('Lead atualizado!');
                fetchLeadDetails();
            }
        } catch (error) {
            toast.error('Erro ao salvar alterações');
        } finally {
            setSaving(false);
        }
    };

    if (!leadId) return null;

    return (
        <aside className="w-80 border-l border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl flex flex-col h-full animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Detalhes do Lead
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/5">
                    <X className="w-5 h-5 text-white/40" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="p-8 text-center text-white/40">Carregando...</div>
                ) : lead ? (
                    <div className="p-4 space-y-6">
                        {/* Info Básica */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-widest text-white/40">Nome Completo</Label>
                                <Input
                                    value={lead.name}
                                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                                    onBlur={() => handleUpdateLead({ name: lead.name })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-widest text-white/40">WhatsApp / Telefone</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={lead.phone || ''}
                                        readOnly
                                        className="bg-white/5 border-white/10 text-white/60"
                                    />
                                    <Button variant="ghost" size="icon" className="bg-primary/20 text-primary hover:bg-primary/30">
                                        <Phone className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Funil e Etapa */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                                    <LayoutGrid className="w-3 h-3" />
                                    Funil de Vendas
                                </Label>
                                <Select
                                    value={lead.funnelId || ''}
                                    onValueChange={(val) => handleUpdateLead({ funnelId: val })}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Selecionar Funil" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {funnels.map(f => (
                                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Etapa Atual
                                </Label>
                                <Select
                                    value={lead.stepId || ''}
                                    onValueChange={(val) => handleUpdateLead({ stepId: val })}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue placeholder="Selecionar Etapa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {funnels.find(f => f.id === lead.funnelId)?.steps.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Etiquetas / Tags */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <Label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <Tag className="w-3 h-3" />
                                Etiquetas
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {JSON.parse(lead.tags || '[]').map((tag: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 py-1">
                                        {tag}
                                        <button className="hover:text-white" onClick={() => {
                                            const tags = JSON.parse(lead.tags || '[]');
                                            handleUpdateLead({ tags: JSON.stringify(tags.filter((t: string) => t !== tag)) });
                                        }}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] border border-white/10 text-white/40 hover:text-white"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add Tag
                                </Button>
                            </div>
                        </div>

                        {/* Valor Potencial */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" />
                                    Valor da Oportunidade
                                </Label>
                                <Input
                                    type="number"
                                    value={lead.valorPotencial || 0}
                                    onChange={(e) => setLead({ ...lead, valorPotencial: parseFloat(e.target.value) })}
                                    onBlur={() => handleUpdateLead({ valorPotencial: lead.valorPotencial })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <Label className="text-[10px] uppercase tracking-widest text-white/40">Notas do Atendimento</Label>
                            <Textarea
                                value={lead.notes || ''}
                                onChange={(e) => setLead({ ...lead, notes: e.target.value })}
                                onBlur={() => handleUpdateLead({ notes: lead.notes })}
                                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                placeholder="Descreva aqui detalhes importantes..."
                            />
                        </div>

                        {/* Timeline / Histórico */}
                        <div className="space-y-4 pt-4 border-t border-white/5 pb-20">
                            <Label className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
                                <History className="w-3 h-3" />
                                Histórico recente
                            </Label>
                            <div className="space-y-3">
                                {lead.history?.slice(0, 3).map((h: any, i: number) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="min-w-[4px] bg-primary/20 rounded-full" />
                                        <div>
                                            <p className="text-[11px] text-white/60">{h.description}</p>
                                            <p className="text-[9px] text-white/30">{new Date(h.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-white/40">Lead não encontrado</div>
                )}
            </ScrollArea>

            {/* Sticky Actions */}
            <div className="p-4 border-t border-white/5 bg-[#0a0a0f] absolute bottom-0 left-0 right-0">
                <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                    onClick={() => handleUpdateLead({})}
                    disabled={saving}
                >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </aside>
    );
}
