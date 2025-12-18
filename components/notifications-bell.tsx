'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Info, AlertTriangle, XCircle, Clock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function NotificationsBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Atualiza a cada minuto
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.isRead).length);
            }
        } catch (error) {
            console.error('Erro ao buscar notificações');
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            toast.error('Erro ao marcar como lida');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check className="w-4 h-4 text-emerald-400" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
            default: return <Info className="w-4 h-4 text-blue-400" />;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-white/10 rounded-xl transition-all h-10 w-10">
                    <Bell className="w-5 h-5 text-white/70" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-emerald-500 text-white border-2 border-[#091a14] rounded-full text-[10px] animate-pulse">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-emerald-950 border-white/10 text-white p-0 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                <DropdownMenuLabel className="p-4 flex items-center justify-between">
                    <span className="font-display text-base tracking-wide">Notificações</span>
                    {unreadCount > 0 && <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">{unreadCount} novas</Badge>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10 m-0" />

                <ScrollArea className="h-[350px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-white/40 flex flex-col items-center gap-2">
                            <Clock className="w-8 h-8 opacity-20" />
                            <p className="text-sm">Nenhuma notificação por enquanto.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.isRead && markAsRead(n.id)}
                                    className={cn(
                                        "p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5",
                                        !n.isRead && "bg-white/[0.03]"
                                    )}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1">{getIcon(n.type)}</div>
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-sm font-medium", !n.isRead ? "text-white" : "text-white/60")}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-white/20 pt-1">
                                                {new Date(n.createdAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <DropdownMenuSeparator className="bg-white/10 m-0" />
                <Button variant="ghost" className="w-full rounded-none h-12 text-xs text-white/40 hover:text-white hover:bg-white/5">
                    Ver todas as notificações
                </Button>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
