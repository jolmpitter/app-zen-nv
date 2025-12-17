'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high';
  metric: string;
  message: string;
  recommendation: string;
  currentValue: number;
  threshold: number;
}

interface AlertCardProps {
  alert: Alert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'secondary';
    }
  };

  const getIcon = () => {
    switch (alert.severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            {getIcon()}
            <div>
              <CardTitle className="text-base">{alert.metric}</CardTitle>
              <CardDescription className="text-sm mt-1">{alert.message}</CardDescription>
            </div>
          </div>
          <Badge variant={getSeverityColor() as any}>
            {alert.severity === 'high' ? 'Alta' : alert.severity === 'medium' ? 'Média' : 'Baixa'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Valor atual:</span>{' '}
            <span className="text-muted-foreground">{alert.currentValue.toLocaleString('pt-BR')}</span>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">💡 Recomendação:</span> {alert.recommendation}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
