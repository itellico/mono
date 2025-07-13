"use client";

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
import { AlertTriangle, HelpCircle, Info, CheckCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

/**
 * Reusable confirmation modal component with consistent styling
 * 
 * @example
 * // For destructive actions (delete, empty, etc.)
 * <ConfirmationModal
 *   isOpen={showDeleteModal}
 *   onClose={() => setShowDeleteModal(false)}
 *   onConfirm={handleDelete}
 *   title="Delete User"
 *   description="Are you sure you want to delete this user? This action cannot be undone."
 *   confirmText="Yes, Delete"
 *   variant="destructive"
 * />
 * 
 * @example
 * // For info confirmations
 * <ConfirmationModal
 *   isOpen={showInfoModal}
 *   onClose={() => setShowInfoModal(false)}
 *   onConfirm={handleProceed}
 *   title="Proceed with Action"
 *   description="This will send notifications to all users. Continue?"
 *   confirmText="Send Notifications"
 *   variant="info"
 * />
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false
}: ConfirmationModalProps) {
  const variantStyles = {
    destructive: {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      buttonVariant: 'destructive' as const
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      buttonVariant: 'destructive' as const
    },
    info: {
      icon: HelpCircle,
      iconColor: 'text-blue-500',
      buttonVariant: 'default' as const
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      buttonVariant: 'default' as const
    }
  };

  const { icon: Icon, iconColor, buttonVariant } = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${iconColor}`} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 