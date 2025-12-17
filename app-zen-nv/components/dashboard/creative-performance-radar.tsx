'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Target } from 'lucide-react';

interface CreativeData {
  criativo: string;
  ctr: number;
  cpc: number;
  cpm: number;
  conversao: number;
  roas: number;
}

interface Props {
  data: CreativeData[];
}

export function CreativePerformanceRadar({ data }: Props) {
  // Normalizar dados para escala do radar (0-100)
  const normalizeData = () => {
    if (!data || data.length === 0) return [];

    const metrics = ['ctr', 'cpc', 'cpm', 'conversao', 'roas'];
    const maxValues: Record<string, number> = {};

    metrics.forEach(metric => {
      maxValues[metric] = Math.max(...data.map(d => d[metric as keyof CreativeData] as number));
    });

    return data.map(creative => ({
      criativo: creative.criativo,
      CTR: ((creative.ctr / maxValues.ctr) * 100).toFixed(1),
      CPC: ((creative.cpc / maxValues.cpc) * 100).toFixed(1),
      CPM: ((creative.cpm / maxValues.cpm) * 100).toFixed(1),
      'Conversão': ((creative.conversao / maxValues.conversao) * 100).toFixed(1),
      ROAS: ((creative.roas / maxValues.roas) * 100).toFixed(1),
    }));
  };

  const radarData = normalizeData();

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-pink-500" />
          Performance por Criativo
        </CardTitle>
        <CardDescription>Métricas comparadas: CTR, CPC, CPM, Conversão, ROAS</CardDescription>
      </CardHeader>
      <CardContent>
        {radarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis
                dataKey="criativo"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  fontSize: 12
                }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Radar
                name="CTR"
                dataKey="CTR"
                stroke={colors[0]}
                fill={colors[0]}
                fillOpacity={0.5}
              />
              <Radar
                name="CPC"
                dataKey="CPC"
                stroke={colors[1]}
                fill={colors[1]}
                fillOpacity={0.4}
              />
              <Radar
                name="CPM"
                dataKey="CPM"
                stroke={colors[2]}
                fill={colors[2]}
                fillOpacity={0.4}
              />
              <Radar
                name="Conversão"
                dataKey="Conversão"
                stroke={colors[3]}
                fill={colors[3]}
                fillOpacity={0.4}
              />
              <Radar
                name="ROAS"
                dataKey="ROAS"
                stroke={colors[4]}
                fill={colors[4]}
                fillOpacity={0.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Nenhum dado de criativo disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
