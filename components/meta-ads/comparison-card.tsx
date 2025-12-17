'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface ComparisonCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  change: number;
  format?: 'currency' | 'number' | 'percentage';
  inverted?: boolean; // Se true, valores menores são melhores (ex: CPC)
}

export function ComparisonCard({
  title,
  currentValue,
  previousValue,
  change,
  format = 'number',
  inverted = false
}: ComparisonCardProps) {
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(2)}%`;
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  const isPositive = inverted ? change < 0 : change > 0;
  const isNeutral = change === 0;

  const getChangeColor = () => {
    if (isNeutral) return 'text-gray-500';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const getIcon = () => {
    if (isNeutral) return <Minus className="w-4 h-4" />;
    return isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{formatValue(currentValue)}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Anterior: {formatValue(previousValue)}</span>
          </div>
          <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor()}`}>
            {getIcon()}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
