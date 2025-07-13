'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { toast } from 'sonner';
import { invalidateTenantCache } from '@/lib/cache/tenant-cache';
import { TenantEditForm, TenantData, ValidationError } from '@/components/admin/tenants/TenantEditForm';

interface TenantEditClientProps {
  initialTenant: TenantData;
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
}

async function saveTenant(tenantData: TenantData): Promise<TenantData> {
  const isUpdate = !!tenantData.id;
  const endpoint = isUpdate 
    ? `/api/v1/admin/tenants/${tenantData.id}`
    : '/api/v1/admin/tenants';
    
  const response = await fetch(endpoint, {
    method: isUpdate ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tenantData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save tenant');
  }

  return response.json();
}

async function deleteTenant(tenantId: string): Promise<void> {
  const response = await fetch(`/api/v1/admin/tenants/${tenantId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete tenant');
  }
}

export function TenantEditClient({
  initialTenant,
  userContext,
}: TenantEditClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { trackClick } = useAuditTracking();

  const [formData, setFormData] = React.useState<TenantData>(initialTenant);
  const [errors, setErrors] = React.useState<ValidationError[]>([]);
  const [isDirty, setIsDirty] = React.useState(false);

  const handleFormChange = (key: string, value: any) => {
    setFormData(prev => {
      // Handle nested object updates
      if (key.includes('.')) {
        const keys = key.split('.');
        const newData = { ...prev };
        let current: any = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return newData;
      }
      
      return { ...prev, [key]: value };
    });
    setIsDirty(true);
    setErrors(prev => prev.filter(error => error.field !== key));
  };

  const validateFormData = (data: TenantData): ValidationError[] => {
    const newErrors: ValidationError[] = [];
    if (!data.name?.trim()) {
      newErrors.push({ field: 'name', message: 'Tenant name is required' });
    }
    if (!data.domain?.trim()) {
      newErrors.push({ field: 'domain', message: 'Domain is required' });
    } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(data.domain)) {
      newErrors.push({ field: 'domain', message: 'Invalid domain format' });
    }
    if (!data.contactEmail?.trim()) {
      newErrors.push({ field: 'contactEmail', message: 'Contact email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      newErrors.push({ field: 'contactEmail', message: 'Invalid email format' });
    }
    if (!data.status) {
      newErrors.push({ field: 'status', message: 'Status is required' });
    }
    if (!data.plan) {
      newErrors.push({ field: 'plan', message: 'Plan is required' });
    }
    return newErrors;
  };

  const saveTenantMutation = useMutation({
    mutationFn: saveTenant,
    onMutate: async (newTenantData) => {
      trackClick('save_tenant_button', {
        tenantId: newTenantData.id,
        isUpdate: !!newTenantData.id
      });

      await queryClient.cancelQueries({ queryKey: ['admin', 'tenants'] });
      const previousTenantData = queryClient.getQueryData(['admin', 'tenants', newTenantData.id]) as TenantData | undefined;
      
      queryClient.setQueryData(['admin', 'tenants', newTenantData.id], newTenantData);

      return { previousTenantData };
    },
    onSuccess: async (savedTenant) => {
      browserLogger.info('✅ Tenant saved successfully', { tenant: savedTenant });
      
      await invalidateTenantCache({
        tenantId: userContext?.tenantId,
        entityId: savedTenant.id,
        queryClient,
        context: 'client',
      });
      
      toast.success('Tenant saved successfully!');
      setIsDirty(false);
      router.push('/admin/tenants');
    },
    onError: (error, newTenantData, context) => {
      if (context?.previousTenantData) {
        queryClient.setQueryData(['admin', 'tenants', newTenantData.id], context.previousTenantData);
      }
      
      browserLogger.error('❌ Failed to save tenant', error);
      toast.error(`Failed to save tenant: ${error.message}`);
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: deleteTenant,
    onMutate: async (tenantId) => {
      trackClick('delete_tenant_button', { tenantId });

      await queryClient.cancelQueries({ queryKey: ['admin', 'tenants'] });
      const previousTenantData = queryClient.getQueryData(['admin', 'tenants', tenantId]) as TenantData | undefined;
      
      queryClient.setQueryData(['admin', 'tenants', tenantId], undefined);

      return { previousTenantData };
    },
    onSuccess: async (_, tenantId) => {
      browserLogger.info('✅ Tenant deleted successfully', { tenantId });
      
      await invalidateTenantCache({
        tenantId: userContext?.tenantId,
        entityId: tenantId,
        queryClient,
        context: 'client',
      });
      
      toast.success('Tenant deleted successfully!');
      router.push('/admin/tenants');
    },
    onError: (error, tenantId, context) => {
      if (context?.previousTenantData) {
        queryClient.setQueryData(['admin', 'tenants', tenantId], context.previousTenantData);
      }
      
      browserLogger.error('❌ Failed to delete tenant', error);
      toast.error(`Failed to delete tenant: ${error.message}`);
    },
  });

  const handleSave = async (data: TenantData) => {
    const validationErrors = validateFormData(data);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    await saveTenantMutation.mutateAsync(data);
  };

  const handleDelete = async (tenantId: string) => {
    await deleteTenantMutation.mutateAsync(tenantId);
  };

  return (
    <TenantEditForm
      tenantData={formData}
      isLoading={saveTenantMutation.isPending || deleteTenantMutation.isPending}
      isSaving={saveTenantMutation.isPending}
      isDeleting={deleteTenantMutation.isPending}
      errors={errors}
      onSave={handleSave}
      onDelete={handleDelete}
      onValidate={validateFormData}
      onFormChange={handleFormChange}
      isDirty={isDirty}
      userContext={userContext}
    />
  );
}
