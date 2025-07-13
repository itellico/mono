'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { PermissionGate } from '@/components/auth/PermissionGate';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Textarea,
} from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Switch,
} from '@/components/ui/switch';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Separator,
} from '@/components/ui/separator';
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
import {
  Skeleton,
} from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Save,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'switch' | 'number' | 'date' | 'custom';
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  render?: (value: any, onChange: (value: any) => void, field: FormField) => React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3; // Grid column span
}

export interface TabConfig {
  key: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  fields: FormField[];
  permission?: {
    action: string;
    resource: string;
    context?: Record<string, any>;
  };
}

export interface ActionButton {
  key: string;
  label: string;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  icon?: React.ComponentType<{ className?: string }>;
  permission?: {
    action: string;
    resource: string;
    context?: Record<string, any>;
  };
  onClick: (data: any) => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  confirmDialog?: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface AdminEditPageProps<T = any> {
  // Basic configuration
  title?: string;
  subtitle?: string;
  backUrl?: string;
  backLabel?: string;
  
  // Entity data
  entityData?: T;
  isLoading?: boolean;
  saveError?: string | null;
  
  // Form configuration
  tabs: TabConfig[];
  defaultTab?: string;
  formData: Record<string, any>;
  onFormChange: (key: string, value: any) => void;
  onSave: (data: T) => Promise<void>;
  onDelete?: () => Promise<void>;
  errors: ValidationError[];
  onValidate: (data: T) => ValidationError[];
  
  // Save state
  isSaving?: boolean;
  isDeleting?: boolean;
  isDirty?: boolean;
  
  // Actions configuration
  customActions?: ActionButton[];
  
  // Permission context
  userContext?: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
  
  // Custom renderers
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  renderLoadingState?: () => React.ReactNode;
  
  // Additional props
  className?: string;
  children?: React.ReactNode;
}

// ============================================================================
// FORM FIELD RENDERERS
// ============================================================================

interface FieldRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const baseInputProps = {
    id: field.key,
    placeholder: field.placeholder,
    disabled: field.disabled,
    className: cn(
      error && "border-destructive focus-visible:ring-destructive"
    )
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'date':
        return (
          <Input
            {...baseInputProps}
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
        
      case 'password':
        return (
          <div className="relative">
            <Input
              {...baseInputProps}
              type={showPassword ? 'text' : 'password'}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
        
      case 'textarea':
        return (
          <Textarea
            {...baseInputProps}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
        );
        
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={field.disabled}
          >
            <SelectTrigger className={error ? "border-destructive" : ""}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'switch':
        return (
          <Switch
            checked={value || false}
            onCheckedChange={onChange}
            disabled={field.disabled}
          />
        );
        
      case 'custom':
        return field.render ? field.render(value, onChange, field) : null;
        
      default:
        return (
          <Input
            {...baseInputProps}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  };

  return (
    <div className={cn(
      "space-y-2",
      field.colSpan === 2 && "md:col-span-2",
      field.colSpan === 3 && "md:col-span-3"
    )}>
      <Label htmlFor={field.key} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {renderField()}
      
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Enterprise-grade Admin Edit Page Component
 * 
 * ✅ mono BEST PRACTICES:
 * - Tab-based form organization using ShadCN Tabs
 * - Back navigation with unsaved changes warning
 * - Form validation and error handling
 * - Permission gates for tabs and actions
 * - Loading and saving states
 * - Responsive design patterns
 * - Type-safe with generics
 * - Browser logger integration
 * - Proper error boundaries
 * 
 * @component
 * @example
 * ```tsx
 * <AdminEditPage
 *   title="Edit User"
 *   backUrl="/admin/users"
 *   tabs={userEditTabs}
 *   formData={formData}
 *   formErrors={formErrors}
 *   onFormChange={handleFormChange}
 *   onFormSubmit={handleFormSubmit}
 *   userContext={userContext}
 * />
 * ```
 */
export function AdminEditPage<T = any>({
  title = 'Edit',
  subtitle,
  backUrl,
  backLabel = 'Back',
  entityData,
  isLoading = false,
  saveError = null,
  tabs,
  defaultTab,
  formData,
  onFormChange,
  onSave,
  onDelete,
  errors,
  onValidate,
  isSaving = false,
  isDeleting = false,
  isDirty = false,
  customActions,
  userContext,
  renderHeader,
  renderFooter,
  renderLoadingState,
  className,
  children,
}: AdminEditPageProps<T>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState(tabs[0]?.key || '');

  // Handle back navigation with unsaved changes warning
  const handleBack = React.useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
    
    if (userContext) {
      browserLogger.info('Navigated back from edit page', {
        backUrl,
        isDirty,
        userRole: userContext.adminRole
      });
    }
  }, [backUrl, isDirty, router, userContext]);

  // Handle form submission
  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSaving) return;
    
    try {
      const validationErrors = onValidate(formData as T);
      if (validationErrors.length > 0) {
        // This should ideally be handled by the parent component setting errors state
        browserLogger.warn('Form validation failed on submit', { errors: validationErrors });
        return;
      }
      await onSave(formData as T);
      
      if (userContext) {
        browserLogger.info('Form submitted successfully', {
          formKeys: Object.keys(formData),
          userRole: userContext.adminRole
        });
      }
    } catch (error) {
      if (userContext) {
        browserLogger.error('Form submission failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userRole: userContext.adminRole
        });
      }
    }
  }, [formData, onSave, isSaving, userContext, onValidate]);

  // Handle field changes
  const handleFieldChange = React.useCallback((key: string, value: any) => {
    onFormChange(key, value);
    
    if (userContext) {
      browserLogger.info('Form field changed', {
        field: key,
        userRole: userContext.adminRole
      });
    }
  }, [onFormChange, userContext]);

  // Filter tabs based on permissions
  const visibleTabs = React.useMemo(() => {
    if (!userContext) return tabs;
    
    return tabs.filter(tab => {
      if (!tab.permission) return true;
      
      if (!userContext.permissions || !Array.isArray(userContext.permissions)) {
        return userContext.adminRole === 'super_admin';
      }
      
      const permissionString = `${tab.permission.action}:${tab.permission.resource}`;
      return userContext.permissions.includes(permissionString);
    });
  }, [tabs, userContext]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {renderLoadingState ? renderLoadingState() : (
          <>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  // Error state for save operations
  if (saveError) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{saveError}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      {renderHeader ? renderHeader() : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          
          {isDirty && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved changes
            </Badge>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleTabs.map((tab) => (
                  <TabsTrigger
                    key={tab.key}
                    value={tab.key}
                    className="flex items-center gap-2"
                  >
                    {tab.icon && <tab.icon className="h-4 w-4" />}
                    {tab.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {visibleTabs.map((tab) => (
                <TabsContent key={tab.key} value={tab.key} className="space-y-6">
                  {tab.description && (
                    <div>
                      <h3 className="text-lg font-semibold">{tab.title}</h3>
                      <p className="text-sm text-muted-foreground">{tab.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tab.fields.map((field) => (
                      <FieldRenderer
                        key={field.key}
                        field={field}
                        value={formData[field.key]}
                        onChange={(value) => handleFieldChange(field.key, value)}
                        error={errors.find(err => err.field === field.key)?.message}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSaving || isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this entity.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {customActions && customActions.map(action => (
              <PermissionGate
                key={action.key}
                permissions={[
                  action.permission?.action 
                    ? `${action.permission.action}:${action.permission.resource}`
                    : 'admin:read'
                ]}
                fallback={null}
              >
                <Button
                  type="button"
                  variant={action.variant || 'outline'}
                  onClick={() => action.onClick(entityData)}
                  disabled={action.disabled || action.loading || isSaving || isDeleting}
                >
                  {action.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    action.icon && <action.icon className="h-4 w-4 mr-2" />
                  )}
                  {action.label}
                </Button>
              </PermissionGate>
            ))}

            <Button
              type="submit"
              disabled={isSaving || errors.length > 0 || !isDirty}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </form>

      {/* Footer */}
      {renderFooter && renderFooter()}
      
      {/* Custom children */}
      {children}
    </div>
  );
} 