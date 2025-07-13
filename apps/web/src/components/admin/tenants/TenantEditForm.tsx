'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminEditPage, type TabConfig, type ActionButton, type ValidationError } from '@/components/admin/AdminEditPage';
import { ValidationErrorDisplay } from '@/components/common/ValidationErrorDisplay';
import { useLocking } from '@/lib/hooks/useLocking';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { 
  Building, 
  Settings, 
  CreditCard, 
  Users,
  Globe,
  MapPin,
  Palette,
  Database
} from 'lucide-react';

import { toast } from 'sonner';
import { cacheInvalidators, applyOptimisticUpdate } from '@/lib/cache/cache-invalidation';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TenantData {
  id?: string | number;
  uuid?: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: 'starter' | 'professional' | 'enterprise';
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  timezone: string;
  contactEmail: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customCss?: string;
  };
  settings?: {
    allowRegistration: boolean;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
    maintenanceMode: boolean;
    maxUsers: number;
    maxStorage: number; // in GB
  };
  billing?: {
    companyName?: string;
    taxId?: string;
    billingEmail?: string;
    paymentMethod?: string;
  };
  features?: {
    analytics: boolean;
    customDomain: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    sso: boolean;
  };
  categories?: unknown[];
  allowedCountries?: unknown[];
  createdAt?: string;
  lastActivity?: string;
  userCount?: number;
  storageUsed?: number; // in GB
}

interface TenantEditFormProps {
  tenantData?: TenantData | null;
  isLoading?: boolean;
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
}

interface TenantsListData {
  tenants: TenantData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function saveTenant(tenantData: TenantData): Promise<TenantData> {
  // ✅ FIXED: Use UUID for UPDATE, not numeric ID
  const url = tenantData.id 
    ? `/api/v1/admin/tenants/${tenantData.uuid || String(tenantData.id)}`  // UPDATE: Use UUID if available, otherwise convert ID to string
    : '/api/v1/admin/tenants';                  // CREATE: /tenants

  // ✅ FIXED: Clean data to match API schema expectations
  const cleanedData = {
    ...tenantData,
    // Convert object fields to arrays if they exist
    categories: Array.isArray((tenantData as { categories?: unknown }).categories) 
      ? (tenantData as { categories: unknown[] }).categories 
      : [],
    allowedCountries: Array.isArray((tenantData as { allowedCountries?: unknown }).allowedCountries)
      ? (tenantData as { allowedCountries: unknown[] }).allowedCountries
      : [],
  };
    
  const response = await fetch(url, {
    method: tenantData.id ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cleanedData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
    throw new Error(error.message || `Failed to ${tenantData.id ? 'update' : 'create'} tenant`);
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

// ============================================================================
// FORM CONFIGURATION
// ============================================================================

const tenantTabs: TabConfig[] = [
  {
    key: 'general',
    title: 'General',
    icon: Building,
    description: 'Basic tenant information and contact details',
    fields: [
      {
        key: 'name',
        label: 'Tenant Name',
        type: 'text',
        required: true,
        placeholder: 'Enter tenant name',
        description: 'The display name for this tenant',
      },
      {
        key: 'domain',
        label: 'Domain',
        type: 'text',
        required: true,
        placeholder: 'example.com',
        description: 'Primary domain for this tenant',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Suspended', value: 'suspended' },
        ],
      },
      {
        key: 'plan',
        label: 'Plan',
        type: 'select',
        required: true,
        options: [
          { label: 'Starter', value: 'starter' },
          { label: 'Professional', value: 'professional' },
          { label: 'Enterprise', value: 'enterprise' },
        ],
      },
      {
        key: 'currency',
        label: 'Currency',
        type: 'select',
        required: true,
        options: [
          { label: 'USD ($)', value: 'USD' },
          { label: 'EUR (€)', value: 'EUR' },
          { label: 'GBP (£)', value: 'GBP' },
          { label: 'CAD (C$)', value: 'CAD' },
        ],
      },
      {
        key: 'timezone',
        label: 'Timezone',
        type: 'select',
        required: true,
        options: [
          { label: 'UTC', value: 'UTC' },
          { label: 'America/New_York', value: 'America/New_York' },
          { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
          { label: 'Europe/London', value: 'Europe/London' },
          { label: 'Europe/Paris', value: 'Europe/Paris' },
          { label: 'Asia/Tokyo', value: 'Asia/Tokyo' },
        ],
      },
      {
        key: 'contactEmail',
        label: 'Contact Email',
        type: 'email',
        required: true,
        placeholder: 'contact@example.com',
      },
      {
        key: 'contactPhone',
        label: 'Contact Phone',
        type: 'text',
        placeholder: '+1 (555) 123-4567',
      },
    ],
  },
  {
    key: 'address',
    title: 'Address',
    icon: MapPin,
    description: 'Physical address and location information',
    fields: [
      {
        key: 'address.street',
        label: 'Street Address',
        type: 'text',
        placeholder: '123 Main Street',
        colSpan: 2,
      },
      {
        key: 'address.city',
        label: 'City',
        type: 'text',
        placeholder: 'New York',
      },
      {
        key: 'address.state',
        label: 'State/Province',
        type: 'text',
        placeholder: 'NY',
      },
      {
        key: 'address.country',
        label: 'Country',
        type: 'text',
        placeholder: 'United States',
      },
      {
        key: 'address.postalCode',
        label: 'Postal Code',
        type: 'text',
        placeholder: '10001',
      },
    ],
  },
  {
    key: 'settings',
    title: 'Settings',
    icon: Settings,
    description: 'Tenant configuration and feature settings',
    fields: [
      {
        key: 'settings.allowRegistration',
        label: 'Allow Registration',
        type: 'switch',
        description: 'Allow new users to register',
      },
      {
        key: 'settings.requireEmailVerification',
        label: 'Email Verification',
        type: 'switch',
        description: 'Require email verification for new users',
      },
      {
        key: 'settings.enableTwoFactor',
        label: 'Two-Factor Authentication',
        type: 'switch',
        description: 'Enable 2FA for enhanced security',
      },
      {
        key: 'settings.maintenanceMode',
        label: 'Maintenance Mode',
        type: 'switch',
        description: 'Put tenant in maintenance mode',
      },
      {
        key: 'settings.maxUsers',
        label: 'Max Users',
        type: 'number',
        placeholder: '100',
        description: 'Maximum number of users allowed',
      },
      {
        key: 'settings.maxStorage',
        label: 'Max Storage (GB)',
        type: 'number',
        placeholder: '10',
        description: 'Maximum storage allowed in GB',
      },
    ],
  },
  {
    key: 'branding',
    label: 'Branding',
    icon: Palette,
    description: 'Customize the appearance and branding',
    permission: {
      action: 'manage',
      resource: 'tenant_branding',
    },
    fields: [
      {
        key: 'branding.logo',
        label: 'Logo URL',
        type: 'text',
        placeholder: 'https://example.com/logo.png',
        colSpan: 2,
      },
      {
        key: 'branding.primaryColor',
        label: 'Primary Color',
        type: 'text',
        placeholder: '#3b82f6',
        description: 'Hex color code for primary brand color',
      },
      {
        key: 'branding.secondaryColor',
        label: 'Secondary Color',
        type: 'text',
        placeholder: '#64748b',
        description: 'Hex color code for secondary brand color',
      },
      {
        key: 'branding.customCss',
        label: 'Custom CSS',
        type: 'textarea',
        placeholder: '/* Custom styles */\n.custom-class {\n  color: #333;\n}',
        colSpan: 3,
        description: 'Custom CSS to apply to the tenant interface',
      },
    ],
  },
  {
    key: 'billing',
    label: 'Billing',
    icon: CreditCard,
    description: 'Billing information and payment settings',
    permission: {
      action: 'manage',
      resource: 'tenant_billing',
    },
    fields: [
      {
        key: 'billing.companyName',
        label: 'Company Name',
        type: 'text',
        placeholder: 'ACME Corporation',
      },
      {
        key: 'billing.taxId',
        label: 'Tax ID',
        type: 'text',
        placeholder: '12-3456789',
      },
      {
        key: 'billing.billingEmail',
        label: 'Billing Email',
        type: 'email',
        placeholder: 'billing@example.com',
      },
      {
        key: 'billing.paymentMethod',
        label: 'Payment Method',
        type: 'select',
        options: [
          { label: 'Credit Card', value: 'credit_card' },
          { label: 'Bank Transfer', value: 'bank_transfer' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Invoice', value: 'invoice' },
        ],
      },
    ],
  },
  {
    key: 'features',
    label: 'Features',
    icon: Database,
    description: 'Available features and integrations',
    permission: {
      action: 'manage',
      resource: 'tenant_features',
    },
    fields: [
      {
        key: 'features.analytics',
        label: 'Analytics',
        type: 'switch',
        description: 'Enable advanced analytics and reporting',
      },
      {
        key: 'features.customDomain',
        label: 'Custom Domain',
        type: 'switch',
        description: 'Allow custom domain configuration',
      },
      {
        key: 'features.apiAccess',
        label: 'API Access',
        type: 'switch',
        description: 'Enable API access for integrations',
      },
      {
        key: 'features.whiteLabel',
        label: 'White Label',
        type: 'switch',
        description: 'Remove platform branding',
      },
      {
        key: 'features.sso',
        label: 'Single Sign-On',
        type: 'switch',
        description: 'Enable SSO integration',
      },
    ],
  },
];

// ============================================================================
// VALIDATION
// ============================================================================

function validateTenantData(data: TenantData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Tenant name is required' });
  }

  if (!data.domain?.trim()) {
    errors.push({ field: 'domain', message: 'Domain is required' });
  } else if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(data.domain)) {
    errors.push({ field: 'domain', message: 'Invalid domain format' });
  }

  if (!data.contactEmail?.trim()) {
    errors.push({ field: 'contactEmail', message: 'Contact email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.push({ field: 'contactEmail', message: 'Invalid email format' });
  }

  if (!data.status) {
    errors.push({ field: 'status', message: 'Status is required' });
  }

  if (!data.plan) {
    errors.push({ field: 'plan', message: 'Plan is required' });
  }

  return errors;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Enhanced Tenant Edit Form with Comprehensive Cache Invalidation
 * 
 * ✅ mono BEST PRACTICES:
 * - Three-layer cache invalidation (Next.js + Redis + TanStack Query)
 * - Optimistic updates for immediate UI feedback
 * - Proper audit tracking and logging
 * - Permission-based UI elements
 * - Type-safe with interfaces
 * 
 * @component
 * @example
 * <TenantEditForm tenantData={tenant} userContext={context} />
 */
export function TenantEditForm({ tenantData, isLoading, userContext }: TenantEditFormProps) {
  const router = useRouter();
  const t = useTranslations('admin-common');
  const { trackClick, trackFormSubmission } = useAuditTracking();
  const queryClient = useQueryClient();
  
  // Entity locking for concurrent editing protection
  const entityId = tenantData?.id || null;
  const lockingHook = useLocking('tenant', entityId || '');
  const { lockStatus, acquireLock, releaseLock } = lockingHook;

  // Form state
  const [formData, setFormData] = React.useState<TenantData>(() => ({
    name: '',
    domain: '',
    status: 'active',
    plan: 'starter',
    currency: 'USD',
    timezone: 'UTC',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    branding: {
      logo: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      customCss: '',
    },
    settings: {
      allowRegistration: true,
      requireEmailVerification: true,
      enableTwoFactor: false,
      maintenanceMode: false,
      maxUsers: 100,
      maxStorage: 10,
    },
    billing: {
      companyName: '',
      taxId: '',
      billingEmail: '',
      paymentMethod: 'credit_card',
    },
    features: {
      analytics: false,
      customDomain: false,
      apiAccess: false,
      whiteLabel: false,
      sso: false,
    },
    ...tenantData,
  }));

  const [errors, setErrors] = React.useState<ValidationError[]>([]);
  const [isDirty, setIsDirty] = React.useState(false);

  // Update errors when form data changes for real-time validation
  React.useEffect(() => {
    const currentErrors = validateTenantData(formData);
    setErrors(currentErrors);
  }, [formData]);

  // 🔥 ENHANCED: Save mutation with comprehensive cache invalidation
  const saveMutation = useMutation({
    mutationFn: saveTenant,
    onMutate: async (newTenantData) => {
      // 🚀 OPTIMISTIC UPDATE: Apply immediate UI changes
      // Get all admin-tenants queries and update them
      const queryCache = queryClient.getQueryCache();
      const adminTenantsQueries = queryCache.findAll({
        queryKey: ['admin-tenants'],
        exact: false
      });

      const rollbacks: (() => void)[] = [];

      // Update all matching queries
      adminTenantsQueries.forEach(query => {
        const oldData = query.state.data as TenantsListData | undefined;
        if (!oldData) return;

        const rollback = applyOptimisticUpdate(
          queryClient, 
          query.queryKey as (string | number)[],
          (data: TenantsListData | undefined) => {
            if (!data) return data;
            
            if (newTenantData.id) {
              // Update existing tenant
              return {
                ...data,
                tenants: data.tenants.map((tenant: TenantData) =>
                  tenant.id === newTenantData.id ? { ...tenant, ...newTenantData } : tenant
                ),
              };
            } else {
              // Add new tenant (with temporary ID)
              const tempTenant = { ...newTenantData, id: `temp-${Date.now()}` };
              return {
                ...data,
                tenants: [...data.tenants, tempTenant],
                pagination: {
                  ...data.pagination,
                  total: data.pagination.total + 1,
                },
              };
            }
          }
        );
        rollbacks.push(rollback);
      });

      // Store rollback function for potential error recovery
      return { 
        rollback: () => {
          rollbacks.forEach(rollback => rollback());
        }
      };
    },
    onSuccess: async (savedTenant) => {
      const operation = tenantData?.id ? 'update' : 'create';
      
      browserLogger.info('Tenant saved successfully', { 
        tenantId: savedTenant.id,
        operation,
        userRole: userContext.adminRole,
        tenantId: userContext.tenantId
      });
      
      // 🔥 COMPREHENSIVE CACHE INVALIDATION: All three layers
      await cacheInvalidators.tenants({
        tenantId: userContext.tenantId,
        entityId: savedTenant.id,
        operation,
        queryClient,
        context: 'client',
        affectedRoutes: [
          '/admin/tenants',
          `/admin/tenants/${savedTenant.id}`,
          '/api/v1/admin/tenants'
        ]
      });

      // Show success message
      toast.success(
        operation === 'create' 
          ? 'Tenant created successfully' 
          : 'Tenant updated successfully'
      );
      
      // ✅ FIXED: Stay on edit page for updates, only redirect for creates
      if (operation === 'create') {
        router.push('/admin/tenants');
      }
      // For updates, stay on current page
    },
    onError: (error, newTenantData, context) => {
      browserLogger.error('Failed to save tenant', { 
        error: error.message,
        operation: tenantData?.id ? 'update' : 'create',
        userRole: userContext.adminRole,
        tenantId: userContext.tenantId
      });

      // 🔄 ROLLBACK: Revert optimistic update
      if (context?.rollback) {
        context.rollback();
      }

      // Show error message
      toast.error(`Failed to save tenant: ${error.message}`);
    },
  });

  // 🔥 ENHANCED: Delete mutation with comprehensive cache invalidation
  const deleteMutation = useMutation({
    mutationFn: () => deleteTenant(tenantData?.id!),
    onMutate: async () => {
      // 🚀 OPTIMISTIC UPDATE: Remove tenant from UI immediately
      // Get all admin-tenants queries and update them
      const queryCache = queryClient.getQueryCache();
      const adminTenantsQueries = queryCache.findAll({
        queryKey: ['admin-tenants'],
        exact: false
      });

      const rollbacks: (() => void)[] = [];

      // Update all matching queries
      adminTenantsQueries.forEach(query => {
        const oldData = query.state.data as TenantsListData | undefined;
        if (!oldData) return;

        const rollback = applyOptimisticUpdate(
          queryClient,
          query.queryKey as (string | number)[],
          (data: TenantsListData | undefined) => {
            if (!data) return data;
            
            return {
              ...data,
              tenants: data.tenants.filter((tenant: TenantData) => tenant.id !== tenantData?.id),
              pagination: {
                ...data.pagination,
                total: Math.max(0, data.pagination.total - 1),
              },
            };
          }
        );
        rollbacks.push(rollback);
      });

      return { 
        rollback: () => {
          rollbacks.forEach(rollback => rollback());
        }
      };
    },
    onSuccess: async () => {
      browserLogger.info('Tenant deleted successfully', { 
        tenantId: tenantData?.id,
        userRole: userContext.adminRole,
        tenantId: userContext.tenantId
      });
      
      // 🔥 COMPREHENSIVE CACHE INVALIDATION: All three layers
      await cacheInvalidators.tenants({
        tenantId: userContext.tenantId,
        entityId: tenantData?.id,
        operation: 'delete',
        queryClient,
        context: 'client',
        affectedRoutes: [
          '/admin/tenants',
          `/admin/tenants/${tenantData?.id}`,
          '/api/v1/admin/tenants'
        ]
      });

      // Show success message
      toast.success('Tenant deleted successfully');
      
      // Navigate back to list
      router.push('/admin/tenants');
    },
    onError: (error, _, context) => {
      browserLogger.error('Failed to delete tenant', { 
        error: error.message,
        tenantId: tenantData?.id,
        userRole: userContext.adminRole,
        tenantId: userContext.tenantId
      });

      // 🔄 ROLLBACK: Revert optimistic update
      if (context?.rollback) {
        context.rollback();
      }

      // Show error message
      toast.error(`Failed to delete tenant: ${error.message}`);
    },
  });

  // Handle form changes
  const handleFormChange = (key: string, value: any) => {
    setFormData(prev => {
      const newData = key.includes('.') 
        ? (() => {
            const keys = key.split('.');
            const result = { ...prev };
            let current: any = result;
            
            for (let i = 0; i < keys.length - 1; i++) {
              current[keys[i]] = { ...current[keys[i]] };
              current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
            return result;
          })()
        : { ...prev, [key]: value };
      
      return newData;
    });
    
    setIsDirty(true);
  };

  // Handle save
  const handleSave = async (data: TenantData) => {
    const validationErrors = validateTenantData(data);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    await saveMutation.mutateAsync(data);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!tenantData?.id) return;
    await deleteMutation.mutateAsync();
  };

  // Custom actions
  const customActions: ActionButton[] = [
    {
      key: 'view_users',
      label: 'View Users',
      variant: 'outline',
      icon: Users,
      onClick: (data) => {
        if (!data?.id) return;
        trackClick('admin_tenant_view_users', { tenantId: data.id });
        router.push(`/admin/users?tenant=${data.id}`);
      },
    },
    {
      key: 'visit_site',
      label: 'Visit Site',
      variant: 'outline',
      icon: Globe,
      onClick: (data) => {
        if (!data?.id || !data?.domain) return;
        trackClick('admin_tenant_visit_site', { tenantId: data.id });
        window.open(`https://${data.domain}`, '_blank');
      },
    },
  ];

  const isNewTenant = !tenantData?.id;
  const title = isNewTenant ? 'Create Tenant' : `Edit Tenant: ${formData.name}`;
  const subtitle = isNewTenant ? 'Add a new tenant to the platform' : `${formData.userCount || 0} users • ${formData.storageUsed || 0}GB used`;

    return (
    <AdminEditPage<TenantData>
      title={title}
      subtitle={subtitle}
      backUrl="/admin/tenants"
      backLabel="Back to Tenants"
      entityData={tenantData || undefined}
      isLoading={isLoading}
      tabs={tenantTabs}
      defaultTab="general"
      formData={formData}
      onFormChange={handleFormChange}
      onSave={handleSave}
      onDelete={isNewTenant ? undefined : handleDelete}
      errors={errors}
      onValidate={validateTenantData}
      isDirty={isDirty}
      isSaving={saveMutation.isPending}
      isDeleting={deleteMutation.isPending}
      saveError={saveMutation.error?.message || null}
      customActions={customActions}
      userContext={userContext}
    >
      {/* 🎯 VALIDATION SUMMARY - Shows compact overview, especially useful for cross-tab errors */}
      <div className="mb-6">
        <ValidationErrorDisplay 
          errors={validateTenantData(formData)}
          title="Fix these issues to save:"
          variant="compact"
          showWhenEmpty={false}
        />
      </div>
    </AdminEditPage>
  );
} 