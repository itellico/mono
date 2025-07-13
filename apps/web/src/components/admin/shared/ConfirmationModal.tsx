'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, UserX, Shield, Download } from 'lucide-react';

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'default';
  icon?: 'delete' | 'suspend' | 'warning' | 'shield' | 'download';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

const iconMap = {
  delete: Trash2,
  suspend: UserX,
  warning: AlertTriangle,
  shield: Shield,
  download: Download,
};

/**
 * @component ConfirmationModal
 * 
 * Reusable confirmation modal for dangerous actions in admin interface.
 * Uses ShadCN AlertDialog for accessible modal behavior.
 * 
 * @param open - Whether the modal is open
 * @param onOpenChange - Callback when modal open state changes
 * @param title - Modal title
 * @param description - Modal description text
 * @param confirmText - Text for confirm button
 * @param cancelText - Text for cancel button (defaults to "Cancel")
 * @param variant - Visual variant for styling (destructive, warning, default)
 * @param icon - Icon to display in the modal
 * @param onConfirm - Callback when user confirms action
 * @param loading - Whether the action is in progress
 * @param disabled - Whether the confirm button should be disabled
 * 
 * @example
 * ```tsx
 * <ConfirmationModal
 *   open={showDeleteModal}
 *   onOpenChange={setShowDeleteModal}
 *   title="Delete Tenant"
 *   description="Are you sure you want to delete this tenant? This action cannot be undone."
 *   confirmText="Delete Tenant"
 *   variant="destructive"
 *   icon="delete"
 *   onConfirm={handleDeleteTenant}
 *   loading={isDeleting}
 * />
 * ```
 */
export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  variant = 'default',
  icon = 'warning',
  onConfirm,
  loading = false,
  disabled = false,
}: ConfirmationModalProps) {
  const IconComponent = iconMap[icon];

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          iconColor: 'text-red-600',
          buttonVariant: 'destructive' as const,
        };
      case 'warning':
        return {
          iconColor: 'text-orange-600',
          buttonVariant: 'default' as const,
        };
      default:
        return {
          iconColor: 'text-blue-600',
          buttonVariant: 'default' as const,
        };
    }
  };

  const { iconColor, buttonVariant } = getVariantStyles();

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling should be done in the onConfirm callback
      console.error('Confirmation action failed:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-gray-100 ${iconColor}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-gray-600 mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={loading}>
              {cancelText}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={buttonVariant}
              onClick={handleConfirm}
              disabled={disabled || loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading...
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for managing confirmation modal state
 * 
 * @example
 * ```tsx
 * const { showModal, openModal, closeModal } = useConfirmationModal();
 * 
 * const handleDelete = () => {
 *   openModal();
 * };
 * ```
 */
export function useConfirmationModal() {
  const [open, setOpen] = React.useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  return {
    open,
    openModal,
    closeModal,
    setOpen,
  };
} 