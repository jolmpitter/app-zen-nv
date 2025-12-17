'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Recommendation {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  impact: string;
  icon: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'secondary';
    }
  };

  const getPriorityLabel = () => {
    switch (recommendation.priority) {
      case 'critical':
        return 'Crítica';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{recommendation.icon}</div>
            <div>
              <CardTitle className="text-lg">{recommendation.title}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {recommendation.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant={getPriorityColor() as any}>{getPriorityLabel()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">🎯 Ação</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{recommendation.action}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">📈 Impacto Esperado</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">{recommendation.impact}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{recommendation.category}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
