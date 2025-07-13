'use client';
// ============================
// SUPER ADMIN HIERARCHICAL SETTINGS
// ============================
// Restricted access component for super admins to manage platform constraints
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings2, 
  Globe, 
  Shield,
  AlertTriangle, 
  Info,
  CheckCircle,
  Clock,
  Building,
  Users,
  FileType,
  Sliders,
  ShieldIcon,
  SaveIcon,
  SettingsIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  UploadIcon,
  UsersIcon,
  ClockIcon,
  DatabaseIcon,
  TagIcon,
  MaximizeIcon,
  MinimizeIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  MailIcon,
  ActivityIcon,
  GlobeIcon,
  BanknoteIcon
} from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';
// ============================
// TYPES
// ============================
interface GlobalSetting {
  id: number;
  category: string;
  key: string;
  level: 'global';
  governance: 'super_admin_only';
  value: any;
  defaultValue?: any;
  maxValue?: any;
  minValue?: any;
  allowedValues?: any[];
  allowedFormats?: string[];
  displayName: string;
  description: string;
  helpText?: string;
  validationSchema?: any;
  requiresRestart: boolean;
  isRequired: boolean;
  lastModifiedBy?: number;
  updatedAt?: string;
}
interface TenantConstraintSummary {
  tenantId: number;
  tenantName: string;
  overrides: number;
  violations: number;
  lastActivity: string;
}
interface Setting {
  id: number;
  category: string;
  key: string;
  value: any;
  defaultValue: any;
  maxValue?: any;
  minValue?: any;
  allowedValues?: any[];
  allowedFormats?: string[];
  displayName: string;
  description: string;
  governance: 'super_admin_only' | 'tenant_admin' | 'inherited' | 'computed';
  level: 'global' | 'tenant';
  requiresApproval: boolean;
  isRequired: boolean;
}
interface SettingsCategory {
  category: string;
  displayName: string;
  icon: any;
  description: string;
  settings: Setting[];
}
interface CategoryConfig {
  displayName: string;
  icon: any;
  description: string;
  color?: string;
}
// ============================
// MAIN COMPONENT
// ============================
const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  media: {
    displayName: 'Media & Upload',
    icon: ImageIcon,
    description: 'File upload limits, formats, and media processing constraints',
    color: 'bg-blue-50 border-blue-200 text-blue-900'
  },
  queue: {
    displayName: 'Workers & Queue',
    icon: ActivityIcon,
    description: 'Background job processing, worker control, and queue management',
    color: 'bg-green-50 border-green-200 text-green-900'
  },
  general: {
    displayName: 'General Platform',
    icon: SettingsIcon,
    description: 'Core platform settings and user session management',
    color: 'bg-gray-50 border-gray-200 text-gray-900'
  },
  business: {
    displayName: 'Business Rules',
    icon: BanknoteIcon,
    description: 'Application limits, rate limiting, and business constraints',
    color: 'bg-purple-50 border-purple-200 text-purple-900'
  }
};
// File size presets with nice UX
const FILE_SIZE_PRESETS = [
  { label: '10MB', value: 10, description: 'Small files' },
  { label: '25MB', value: 25, description: 'Standard' },
  { label: '50MB', value: 50, description: 'Large files' },
  { label: '100MB', value: 100, description: 'Very large' },
  { label: '250MB', value: 250, description: 'Extra large' },
  { label: '500MB', value: 500, description: 'Maximum' }
];
// Format presets for media files
const FORMAT_PRESETS: Record<string, string[]> = {
  basic: ['jpg', 'jpeg', 'png'],
  standard: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  professional: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'raw'],
  video: ['mp4', 'mov', 'avi', 'wmv'],
  documents: ['pdf', 'doc', 'docx', 'txt']
};
export function SuperAdminHierarchicalSettings() {
  const { toast } = useToast();
  // State
  const [activeTab, setActiveTab] = useState('platform-constraints');
  const [globalSettings, setGlobalSettings] = useState<Record<string, GlobalSetting>>({});
  const [tenantSummaries, setTenantSummaries] = useState<TenantConstraintSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Editable values
  const [editableValues, setEditableValues] = useState<Record<string, any>>({});
  // ============================
  // DATA FETCHING
  // ============================
  const fetchGlobalSettings = async () => {
    try {
      setLoading(true);
      // Fetch global settings (tenantId = null)
      const response = await fetch(
        `/api/v1/admin/settings/hierarchical?mode=global&level=global`
      );
      const data = await response.json();
      if (data.success) {
        setGlobalSettings(data.data.settings);
        // Initialize editable values
        const initialValues: Record<string, any> = {};
        Object.entries(data.data.settings).forEach(([key, setting]) => {
          initialValues[key] = (setting as any).value;
        });
        setEditableValues(initialValues);
      }
      // Fetch tenant constraint summaries
      const summaryResponse = await fetch(
        `/api/v1/admin/settings/hierarchical?mode=tenant-summary`
      );
      const summaryData = await summaryResponse.json();
      if (summaryData.success) {
        setTenantSummaries(summaryData.data.tenants);
      }
    } catch (error) {
      toast({
        title: 'Error Loading Settings',
        description: 'Failed to load global constraint settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchGlobalSettings();
  }, []);
  // ============================
  // UPDATE FUNCTIONS
  // ============================
  const updateGlobalSetting = async (category: string, key: string, field: string, value: any) => {
    try {
      setSaving(true);
      const response = await fetch('/api/v1/admin/settings/hierarchical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-global',
          category,
          key,
          field, // 'value', 'maxValue', 'minValue', 'allowedValues', etc.
          value
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Global Constraint Updated',
          description: `${category}.${key}.${field} updated successfully`,
          variant: 'default'
        });
        await fetchGlobalSettings();
        return true;
      } else {
        toast({
          title: 'Update Failed',
          description: data.details?.join(', ') || data.error,
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update global constraint',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };
  // ============================
  // RENDER HELPERS WITH ENHANCED UX
  // ============================
  // Render file size setting with clickable presets
  const renderFileSizeConstraint = (setting: GlobalSetting) => {
    const currentValue = editableValues[`${setting.category}.${setting.key}.value`] ?? setting.value;
    const maxValue = editableValues[`${setting.category}.${setting.key}.maxValue`] ?? setting.maxValue;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">{setting.displayName}</Label>
            <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Ceiling: {maxValue}MB
            </Badge>
            <Badge variant="destructive" className="text-xs">
              Super Admin Only
            </Badge>
          </div>
        </div>
        {/* Default Value Presets */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Default for Tenants</Label>
          <div className="flex flex-wrap gap-2">
            {FILE_SIZE_PRESETS.filter(preset => !maxValue || preset.value <= maxValue).map(preset => (
              <Button
                key={preset.value}
                variant={currentValue === preset.value ? 'default' : 'outline'}
                size="sm"
                className="h-8"
                onClick={() => {
                  setEditableValues(prev => ({
                    ...prev,
                    [`${setting.category}.${setting.key}.value`]: preset.value
                  }));
                  updateGlobalSetting(setting.category, setting.key, 'value', preset.value);
                }}
                disabled={saving}
              >
                {preset.label}
                <span className="ml-1 text-xs opacity-70">{preset.description}</span>
              </Button>
            ))}
          </div>
        </div>
        {/* Custom Default Input */}
        <div className="flex items-center space-x-2">
          <Label className="text-xs text-muted-foreground w-20">Custom:</Label>
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setEditableValues(prev => ({
                ...prev,
                [`${setting.category}.${setting.key}.value`]: value
              }));
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value);
              if (value && value !== setting.value) {
                updateGlobalSetting(setting.category, setting.key, 'value', value);
              }
            }}
            className="w-24"
            min={setting.minValue || 1}
            max={maxValue}
          />
          <span className="text-sm text-muted-foreground">MB</span>
        </div>
        {/* Maximum Ceiling Input */}
        <Separator />
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Platform Maximum (Ceiling)</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={maxValue}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setEditableValues(prev => ({
                  ...prev,
                  [`${setting.category}.${setting.key}.maxValue`]: value
                }));
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (value && value !== setting.maxValue) {
                  updateGlobalSetting(setting.category, setting.key, 'maxValue', value);
                }
              }}
              className="w-24"
              min={currentValue || 1}
            />
            <span className="text-sm text-muted-foreground">MB maximum</span>
            <Badge variant="outline" className="text-xs">
              Tenants cannot exceed this
            </Badge>
          </div>
        </div>
      </div>
    );
  };
  // Render file formats with clickable presets
  const renderFileFormatsConstraint = (setting: GlobalSetting) => {
    const currentFormats = editableValues[`${setting.category}.${setting.key}.value`] ?? setting.value ?? [];
    const allowedFormats = setting.allowedFormats || [];
    const toggleFormat = (format: string) => {
      const newFormats = currentFormats.includes(format)
        ? currentFormats.filter((f: string) => f !== format)
        : [...currentFormats, format];
      setEditableValues(prev => ({
        ...prev,
        [`${setting.category}.${setting.key}.value`]: newFormats
      }));
      updateGlobalSetting(setting.category, setting.key, 'value', newFormats);
    };
    const setPreset = (presetKey: string) => {
      const presetFormats = FORMAT_PRESETS[presetKey] || [];
      const validFormats = presetFormats;
      setEditableValues(prev => ({
        ...prev,
        [`${setting.category}.${setting.key}.value`]: validFormats
      }));
      updateGlobalSetting(setting.category, setting.key, 'value', validFormats);
    };
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">{setting.displayName}</Label>
            <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {currentFormats.length} of {allowedFormats.length} enabled
          </Badge>
        </div>
        {/* Format Preset Buttons */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(FORMAT_PRESETS).map(([key, formats]) => {
              const validFormats = formats.filter((f: string) => allowedFormats.includes(f));
              const isSelected = validFormats.every((f: string) => currentFormats.includes(f)) && validFormats.length > 0;
              return (
                <Button
                  key={key}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="h-8"
                  onClick={() => setPreset(key)}
                  disabled={saving || validFormats.length === 0}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  <span className="ml-1 text-xs opacity-70">({validFormats.length})</span>
                </Button>
              );
            })}
          </div>
        </div>
        {/* Individual Format Toggles */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Individual Formats</Label>
          <div className="flex flex-wrap gap-2">
            {allowedFormats.map(format => (
              <Button
                key={format}
                variant={currentFormats.includes(format) ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => toggleFormat(format)}
                disabled={saving}
              >
                .{format}
              </Button>
            ))}
          </div>
        </div>
        {saving && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Updating formats...</span>
          </div>
        )}
      </div>
    );
  };
  // Render boolean settings with nice toggles
  const renderBooleanConstraint = (setting: GlobalSetting) => {
    const currentValue = editableValues[`${setting.category}.${setting.key}.value`] ?? setting.value;
    return (
      <div className="flex items-center justify-between py-4">
        <div className="flex-1">
          <Label className="text-sm font-medium">{setting.displayName}</Label>
          <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant={currentValue ? 'default' : 'outline'} className="text-xs">
              {currentValue ? 'Enabled' : 'Disabled'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {setting.governance === 'super_admin_only' ? 'Super Admin Control' : 'Tenant Configurable'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Switch
            checked={currentValue}
            onCheckedChange={(checked) => {
              setEditableValues(prev => ({
                ...prev,
                [`${setting.category}.${setting.key}.value`]: checked
              }));
              updateGlobalSetting(setting.category, setting.key, 'value', checked);
            }}
            disabled={saving}
          />
          {saving && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>
    );
  };
  // Render numeric settings with constraints
  const renderNumericConstraint = (setting: GlobalSetting) => {
    const currentValue = editableValues[`${setting.category}.${setting.key}.value`] ?? setting.value;
    const maxValue = setting.maxValue;
    const minValue = setting.minValue;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">{setting.displayName}</Label>
            <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            {minValue !== null && (
              <Badge variant="outline" className="text-xs">
                Min: {minValue}
              </Badge>
            )}
            {maxValue !== null && (
              <Badge variant="outline" className="text-xs">
                Max: {maxValue}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setEditableValues(prev => ({
                ...prev,
                [`${setting.category}.${setting.key}.value`]: value
              }));
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value);
              if (value && value !== setting.value) {
                updateGlobalSetting(setting.category, setting.key, 'value', value);
              }
            }}
            className="w-32"
            min={minValue}
            max={maxValue}
          />
          <Badge variant="outline" className="text-xs">
            {setting.key.includes('timeout') || setting.key.includes('delay') ? 'milliseconds' : 
             setting.key.includes('days') ? 'days' :
             setting.key.includes('hours') ? 'hours' : 'units'}
          </Badge>
          {saving && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>
    );
  };
  const renderConstraintInput = (setting: GlobalSetting, field: 'value' | 'maxValue' | 'minValue' | 'defaultValue') => {
    // Enhanced rendering based on setting type
    if (setting.key === 'max_file_size_mb' && field === 'value') {
      return renderFileSizeConstraint(setting);
    }
    if (setting.key === 'allowed_file_formats' && field === 'value') {
      return renderFileFormatsConstraint(setting);
    }
    if (typeof setting.value === 'boolean' && field === 'value') {
      return renderBooleanConstraint(setting);
    }
    if (typeof setting.value === 'number' && field === 'value') {
      return renderNumericConstraint(setting);
    }
    // Fallback to original implementation for other cases
    const currentValue = editableValues[`${setting.category}.${setting.key}.${field}`] ?? setting[field];
    const updateValue = (value: any) => {
      setEditableValues(prev => ({
        ...prev,
        [`${setting.category}.${setting.key}.${field}`]: value
      }));
    };
    const fieldLabels = {
      value: 'Default Value',
      maxValue: 'Maximum Value',
      minValue: 'Minimum Value',
      defaultValue: 'Fallback Default'
    };
    if (typeof currentValue === 'boolean') {
      return (
        <div className="flex items-center justify-between">
          <Label className="text-sm">{fieldLabels[field]}</Label>
          <Switch
            checked={currentValue}
            onCheckedChange={(checked) => {
              updateValue(checked);
              updateGlobalSetting(setting.category, setting.key, field, checked);
            }}
          />
        </div>
      );
    }
    if (typeof currentValue === 'number') {
      return (
        <div className="space-y-2">
          <Label className="text-sm">{fieldLabels[field]}</Label>
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => updateValue(parseInt(e.target.value))}
            onBlur={(e) => {
              const value = parseInt(e.target.value);
              if (value !== setting[field]) {
                updateGlobalSetting(setting.category, setting.key, field, value);
              }
            }}
          />
        </div>
      );
    }
    if (Array.isArray(currentValue)) {
      return (
        <div className="space-y-2">
          <Label className="text-sm">{fieldLabels[field]}</Label>
          <Textarea
            value={JSON.stringify(currentValue, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                updateValue(parsed);
              } catch {}
            }}
            onBlur={() => {
              updateGlobalSetting(setting.category, setting.key, field, currentValue);
            }}
            rows={3}
          />
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <Label className="text-sm">{fieldLabels[field]}</Label>
        <Input
          value={currentValue}
          onChange={(e) => updateValue(e.target.value)}
          onBlur={(e) => {
            if (e.target.value !== setting[field]) {
              updateGlobalSetting(setting.category, setting.key, field, e.target.value);
            }
          }}
        />
      </div>
    );
  };
  const renderGlobalSettingCard = (setting: GlobalSetting) => {
    const categoryConfig = CATEGORY_CONFIG[setting.category];
    const Icon = categoryConfig?.icon || Settings2;
    return (
      <Card key={setting.key} className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${categoryConfig?.color || 'bg-gray-50'}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">{setting.displayName}</CardTitle>
                <CardDescription className="text-sm">
                  {setting.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="destructive" className="text-xs">
                Super Admin Only
              </Badge>
              <Badge variant="outline" className="text-xs">
                {setting.category}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderConstraintInput(setting, 'value')}
          {saving && (
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  const renderCategorySettings = (category: string) => {
    const categorySettings = Object.values(globalSettings).filter(
      setting => setting.category === category
    );
    if (categorySettings.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No global constraints defined for {category}</p>
          <p className="text-sm">Create platform-wide constraints to enable tenant configuration</p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {categorySettings.map(renderGlobalSettingCard)}
      </div>
    );
  };
  const renderTenantOverview = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tenant Constraint Summary
            </CardTitle>
            <CardDescription>
              Overview of how tenants are using the platform constraints you&apos;ve defined
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenantSummaries.map((tenant) => (
                <Card key={tenant.tenantId} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{tenant.tenantName}</h4>
                        <p className="text-sm text-muted-foreground">ID: {tenant.tenantId}</p>
                      </div>
                      <Building className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Setting Overrides:</span>
                        <Badge variant="outline">{tenant.overrides}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Constraint Violations:</span>
                        <Badge variant={tenant.violations > 0 ? 'destructive' : 'secondary'}>
                          {tenant.violations}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last activity: {new Date(tenant.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  // ============================
  // RENDER
  // ============================
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading hierarchical settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Shield className="h-5 w-5" />
            Platform Constraint Management
          </CardTitle>
          <CardDescription className="text-red-700">
            <strong>Super Admin Only:</strong> Define platform-wide constraints and maximums that control what tenant administrators can configure. 
            These settings establish the boundaries within which all tenants must operate.
          </CardDescription>
        </CardHeader>
      </Card>
      {/* Warning Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Impact Warning:</strong> Changes to platform constraints affect all tenants immediately. 
          Reducing maximum values may invalidate existing tenant configurations and require manual intervention.
        </AlertDescription>
      </Alert>
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="platform-constraints">Platform Constraints</TabsTrigger>
          <TabsTrigger value="tenant-overview">Tenant Overview</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="platform-constraints" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                All Platform Constraints
              </CardTitle>
              <CardDescription>
                Manage all platform-wide constraints that control tenant configuration boundaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.values(globalSettings).map(renderGlobalSettingCard)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tenant-overview" className="mt-6">
          {renderTenantOverview()}
        </TabsContent>
        <TabsContent value="media" className="mt-6">
          {renderCategorySettings('media')}
        </TabsContent>
        <TabsContent value="general" className="mt-6">
          {renderCategorySettings('general')}
        </TabsContent>
        <TabsContent value="business" className="mt-6">
          {renderCategorySettings('business')}
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          {renderCategorySettings('security')}
        </TabsContent>
      </Tabs>
      {/* Help Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Platform Constraint System:</div>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li><strong>Platform Default:</strong> The value tenants inherit if they don&apos;t override</li>
                <li><strong>Maximum Value:</strong> The highest value any tenant can set</li>
                <li><strong>Minimum Value:</strong> The lowest value any tenant can set</li>
                <li><strong>Allowed Values/Formats:</strong> Restrictive lists that tenants cannot exceed</li>
                <li><strong>Tenant Override:</strong> When tenants customize within your constraints</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}