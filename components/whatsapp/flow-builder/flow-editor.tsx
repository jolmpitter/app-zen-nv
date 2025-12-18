'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    ReactFlow,
    addEdge,
    Background,
    Controls,
    Connection,
    Edge,
    Node,
    ReactFlowInstance,
    useNodesState,
    useEdgesState,
    Panel,
    BackgroundVariant,
    MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from './trigger-node';
import { MessageNode } from './message-node';
import { ConditionNode } from './condition-node';
import { ActionNode } from './action-node';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Zap,
    MessageSquare,
    Split,
    Settings,
    Save,
    Play,
    Trash2,
    ChevronLeft,
    X,
    Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const nodeTypes = {
    trigger: TriggerNode,
    message: MessageNode,
    condition: ConditionNode,
    action: ActionNode,
};

const initialNodes: Node[] = [
    {
        id: 'trigger-1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { triggerType: 'keyword', keyword: 'PROMO' }
    }
];

const initialEdges: Edge[] = [];

export function FlowEditor({ id }: { id?: string }) {
    const router = useRouter();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState('Novo Fluxo de Automação');

    useEffect(() => {
        if (id && id !== 'new') {
            const fetchFlow = async () => {
                try {
                    const res = await fetch(`/api/whatsapp/flows?id=${id}`);
                    const data = await res.json();
                    if (data && data.flowContext) {
                        const context = JSON.parse(data.flowContext);
                        setNodes(context.nodes || []);
                        setEdges(context.edges || []);
                        setTitle(data.name || 'Fluxo sem nome');
                    }
                } catch (error) {
                    toast.error('Erro ao carregar o fluxo');
                }
            };
            fetchFlow();
        }
    }, [id, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } }, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowInstance) return;

            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: `${type}-${Date.now()}`,
                type,
                position,
                data: { label: `Novo ${type}` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const onSave = async () => {
        setIsSaving(true);
        try {
            const flow = reactFlowInstance?.toObject();
            if (!flow) return;

            const res = await fetch('/api/whatsapp/flows', {
                method: id && id !== 'new' ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id === 'new' ? undefined : id,
                    name: title,
                    nodes: flow.nodes,
                    edges: flow.edges
                })
            });

            if (!res.ok) throw new Error('Erro ao salvar');

            toast.success('Fluxo salvo com sucesso!');
            if (!id || id === 'new') {
                const data = await res.json();
                router.replace(`/whatsapp/flows/${data.id}`);
            }
        } catch (error) {
            toast.error('Erro ao salvar o fluxo');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0a0a0f] overflow-hidden rounded-3xl border border-white/10 relative">
            {/* Top Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0f]/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/whatsapp/flows')} className="rounded-xl hover:bg-white/5 border border-white/10 h-10 w-10">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-transparent border-none text-white font-bold focus:ring-0 p-0 text-lg placeholder:text-white/20"
                            placeholder="Nome do Fluxo..."
                        />
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Status: Editando</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="text-white/40 hover:text-white rounded-xl gap-2 font-medium">
                        <Play className="w-4 h-4" /> Simular
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-white rounded-xl gap-2 px-6 shadow-lg shadow-primary/20 font-bold"
                    >
                        <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar Fluxo'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex relative">
                {/* Left Toolbar */}
                <div className="w-72 border-r border-white/10 p-4 bg-[#0a0a0f]/80 backdrop-blur-md z-10">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Gatilhos</h3>
                            <div
                                className="group flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-amber-500/10 hover:border-amber-500/30 transition-all cursor-grab active:cursor-grabbing shadow-sm"
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('application/reactflow', 'trigger');
                                    e.dataTransfer.effectAllowed = 'move';
                                }}
                            >
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">Início/Gatilho</div>
                                    <div className="text-[10px] text-white/40 line-clamp-1">Palavra-chave ou evento</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Ações</h3>
                            <div className="space-y-3">
                                <div
                                    className="group flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-primary/10 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing shadow-sm"
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('application/reactflow', 'message');
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
                                        <MessageSquare className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Enviar Mensagem</div>
                                        <div className="text-[10px] text-white/40 line-clamp-1">Texto para o lead</div>
                                    </div>
                                </div>

                                <div
                                    className="group flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-500/10 hover:border-blue-500/30 transition-all cursor-grab active:cursor-grabbing shadow-sm"
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('application/reactflow', 'condition');
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 group-hover:scale-110 transition-transform">
                                        <Split className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Condição</div>
                                        <div className="text-[10px] text-white/40 line-clamp-1">Sim/Não based em dados</div>
                                    </div>
                                </div>

                                <div
                                    className="group flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-grab active:cursor-grabbing shadow-sm"
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('application/reactflow', 'action');
                                        e.dataTransfer.effectAllowed = 'move';
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                                        <Settings className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Configuração</div>
                                        <div className="text-[10px] text-white/40 line-clamp-1">Etiquetas ou etapas</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-[#050508] relative group">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        nodeTypes={nodeTypes}
                        fitView
                        colorMode="dark"
                    >
                        <Background color="#1a1a2e" variant={BackgroundVariant.Dots} gap={30} size={1} />
                        <Controls className="!bg-[#0a0a0f] !border-white/10 !rounded-xl overflow-hidden !m-4" />
                        <MiniMap
                            className="!bg-[#0a0a0f] !border-white/10 !rounded-xl !m-4"
                            maskColor="rgba(0,0,0,0.5)"
                            nodeColor={(node) => {
                                switch (node.type) {
                                    case 'trigger': return '#f59e0b';
                                    case 'message': return '#a855f7';
                                    case 'condition': return '#3b82f6';
                                    case 'action': return '#10b981';
                                    default: return '#333';
                                }
                            }}
                        />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}
