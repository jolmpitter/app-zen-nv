'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface HeatmapCell {
  day: string;
  hour: number;
  value: number;
  metric: string;
}

interface Props {
  data: HeatmapCell[];
  metric: 'roi' | 'vendas' | 'cliques' | 'cpm';
}

const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const hours = Array.from({ length: 24 }, (_, i) => i);

export function PerformanceHeatmap({ data, metric }: Props) {
  const getColor = (value: number) => {
    const max = Math.max(...data.map(d => d.value));
    const min = Math.min(...data.map(d => d.value));
    const intensity = (value - min) / (max - min || 1);
    
    if (intensity > 0.75) return 'bg-green-500';
    if (intensity > 0.5) return 'bg-yellow-500';
    if (intensity > 0.25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCellValue = (day: string, hour: number) => {
    const cell = data.find(d => d.day === day && d.hour === hour);
    return cell?.value || 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          Heatmap - Horários e Dias com Melhor Performance
        </CardTitle>
        <CardDescription>Métrica: {metric.toUpperCase()} - Identifique os melhores momentos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header de Horas */}
            <div className="flex gap-1 mb-2 ml-20">
              {hours.filter(h => h % 3 === 0).map(hour => (
                <div key={hour} className="flex-1 text-center text-xs text-gray-400">
                  {hour}h
                </div>
              ))}
            </div>
            
            {/* Linhas do Heatmap */}
            {days.map(day => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <div className="w-16 text-xs text-gray-300 font-semibold truncate">{day}</div>
                <div className="flex gap-1 flex-1">
                  {hours.map(hour => {
                    const value = getCellValue(day, hour);
                    return (
                      <div
                        key={hour}
                        className={`flex-1 h-6 rounded ${getColor(value)} hover:scale-110 transition-transform cursor-pointer relative group`}
                        title={`${day} ${hour}:00 - ${value.toFixed(2)}`}
                      >
                        <span className="absolute hidden group-hover:block bg-gray-900 text-white text-xs p-1 rounded -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10">
                          {day} {hour}:00<br />{value.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legenda */}
            <div className="flex items-center gap-4 mt-4 justify-center">
              <span className="text-xs text-gray-400">Baixa</span>
              <div className="flex gap-1">
                <div className="w-8 h-4 bg-red-500 rounded" />
                <div className="w-8 h-4 bg-orange-500 rounded" />
                <div className="w-8 h-4 bg-yellow-500 rounded" />
                <div className="w-8 h-4 bg-green-500 rounded" />
              </div>
              <span className="text-xs text-gray-400">Alta</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
