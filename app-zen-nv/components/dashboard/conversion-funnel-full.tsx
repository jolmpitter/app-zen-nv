'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, TrendingDown } from 'lucide-react';

interface FunnelStage {
  name: string;
  value: number;
  color: string;
}

interface Props {
  impressoes: number;
  cliques: number;
  leads: number;
  conversas: number;
  compras: number;
  vendas: number;
  ltv: number;
}

export function ConversionFunnelFull({
  impressoes,
  cliques,
  leads,
  conversas,
  compras,
  vendas,
  ltv
}: Props) {
  const stages: FunnelStage[] = [
    { name: 'Impressões', value: impressoes, color: 'from-blue-500 to-blue-600' },
    { name: 'Cliques', value: cliques, color: 'from-cyan-500 to-cyan-600' },
    { name: 'Leads', value: leads, color: 'from-green-500 to-green-600' },
    { name: 'Conversas', value: conversas, color: 'from-yellow-500 to-yellow-600' },
    { name: 'Compras', value: compras, color: 'from-orange-500 to-orange-600' },
    { name: 'Vendas', value: vendas, color: 'from-red-500 to-red-600' },
    { name: 'LTV', value: ltv, color: 'from-purple-500 to-purple-600' },
  ];

  const maxValue = impressoes || 1;

  const calculateConversionRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current / previous) * 100).toFixed(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-500" />
          Funil de Conversão Completo
        </CardTitle>
        <CardDescription>Jornada do cliente: Impressões → LTV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage, index) => {
          const widthPercentage = (stage.value / maxValue) * 100;
          const conversionRate = index > 0 ? calculateConversionRate(stage.value, stages[index - 1].value) : 100;

          return (
            <div key={stage.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-200">{stage.name}</span>
                  {index > 0 && (
                    <span className="text-xs text-gray-400">
                      {conversionRate}% de conversão
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-white">
                  {stage.name === 'LTV' ? `R$ ${stage.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : stage.value.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="relative h-12 bg-gray-800 rounded-lg overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${stage.color} flex items-center justify-start px-4 transition-all duration-500`}
                  style={{ width: `${widthPercentage}%`, minWidth: '60px' }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-lg">
                    {Math.round(widthPercentage)}%
                  </span>
                </div>
              </div>
              {index < stages.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowDown className="w-4 h-4 text-gray-500 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}

        {/* Resumo de Conversão */}
        <div className="mt-6 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
          <h4 className="text-sm font-semibold text-gray-200 mb-3">Resumo de Conversão</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400">CTR</p>
              <p className="text-lg font-bold text-cyan-400">
                {calculateConversionRate(cliques, impressoes)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Taxa de Lead</p>
              <p className="text-lg font-bold text-green-400">
                {calculateConversionRate(leads, cliques)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Taxa de Venda</p>
              <p className="text-lg font-bold text-red-400">
                {calculateConversionRate(vendas, leads)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
