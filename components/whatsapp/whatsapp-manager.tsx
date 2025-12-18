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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Canais do WhatsApp</h2>
                    <p className="text-muted-foreground">Gerencie suas conexões de WhatsApp Business ou Web.</p>
                </div>
                <Button onClick={createInstance} className="bg-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Conexão
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instances.map((instance) => (
                    <Card key={instance.id} className="overflow-hidden border-border bg-card/50">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold">{instance.name}</CardTitle>
                                <Badge variant={instance.status === 'CONNECTED' ? 'success' : 'secondary'}>
                                    {instance.status === 'CONNECTED' ? 'Conectado' : 'Desconectado'}
                                </Badge>
                            </div>
                            <CardDescription>{instance.phone || 'Sem número vinculado'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {instance.status === 'DISCONNECTED' ? (
                                <div className="flex flex-col items-center justify-center p-6 bg-secondary/20 rounded-xl border-2 border-dashed border-primary/20">
                                    <QrCode className="w-32 h-32 text-primary opacity-20 mb-4" />
                                    <p className="text-sm text-center text-muted-foreground mb-4">
                                        Gere um QR Code para conectar seu WhatsApp
                                    </p>
                                    <Button variant="outline" size="sm" className="w-full">
                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                        Gerar QR Code
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 bg-green-500/10 rounded-xl border-2 border-green-500/20">
                                    <Smartphone className="w-32 h-32 text-green-500 mb-4" />
                                    <p className="text-sm font-semibold text-green-600">Dispositivo Conectado</p>
                                    <Button variant="ghost" size="sm" className="mt-4 text-red-500 hover:text-red-600 hover:bg-red-50">
                                        Desconectar
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {instances.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nenhuma conexão configurada.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
