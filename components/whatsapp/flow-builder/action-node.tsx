'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Settings, MoreVertical, Tag, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const ActionNode = memo((props: NodeProps) => {
    const data = props.data as { actionType?: string; tag?: string; step?: string };
    const selected = props.selected;
    return (
        <div className="relative">
            <Card className={`w-64 border-white/10 bg-[#1a1a2e]/80 backdrop-blur-xl overflow-visible transition-all ${selected ? 'ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : ''}`}>
                <div className="p-3 bg-emerald-500/20 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <Settings className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Ação do Sistema</span>
                    </div>
                    <MoreVertical className="w-4 h-4 text-white/40" />
                </div>

                <div className="p-4">
                    <div className="text-[11px] text-white/40 mb-2 uppercase font-semibold">Tarefa Automática</div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="flex items-center gap-3">
                            {data.actionType === 'add_tag' ? <Tag className="w-4 h-4 text-emerald-500" /> : <UserPlus className="w-4 h-4 text-emerald-500" />}
                            <span className="text-sm text-white/80 font-medium">
                                {data.actionType === 'add_tag' ? 'Adicionar Tag: ' + (data.tag || 'Interessado') : 'Alterar Etapa: ' + (data.step || 'Apresentação')}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Handle de Entrada - TOPO */}
            <Handle
                type="target"
                position={Position.Top}
                id="input"
                style={{
                    width: 16,
                    height: 16,
                    background: '#10b981',
                    border: '3px solid #0a0a0f',
                    top: -8,
                    cursor: 'crosshair',
                }}
            />

            {/* Handle de Saída - BASE */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="output"
                style={{
                    width: 16,
                    height: 16,
                    background: '#10b981',
                    border: '3px solid #0a0a0f',
                    bottom: -8,
                    cursor: 'crosshair',
                }}
            />
        </div>
    );
});

ActionNode.displayName = 'ActionNode';
