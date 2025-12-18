'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Search,
    Send,
    MoreVertical,
    Phone,
    Video,
    Paperclip,
    Smile,
    Check,
    CheckCheck,
    MessageSquare,
    Plus,
    ArrowLeft,
    Smartphone
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedDiv } from '@/components/animated/motion-components';
import { fadeInUp, fadeIn } from '@/lib/animations';

interface Chat {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    avatar?: string;
    status: 'online' | 'offline';
}

const mockChats: Chat[] = [
    { id: '1', name: 'João Silva', lastMessage: 'Olá, gostaria de saber mais sobre o plano...', time: '10:30', unread: 2, status: 'online' },
    { id: '2', name: 'Maria Santos', lastMessage: 'Obrigado pelo retorno!', time: '09:15', unread: 0, status: 'offline' },
    { id: '3', name: 'Pedro Oliveira', lastMessage: 'Pode me enviar o catálogo atualizado?', time: 'Ontem', unread: 5, status: 'online' },
];

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppManager } from '@/components/whatsapp/whatsapp-manager';

import { useSocket } from '@/hooks/use-socket';
import { toast } from 'react-hot-toast';

export default function WhatsAppInbox() {
    const router = useRouter();
    const { data: session } = useSession();
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [chats, setChats] = useState<Chat[]>(Array.isArray(mockChats) ? mockChats : []);
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('new_message', (data) => {
            toast.success(`Nova mensagem de ${data.from}`);

            // Atualizar lista de chats (lógica simplificada para demo)
            setChats(prev => {
                const existing = prev.find(c => c.id === data.leadId);
                if (existing) {
                    return [
                        { ...existing, lastMessage: data.content, time: 'Agora', unread: existing.unread + 1 },
                        ...prev.filter(c => c.id !== data.leadId)
                    ];
                }
                return [{
                    id: data.leadId,
                    name: `Lead: ${data.from}`,
                    lastMessage: data.content,
                    time: 'Agora',
                    unread: 1,
                    status: 'online'
                }, ...prev];
            });
        });

        return () => {
            socket.off('new_message');
        };
    }, [socket]);

    return (
        <div className="pt-16 lg:pt-6 p-4 sm:p-6 h-[calc(100vh-10px)] flex flex-col gap-4">
            <Tabs defaultValue="inbox" className="w-full h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard')}
                        className="rounded-full hover:bg-card/80 shadow-sm border border-border/50"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <TabsList className="bg-card/50 backdrop-blur-sm border border-border">
                        <TabsTrigger value="inbox" className="px-8 flex gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Inbox
                        </TabsTrigger>
                        <TabsTrigger value="connections" className="px-8 flex gap-2">
                            <Smartphone className="w-4 h-4" />
                            Canais
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="inbox" className="flex-1 min-h-0 mt-0">
                    <div className="flex h-full gap-4 overflow-hidden">
                        {/* Sidebar - Chat List */}
                        <Card className="w-80 flex flex-col border-border bg-card/50 backdrop-blur-sm">
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <h2 className="text-xl font-bold">Conversas</h2>
                                <Button variant="ghost" size="sm">
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="p-4 bg-secondary/30">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input placeholder="Buscar conversas..." className="pl-9 bg-background border-none focus-visible:ring-1" />
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="divide-y divide-border/50">
                                    {chats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            onClick={() => setSelectedChat(chat)}
                                            className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 flex gap-3 items-start ${selectedChat?.id === chat.id ? 'bg-muted' : ''}`}
                                        >
                                            <div className="relative">
                                                <Avatar>
                                                    <AvatarImage src={chat.avatar} />
                                                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                                                </Avatar>
                                                {chat.status === 'online' && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-semibold truncate">{chat.name}</span>
                                                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                                            </div>
                                            {chat.unread > 0 && (
                                                <Badge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full mt-1">
                                                    {chat.unread}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </Card>

                        {/* Main Chat Area */}
                        {selectedChat ? (
                            <Card className="flex-1 flex flex-col border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
                                {/* Chat Header */}
                                <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="font-semibold">{selectedChat.name}</h3>
                                            <span className="text-xs text-green-500">{selectedChat.status === 'online' ? 'Online' : 'Visto por último recentemente'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon"><Phone className="w-5 h-5" /></Button>
                                        <Button variant="ghost" size="icon"><Video className="w-5 h-5" /></Button>
                                        <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <ScrollArea className="flex-1 p-6 space-y-4 bg-[url('/whatsapp-bg.png')] bg-repeat opacity-100">
                                    <div className="flex flex-col gap-4">
                                        {/* Outgoing Message */}
                                        <div className="flex justify-end">
                                            <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none max-w-[70%] shadow-sm">
                                                <p className="text-sm">Olá João! Como posso te ajudar hoje?</p>
                                                <div className="flex justify-end items-center gap-1 mt-1">
                                                    <span className="text-[10px] opacity-70">10:30</span>
                                                    <CheckCheck className="w-3 h-3 opacity-70" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Incoming Message */}
                                        <div className="flex justify-start">
                                            <div className="bg-secondary text-secondary-foreground p-3 rounded-2xl rounded-tl-none max-w-[70%] shadow-sm">
                                                <p className="text-sm">Oi! Eu vi o anúncio no Instagram e gostaria de tirar uma dúvida sobre os planos corporativos.</p>
                                                <div className="flex justify-end mt-1">
                                                    <span className="text-[10px] opacity-70">10:31</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollArea>

                                {/* Input Area */}
                                <div className="p-4 border-t border-border bg-card">
                                    <div className="flex gap-2 items-center">
                                        <Button variant="ghost" size="icon"><Smile className="w-5 h-5" /></Button>
                                        <Button variant="ghost" size="icon"><Paperclip className="w-5 h-5" /></Button>
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Digite sua mensagem..."
                                            className="flex-1"
                                            onKeyPress={(e) => e.key === 'Enter' && setNewMessage('')}
                                        />
                                        <Button
                                            onClick={() => setNewMessage('')}
                                            className="bg-primary hover:bg-primary/90"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <Card className="flex-1 flex flex-col items-center justify-center border-border bg-card/50 backdrop-blur-sm text-center p-12">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <MessageSquare className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Seu Inbox do WhatsApp</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Selecione uma conversa para começar a responder seus clientes em tempo real.
                                </p>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="connections" className="p-1">
                    <WhatsAppManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
