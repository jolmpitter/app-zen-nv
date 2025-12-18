import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Split, MoreVertical, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
    return (
        <Card className={`w-64 border-white/10 bg-[#1a1a2e]/80 backdrop-blur-xl overflow-hidden transition-all ${selected ? 'ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : ''}`}>
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
                    <div className="text-green-500">Sim (Verdadeiro)</div>
                    <div className="text-red-500">Não (Falso)</div>
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-blue-500 border-2 border-[#0a0a0f] !-top-1.5"
            />

            {/* Saída para Verdadeiro (Esquerda) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="true"
                style={{ left: '25%' }}
                className="w-3 h-3 bg-green-500 border-2 border-[#0a0a0f] !-bottom-1.5"
            />

            {/* Saída para Falso (Direita) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="false"
                style={{ left: '75%' }}
                className="w-3 h-3 bg-red-500 border-2 border-[#0a0a0f] !-bottom-1.5"
            />
        </Card>
    );
});

ConditionNode.displayName = 'ConditionNode';
