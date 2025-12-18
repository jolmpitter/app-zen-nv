import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { MessageSquare, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const MessageNode = memo(({ data, selected }: NodeProps) => {
    return (
        <Card className={`w-64 border-white/10 bg-[#1a1a2e]/80 backdrop-blur-xl overflow-hidden transition-all ${selected ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(168,85,247,0.3)]' : ''}`}>
            <div className="p-3 bg-primary/20 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                        <MessageSquare className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Enviar Mensagem</span>
                </div>
                <MoreVertical className="w-4 h-4 text-white/40" />
            </div>

            <div className="p-4">
                <div className="text-[11px] text-white/40 mb-2 uppercase font-semibold">Conteúdo da Mensagem</div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 min-h-[60px]">
                    <p className="text-sm text-white/80 line-clamp-3 italic">
                        {data.label || 'Digite a mensagem de boas-vindas...'}
                    </p>
                </div>
            </div>

            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 bg-primary border-2 border-[#0a0a0f] !-top-1.5"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3 bg-primary border-2 border-[#0a0a0f] !-bottom-1.5"
            />
        </Card>
    );
});

MessageNode.displayName = 'MessageNode';
