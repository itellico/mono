'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LoadSavedSearchDropdown } from '@/components/saved-searches/LoadSavedSearchDropdown';
import { SaveSearchDialog } from '@/components/saved-searches/SaveSearchDialog';
import { BookmarkIcon, BookmarkPlusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TenantsSaveLoadBarProps {
  entityType: string;
  hasActiveSearch: boolean;
  activeSearchName?: string;
  onLoadSearch: (config: any) => void;
  onSaveSearch: (data: any) => void;
  canSave: boolean;
  canLoad: boolean;
  className?: string;
}

/**
 * Enhanced Save/Load Bar for Tenants Page
 * Makes save/load functionality more prominent and always visible
 */
export function TenantsSaveLoadBar({
  entityType,
  hasActiveSearch,
  activeSearchName,
  onLoadSearch,
  onSaveSearch,
  canSave,
  canLoad,
  className
}: TenantsSaveLoadBarProps) {
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);

  return (
    <div className={cn("flex items-center gap-2 p-2 bg-muted/50 rounded-lg border", className)}>
      {/* Always visible label */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <BookmarkIcon className="h-4 w-4 text-primary" />
        <span>Search Filters:</span>
      </div>

      {/* Load Saved Searches - Always Visible */}
      {canLoad && (
        <LoadSavedSearchDropdown
          entityType={entityType}
          onLoadSearch={onLoadSearch}
          className="min-w-[150px]"
        />
      )}

      {/* Save Current Search - Always Visible with different states */}
      {canSave && (
        <Button
          variant={hasActiveSearch ? "default" : "outline"}
          size="sm"
          onClick={() => setSaveDialogOpen(true)}
          disabled={!hasActiveSearch}
          className={cn(
            "gap-2 min-w-[100px]",
            hasActiveSearch && "animate-pulse-once"
          )}
        >
          <BookmarkPlusIcon className="h-4 w-4" />
          {hasActiveSearch ? "Save Current" : "Save"}
        </Button>
      )}

      {/* Current Active Search Indicator */}
      {activeSearchName && (
        <div className="ml-auto text-sm text-muted-foreground">
          Active: <span className="font-medium text-foreground">{activeSearchName}</span>
        </div>
      )}

      {/* Save Dialog */}
      {canSave && (
        <SaveSearchDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          entityType={entityType}
          currentFilters={{}}
          currentSearch=""
          onSaved={(savedSearch) => {
            onSaveSearch(savedSearch);
            setSaveDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}