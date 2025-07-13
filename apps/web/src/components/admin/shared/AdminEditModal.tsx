'use client';

import React, { useState, useEffect } from 'react';
import { isEqual } from 'lodash-es';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

interface AdminEditModalProps<T extends object> {
  title: string;
  initialData: T;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<T>) => Promise<void>;
  children: React.ReactNode;
}

export function AdminEditModal<T extends object>({
  title,
  initialData,
  isOpen,
  onClose,
  onSave,
  children,
}: AdminEditModalProps<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const hasChanges = !isEqual(initialData, formData);
    setIsDirty(hasChanges);
  }, [initialData, formData]);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    if (!isDirty) {
      toast.info('No changes to save');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      toast.success('Changes saved successfully');
      setIsDirty(false);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        formData,
        setFormData,
      });
    }
    return child;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="py-4">{enhancedChildren}</div>
        <Separator />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={!isDirty || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
