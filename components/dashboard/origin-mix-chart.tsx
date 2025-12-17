'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layers } from 'lucide-react';

interface OriginData {
  month: string;
  facebook: number;
  google: number;
  tiktok: number;
  organico: number;
}

interface Props {
  data: OriginData[];
}

export function OriginMixChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-500" />
          Mix de Resultados por Origem
        </CardTitle>
        <CardDescription>Canais: Facebook, Google, TikTok, Orgânico</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="month"
              stroke="#9CA3AF"
              tick={{ fontSize: 11 }}
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
              formatter={(value: any) => `R$ ${Number(value).toFixed(2)}`}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="facebook" stackId="a" fill="#3B82F6" name="Facebook" animationDuration={800} animationEasing="ease-in-out" />
            <Bar dataKey="google" stackId="a" fill="#10B981" name="Google" animationDuration={800} animationEasing="ease-in-out" />
            <Bar dataKey="tiktok" stackId="a" fill="#EC4899" name="TikTok" animationDuration={800} animationEasing="ease-in-out" />
            <Bar dataKey="organico" stackId="a" fill="#F59E0B" name="Orgânico" animationDuration={800} animationEasing="ease-in-out" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
