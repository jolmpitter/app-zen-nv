'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown } from 'lucide-react';

interface ConversionFunnelProps {
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
}

export function ConversionFunnel({
  impressions,
  clicks,
  leads,
  conversions,
}: ConversionFunnelProps) {
  // Calcular taxas de conversão entre etapas
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const leadRate = clicks > 0 ? (leads / clicks) * 100 : 0;
  const conversionRate = leads > 0 ? (conversions / leads) * 100 : 0;

  const stages = [
    {
      name: 'Impressões',
      value: impressions,
      color: 'from-blue-500 to-blue-600',
      width: 100,
      rate: null,
    },
    {
      name: 'Cliques',
      value: clicks,
      color: 'from-green-500 to-green-600',
      width: impressions > 0 ? (clicks / impressions) * 100 : 0,
      rate: ctr,
      rateLabel: 'CTR',
    },
    {
      name: 'Leads',
      value: leads,
      color: 'from-yellow-500 to-yellow-600',
      width: impressions > 0 ? (leads / impressions) * 100 : 0,
      rate: leadRate,
      rateLabel: 'Taxa de Lead',
    },
    {
      name: 'Conversões',
      value: conversions,
      color: 'from-pink-500 to-pink-600',
      width: impressions > 0 ? (conversions / impressions) * 100 : 0,
      rate: conversionRate,
      rateLabel: 'Taxa de Conversão',
    },
  ];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-12 rounded-lg bg-gradient-to-r ${stage.color} flex items-center justify-center px-6 shadow-md transition-all duration-300 hover:shadow-lg`}
                    style={{
                      width: `${Math.max(stage.width, 15)}%`,
                      minWidth: '150px',
                    }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {stage.name}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">
                      {stage.value?.toLocaleString('pt-BR')}
                    </span>
                    {stage.rate !== null && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stage.rateLabel}: {stage.rate?.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {index < stages.length - 1 && (
                <div className="flex items-center justify-center">
                  <ArrowDown className="w-5 h-5 text-gray-400 animate-bounce" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resumo do Funil */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">CTR Geral</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {ctr?.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Taxa de Lead</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {leadRate?.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Taxa de Conversão</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {conversionRate?.toFixed(2)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Conversão Total</p>
              <p className="text-lg font-bold text-pink-600 dark:text-pink-400">
                {impressions > 0 ? ((conversions / impressions) * 100).toFixed(2) : 0}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
