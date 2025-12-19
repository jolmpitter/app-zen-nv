'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play, MoreVertical, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const TriggerNode = memo((props: NodeProps) => {
    const data = props.data as { triggerType?: string; keyword?: string };
    const selected = props.selected;
    return (
        <div className="relative">
            <Card className={`w-64 border-white/10 bg-[#1a1a2e]/80 backdrop-blur-xl overflow-visible transition-all ${selected ? 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : ''}`}>
                <div className="p-3 bg-amber-500/20 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <Zap className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Início do Fluxo</span>
                    </div>
                    <MoreVertical className="w-4 h-4 text-white/40" />
                </div>

                <div className="p-4">
                    <div className="text-[11px] text-white/40 mb-2 uppercase font-semibold">Gatilho Selecionado</div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="flex items-center gap-3">
                            <Play className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-white/80 font-medium">
                                {data.triggerType === 'keyword' ? 'Palavra-chave: ' + (data.keyword || 'oi') : 'Novo Lead Criado'}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Handle de Saída - GRANDE E VISÍVEL */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="output"
                style={{
                    width: 16,
                    height: 16,
                    background: '#f59e0b',
                    border: '3px solid #0a0a0f',
                    bottom: -8,
                    cursor: 'crosshair',
                }}
            />
        </div>
    );
});

TriggerNode.displayName = 'TriggerNode';
