'use client';

import { useState } from 'react';
import {
    GitBranch,
    MessageSquare,
    Zap,
    Tag,
    Bot,
    Smartphone,
    Send,
    Users,
    Target
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface CommandCard {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    category: 'fluxos' | 'mensagens' | 'automacoes' | 'config';
    color: string;
}

const commandCards: CommandCard[] = [
    {
        id: 'criar-fluxo',
        icon: GitBranch,
        title: 'Criar Fluxo',
        description: 'Novo fluxo de conversa com etapas',
        category: 'fluxos',
        color: 'from-purple-500 to-indigo-600',
    },
    {
        id: 'criar-mensagem',
        icon: MessageSquare,
        title: 'Criar Mensagem',
        description: 'Template de mensagem reutilizável',
        category: 'mensagens',
        color: 'from-blue-500 to-cyan-500',
    },
    {
        id: 'criar-gatilho',
        icon: Zap,
        title: 'Criar Gatilho',
        description: 'Disparar ação por palavra-chave',
        category: 'automacoes',
        color: 'from-yellow-500 to-orange-500',
    },
    {
        id: 'criar-etiqueta',
        icon: Tag,
        title: 'Criar Etiqueta',
        description: 'Organizar leads por categoria',
        category: 'config',
        color: 'from-green-500 to-emerald-500',
    },
    {
        id: 'criar-automacao',
        icon: Bot,
        title: 'Criar Automação',
        description: 'Sequência automática de ações',
        category: 'automacoes',
        color: 'from-pink-500 to-rose-500',
    },
    {
        id: 'enviar-broadcast',
        icon: Send,
        title: 'Enviar Broadcast',
        description: 'Mensagem em massa para leads',
        category: 'mensagens',
        color: 'from-violet-500 to-purple-600',
    },
];

interface CommandCardsProps {
    onAction?: (cardId: string, data: any) => void;
}

export function CommandCards({ onAction }: CommandCardsProps) {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    const handleCardClick = (cardId: string) => {
        setFormData({});
        setActiveModal(cardId);
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            let endpoint = '';
            let payload = {};

            switch (activeModal) {
                case 'criar-fluxo':
                    endpoint = '/api/automation/flows';
                    payload = { name: formData.name, description: formData.description };
                    break;
                case 'criar-etiqueta':
                    endpoint = '/api/tags';
                    payload = { name: formData.name, color: formData.color || '#6366f1' };
                    break;
                case 'criar-mensagem':
                    endpoint = '/api/messages/templates';
                    payload = { name: formData.name, content: formData.content };
                    break;
                case 'criar-gatilho':
                    endpoint = '/api/automation/triggers';
                    payload = { keyword: formData.keyword, action: formData.action };
                    break;
                default:
                    toast.info('Funcionalidade em desenvolvimento');
                    setActiveModal(null);
                    setLoading(false);
                    return;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success('Criado com sucesso!');
                onAction?.(activeModal!, formData);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Erro ao criar');
            }
        } catch (error) {
            console.error('Command error:', error);
            toast.error('Erro ao executar comando');
        } finally {
            setLoading(false);
            setActiveModal(null);
        }
    };

    const renderModalContent = () => {
        switch (activeModal) {
            case 'criar-fluxo':
                return (
                    <>
                        <div className="space-y-2">
                            <Label>Nome do Fluxo *</Label>
                            <Input
                                placeholder="Ex: Atendimento Inicial"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Textarea
                                placeholder="Descreva o objetivo deste fluxo..."
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </>
                );

            case 'criar-etiqueta':
                return (
                    <>
                        <div className="space-y-2">
                            <Label>Nome da Etiqueta *</Label>
                            <Input
                                placeholder="Ex: VIP, Lead Quente, Suporte"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Cor</Label>
                            <div className="flex gap-2">
                                {['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'].map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color ? 'scale-125 border-white' : 'border-transparent'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormData({ ...formData, color })}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                );

            case 'criar-mensagem':
                return (
                    <>
                        <div className="space-y-2">
                            <Label>Nome do Template *</Label>
                            <Input
                                placeholder="Ex: Boas-vindas, Follow-up"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Conteúdo da Mensagem *</Label>
                            <Textarea
                                placeholder="Digite o texto da mensagem. Use {nome} para personalizar."
                                className="min-h-[120px]"
                                value={formData.content || ''}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            />
                        </div>
                    </>
                );

            case 'criar-gatilho':
                return (
                    <>
                        <div className="space-y-2">
                            <Label>Palavra-chave *</Label>
                            <Input
                                placeholder="Ex: preço, desconto, ajuda"
                                value={formData.keyword || ''}
                                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ação</Label>
                            <Select
                                value={formData.action || ''}
                                onValueChange={(value) => setFormData({ ...formData, action: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma ação" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="send_message">Enviar Mensagem</SelectItem>
                                    <SelectItem value="add_tag">Adicionar Etiqueta</SelectItem>
                                    <SelectItem value="move_funnel">Mover no Funil</SelectItem>
                                    <SelectItem value="notify_team">Notificar Equipe</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );

            default:
                return (
                    <p className="text-white/60 text-center py-8">
                        Funcionalidade em desenvolvimento 🚧
                    </p>
                );
        }
    };

    const activeCard = commandCards.find((c) => c.id === activeModal);

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {commandCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className="glass-card p-4 flex flex-col items-center gap-3 text-center transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] group cursor-pointer"
                        >
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} shadow-lg group-hover:shadow-xl transition-shadow`}>
                                <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">{card.title}</h3>
                                <p className="text-white/50 text-xs mt-1 line-clamp-2">{card.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Modal for card action */}
            <Dialog open={!!activeModal} onOpenChange={() => setActiveModal(null)}>
                <DialogContent className="glass-card border-white/10 text-white sm:max-w-[450px] bg-[#0a0a0f]/95 backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            {activeCard && (
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${activeCard.color}`}>
                                    <activeCard.icon className="w-5 h-5 text-white" />
                                </div>
                            )}
                            {activeCard?.title}
                        </DialogTitle>
                        <DialogDescription className="text-white/60">
                            {activeCard?.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {renderModalContent()}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setActiveModal(null)}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        >
                            {loading ? 'Criando...' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
