'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface CampaignData {
  name: string;
  gasto: number;
  leads: number;
  cpa: number;
  roas: number;
}

interface Props {
  data: CampaignData[];
}

export function CampaignsComparisonChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Comparação entre Campanhas
        </CardTitle>
        <CardDescription>Desempenho de campanhas e criativos: gasto, leads, CPA e ROAS</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
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
                if (name === 'Gasto' || name === 'CPA') return [`R$ ${Number(value).toFixed(2)}`, name];
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="gasto" fill="#EF4444" name="Gasto" radius={[8, 8, 0, 0]} animationDuration={800} animationEasing="ease-in-out" />
            <Bar dataKey="leads" fill="#10B981" name="Leads" radius={[8, 8, 0, 0]} animationDuration={800} animationEasing="ease-in-out" />
            <Bar dataKey="cpa" fill="#F59E0B" name="CPA" radius={[8, 8, 0, 0]} animationDuration={800} animationEasing="ease-in-out" />
            <Bar dataKey="roas" fill="#8B5CF6" name="ROAS" radius={[8, 8, 0, 0]} animationDuration={800} animationEasing="ease-in-out" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
