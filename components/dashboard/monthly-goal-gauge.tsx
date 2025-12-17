'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Props {
  metaMensal: number;
  valorAtingido: number;
  metaDiaria: number;
  valorDiario: number;
  ticketMedio: number;
  roasAtual: number;
}

export function MonthlyGoalGauge({
  metaMensal,
  valorAtingido,
  metaDiaria,
  valorDiario,
  ticketMedio,
  roasAtual
}: Props) {
  const percentualMensal = (valorAtingido / metaMensal) * 100;
  const percentualDiario = (valorDiario / metaDiaria) * 100;

  const getStatusColor = (percentual: number) => {
    if (percentual >= 100) return 'text-green-500';
    if (percentual >= 75) return 'text-blue-500';
    if (percentual >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-green-500" />
          Metas e KPIs
        </CardTitle>
        <CardDescription>Acompanhamento de metas mensais e diárias</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Meta Mensal */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-200">Meta Mensal</span>
            <span className={`text-2xl font-bold ${getStatusColor(percentualMensal)}`}>
              {percentualMensal.toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.min(percentualMensal, 100)} className="h-3" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>R$ {valorAtingido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span>Meta: R$ {metaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Meta Diária */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-200">Meta Diária</span>
            <span className={`text-2xl font-bold ${getStatusColor(percentualDiario)}`}>
              {percentualDiario.toFixed(1)}%
            </span>
          </div>
          <Progress value={Math.min(percentualDiario, 100)} className="h-3" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>R$ {valorDiario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span>Meta: R$ {metaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* KPIs Adicionais */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-300">Ticket Médio</span>
            </div>
            <p className="text-xl font-bold text-blue-400">
              R$ {ticketMedio.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-gray-300">ROAS Atual</span>
            </div>
            <p className="text-xl font-bold text-green-400">
              {roasAtual.toFixed(2)}x
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
