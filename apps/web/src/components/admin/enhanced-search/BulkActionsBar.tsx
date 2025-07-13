'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  Mail,
  Trash,
  MoreHorizontal,
  Users,
  Archive,
  RefreshCw,
  FileText,
  X,
  Zap,
  CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BulkAction {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  permission?: {
    action: string;
    resource: string;
    context?: Record<string, any>;
  };
  onClick: (selectedIds: Set<any>) => void;
  confirmationRequired?: boolean;
  description?: string;
}

export interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  selectedIds: Set<any>;
  actions: BulkAction[];
  onClearSelection: () => void;
  entityName?: string;
  className?: string;
}

/**
 * Modern Floating Bulk Actions Bar Component
 * 
 * Features:
 * - Floating design that appears on selection
 * - Smooth animations and modern shadows
 * - Command palette-style action organization
 * - Responsive design with priority actions
 * - Clean visual hierarchy with rounded corners
 * - Backdrop blur for modern glass effect
 */
export function BulkActionsBar({
  selectedCount,
  totalCount,
  selectedIds,
  actions,
  onClearSelection,
  entityName = 'items',
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  // Separate actions by priority and type
  const primaryActions = actions.filter(action => 
    ['default', 'outline'].includes(action.variant || 'default')
  ).slice(0, 2); // Show max 2 primary actions

  const secondaryActions = actions.filter(action => 
    !['destructive'].includes(action.variant || 'default') &&
    !primaryActions.includes(action)
  );

  const destructiveActions = actions.filter(action => 
    action.variant === 'destructive'
  );

  const renderActionButton = (action: BulkAction, compact: boolean = false) => (
    <Button
      key={action.key}
      variant={action.variant || 'outline'}
      size="sm"
      onClick={() => action.onClick(selectedIds)}
      className={cn(
        "gap-2 transition-all duration-200 hover:scale-105",
        compact && "px-3",
        action.variant === 'destructive' && "hover:shadow-lg"
      )}
    >
      {action.icon && <action.icon className="h-4 w-4" />}
      {!compact && action.label}
    </Button>
  );

  return (
    <>
      {/* Backdrop overlay for emphasis */}
      <div className="fixed inset-0 bg-background/20 backdrop-blur-[1px] z-40 animate-in fade-in-0 duration-200" />
      
      {/* Floating Action Bar */}
      <div className={cn(
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
        "animate-in slide-in-from-bottom-3 duration-300 ease-out",
        className
      )}>
        <div className={cn(
          "flex items-center gap-4 px-6 py-4",
          "bg-background/95 backdrop-blur-lg border border-border/60",
          "rounded-2xl shadow-2xl shadow-black/20",
          "min-w-max max-w-2xl"
        )}>
          {/* Selection Counter with Icon */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-full">
              <CheckCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {selectedCount}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              of <span className="font-medium">{totalCount}</span> {entityName}
            </div>
          </div>

          {/* Separator */}
          <Separator orientation="vertical" className="h-8 opacity-60" />

          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            {primaryActions.map(action => renderActionButton(action))}
            
            {/* More Actions Dropdown */}
            {(secondaryActions.length > 0 || destructiveActions.length > 0) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 transition-all duration-200 hover:scale-105"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    More
                    <Badge variant="secondary" className="h-5 px-2 text-xs font-semibold bg-muted/60 rounded-full">
                      {secondaryActions.length + destructiveActions.length}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="center" 
                  side="top" 
                  className="w-64 shadow-xl border-0 bg-background/95 backdrop-blur-sm"
                >
                  {/* Secondary Actions */}
                  {secondaryActions.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground/80 flex items-center gap-2 border-b bg-muted/20">
                        <Zap className="w-3.5 h-3.5" />
                        Quick Actions
                      </div>
                      {secondaryActions.map((action) => (
                        <DropdownMenuItem
                          key={action.key}
                          onClick={() => action.onClick(selectedIds)}
                          className="gap-3 py-3 px-3 cursor-pointer transition-colors rounded-lg mx-2 my-1"
                        >
                          {action.icon && <action.icon className="h-4 w-4 text-muted-foreground/70" />}
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{action.label}</span>
                            {action.description && (
                              <span className="text-xs text-muted-foreground/80">
                                {action.description}
                              </span>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}

                  {/* Destructive Actions */}
                  {destructiveActions.length > 0 && (
                    <>
                      {secondaryActions.length > 0 && <DropdownMenuSeparator className="my-2" />}
                      <div className="px-3 py-2 text-xs font-semibold text-destructive/80 flex items-center gap-2 border-b bg-destructive/5">
                        <Trash className="w-3.5 h-3.5" />
                        Destructive Actions
                      </div>
                      {destructiveActions.map((action) => (
                        <DropdownMenuItem
                          key={action.key}
                          onClick={() => action.onClick(selectedIds)}
                          className="gap-3 py-3 px-3 cursor-pointer transition-colors rounded-lg mx-2 my-1 text-destructive focus:text-destructive"
                        >
                          {action.icon && <action.icon className="h-4 w-4" />}
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{action.label}</span>
                            {action.description && (
                              <span className="text-xs text-destructive/70">
                                {action.description}
                              </span>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Separator */}
          <Separator orientation="vertical" className="h-8 opacity-60" />

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="gap-2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 rounded-full px-4"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    </>
  );
}

// Default bulk actions for common use cases with modern styling
export const getDefaultBulkActions = (entityType: string): BulkAction[] => [
  {
    key: 'export',
    label: 'Export',
    icon: Download,
    variant: 'outline',
    description: `Export selected ${entityType} to CSV`,
    onClick: (selectedIds) => {
      console.log(`Exporting ${selectedIds.size} ${entityType}`);
    },
  },
  {
    key: 'email',
    label: 'Send Email',
    icon: Mail,
    variant: 'outline',
    description: `Send notification email to selected ${entityType}`,
    onClick: (selectedIds) => {
      console.log(`Sending email to ${selectedIds.size} ${entityType}`);
    },
  },
  {
    key: 'archive',
    label: 'Archive',
    icon: Archive,
    variant: 'secondary',
    description: `Archive selected ${entityType}`,
    onClick: (selectedIds) => {
      console.log(`Archiving ${selectedIds.size} ${entityType}`);
    },
  },
  {
    key: 'generate-report',
    label: 'Generate Report',
    icon: FileText,
    variant: 'secondary',
    description: `Generate detailed report for selected ${entityType}`,
    onClick: (selectedIds) => {
      console.log(`Generating report for ${selectedIds.size} ${entityType}`);
    },
  },
  {
    key: 'refresh',
    label: 'Refresh Status',
    icon: RefreshCw,
    variant: 'secondary',
    description: `Refresh status for selected ${entityType}`,
    onClick: (selectedIds) => {
      console.log(`Refreshing ${selectedIds.size} ${entityType}`);
    },
  },
  {
    key: 'delete',
    label: 'Delete Selected',
    icon: Trash,
    variant: 'destructive',
    confirmationRequired: true,
    description: `Permanently delete selected ${entityType}`,
    onClick: (selectedIds) => {
      console.log(`Deleting ${selectedIds.size} ${entityType}`);
    },
  },
];