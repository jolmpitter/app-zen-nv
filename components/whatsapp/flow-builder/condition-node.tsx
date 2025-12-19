'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Split, MoreVertical, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const ConditionNode = memo((props: NodeProps) => {
    const data = props.data as { conditionType?: string; field?: string; value?: string };
    const selected = props.selected;
    return (
        <div className="relative">
            <Card className={`w-64 border-white/10 bg-[#1a1a2e]/80 backdrop-blur-xl overflow-visible transition-all ${selected ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}`}>
                <div className="p-3 bg-blue-500/20 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <Split className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Condição / Filtro</span>
                    </div>
                    <MoreVertical className="w-4 h-4 text-white/40" />
                </div>

                <div className="p-4">
                    <div className="text-[11px] text-white/40 mb-2 uppercase font-semibold">Regra de Seleção</div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="flex items-center gap-3">
                            <HelpCircle className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-white/80 font-medium">
                                {data.conditionType === 'lead_field' ? 'Campo: ' + (data.field || 'Cidade') : 'Contém palavra-chave'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                        <div className="text-green-500">✓ Sim</div>
                        <div className="text-red-500">✗ Não</div>
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
                    background: '#3b82f6',
                    border: '3px solid #0a0a0f',
                    top: -8,
                    cursor: 'crosshair',
                }}
            />

            {/* Saída Verdadeiro (Esquerda) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                style={{
                    width: 16,
                    height: 16,
                    background: '#22c55e',
                    border: '3px solid #0a0a0f',
                    bottom: -8,
                    left: '25%',
                    cursor: 'crosshair',
                }}
            />

            {/* Saída Falso (Direita) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                style={{
                    width: 16,
                    height: 16,
                    background: '#ef4444',
                    border: '3px solid #0a0a0f',
                    bottom: -8,
                    left: '75%',
                    cursor: 'crosshair',
                }}
            />
        </div>
    );
});

ConditionNode.displayName = 'ConditionNode';
