'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface MarketingData {
  date: string;
  cpa: number;
  cpl: number;
  cpc: number;
  roas: number;
}

interface Props {
  data: MarketingData[];
}

export function MarketingEvolutionChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          Evolução de CPA, CPL, CPC e ROAS
        </CardTitle>
        <CardDescription>Tendências diárias, semanais e mensais de métricas-chave</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: 12
              }}
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value: any, name: string) => {
                if (name === 'ROAS') return [`${Number(value).toFixed(2)}x`, name];
                return [`R$ ${Number(value).toFixed(2)}`, name];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="cpa"
              stroke="#EF4444"
              strokeWidth={2.5}
              name="CPA (Custo por Aquisição)"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
            <Line
              type="monotone"
              dataKey="cpl"
              stroke="#F59E0B"
              strokeWidth={2.5}
              name="CPL (Custo por Lead)"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
            <Line
              type="monotone"
              dataKey="cpc"
              stroke="#3B82F6"
              strokeWidth={2.5}
              name="CPC (Custo por Clique)"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
            <Line
              type="monotone"
              dataKey="roas"
              stroke="#10B981"
              strokeWidth={3}
              name="ROAS (Retorno sobre Gasto)"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              animationDuration={800}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
