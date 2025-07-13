'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PermissionForm } from './PermissionForm';

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; description?: string }) => void;
  initialData?: { id?: number; name: string; description?: string };
  isSubmitting?: boolean;
}

export function PermissionDialog({ open, onOpenChange, onSubmit, initialData, isSubmitting }: PermissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Permission' : 'Add Permission'}</DialogTitle>
        </DialogHeader>
        <PermissionForm
          onSubmit={onSubmit}
          initialData={initialData}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
