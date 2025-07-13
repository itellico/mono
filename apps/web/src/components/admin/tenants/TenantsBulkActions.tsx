'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, Square, MoreHorizontal } from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';
import { useToast } from '@/hooks/use-toast';

interface TenantsBulkActionsProps {
  selectedTenants?: string[];
  onSelectionChange?: (tenantIds: string[]) => void;
  totalTenants?: number;
}

interface BulkActionConfig {
  id: string;
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
  requiresConfirmation: boolean;
}

export function TenantsBulkActions({
  selectedTenants = [],
  onSelectionChange,
  totalTenants = 0
}: TenantsBulkActionsProps) {
  const t = useTranslations('admin-tenants');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState<string>('');

  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, tenantIds }: { action: string; tenantIds: string[] }) => {
      browserLogger.info('Executing bulk action', { action, tenantCount: tenantIds.length });

      const response = await fetch('/api/v1/admin/tenants/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, tenantIds })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Bulk action failed');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: t('bulkActions.success.title'),
        description: t('bulkActions.success.description', {
          count: data.processedCount,
          action: variables.action
        }),
      });

      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });

      onSelectionChange?.([]);
      setSelectedAction('');
    },
    onError: (error) => {
      browserLogger.error('Bulk action failed', { error });
      toast({
        title: t('bulkActions.error.title'),
        description: t('bulkActions.error.description'),
        variant: 'destructive',
      });
    }
  });

  const bulkActions: BulkActionConfig[] = [
    {
      id: 'activate',
      label: t('bulkActions.actions.activate'),
      variant: 'default',
      requiresConfirmation: false
    },
    {
      id: 'deactivate',
      label: t('bulkActions.actions.deactivate'),
      variant: 'secondary',
      requiresConfirmation: true
    },
    {
      id: 'delete',
      label: t('bulkActions.actions.delete'),
      variant: 'destructive',
      requiresConfirmation: true
    }
  ];

  const handleSelectAll = () => {
    if (selectedTenants.length > 0) {
      onSelectionChange?.([]);
    } else {
      // This would ideally fetch all tenant IDs based on current filters
      // For now, a placeholder or actual fetch would be needed
      onSelectionChange?.(['mock-tenant-1', 'mock-tenant-2']);
    }
  };

  const handleExecuteAction = () => {
    if (!selectedAction || selectedTenants.length === 0) return;

    const action = bulkActions.find(a => a.id === selectedAction);
    if (!action) return;

    if (action.requiresConfirmation) {
      const confirmed = window.confirm(
        t('bulkActions.confirmation.message', {
          action: action.label.toLowerCase(),
          count: selectedTenants.length
        })
      );
      if (!confirmed) return;
    }

    bulkActionMutation.mutate({
      action: selectedAction,
      tenantIds: selectedTenants
    });
  };

  const isAllSelected = selectedTenants.length > 0 && selectedTenants.length === totalTenants;
  const isSomeSelected = selectedTenants.length > 0 && selectedTenants.length < totalTenants;

  return (
    <div className="flex items-center gap-3">
      {/* Selection Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="p-1 h-8 w-8"
        >
          {isAllSelected ? (
            <CheckSquare className="h-4 w-4" />
          ) : isSomeSelected ? (
            <Square className="h-4 w-4 opacity-50" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>

        {selectedTenants.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {t('bulkActions.selected', { count: selectedTenants.length })}
          </span>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedTenants.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder={t('bulkActions.selectAction')} />
            </SelectTrigger>
            <SelectContent>
              {bulkActions.map((action) => (
                <SelectItem key={action.id} value={action.id}>
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={handleExecuteAction}
            disabled={!selectedAction || bulkActionMutation.isPending}
            variant={bulkActions.find(a => a.id === selectedAction)?.variant || 'default'}
          >
            {bulkActionMutation.isPending ? t('bulkActions.executing') : t('bulkActions.execute')}
          </Button>
        </div>
      )}
    </div>
  );
}
