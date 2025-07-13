import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Edit2 } from 'lucide-react';

interface DiffViewerProps {
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  diff?: Record<string, any>;
  className?: string;
  maxHeight?: string;
}

export function DiffViewer({ 
  oldValues, 
  newValues, 
  diff,
  className,
  maxHeight = '300px'
}: DiffViewerProps) {
  // Calculate diff if not provided
  const changes = React.useMemo(() => {
    if (diff) return diff;
    
    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {})
    ]);
    
    const calculated: Record<string, { type: 'added' | 'removed' | 'modified'; old?: any; new?: any }> = {};
    
    allKeys.forEach(key => {
      const oldVal = oldValues?.[key];
      const newVal = newValues?.[key];
      
      if (oldVal === undefined && newVal !== undefined) {
        calculated[key] = { type: 'added', new: newVal };
      } else if (oldVal !== undefined && newVal === undefined) {
        calculated[key] = { type: 'removed', old: oldVal };
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        calculated[key] = { type: 'modified', old: oldVal, new: newVal };
      }
    });
    
    return calculated;
  }, [oldValues, newValues, diff]);

  const changeCount = Object.keys(changes).length;

  if (changeCount === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No changes detected
      </div>
    );
  }

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Changes</h4>
        <Badge variant="secondary" className="text-xs">
          {changeCount} field{changeCount !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      <ScrollArea style={{ maxHeight }} className="rounded-md border">
        <div className="p-4 space-y-3">
          {Object.entries(changes).map(([key, change]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{key}</span>
                {change.type === 'added' && (
                  <Badge variant="default" className="h-5 gap-1">
                    <Plus className="h-3 w-3" />
                    Added
                  </Badge>
                )}
                {change.type === 'removed' && (
                  <Badge variant="destructive" className="h-5 gap-1">
                    <Minus className="h-3 w-3" />
                    Removed
                  </Badge>
                )}
                {change.type === 'modified' && (
                  <Badge variant="secondary" className="h-5 gap-1">
                    <Edit2 className="h-3 w-3" />
                    Modified
                  </Badge>
                )}
              </div>
              
              <div className="ml-2 space-y-1">
                {(change.type === 'removed' || change.type === 'modified') && (
                  <div className="flex gap-2">
                    <span className="text-xs text-muted-foreground">Old:</span>
                    <code className="text-xs bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 px-1 rounded line-through">
                      {formatValue(change.old)}
                    </code>
                  </div>
                )}
                
                {(change.type === 'added' || change.type === 'modified') && (
                  <div className="flex gap-2">
                    <span className="text-xs text-muted-foreground">New:</span>
                    <code className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-1 rounded">
                      {formatValue(change.new)}
                    </code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Side-by-side diff viewer for larger diffs
export function SideBySideDiffViewer({
  oldValues,
  newValues,
  className
}: DiffViewerProps) {
  const allKeys = React.useMemo(() => {
    return Array.from(new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {})
    ])).sort();
  }, [oldValues, newValues]);

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return '-';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <div className={cn('overflow-hidden rounded-md border', className)}>
      <div className="grid grid-cols-2 divide-x">
        <div className="p-2 bg-red-50 dark:bg-red-950">
          <h5 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
            Previous
          </h5>
        </div>
        <div className="p-2 bg-green-50 dark:bg-green-950">
          <h5 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
            Current
          </h5>
        </div>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="divide-y">
          {allKeys.map(key => {
            const oldVal = oldValues?.[key];
            const newVal = newValues?.[key];
            const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);
            
            return (
              <div key={key} className="grid grid-cols-2 divide-x">
                <div className={cn(
                  'p-2 text-xs font-mono',
                  hasChanged && oldVal !== undefined && 'bg-red-50 dark:bg-red-950'
                )}>
                  <div className="font-sans font-medium text-muted-foreground mb-1">
                    {key}
                  </div>
                  <div className={cn(
                    hasChanged && oldVal !== undefined && 'text-red-700 dark:text-red-300'
                  )}>
                    {formatValue(oldVal)}
                  </div>
                </div>
                
                <div className={cn(
                  'p-2 text-xs font-mono',
                  hasChanged && newVal !== undefined && 'bg-green-50 dark:bg-green-950'
                )}>
                  <div className="font-sans font-medium text-muted-foreground mb-1">
                    {key}
                  </div>
                  <div className={cn(
                    hasChanged && newVal !== undefined && 'text-green-700 dark:text-green-300'
                  )}>
                    {formatValue(newVal)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}