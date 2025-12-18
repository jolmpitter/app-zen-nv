'use client';

import { useState, useEffect } from 'react';
import {
    Target,
    TrendingUp,
    Plus,
    ChevronRight,
    ChevronDown,
    Users,
    User,
    Building,
    MoreHorizontal,
    PlusCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { AnimatedDiv } from '@/components/animated/motion-components';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface KeyResult {
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string;
}

interface Objective {
    id: string;
    title: string;
    description?: string;
    level: 'COMPANY' | 'SECTOR' | 'INDIVIDUAL';
    progress: number;
    keyResults: KeyResult[];
    sector?: { name: string };
    user?: { name: string; avatarUrl?: string };
}

export function OKRManager() {
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchObjectives();
    }, []);

    const fetchObjectives = async () => {
        try {
            const res = await fetch('/api/okr/objectives');
            const data = await res.json();
            setObjectives(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredObjectives = objectives.filter(obj => {
        if (activeTab === 'all') return true;
        return obj.level === activeTab.toUpperCase();
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Target className="w-6 h-6 text-primary" />
                        Objetivos e Resultados Chave (OKRs)
                    </h2>
                    <p className="text-muted-foreground">Planejamento estratégico e métricas de sucesso da empresa.</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Novo Objetivo
                </Button>
            </div>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-card/50 border border-border">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="company" className="flex gap-2">
                        <Building className="w-4 h-4" /> Empresa
                    </TabsTrigger>
                    <TabsTrigger value="sector" className="flex gap-2">
                        <Users className="w-4 h-4" /> Setores
                    </TabsTrigger>
                    <TabsTrigger value="individual" className="flex gap-2">
                        <User className="w-4 h-4" /> Individuais
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                    <AnimatedDiv
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        {filteredObjectives.map((obj) => (
                            <AnimatedDiv key={obj.id} variants={fadeInUp}>
                                <Card className="hover:shadow-xl transition-all duration-300 border-border/50 group overflow-hidden">
                                    <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={obj.level === 'COMPANY' ? 'default' : 'secondary'} className="text-[10px] py-0">
                                                        {obj.level === 'COMPANY' ? 'Empresa' : obj.level === 'SECTOR' ? 'Setor' : 'Individual'}
                                                    </Badge>
                                                    {obj.level === 'SECTOR' && (
                                                        <span className="text-xs font-semibold text-muted-foreground">• {obj.sector?.name}</span>
                                                    )}
                                                    {obj.level === 'INDIVIDUAL' && (
                                                        <span className="text-xs font-semibold text-muted-foreground">• {obj.user?.name}</span>
                                                    )}
                                                </div>
                                                <CardTitle className="text-lg group-hover:text-primary transition-colors">{obj.title}</CardTitle>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-2xl font-bold text-primary">{obj.progress}%</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Progresso</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-6">
                                        <Progress value={obj.progress} className="h-2" />

                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <TrendingUp className="w-3 h-3" />
                                                Key Results
                                            </h4>
                                            <div className="grid gap-3">
                                                {obj.keyResults.map((kr) => (
                                                    <div key={kr.id} className="p-3 bg-secondary/20 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-medium">{kr.title}</span>
                                                            <span className="text-xs font-bold bg-background px-2 py-1 rounded-md border border-border">
                                                                {kr.currentValue} / {kr.targetValue} {kr.unit}
                                                            </span>
                                                        </div>
                                                        <Progress value={(kr.currentValue / kr.targetValue) * 100} className="h-1 bg-muted" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-border/30">
                                            <div className="flex -space-x-2">
                                                {/* Avatar placeholders ou integrantes do objetivo */}
                                                <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold">
                                                    PD
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-xs">
                                                Ver Detalhes <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </AnimatedDiv>
                        ))}

                        {filteredObjectives.length === 0 && !loading && (
                            <div className="col-span-full py-20 text-center bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                                <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <h3 className="text-xl font-bold text-muted-foreground">Nenhum objetivo encontrado</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                    Comece criando um objetivo estratégico para sua empresa ou setor no ciclo atual.
                                </p>
                                <Button variant="outline" className="mt-6">
                                    Criar Primeiro OKR
                                </Button>
                            </div>
                        )}
                    </AnimatedDiv>
                </TabsContent>
            </Tabs>
        </div>
    );
}
