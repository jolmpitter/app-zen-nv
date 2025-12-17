'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimeSeriesChartProps {
  data: Array<{
    date: string;
    spend: number;
    conversions: number;
    leads: number;
    purchases: number;
  }>;
  title: string;
  showSpend?: boolean;
  showConversions?: boolean;
  showLeads?: boolean;
  showPurchases?: boolean;
}

export function TimeSeriesChart({
  data,
  title,
  showSpend = true,
  showConversions = true,
  showLeads = false,
  showPurchases = false,
}: TimeSeriesChartProps) {
  // Formatar data para exibição (DD/MM)
  const formattedData = data?.map((item) => ({
    ...item,
    dateFormatted: new Date(item.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
  })) || [];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold mb-2">
            {new Date(payload[0]?.payload?.date).toLocaleDateString('pt-BR')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}:{' '}
              {entry.dataKey === 'spend'
                ? `R$ ${entry.value?.toFixed(2)}`
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="dateFormatted"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            {(showConversions || showLeads || showPurchases) && (
              <YAxis
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />

            {showSpend && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spend"
                stroke="#10b981"
                strokeWidth={2}
                name="Gasto (R$)"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}

            {showConversions && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="conversions"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Conversões"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}

            {showLeads && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="leads"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Leads"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}

            {showPurchases && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="purchases"
                stroke="#ec4899"
                strokeWidth={2}
                name="Compras"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
