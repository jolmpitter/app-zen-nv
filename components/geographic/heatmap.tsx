'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, DollarSign } from 'lucide-react';

interface GeographicData {
  estado: string;
  cidade?: string;
  totalLeads: number;
  totalVendas: number;
  valorTotal: number;
  taxaConversao: number;
}

interface GeographicHeatmapProps {
  data: GeographicData[];
  groupBy: 'estado' | 'cidade';
  title?: string;
}

// Cores para o heatmap (gradiente de verde)
const getColorByIntensity = (value: number, maxValue: number): string => {
  const intensity = maxValue > 0 ? value / maxValue : 0;
  
  if (intensity >= 0.8) return '#166534'; // Verde escuro
  if (intensity >= 0.6) return '#16a34a'; // Verde médio
  if (intensity >= 0.4) return '#22c55e'; // Verde claro
  if (intensity >= 0.2) return '#86efac'; // Verde muito claro
  return '#d1fae5'; // Verde palidíssimo
};

// Mapeamento de siglas de estados para nomes completos
const estadosMap: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

export function GeographicHeatmap({ data, groupBy, title }: GeographicHeatmapProps) {
  // Preparar dados para o gráfico
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: groupBy === 'cidade' && item.cidade ? item.cidade : estadosMap[item.estado] || item.estado,
      sigla: item.estado,
      leads: item.totalLeads,
      vendas: item.totalVendas,
      valor: item.valorTotal,
      conversao: item.taxaConversao,
    }));
  }, [data, groupBy]);

  const maxLeads = Math.max(...data.map((d) => d.totalLeads), 1);
  const maxVendas = Math.max(...data.map((d) => d.totalVendas), 1);
  const maxValor = Math.max(...data.map((d) => d.valorTotal), 1);

  // Top 3 regiões
  const top3 = data.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Cards de Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top3.map((region, index) => {
          const displayName = groupBy === 'cidade' && region.cidade
            ? region.cidade
            : estadosMap[region.estado] || region.estado;

          return (
            <Card key={`${region.estado}-${region.cidade || ''}`} className="relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Badge
                  variant="secondary"
                  className={
                    index === 0
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : index === 1
                      ? 'bg-gray-400 hover:bg-gray-500'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }
                >
                  {index + 1}º
                </Badge>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {displayName}
                </CardTitle>
                <CardDescription className="text-xs">{region.estado}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Leads</span>
                  <span className="font-bold">{region.totalLeads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Vendas</span>
                  <span className="font-bold text-green-600">{region.totalVendas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor Total</span>
                  <span className="font-bold text-blue-600">
                    R$ {region.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Conversão</span>
                  <Badge variant="outline">{region.taxaConversao.toFixed(1)}%</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráfico de Barras - Leads por Região */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {title || `Leads por ${groupBy === 'cidade' ? 'Cidade' : 'Estado'}`}
          </CardTitle>
          <CardDescription>
            Distribuição geográfica de leads e vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                style={{ fontSize: '12px' }}
              />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                        <p className="font-semibold">{data.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{data.sigla}</p>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-blue-600">Leads:</span> {data.leads}
                          </p>
                          <p>
                            <span className="text-green-600">Vendas:</span> {data.vendas}
                          </p>
                          <p>
                            <span className="text-purple-600">Conversão:</span> {data.conversao.toFixed(1)}%
                          </p>
                          <p>
                            <span className="text-orange-600">Valor:</span> R${' '}
                            {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="leads" name="Leads" fill="#3b82f6">
                {chartData.slice(0, 10).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColorByIntensity(entry.leads, maxLeads)}
                  />
                ))}
              </Bar>
              <Bar dataKey="vendas" name="Vendas" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Valor por Região */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Valor de Vendas por {groupBy === 'cidade' ? 'Cidade' : 'Estado'}
          </CardTitle>
          <CardDescription>
            Valor total de vendas por região
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={(value) =>
                  `R$ ${(value / 1000).toFixed(0)}k`
                }
              />
              <Tooltip
                formatter={(value: any) =>
                  `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
                labelFormatter={(label) => `Região: ${label}`}
              />
              <Legend />
              <Bar dataKey="valor" name="Valor Total (R$)" fill="#f59e0b">
                {chartData.slice(0, 10).map((entry, index) => (
                  <Cell
                    key={`cell-valor-${index}`}
                    fill={getColorByIntensity(entry.valor, maxValor)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Completa */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Regiões</CardTitle>
          <CardDescription>
            Lista completa com todas as métricas por região
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">{groupBy === 'cidade' ? 'Cidade' : 'Estado'}</th>
                  <th className="text-right p-2">Leads</th>
                  <th className="text-right p-2">Vendas</th>
                  <th className="text-right p-2">Valor Total</th>
                  <th className="text-right p-2">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {data.map((region, index) => {
                  const displayName = groupBy === 'cidade' && region.cidade
                    ? `${region.cidade} - ${region.estado}`
                    : estadosMap[region.estado] || region.estado;

                  return (
                    <tr key={`${region.estado}-${region.cidade || ''}`} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-muted-foreground">{index + 1}</td>
                      <td className="p-2 font-medium">{displayName}</td>
                      <td className="p-2 text-right">{region.totalLeads}</td>
                      <td className="p-2 text-right text-green-600 font-semibold">
                        {region.totalVendas}
                      </td>
                      <td className="p-2 text-right">
                        R$ {region.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right">
                        <Badge
                          variant={region.taxaConversao >= 20 ? 'default' : 'secondary'}
                          className={
                            region.taxaConversao >= 20
                              ? 'bg-green-500 hover:bg-green-600'
                              : region.taxaConversao >= 10
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : 'bg-red-500 hover:bg-red-600'
                          }
                        >
                          {region.taxaConversao.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
