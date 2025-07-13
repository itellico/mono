import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, FileText, GitMerge, RefreshCw } from 'lucide-react';
import { SideBySideDiffViewer } from './DiffViewer';
import { useConflictResolution } from '@/hooks/useThreeLevelChange';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConflictResolverProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: Array<{
    id: string;
    type: string;
    data?: any;
    changeSet?: {
      entityType: string;
      entityId: string;
      changes: any;
      oldValues?: any;
      newValues?: any;
    };
  }>;
  currentValues?: any;
  incomingValues?: any;
  onResolve?: () => void;
}

export function ConflictResolver({
  isOpen,
  onClose,
  conflicts,
  currentValues,
  incomingValues,
  onResolve
}: ConflictResolverProps) {
  const [selectedResolution, setSelectedResolution] = React.useState<string>('');
  const [mergedChanges, setMergedChanges] = React.useState<string>('');
  const resolveConflict = useConflictResolution();

  const conflictTypeLabels: Record<string, string> = {
    CONCURRENT_EDIT: 'Another user edited this item',
    VALIDATION_FAILURE: 'Changes failed validation',
    DEPENDENCY_MISSING: 'Required dependencies are missing',
    PERMISSION_DENIED: 'Insufficient permissions',
    BUSINESS_RULE: 'Business rule violation',
    STALE_DATA: 'Your data is out of date',
  };

  const handleResolve = async () => {
    if (!selectedResolution || conflicts.length === 0) return;

    try {
      const resolution: any = { type: selectedResolution };
      
      if (selectedResolution === 'MERGE' && mergedChanges) {
        try {
          resolution.mergedChanges = JSON.parse(mergedChanges);
        } catch (e) {
          alert('Invalid JSON in merged changes');
          return;
        }
      }

      // Resolve all conflicts with the same resolution
      await Promise.all(
        conflicts.map(conflict => 
          resolveConflict.mutateAsync({ 
            conflictId: conflict.id, 
            resolution 
          })
        )
      );

      onResolve?.();
      onClose();
    } catch (error) {
      console.error('Failed to resolve conflicts:', error);
    }
  };

  const mainConflict = conflicts[0];
  const conflictType = mainConflict?.type || 'UNKNOWN';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Resolve Conflicts
          </DialogTitle>
          <DialogDescription>
            {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected. 
            Choose how to resolve {conflicts.length > 1 ? 'them' : 'it'}.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-1">
          <div className="space-y-4">
            {/* Conflict Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Conflict Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {conflicts.map((conflict, idx) => (
                  <div key={conflict.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        {conflict.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {conflictTypeLabels[conflict.type] || conflict.type}
                      </span>
                    </div>
                    {conflict.data?.recentChanges && (
                      <span className="text-xs text-muted-foreground">
                        {conflict.data.recentChanges.length} recent changes
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Show diff if available */}
            {currentValues && incomingValues && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Changes Comparison</CardTitle>
                  <CardDescription>
                    Review the differences between current and incoming values
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SideBySideDiffViewer
                    oldValues={currentValues}
                    newValues={incomingValues}
                  />
                </CardContent>
              </Card>
            )}

            {/* Resolution Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resolution Options</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={selectedResolution} 
                  onValueChange={setSelectedResolution}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="ACCEPT_CURRENT" id="current" />
                    <div className="space-y-1">
                      <Label htmlFor="current" className="cursor-pointer">
                        Keep current version
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Discard incoming changes and keep the current data
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="ACCEPT_INCOMING" id="incoming" />
                    <div className="space-y-1">
                      <Label htmlFor="incoming" className="cursor-pointer">
                        Accept incoming changes
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Replace current data with the incoming changes
                      </p>
                    </div>
                  </div>

                  {conflictType === 'CONCURRENT_EDIT' && (
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value="MERGE" id="merge" />
                      <div className="space-y-1">
                        <Label htmlFor="merge" className="cursor-pointer">
                          Merge changes manually
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Manually specify the final state by merging both versions
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="RETRY" id="retry" />
                    <div className="space-y-1">
                      <Label htmlFor="retry" className="cursor-pointer">
                        Retry with latest data
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Refresh and retry the operation with the latest data
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                {selectedResolution === 'MERGE' && (
                  <div className="mt-4 space-y-2">
                    <Label>Merged Changes (JSON)</Label>
                    <Textarea
                      value={mergedChanges}
                      onChange={(e) => setMergedChanges(e.target.value)}
                      placeholder={JSON.stringify(incomingValues || {}, null, 2)}
                      className="font-mono text-sm"
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the final state as valid JSON
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional conflict information */}
            {mainConflict?.data?.staleData && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your changes are based on outdated data. The item was last updated {' '}
                  {new Date(mainConflict.data.currentVersion).toLocaleString()}.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={resolveConflict.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={!selectedResolution || resolveConflict.isPending}
            className="gap-2"
          >
            {resolveConflict.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                <GitMerge className="h-4 w-4" />
                Resolve Conflict
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}