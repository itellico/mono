'use client';

import React from 'react';
import { AdminEditForm } from '@/components/admin/shared/AdminEditForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { type Tenant } from '@/lib/schemas/tenants';
import { useUpdateTenant } from '@/hooks/admin/useTenants';

interface TenantEditClientProps {
  initialTenant: Tenant;
}

interface TenantFormFieldsProps {
  formData?: Tenant;
  setFormData?: React.Dispatch<React.SetStateAction<Tenant>>;
}

function TenantFormFields({ formData, setFormData }: TenantFormFieldsProps) {
  // These will be injected by AdminEditForm
  if (!formData || !setFormData) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter tenant name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">Domain *</Label>
        <Input
          id="domain"
          value={formData.domain || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
          placeholder="example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={formData.slug || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
          placeholder="tenant-slug"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultCurrency">Default Currency</Label>
        <Select
          value={formData.defaultCurrency || 'USD'}
          onValueChange={(value) => setFormData(prev => ({ ...prev, defaultCurrency: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD - US Dollar</SelectItem>
            <SelectItem value="EUR">EUR - Euro</SelectItem>
            <SelectItem value="GBP">GBP - British Pound</SelectItem>
            <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
            <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive || false}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Inactive tenants cannot access the platform
        </p>
      </div>
    </div>
  );
}

export function TenantEditClient({ initialTenant }: TenantEditClientProps) {
  const updateTenantMutation = useUpdateTenant();

  const handleSave = async (formData: Partial<Tenant>) => {
    // Extract only the fields that can be updated
    const updateData = {
      name: formData.name,
      domain: formData.domain,
      slug: formData.slug,
      defaultCurrency: formData.defaultCurrency,
      isActive: formData.isActive,
      description: formData.description,
      settings: formData.settings,
      features: formData.features,
    };

    // Remove undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Use the TanStack Query mutation
    await updateTenantMutation.mutateAsync({
      uuid: initialTenant.uuid,
      data: cleanedData,
    });
  };

  return (
    <AdminEditForm
      title="Tenant Management"
      description="Update tenant information and settings"
      initialData={initialTenant}
      onSave={handleSave}
      backUrl="/admin/tenants"
    >
      <TenantFormFields />
    </AdminEditForm>
  );
} 