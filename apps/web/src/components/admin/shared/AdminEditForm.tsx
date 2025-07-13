'use client';

import React, { useState, useEffect } from 'react';
import { isEqual } from 'lodash-es';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface AdminEditFormProps<T extends object> {
  title: string;
  description?: string;
  initialData: T;
  onSave: (data: Partial<T>) => Promise<void>;
  backUrl?: string;
  children: React.ReactNode;
}

/**
 * @component AdminEditForm
 * 
 * A reusable composite edit component for admin edit pages with an intelligent 
 * save button that only activates when data changes, and a back button for navigation.
 * 
 * @param title - The title of the edit form
 * @param description - Optional description text
 * @param initialData - The initial data object
 * @param onSave - Callback function to handle save operations
 * @param backUrl - Optional URL to navigate back to (defaults to going back in history)
 * @param children - Form fields and other content
 * 
 * @example
 * ```tsx
 * <AdminEditForm
 *   title="Edit User"
 *   description="Update user information"
 *   initialData={user}
 *   onSave={handleSave}
 *   backUrl="/admin/users"
 * >
 *   <div className="grid grid-cols-2 gap-4">
 *     <div>
 *       <Label htmlFor="firstName">First Name</Label>
 *       <Input
 *         id="firstName"
 *         value={formData.firstName || ''}
 *         onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
 *       />
 *     </div>
 *   </div>
 * </AdminEditForm>
 * ```
 */
export function AdminEditForm<T extends object>({
  title,
  description,
  initialData,
  onSave,
  backUrl,
  children
}: AdminEditFormProps<T>) {
  const router = useRouter();
  const [formData, setFormData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Track changes to determine if save button should be enabled
  useEffect(() => {
    const hasChanges = !isEqual(initialData, formData);
    setIsDirty(hasChanges);
  }, [initialData, formData]);

  // Update form data when initial data changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

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
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  // Clone children and inject formData and setFormData
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
    <div className="space-y-6">
      {/* Page Header - matches tenant list layout exactly */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
          >
            Cancel
          </Button>
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
        </div>
      </div>

      {/* Form Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-6">
            {enhancedChildren}
            
            {isDirty && (
              <div className="text-sm text-muted-foreground border-l-2 border-amber-500 pl-3 py-1">
                You have unsaved changes
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 