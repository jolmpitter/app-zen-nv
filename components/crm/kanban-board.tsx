'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, User, DollarSign, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumn {
    id: string;
    name: string;
    leads: any[];
}

interface KanbanBoardProps {
    funnel: {
        id: string;
        name: string;
        steps: { id: string; name: string; order: number }[];
    } | null;
    leads: any[];
}

export function KanbanBoard({ funnel, leads }: KanbanBoardProps) {
    if (!funnel) return null;

    return (
        <div className="flex gap-4 h-[calc(100vh-280px)] overflow-x-auto pb-4 custom-scrollbar">
            {funnel.steps.sort((a, b) => a.order - b.order).map((step) => {
                const stepLeads = leads.filter(l => l.status === step.name || l.stepId === step.id);

                return (
                    <div key={step.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{step.name}</h3>
                                <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px]">
                                    {stepLeads.length}
                                </Badge>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 bg-muted/30 rounded-xl p-2 border border-border/50">
                            <div className="flex flex-col gap-3">
                                {stepLeads.map((lead) => (
                                    <Card key={lead.id} className="bg-card hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing shadow-sm border-border/50 group">
                                        <CardHeader className="p-3 pb-0">
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-semibold group-hover:text-primary transition-colors">{lead.name}</span>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-2 space-y-2">
                                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                <User className="w-3 h-3" />
                                                <span>{lead.atendente?.name || 'Sem atendente'}</span>
                                            </div>

                                            {lead.valorPotencial && (
                                                <div className="flex items-center gap-1 text-[11px] font-semibold text-green-500">
                                                    <DollarSign className="w-3 h-3" />
                                                    <span>R$ {lead.valorPotencial.toLocaleString()}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(lead.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                );
            })}
        </div>
    );
}
