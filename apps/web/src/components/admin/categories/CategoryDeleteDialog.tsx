'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, Move, ArrowUp } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  parentId?: string;
  children?: Category[];
}

interface CategoryDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  allCategories: Category[];
  onConfirm: (categoryId: string, options: {
    cascadeDelete?: boolean;
    moveChildrenToParent?: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

export function CategoryDeleteDialog({
  isOpen,
  onClose,
  category,
  allCategories,
  onConfirm,
  loading = false
}: CategoryDeleteDialogProps) {
  const [deleteOption, setDeleteOption] = useState<'simple' | 'cascade' | 'move'>('simple');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!category) return null;

  // Find children of this category
  const children = allCategories.filter(cat => cat.parentId === category.id);
  const hasChildren = children.length > 0;

  // Find parent category for context
  const parentCategory = category.parentId 
    ? allCategories.find(cat => cat.id === category.parentId)
    : null;

  const handleConfirm = async () => {
    if (!category) return;

    setIsDeleting(true);
    try {
      const options = {
        cascadeDelete: deleteOption === 'cascade',
        moveChildrenToParent: deleteOption === 'move'
      };

      await onConfirm(category.id, options);
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getDeleteOptionDescription = () => {
    switch (deleteOption) {
      case 'simple':
        return hasChildren 
          ? 'This will fail because the category has children. Please choose another option.'
          : 'This will delete the category permanently.';
      case 'cascade':
        return `This will delete "${category.name}" and all ${children.length} child categories permanently.`;
      case 'move':
        return parentCategory
          ? `This will delete "${category.name}" and move its ${children.length} child categories to "${parentCategory.name}".`
          : `This will delete "${category.name}" and move its ${children.length} child categories to the root level.`;
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Category
          </DialogTitle>
          <DialogDescription>
            You are about to delete &quot;{category.name}&quot;.
            {hasChildren && (
              <span className="block mt-2 text-amber-600 font-medium">
                ⚠️ This category has {children.length} child categor{children.length === 1 ? 'y' : 'ies'}.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasChildren && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Child categories found:</strong> {children.map(c => c.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          <RadioGroup value={deleteOption} onValueChange={(value) => setDeleteOption(value as any)}>
            {/* Simple delete option */}
            <div className={`flex items-center space-x-2 p-3 rounded-lg border ${
              hasChildren && deleteOption === 'simple' 
                ? 'border-red-200 bg-red-50' 
                : 'border-gray-200'
            }`}>
              <RadioGroupItem 
                value="simple" 
                id="simple" 
                disabled={hasChildren}
              />
              <Label htmlFor="simple" className={`flex-1 ${hasChildren ? 'text-gray-400' : ''}`}>
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete category only
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {hasChildren ? '❌ Not available - category has children' : 'Simple deletion without children'}
                </div>
              </Label>
            </div>

            {/* Cascade delete option */}
            {hasChildren && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg border ${
                deleteOption === 'cascade' ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="cascade" id="cascade" />
                <Label htmlFor="cascade" className="flex-1">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    Delete category and all children
                  </div>
                  <div className="text-sm text-red-600 mt-1">
                    ⚠️ This will permanently delete {children.length + 1} categories
                  </div>
                </Label>
              </div>
            )}

            {/* Move children option */}
            {hasChildren && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg border ${
                deleteOption === 'move' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <RadioGroupItem value="move" id="move" />
                <Label htmlFor="move" className="flex-1">
                  <div className="flex items-center gap-2">
                    {parentCategory ? <ArrowUp className="h-4 w-4 text-blue-500" /> : <Move className="h-4 w-4 text-blue-500" />}
                    Move children to {parentCategory ? `"${parentCategory.name}"` : 'root level'}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    Preserves child categories by moving them up one level
                  </div>
                </Label>
              </div>
            )}
          </RadioGroup>

          {/* Option description */}
          <Alert className={
            deleteOption === 'cascade' ? 'border-red-200 bg-red-50' :
            deleteOption === 'move' ? 'border-blue-200 bg-blue-50' :
            hasChildren && deleteOption === 'simple' ? 'border-red-200 bg-red-50' :
            'border-gray-200'
          }>
            <AlertDescription>
              {getDeleteOptionDescription()}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting || (hasChildren && deleteOption === 'simple')}
          >
            {isDeleting ? 'Deleting...' : 
             deleteOption === 'cascade' ? `Delete ${children.length + 1} Categories` :
             deleteOption === 'move' ? 'Delete & Move Children' :
             'Delete Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 