import React from 'react';
import { useChangeHistory } from '@/hooks/useThreeLevelChange';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  Check, 
  X, 
  AlertTriangle, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight,
  User,
  Calendar,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DiffViewer } from './DiffViewer';
import { useChangeRollback } from '@/hooks/useThreeLevelChange';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ChangeHistoryProps {
  entityType: string;
  entityId: string;
  showRollback?: boolean;
  maxHeight?: string;
  className?: string;
}

export function ChangeHistory({ 
  entityType, 
  entityId,
  showRollback = true,
  maxHeight = '500px',
  className
}: ChangeHistoryProps) {
  const { data, isLoading, error } = useChangeHistory(entityType, entityId, {
    includeRollbacks: true,
  });
  
  const rollback = useChangeRollback();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (changeId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(changeId)) {
        next.delete(changeId);
      } else {
        next.add(changeId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading change history...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-destructive">Failed to load change history</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.changes.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">No change history available</div>
        </CardContent>
      </Card>
    );
  }

  const statusIcons = {
    PENDING: { icon: Clock, color: 'text-blue-500' },
    APPROVED: { icon: Check, color: 'text-green-500' },
    REJECTED: { icon: X, color: 'text-red-500' },
    APPLIED: { icon: Check, color: 'text-green-500' },
    ROLLED_BACK: { icon: RotateCcw, color: 'text-gray-500' },
    CONFLICTED: { icon: AlertTriangle, color: 'text-red-500' },
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Change History
        </CardTitle>
        <CardDescription>
          View all changes made to this {entityType}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-0">
            {data.changes.map((change, index) => {
              const StatusIcon = statusIcons[change.status]?.icon || Clock;
              const statusColor = statusIcons[change.status]?.color || 'text-gray-500';
              const isExpanded = expandedItems.has(change.id);
              const isLatest = index === 0;
              const canRollback = change.status === 'APPLIED' && showRollback && !isLatest;

              return (
                <div key={change.id}>
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleExpanded(change.id)}
                  >
                    <div className="px-6 py-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        
                        <div className={cn('mt-1', statusColor)}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {change.status}
                                </Badge>
                                {change.level && (
                                  <Badge variant="secondary" className="text-xs">
                                    {change.level}
                                  </Badge>
                                )}
                                {isLatest && (
                                  <Badge className="text-xs">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {change.user?.name || change.user?.email || 'Unknown'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(change.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              
                              {change.approver && (
                                <div className="text-sm text-muted-foreground">
                                  Approved by {change.approver.name || change.approver.email}
                                </div>
                              )}
                              
                              {change.rejecter && (
                                <div className="text-sm text-muted-foreground">
                                  Rejected by {change.rejecter.name || change.rejecter.email}
                                  {change.rejectionReason && `: ${change.rejectionReason}`}
                                </div>
                              )}
                            </div>
                            
                            {canRollback && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    disabled={rollback.isPending}
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    Rollback
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Rollback Change?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will revert the entity to its previous state before this change.
                                      This action creates a new change entry and cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => rollback.mutate(change.id)}
                                    >
                                      Rollback
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                          
                          <CollapsibleContent>
                            <div className="mt-4 space-y-4">
                              {change.metadata?.rollbackOf && (
                                <div className="bg-muted rounded-md p-3 text-sm">
                                  This is a rollback of change {change.metadata.rollbackOf}
                                </div>
                              )}
                              
                              {change.conflicts && change.conflicts.length > 0 && (
                                <div className="bg-destructive/10 rounded-md p-3 space-y-2">
                                  <div className="font-medium text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Conflicts Detected
                                  </div>
                                  {change.conflicts.map((conflict, idx) => (
                                    <div key={idx} className="text-sm text-muted-foreground">
                                      {conflict.conflictType}: {JSON.stringify(conflict.conflictData)}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <DiffViewer
                                oldValues={change.oldValues || {}}
                                newValues={change.newValues || change.changes || {}}
                                diff={change.diff}
                              />
                              
                              {change.version && (
                                <div className="text-xs text-muted-foreground">
                                  Version {change.version.versionNumber}
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </div>
                    </div>
                  </Collapsible>
                  
                  {index < data.changes.length - 1 && (
                    <Separator className="my-0" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}