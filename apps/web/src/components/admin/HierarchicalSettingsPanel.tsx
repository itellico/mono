'use client';
// ============================
// HIERARCHICAL SETTINGS PANEL
// ============================
// Demonstrates proper UI for multi-level settings management
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Globe, 
  Building, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Shield,
  Clock,
  Zap
} from 'lucide-react';
// ============================
// TYPES
// ============================
interface EffectiveSetting {
  value: any;
  source: 'global' | 'tenant' | 'computed';
  isOverridden: boolean;
  constraints?: {
    maxValue?: any;
    minValue?: any;
    allowedValues?: any[];
    allowedFormats?: string[];
    requiresApproval?: boolean;
  };
  metadata: {
    lastModifiedBy?: number;
    lastModified?: Date;
    approvedBy?: number;
    approvedAt?: Date;
  };
}
interface PendingSetting {
  id: number;
  tenantId: number;
  category: string;
  key: string;
  value: any;
  displayName: string;
  description: string;
  lastModifiedBy: number;
  updatedAt: Date;
  requiresApproval: boolean;
}
interface HierarchicalSettingsPanelProps {
  tenantId: number;
  userRole: 'super_admin' | 'tenant_admin' | 'content_moderator';
  className?: string;
}
// ============================
// MAIN COMPONENT
// ============================
export function HierarchicalSettingsPanel({ 
  tenantId, 
  userRole, 
  className 
}: HierarchicalSettingsPanelProps) {
  const { toast } = useToast();
  // State
  const [activeTab, setActiveTab] = useState('media');
  const [settings, setSettings] = useState<Record<string, EffectiveSetting>>({});
  const [pendingSettings, setPendingSettings] = useState<PendingSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Editable values (separate from fetched settings)
  const [editableValues, setEditableValues] = useState<Record<string, any>>({});
  // ============================
  // DATA FETCHING
  // ============================
  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Fetch all tenant settings
      const response = await fetch(
        `/api/admin/settings/hierarchical?mode=all&tenantId=${tenantId}`
      );
      const data = await response.json();
      if (data.success) {
        setSettings(data.data.settings);
        // Initialize editable values
        const initialValues: Record<string, any> = {};
        Object.entries(data.data.settings).forEach(([key, setting]) => {
          initialValues[key] = (setting as any).value;
        });
        setEditableValues(initialValues);
      }
      // Fetch pending approvals
      const pendingResponse = await fetch(
        `/api/admin/settings/hierarchical?mode=pending&tenantId=${tenantId}`
      );
      const pendingData = await pendingResponse.json();
      if (pendingData.success) {
        setPendingSettings(pendingData.data.pending);
      }
    } catch (error) {
      toast({
        title: 'Error Loading Settings',
        description: 'Failed to load hierarchical settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSettings();
  }, [tenantId]);
  // ============================
  // UPDATE FUNCTIONS
  // ============================
  const validateSetting = async (category: string, key: string, value: any) => {
    try {
      const response = await fetch('/api/admin/settings/hierarchical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          category,
          key,
          value,
          tenantId
        })
      });
      const data = await response.json();
      return data.success ? data.data.validation : null;
    } catch (error) {
      return null;
    }
  };
  const updateSetting = async (category: string, key: string, value: any) => {
    try {
      setSaving(true);
      // Validate first
      const validation = await validateSetting(category, key, value);
      if (validation && !validation.isValid) {
        toast({
          title: 'Validation Failed',
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return false;
      }
      // Update setting
      const response = await fetch('/api/admin/settings/hierarchical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          category,
          key,
          value,
          tenantId
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Setting Updated',
          description: data.data.message,
          variant: data.data.requiresApproval ? 'default' : 'default'
        });
        // Refresh settings
        await fetchSettings();
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
        description: 'Failed to update setting',
        variant: 'destructive'
      });
      return false;
    } finally {
      setSaving(false);
    }
  };
  const approveSetting = async (settingId: number) => {
    try {
      const response = await fetch('/api/admin/settings/hierarchical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          settingId
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Setting Approved',
          description: 'The setting change has been approved',
          variant: 'default'
        });
        await fetchSettings();
      } else {
        toast({
          title: 'Approval Failed',
          description: data.details?.join(', ') || data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve setting',
        variant: 'destructive'
      });
    }
  };
  // ============================
  // RENDER HELPERS
  // ============================
  const renderSourceBadge = (setting: EffectiveSetting) => {
    const sourceConfig = {
      global: { icon: Globe, color: 'secondary', text: 'Global Default' },
      tenant: { icon: Building, color: 'default', text: 'Tenant Override' },
      computed: { icon: Zap, color: 'outline', text: 'Computed' }
    };
    const config = sourceConfig[setting.source];
    const Icon = config.icon;
    return (
      <Badge variant={config.color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };
  const renderConstraintInfo = (setting: EffectiveSetting) => {
    if (!setting.constraints) return null;
    const { maxValue, minValue, allowedValues, allowedFormats, requiresApproval } = setting.constraints;
    return (
      <div className="text-xs text-muted-foreground space-y-1">
        {maxValue !== undefined && (
          <div>Max Value: {JSON.stringify(maxValue)}</div>
        )}
        {minValue !== undefined && (
          <div>Min Value: {JSON.stringify(minValue)}</div>
        )}
        {allowedValues && (
          <div>Allowed: {allowedValues.join(', ')}</div>
        )}
        {allowedFormats && (
          <div>Formats: {allowedFormats.join(', ')}</div>
        )}
        {requiresApproval && (
          <div className="flex items-center gap-1 text-orange-600">
            <Shield className="h-3 w-3" />
            Requires Approval
          </div>
        )}
      </div>
    );
  };
  const renderSettingInput = (category: string, key: string, setting: EffectiveSetting) => {
    const settingKey = `${category}.${key}`;
    const currentValue = editableValues[settingKey] ?? setting.value;
    const hasChanged = JSON.stringify(currentValue) !== JSON.stringify(setting.value);
    const updateValue = (value: any) => {
      setEditableValues(prev => ({
        ...prev,
        [settingKey]: value
      }));
    };
    // Different input types based on setting type
    if (typeof setting.value === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={settingKey}
            checked={currentValue}
            onCheckedChange={updateValue}
            disabled={userRole !== 'super_admin' && userRole !== 'tenant_admin'}
          />
          <Label htmlFor={settingKey}>Enabled</Label>
        </div>
      );
    }
    if (setting.constraints?.allowedValues) {
      return (
        <Select value={String(currentValue)} onValueChange={updateValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {setting.constraints.allowedValues.map((value: any) => (
              <SelectItem key={value} value={String(value)}>
                {String(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (Array.isArray(setting.value)) {
      return (
        <Input
          value={Array.isArray(currentValue) ? currentValue.join(', ') : currentValue}
          onChange={(e) => updateValue(e.target.value.split(', ').map(s => s.trim()))}
          placeholder="Comma-separated values"
          disabled={userRole !== 'super_admin' && userRole !== 'tenant_admin'}
        />
      );
    }
    return (
      <Input
        type={typeof setting.value === 'number' ? 'number' : 'text'}
        value={currentValue}
        onChange={(e) => updateValue(
          typeof setting.value === 'number' 
            ? parseFloat(e.target.value) || 0 
            : e.target.value
        )}
        disabled={userRole !== 'super_admin' && userRole !== 'tenant_admin'}
      />
    );
  };
  const renderCategorySettings = (category: string) => {
    const categorySettings = Object.entries(settings).filter(
      ([key]) => key.startsWith(`${category}.`)
    );
    if (categorySettings.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No settings found for {category}
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {categorySettings.map(([settingKey, setting]) => {
          const [cat, key] = settingKey.split('.');
          const hasChanged = JSON.stringify(editableValues[settingKey]) !== JSON.stringify(setting.value);
          return (
            <Card key={settingKey}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</CardTitle>
                    <CardDescription>
                      {setting.metadata.lastModified && (
                        <span className="text-xs">
                          Last modified: {new Date(setting.metadata.lastModified).toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSourceBadge(setting)}
                    {hasChanged && (
                      <Badge variant="outline" className="text-orange-600">
                        Modified
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={settingKey}>Value</Label>
                  {renderSettingInput(cat, key, setting)}
                </div>
                {renderConstraintInfo(setting)}
                {hasChanged && (userRole === 'super_admin' || userRole === 'tenant_admin') && (
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => updateSetting(cat, key, editableValues[settingKey])}
                      disabled={saving}
                    >
                      Save Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditableValues(prev => ({
                        ...prev,
                        [settingKey]: setting.value
                      }))}
                    >
                      Reset
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };
  // ============================
  // RENDER
  // ============================
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading hierarchical settings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className={className}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Hierarchical Settings
          </CardTitle>
          <CardDescription>
            Manage tenant-specific settings within platform constraints. 
            {userRole === 'super_admin' && ' Super admins can modify global constraints.'}
            {userRole === 'tenant_admin' && ' Tenant admins can configure values within global limits.'}
          </CardDescription>
        </CardHeader>
      </Card>
      {/* Pending Approvals */}
      {pendingSettings.length > 0 && userRole === 'super_admin' && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock className="h-5 w-5" />
              Pending Approvals ({pendingSettings.length})
            </CardTitle>
            <CardDescription className="text-orange-700">
              Settings changes waiting for super admin approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium">
                      {setting.displayName} ({setting.category}.{setting.key})
                    </div>
                    <div className="text-sm text-muted-foreground">
                      New value: {JSON.stringify(setting.value)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => approveSetting(setting.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Settings by Category */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ui">UI</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="media" className="mt-6">
          {renderCategorySettings('media')}
        </TabsContent>
        <TabsContent value="general" className="mt-6">
          {renderCategorySettings('general')}
        </TabsContent>
        <TabsContent value="ui" className="mt-6">
          {renderCategorySettings('ui')}
        </TabsContent>
        <TabsContent value="business" className="mt-6">
          {renderCategorySettings('business')}
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          {renderCategorySettings('security')}
        </TabsContent>
      </Tabs>
      {/* Help Information */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">How Hierarchical Settings Work:</div>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li><strong>Global Settings:</strong> Platform-wide defaults and maximums set by super admins</li>
                <li><strong>Tenant Overrides:</strong> Tenant-specific values within global constraints</li>
                <li><strong>Inheritance:</strong> Tenant gets global value unless overridden</li>
                <li><strong>Validation:</strong> All tenant values validated against global constraints</li>
                <li><strong>Approval:</strong> Some settings require super admin approval</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 