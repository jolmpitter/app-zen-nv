'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Brain, Sparkles, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface GPTConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    flowName: string;
    flowId: string;
}

export function GPTConfigModal({ isOpen, onClose, flowName, flowId }: GPTConfigModalProps) {
    const [enabled, setEnabled] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState(
        'Você é um assistente virtual especialista em atendimento. Seja educado, breve e foque em ajudar o cliente a resolver seu problema ou comprar o produto.'
    );
    const [temperature, setTemperature] = useState('0.7');
    const [model, setModel] = useState('gpt-4');

    const handleSave = () => {
        // Aqui entraria a chamada de API para salvar
        toast.success(`Configurações de IA salvas para "${flowName}"`);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-card border-white/10 text-white sm:max-w-[500px] bg-[#0a0a0f]/95 backdrop-blur-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/20 rounded-xl border border-primary/30">
                            <Brain className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">Configurar Agente IA</DialogTitle>
                            <DialogDescription className="text-white/40">
                                Personalize a inteligência artificial para o fluxo "{flowName}".
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Ativar/Desativar */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="space-y-0.5">
                            <Label className="text-base font-semibold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-accent" />
                                Ativar IA Humanizada
                            </Label>
                            <p className="text-xs text-white/40">
                                Permite que a IA responda mensagens fora do fluxo padrão.
                            </p>
                        </div>
                        <Switch checked={enabled} onCheckedChange={setEnabled} className="data-[state=checked]:bg-primary" />
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-white/70">Modelo</Label>
                                <Select value={model} onValueChange={setModel}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                        <SelectItem value="gpt-4">GPT-4 (Recomendado)</SelectItem>
                                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-white/70">Criatividade (Temp)</Label>
                                <Select value={temperature} onValueChange={setTemperature}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                                        <SelectItem value="0.2">0.2 (Preciso)</SelectItem>
                                        <SelectItem value="0.5">0.5 (Equilibrado)</SelectItem>
                                        <SelectItem value="0.7">0.7 (Criativo)</SelectItem>
                                        <SelectItem value="1.0">1.0 (Muito Criativo)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-white/70 flex items-center gap-2">
                                <Bot className="w-4 h-4 text-primary" />
                                Prompt do Sistema (Personalidade)
                            </Label>
                            <Textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="min-h-[120px] bg-white/5 border-white/10 text-white resize-none focus:border-primary/50 transition-colors"
                                placeholder="Descreva como a IA deve se comportar..."
                            />
                            <p className="text-xs text-white/30 text-right">
                                {systemPrompt.length} caracteres
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/10">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                        Salvar Configurações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
