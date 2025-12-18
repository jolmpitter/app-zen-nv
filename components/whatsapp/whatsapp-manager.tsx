'use client';

import { useState, useEffect } from 'react';
import {
    QrCode,
    RefreshCcw,
    Smartphone,
    CheckCircle2,
    AlertCircle,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface WhatsAppInstance {
    id: string;
    name: string;
    status: string;
    qrCode?: string;
    phone?: string;
}

export function WhatsAppManager() {
    const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInstances();
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Canais do WhatsApp</h2>
                    <p className="text-white/40">Gerencie suas conexões via Evolution API ou WhatsApp Business.</p>
                </div>
                <Button onClick={createInstance} className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Conexão
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map((instance) => (
                    <Card key={instance.id} className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all group">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">{instance.name}</CardTitle>
                                    <CardDescription className="text-white/40">{instance.phone || 'Sem número vinculado'}</CardDescription>
                                </div>
                                <Badge className={instance.status === 'CONNECTED' ? 'bg-green-500/20 text-green-500 border-green-500/20' : 'bg-white/5 text-white/40 border-white/5'}>
                                    {instance.status === 'CONNECTED' ? 'Conectado' : 'Desconectado'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {instance.status === 'DISCONNECTED' || instance.status === 'INITIALIZING' ? (
                                <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 group-hover:border-primary/50 transition-colors">
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
                                    <Smartphone className="w-32 h-32 text-green-500 mb-4" />
                                    <p className="text-sm font-semibold text-green-500">Dispositivo Conectado</p>
                                    <Button variant="ghost" size="sm" className="mt-4 text-white/40 hover:text-red-500 hover:bg-red-500/10">
                                        Desvincular Rota
                                    </Button>
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
