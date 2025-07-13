'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from 'next-themes';

interface DataPoint {
  time: string;
  value: number;
  timestamp: number;
}

interface MetricChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
  color?: string;
  type?: 'line' | 'area';
  height?: number;
  showGrid?: boolean;
  domain?: [number, number] | ['dataMin', 'dataMax'];
}

export function MetricChart({
  title,
  data,
  unit = '',
  color = '#3b82f6',
  type = 'line',
  height = 300,
  showGrid = true,
  domain = ['dataMin', 'dataMax']
}: MetricChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Chart styling based on theme
  const chartColors = {
    text: isDark ? '#9ca3af' : '#6b7280',
    grid: isDark ? '#374151' : '#e5e7eb',
    background: isDark ? '#1f2937' : '#f9fafb'
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].value.toFixed(2)}{unit}
          </p>
        </div>
      );
    }
    return null;
  };

  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'area' ? Area : Line;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />
            )}
            <XAxis
              dataKey="time"
              stroke={chartColors.text}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={chartColors.text}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={domain}
              tickFormatter={(value) => `${value}${unit}`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: chartColors.grid }}
            />
            <DataComponent
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={type === 'area' ? color : undefined}
              fillOpacity={type === 'area' ? 0.2 : undefined}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}