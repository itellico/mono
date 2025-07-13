'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  TooltipProps
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface DataPoint {
  timestamp: string;
  value: number;
  [key: string]: any;
}

interface PerformanceChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
  type?: 'line' | 'area';
  yAxisDomain?: [number | 'auto', number | 'auto'];
  formatValue?: (value: number) => string;
  showGrid?: boolean;
  height?: number;
  className?: string;
}

const CustomTooltip = ({ active, payload, label, unit, formatValue }: TooltipProps<number, string> & { unit?: string; formatValue?: (value: number) => string }) => {
  const { theme } = useTheme();
  
  if (active && payload && payload.length) {
    const value = payload[0].value as number;
    const displayValue = formatValue ? formatValue(value) : value.toFixed(1);
    
    return (
      <div className={cn(
        "rounded-lg border p-2 shadow-lg",
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      )}>
        <p className="text-xs font-medium">
          {format(new Date(label), 'HH:mm:ss')}
        </p>
        <p className="text-sm font-bold">
          {displayValue}{unit ? ` ${unit}` : ''}
        </p>
      </div>
    );
  }
  return null;
};

export function PerformanceChart({
  title,
  data,
  unit,
  color = '#3b82f6',
  icon: Icon,
  type = 'line',
  yAxisDomain = ['auto', 'auto'],
  formatValue,
  showGrid = true,
  height = 200,
  className
}: PerformanceChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const gridColor = isDark ? '#374151' : '#e5e7eb';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  
  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'area' ? Area : Line;
  
  const formatXAxis = (tickItem: string) => {
    return format(new Date(tickItem), 'HH:mm');
  };
  
  const formatYAxis = (value: number) => {
    if (formatValue) return formatValue(value);
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toFixed(0);
  };
  
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {title}
        </CardTitle>
        {data.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Last {data.length} data points
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
            )}
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 11, fill: textColor }}
              stroke={gridColor}
            />
            <YAxis 
              domain={yAxisDomain}
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: textColor }}
              stroke={gridColor}
              width={50}
            />
            <Tooltip 
              content={<CustomTooltip unit={unit} formatValue={formatValue} />}
            />
            <DataComponent
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={type === 'area' ? color : undefined}
              fillOpacity={type === 'area' ? 0.1 : undefined}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}