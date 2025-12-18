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
    Smartphone,
    User
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedDiv } from '@/components/animated/motion-components';
import { fadeInUp, fadeIn } from '@/lib/animations';
import { cn } from '@/lib/utils';

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
import { LeadDetailsSidebar } from '@/components/whatsapp/lead-details-sidebar';

import { useSocket } from '@/hooks/use-socket';
import { toast } from 'react-hot-toast';

export default function WhatsAppInbox() {
    const router = useRouter();
    const { data: session } = useSession();
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [instances, setInstances] = useState<any[]>([]);
    const socket = useSocket();

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/whatsapp/chats');
            const data = await res.json();
            setChats(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoadingChats(false);
        }
    };

    const fetchMessages = async (leadId: string) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/whatsapp/messages?leadId=${leadId}`);
            const data = await res.json();
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const fetchInstances = async () => {
        try {
            const res = await fetch('/api/whatsapp/instances');
            const data = await res.json();
            setInstances(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching instances:', error);
        }
    };

    useEffect(() => {
        fetchChats();
        fetchInstances();
    }, []);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id);
        } else {
            setMessages([]);
        }
    }, [selectedChat]);

    useEffect(() => {
        if (!socket) return;

        socket.on('new_message', (data) => {
            if (selectedChat?.id === data.leadId) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    content: data.content,
                    fromMe: false,
                    timestamp: new Date(),
                    status: 'received'
                }]);
            }
            fetchChats(); // Refresh list to update last message/unread
        });

        return () => {
            socket.off('new_message');
        };
    }, [socket, selectedChat]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        const connectedInstance = instances.find(inst => inst.status === 'CONNECTED');
        if (!connectedInstance) {
            toast.error('Nenhuma conexão ativa encontrada');
            return;
        }

        const textToSend = newMessage;
        setNewMessage('');

        // Optimistic update
        const tempId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: tempId,
            content: textToSend,
            fromMe: true,
            timestamp: new Date(),
            status: 'sending'
        }]);

        try {
            const res = await fetch('/api/whatsapp/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: selectedChat.id,
                    text: textToSend,
                    instanceId: connectedInstance.id
                })
            });

            if (!res.ok) throw new Error('Failed to send');

            const sentMsg = await res.json();
            setMessages(prev => prev.map(m => m.id === tempId ? sentMsg : m));
            fetchChats();
        } catch (error) {
            toast.error('Erro ao enviar mensagem');
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    return (
        <div className="pt-16 lg:pt-6 p-4 sm:p-6 h-[calc(100vh-10px)] flex flex-col gap-4 bg-[#0a0a0f] text-white">
            <Tabs defaultValue="inbox" className="w-full h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/dashboard')}
                        className="rounded-xl hover:bg-white/5 border border-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <TabsList className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl">
                        <TabsTrigger value="inbox" className="px-8 flex gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                            <MessageSquare className="w-4 h-4" />
                            Inbox
                        </TabsTrigger>
                        <TabsTrigger value="connections" className="px-8 flex gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Smartphone className="w-4 h-4" />
                            Canais
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="inbox" className="flex-1 min-h-0 mt-0">
                    <div className="flex h-full gap-4 overflow-hidden relative">
                        {/* Sidebar - Chat List */}
                        <Card className="w-80 flex flex-col border-white/10 bg-white/5 backdrop-blur-xl">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Mensagens</h2>
                                <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-xl">
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="p-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <Input
                                        placeholder="Buscar conversas..."
                                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10 rounded-xl"
                                    />
                                </div>
                            </div>

                            <ScrollArea className="flex-1 px-2">
                                <div className="space-y-1 pb-4">
                                    {loadingChats ? (
                                        <div className="p-4 text-center text-white/20">Carregando chats...</div>
                                    ) : chats.map((chat) => (
                                        <div
                                            key={chat.id}
                                            onClick={() => setSelectedChat(chat)}
                                            className={cn(
                                                "p-3 cursor-pointer rounded-2xl transition-all duration-300 flex gap-3 items-start group",
                                                selectedChat?.id === chat.id
                                                    ? 'bg-primary/20 border border-primary/30'
                                                    : 'hover:bg-white/5 border border-transparent'
                                            )}
                                        >
                                            <div className="relative">
                                                <Avatar className="w-12 h-12 border border-white/10">
                                                    <AvatarImage src={chat.avatar} />
                                                    <AvatarFallback className="bg-white/5">{chat.name[0]}</AvatarFallback>
                                                </Avatar>
                                                {chat.status === 'online' && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0a0f] rounded-full"></span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className="text-sm font-bold truncate text-white">{chat.name}</span>
                                                    <span className="text-[10px] text-white/40">{chat.time}</span>
                                                </div>
                                                <p className="text-xs text-white/60 truncate leading-relaxed">{chat.lastMessage}</p>
                                            </div>
                                            {chat.unread > 0 && (
                                                <Badge className="bg-primary text-white text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full mt-1 border-none">
                                                    {chat.unread}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                    {!loadingChats && chats.length === 0 && (
                                        <div className="p-8 text-center">
                                            <p className="text-white/20 text-sm">Nenhuma conversa encontrada</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </Card>

                        {/* Main Chat Area */}
                        {selectedChat ? (
                            <div className="flex-1 flex gap-4 min-w-0 h-full">
                                <Card className="flex-1 flex flex-col border-white/10 bg-white/5 backdrop-blur-xl relative overflow-hidden">
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="border border-white/10">
                                                <AvatarFallback className="bg-white/5">{selectedChat.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-white">{selectedChat.name}</h3>
                                                <span className="text-[10px] text-green-500 flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                    {selectedChat.status === 'online' ? 'Online agora' : 'Disponível'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setShowSidebar(!showSidebar)}
                                                className={cn("rounded-xl transition-colors", showSidebar ? "bg-primary/20 text-primary" : "text-white/40 hover:text-white hover:bg-white/10")}
                                            >
                                                <User className="w-5 h-5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl"><MoreVertical className="w-5 h-5" /></Button>
                                        </div>
                                    </div>

                                    {/* Messages Area */}
                                    <ScrollArea className="flex-1 p-6">
                                        <div className="flex flex-col gap-4">
                                            {messages.map((msg) => (
                                                <div key={msg.id} className={cn("flex", msg.fromMe ? "justify-end" : "justify-start")}>
                                                    <div className={cn(
                                                        "p-3 px-4 rounded-2xl max-w-[70%] shadow-lg border",
                                                        msg.fromMe
                                                            ? "bg-primary text-white rounded-tr-none border-primary/20"
                                                            : "bg-white/5 text-white rounded-tl-none border-white/10"
                                                    )}>
                                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                                        <div className={cn("flex items-center gap-1 mt-1", msg.fromMe ? "justify-end" : "justify-start")}>
                                                            <span className={cn("text-[10px]", msg.fromMe ? "text-white/60" : "text-white/40")}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {msg.fromMe && (
                                                                msg.status === 'sent'
                                                                    ? <CheckCheck className="w-3 h-3 text-white/80" />
                                                                    : <Check className="w-3 h-3 text-white/40" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {loadingMessages && (
                                                <div className="text-center py-4 text-white/20 text-xs">Carregando histórico...</div>
                                            )}
                                        </div>
                                    </ScrollArea>

                                    {/* Input Area */}
                                    <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
                                        <form onSubmit={handleSendMessage} className="flex gap-3 items-center bg-white/5 rounded-2xl p-1.5 px-3 border border-white/10">
                                            <Button type="button" variant="ghost" size="icon" className="text-white/40 hover:text-white rounded-xl h-9 w-9"><Smile className="w-5 h-5" /></Button>
                                            <Button type="button" variant="ghost" size="icon" className="text-white/40 hover:text-white rounded-xl h-9 w-9"><Paperclip className="w-5 h-5" /></Button>
                                            <Input
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Digite sua mensagem..."
                                                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-white/20"
                                            />
                                            <Button
                                                type="submit"
                                                size="icon"
                                                className="bg-primary hover:bg-primary/90 text-white rounded-xl h-9 w-9 shadow-lg shadow-primary/20"
                                            >
                                                <Send className="w-4 h-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </Card>

                                {/* Sidebar de Detalhes do Lead */}
                                {showSidebar && (
                                    <LeadDetailsSidebar
                                        leadId={selectedChat.id}
                                        onClose={() => setShowSidebar(false)}
                                    />
                                )}
                            </div>
                        ) : (
                            <Card className="flex-1 flex flex-col items-center justify-center border-white/10 bg-white/5 backdrop-blur-xl text-center p-12 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                                <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 border border-primary/30 shadow-[0_0_50px_rgba(168,85,247,0.2)] animate-pulse relative z-10">
                                    <MessageSquare className="w-12 h-12 text-primary" />
                                </div>
                                <h3 className="text-3xl font-bold mb-3 text-white relative z-10">Inbox Centralizado</h3>
                                <p className="text-white/40 max-w-sm text-base leading-relaxed relative z-10">
                                    Conecte-se com seus leads em tempo real. Selecione uma conversa ao lado para gerenciar vendas e atendimento.
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

