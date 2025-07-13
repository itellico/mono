'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Info, 
  AlertTriangle, 
  Settings, 
  Shield, 
  Code, 
  Palette, 
  Bell,
  Wrench,
  Zap
} from 'lucide-react';
import { logger } from '@/lib/logger';

interface AdminSetting {
  id: number;
  key: string;
  displayName: string | null;
  description: string | null;
  value: any;
  defaultValue: any;
  category: string;
  level: string;
  governance: string;
  isReadonly: boolean;
  requiresRestart: boolean;
  helpText: string | null;
  tenantId: number | null;
}

interface EditSettingFormData {
  displayName: string;
  description?: string;
  category: 'security' | 'development' | 'features' | 'maintenance' | 'performance' | 'ui' | 'notifications';
  accessLevel: 'super_admin' | 'admin' | 'moderator';
  isUserSpecific: boolean;
  isReadOnly: boolean;
  requiresRestart: boolean;
  helpText?: string;
  isExperimental: boolean;
  isActive: boolean;
}

interface EditSettingFormProps {
  setting: AdminSetting;
  onSuccess: () => void;
  onCancel: () => void;
}

const categoryIcons = {
  security: Shield,
  development: Code,
  features: Settings,
  maintenance: Wrench,
  performance: Zap,
  ui: Palette,
  notifications: Bell
};

const categoryColors = {
  security: 'bg-red-100 text-red-800',
  development: 'bg-blue-100 text-blue-800',
  features: 'bg-green-100 text-green-800',
  maintenance: 'bg-orange-100 text-orange-800',
  performance: 'bg-purple-100 text-purple-800',
  ui: 'bg-pink-100 text-pink-800',
  notifications: 'bg-yellow-100 text-yellow-800'
};

export function EditSettingForm({ setting, onSuccess, onCancel }: EditSettingFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, isDirty }
  } = useForm<EditSettingFormData>({
    mode: 'onChange', // Enable real-time validation and dirty checking
    defaultValues: {
      displayName: setting.displayName || '',
      description: setting.description || '',
      category: setting.category as any,
              accessLevel: (setting.governance as 'super_admin' | 'admin' | 'moderator') || 'super_admin', // Map from governance field
      isUserSpecific: setting.level === 'user',
      isReadOnly: setting.isReadonly,
      requiresRestart: setting.requiresRestart,
      helpText: setting.helpText || '',
      isExperimental: false, // We'll need to get this from the setting
      isActive: true // We'll need to get this from the setting
    }
  });

  const watchedCategory = watch('category');

  const updateSettingMutation = useMutation({
    mutationFn: async (data: EditSettingFormData) => {
      const payload = {
        id: setting.id,
        displayName: data.displayName,
        description: data.description,
        category: data.category,
        accessLevel: data.accessLevel,
        isUserSpecific: data.isUserSpecific,
        isReadOnly: data.isReadOnly,
        requiresRestart: data.requiresRestart,
        helpText: data.helpText,
        isExperimental: data.isExperimental,
        isActive: data.isActive
      };

      const response = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update setting');
      }

      return response.json();
    },
    onSuccess: () => {
      logger.info('Setting updated successfully');
      onSuccess();
    },
    onError: (error) => {
      logger.error('Failed to update setting:', error);
    }
  });

  const onSubmit = (data: EditSettingFormData) => {
    updateSettingMutation.mutate(data);
  };

  const CategoryIcon = categoryIcons[watchedCategory];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Setting Info */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="outline" className="font-mono text-xs">
            {setting.key}
          </Badge>
          <Badge className={categoryColors[setting.category as keyof typeof categoryColors]}>
            <CategoryIcon className="h-3 w-3 mr-1" />
            {setting.category}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <strong>Current Value:</strong> {JSON.stringify(setting.value)} 
          <span className="ml-2">({typeof setting.value})</span>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              {...register('displayName', { required: 'Display name is required' })}
              placeholder="Setting Display Name"
              className={errors.displayName ? 'border-red-500' : ''}
            />
            {errors.displayName && (
              <p className="text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe what this setting controls..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="helpText">Help Text</Label>
            <Textarea
              id="helpText"
              {...register('helpText')}
              placeholder="Detailed help text for administrators..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CategoryIcon className="h-5 w-5" />
            Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select
              value={watchedCategory}
              onValueChange={(value) => setValue('category', value as any, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryIcons).map(([key, Icon]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="capitalize">{key}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={categoryColors[watchedCategory]}>
              <CategoryIcon className="h-3 w-3 mr-1" />
              {watchedCategory}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Access Control & Behavior */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Control & Behavior
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Access Level *</Label>
            <Select
              value={watch('accessLevel')}
              onValueChange={(value) => setValue('accessLevel', value as any, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin Only</SelectItem>
                <SelectItem value="admin">Admin and Above</SelectItem>
                <SelectItem value="moderator">Moderator and Above</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>User-Specific</Label>
                <p className="text-xs text-muted-foreground">
                  Each user has their own value
                </p>
              </div>
              <Switch
                checked={watch('isUserSpecific')}
                onCheckedChange={(checked) => setValue('isUserSpecific', checked, { shouldDirty: true })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Read-Only</Label>
                <p className="text-xs text-muted-foreground">
                  Cannot be edited
                </p>
              </div>
              <Switch
                checked={watch('isReadOnly')}
                onCheckedChange={(checked) => setValue('isReadOnly', checked, { shouldDirty: true })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requires Restart</Label>
                <p className="text-xs text-muted-foreground">
                  Application restart needed
                </p>
              </div>
              <Switch
                checked={watch('requiresRestart')}
                onCheckedChange={(checked) => setValue('requiresRestart', checked, { shouldDirty: true })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Experimental</Label>
                <p className="text-xs text-muted-foreground">
                  Mark as experimental feature
                </p>
              </div>
              <Switch
                checked={watch('isExperimental')}
                onCheckedChange={(checked) => setValue('isExperimental', checked, { shouldDirty: true })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Setting is active and usable
                </p>
              </div>
              <Switch
                checked={watch('isActive')}
                onCheckedChange={(checked) => setValue('isActive', checked, { shouldDirty: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning for sensitive settings */}
      {(watch('category') === 'security' || watch('requiresRestart')) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> {watch('category') === 'security' && 'Security settings can affect platform safety. '}
            {watch('requiresRestart') && 'This setting requires an application restart to take effect. '}
            Please ensure you understand the implications of these changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-muted/50 p-3 rounded text-xs space-y-1">
          <div><strong>Form State:</strong></div>
          <div>• isValid: {isValid ? '✅' : '❌'}</div>
          <div>• isDirty: {isDirty ? '✅' : '❌'}</div>
          <div>• isPending: {updateSettingMutation.isPending ? '✅' : '❌'}</div>
          <div>• Button Enabled: {(!isValid || updateSettingMutation.isPending) ? '❌' : '✅'}</div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={updateSettingMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid || updateSettingMutation.isPending}
        >
          {updateSettingMutation.isPending ? 'Updating...' : 'Update Setting'}
        </Button>
      </div>

      {/* Error Display */}
      {updateSettingMutation.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {updateSettingMutation.error.message}
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
} 