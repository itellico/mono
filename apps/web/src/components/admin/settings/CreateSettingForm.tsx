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

interface CreateSettingFormData {
  key: string;
  displayName: string;
  description?: string;
  type: 'boolean' | 'string' | 'integer' | 'float' | 'json';
  value: string; // We'll parse this based on type
  defaultValue?: string;
  category: 'security' | 'development' | 'features' | 'maintenance' | 'performance' | 'ui' | 'notifications';
  accessLevel: 'super_admin' | 'admin' | 'moderator';
  isUserSpecific: boolean;
  isReadOnly: boolean;
  requiresRestart: boolean;
  helpText?: string;
  isExperimental: boolean;
}

interface CreateSettingFormProps {
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

export function CreateSettingForm({ onSuccess, onCancel }: CreateSettingFormProps) {
  const [previewValue, setPreviewValue] = useState<any>(null);
  const [valueError, setValueError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<CreateSettingFormData>({
    defaultValues: {
      type: 'string',
      category: 'features',
      accessLevel: 'super_admin',
      isUserSpecific: false,
      isReadOnly: false,
      requiresRestart: false,
      isExperimental: false
    }
  });

  const watchedType = watch('type');
  const watchedCategory = watch('category');
  const watchedValue = watch('value');

  // Parse and validate value based on type
  React.useEffect(() => {
    if (!watchedValue) {
      setPreviewValue(null);
      setValueError('');
      return;
    }

    try {
      let parsed: any;
      switch (watchedType) {
        case 'boolean':
          parsed = watchedValue.toLowerCase() === 'true';
          break;
        case 'integer':
          parsed = parseInt(watchedValue);
          if (isNaN(parsed)) throw new Error('Invalid integer');
          break;
        case 'float':
          parsed = parseFloat(watchedValue);
          if (isNaN(parsed)) throw new Error('Invalid float');
          break;
        case 'json':
          parsed = JSON.parse(watchedValue);
          break;
        case 'string':
        default:
          parsed = watchedValue;
          break;
      }
      setPreviewValue(parsed);
      setValueError('');
    } catch (error) {
      setPreviewValue(null);
      setValueError(`Invalid ${watchedType}: ${error.message}`);
    }
  }, [watchedValue, watchedType]);

  const createSettingMutation = useMutation({
    mutationFn: async (data: CreateSettingFormData) => {
      // Parse the value based on type
      let parsedValue: any;
      let parsedDefaultValue: any;

      try {
        switch (data.type) {
          case 'boolean':
            parsedValue = data.value.toLowerCase() === 'true';
            parsedDefaultValue = data.defaultValue ? data.defaultValue.toLowerCase() === 'true' : parsedValue;
            break;
          case 'integer':
            parsedValue = parseInt(data.value);
            parsedDefaultValue = data.defaultValue ? parseInt(data.defaultValue) : parsedValue;
            break;
          case 'float':
            parsedValue = parseFloat(data.value);
            parsedDefaultValue = data.defaultValue ? parseFloat(data.defaultValue) : parsedValue;
            break;
          case 'json':
            parsedValue = JSON.parse(data.value);
            parsedDefaultValue = data.defaultValue ? JSON.parse(data.defaultValue) : parsedValue;
            break;
          case 'string':
          default:
            parsedValue = data.value;
            parsedDefaultValue = data.defaultValue || parsedValue;
            break;
        }
      } catch (error) {
        throw new Error(`Invalid ${data.type} value: ${error.message}`);
      }

      const payload = {
        key: data.key,
        displayName: data.displayName,
        description: data.description,
        type: data.type,
        value: parsedValue,
        defaultValue: parsedDefaultValue,
        category: data.category,
        accessLevel: data.accessLevel,
        isUserSpecific: data.isUserSpecific,
        isReadOnly: data.isReadOnly,
        requiresRestart: data.requiresRestart,
        helpText: data.helpText,
        isExperimental: data.isExperimental
      };

      const response = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create setting');
      }

      return response.json();
    },
    onSuccess: () => {
      logger.info('Setting created successfully');
      onSuccess();
    },
    onError: (error) => {
      logger.error('Failed to create setting:', error);
    }
  });

  const onSubmit = (data: CreateSettingFormData) => {
    if (valueError) {
      return;
    }
    createSettingMutation.mutate(data);
  };

  const getValuePlaceholder = (type: string) => {
    switch (type) {
      case 'boolean': return 'true or false';
      case 'integer': return '42';
      case 'float': return '3.14';
      case 'json': return '{"key": "value"}';
      case 'string':
      default: return 'Enter string value';
    }
  };

  const CategoryIcon = categoryIcons[watchedCategory];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key">Setting Key *</Label>
              <Input
                id="key"
                {...register('key', { 
                  required: 'Setting key is required',
                  pattern: {
                    value: /^[a-z][a-z0-9_]*[a-z0-9]$/,
                    message: 'Key must be lowercase letters, numbers, and underscores only'
                  }
                })}
                placeholder="my_custom_setting"
                className={errors.key ? 'border-red-500' : ''}
              />
              {errors.key && (
                <p className="text-sm text-red-500">{errors.key.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                {...register('displayName', { required: 'Display name is required' })}
                placeholder="My Custom Setting"
                className={errors.displayName ? 'border-red-500' : ''}
              />
              {errors.displayName && (
                <p className="text-sm text-red-500">{errors.displayName.message}</p>
              )}
            </div>
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

      {/* Category and Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CategoryIcon className="h-5 w-5" />
            Category & Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={watchedCategory}
                onValueChange={(value) => setValue('category', value as any)}
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

            <div className="space-y-2">
              <Label>Data Type *</Label>
              <Select
                value={watchedType}
                onValueChange={(value) => setValue('type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="integer">Integer</SelectItem>
                  <SelectItem value="float">Float</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={categoryColors[watchedCategory]}>
              <CategoryIcon className="h-3 w-3 mr-1" />
              {watchedCategory}
            </Badge>
            <Badge variant="outline">{watchedType}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Value Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="h-5 w-5" />
            Value Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Current Value *</Label>
              <Input
                id="value"
                {...register('value', { required: 'Value is required' })}
                placeholder={getValuePlaceholder(watchedType)}
                className={errors.value || valueError ? 'border-red-500' : ''}
              />
              {errors.value && (
                <p className="text-sm text-red-500">{errors.value.message}</p>
              )}
              {valueError && (
                <p className="text-sm text-red-500">{valueError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                {...register('defaultValue')}
                placeholder={getValuePlaceholder(watchedType)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use current value as default
              </p>
            </div>
          </div>

          {previewValue !== null && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Parsed Value:</strong> {JSON.stringify(previewValue)} 
                <span className="text-muted-foreground ml-2">({typeof previewValue})</span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Access Control */}
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
              onValueChange={(value) => setValue('accessLevel', value as any)}
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
                onCheckedChange={(checked) => setValue('isUserSpecific', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Read-Only</Label>
                <p className="text-xs text-muted-foreground">
                  Cannot be edited after creation
                </p>
              </div>
              <Switch
                checked={watch('isReadOnly')}
                onCheckedChange={(checked) => setValue('isReadOnly', checked)}
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
                onCheckedChange={(checked) => setValue('requiresRestart', checked)}
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
                onCheckedChange={(checked) => setValue('isExperimental', checked)}
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
            Please ensure you understand the implications before creating this setting.
          </AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={createSettingMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid || !!valueError || createSettingMutation.isPending}
        >
          {createSettingMutation.isPending ? 'Creating...' : 'Create Setting'}
        </Button>
      </div>

      {/* Error Display */}
      {createSettingMutation.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {createSettingMutation.error.message}
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
} 