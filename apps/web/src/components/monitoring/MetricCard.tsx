'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  status: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  unit,
  trend,
  status,
  icon: Icon,
  className,
  onClick
}: MetricCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend < 0) return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
    return null;
  };

  const isNegativeMetric = (metricTitle: string) => {
    return ['Error Rate', 'Email Queue', 'Queue Length'].some(neg => 
      metricTitle.includes(neg)
    );
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all duration-200",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${getStatusColor(status)}`} />
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-baseline gap-2">
          <div className="text-xl font-bold">
            {typeof value === 'number' ? 
              (value < 10 ? value.toFixed(1) : value.toLocaleString()) 
              : value}
          </div>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {getTrendIcon(trend)}
            <span className={cn(
              "text-xs font-medium",
              trend > 0 
                ? (isNegativeMetric(title) ? 'text-red-600' : 'text-green-600')
                : (isNegativeMetric(title) ? 'text-green-600' : 'text-red-600')
            )}>
              {trend === 0 ? 'stable' : `${trend > 0 ? '+' : ''}${trend}%`}
            </span>
            <span className="text-xs text-muted-foreground">vs 1h ago</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}