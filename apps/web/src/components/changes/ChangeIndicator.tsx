import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, X, AlertTriangle, Loader2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ChangeIndicatorProps {
  entityType: string;
  entityId: string;
  showDetails?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface ChangeSet {
  id: string;
  level: 'OPTIMISTIC' | 'PROCESSING' | 'COMMITTED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'ROLLED_BACK' | 'CONFLICTED';
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  conflicts?: any[];
}

const levelConfig = {
  OPTIMISTIC: { 
    icon: Clock, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    label: 'Saving...',
    description: 'Changes are being saved'
  },
  PROCESSING: { 
    icon: Loader2, 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    label: 'Processing...',
    description: 'Server is processing changes'
  },
  COMMITTED: { 
    icon: Check, 
    color: 'text-green-500', 
    bgColor: 'bg-green-50 dark:bg-green-950',
    label: 'Saved',
    description: 'Changes saved successfully'
  },
};

const statusConfig = {
  PENDING: { 
    icon: Clock, 
    color: 'text-blue-500',
    label: 'Pending Approval'
  },
  APPROVED: { 
    icon: Check, 
    color: 'text-green-500',
    label: 'Approved'
  },
  REJECTED: { 
    icon: X, 
    color: 'text-red-500',
    label: 'Rejected'
  },
  APPLIED: { 
    icon: Check, 
    color: 'text-green-500',
    label: 'Applied'
  },
  ROLLED_BACK: { 
    icon: X, 
    color: 'text-gray-500',
    label: 'Rolled Back'
  },
  CONFLICTED: { 
    icon: AlertTriangle, 
    color: 'text-red-500',
    label: 'Conflict'
  },
};

export function ChangeIndicator({ 
  entityType, 
  entityId, 
  showDetails = false,
  className,
  size = 'md'
}: ChangeIndicatorProps) {
  // Query recent changes for this entity
  const { data: recentChanges } = useQuery({
    queryKey: ['changes', entityType, entityId, 'recent'],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/changes/${entityType}/${entityId}/history`, {
        params: { limit: 5 }
      });
      return response.changes as ChangeSet[];
    },
    refetchInterval: 5000, // Poll every 5 seconds for active changes
    enabled: true,
  });

  if (!recentChanges || recentChanges.length === 0) {
    return null;
  }

  // Find active changes (not completed)
  const activeChanges = recentChanges.filter(
    change => ['OPTIMISTIC', 'PROCESSING', 'PENDING', 'CONFLICTED'].includes(change.level) ||
              ['PENDING', 'CONFLICTED'].includes(change.status)
  );

  const latestChange = recentChanges[0];
  const hasConflicts = activeChanges.some(c => c.status === 'CONFLICTED');

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badgeSizes = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  if (hasConflicts) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="destructive" 
              className={cn('gap-1 animate-pulse', badgeSizes[size], className)}
            >
              <AlertTriangle className={cn(sizeClasses[size], 'animate-pulse')} />
              {showDetails && 'Conflict'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Changes have conflicts that need resolution</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (activeChanges.length > 0) {
    const change = activeChanges[0];
    const config = change.level ? levelConfig[change.level] : statusConfig[change.status];
    const Icon = config.icon;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                'gap-1',
                config.bgColor,
                config.color,
                badgeSizes[size],
                className,
                change.level === 'PROCESSING' && 'animate-pulse'
              )}
            >
              <Icon className={cn(
                sizeClasses[size],
                change.level === 'PROCESSING' && 'animate-spin'
              )} />
              {showDetails && config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{config.description || config.label}</p>
              {change.user && (
                <p className="text-xs text-muted-foreground">
                  by {change.user.name || change.user.email}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(change.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show last saved indicator if no active changes
  if (showDetails && latestChange?.status === 'APPLIED') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center gap-1 text-xs text-muted-foreground',
              className
            )}>
              <Eye className={sizeClasses[size]} />
              <span>Last saved {new Date(latestChange.createdAt).toLocaleTimeString()}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>All changes saved</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}

// Compound component for showing multiple change indicators
export function ChangeIndicatorGroup({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  );
}