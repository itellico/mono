'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { toast } from 'sonner';
import { AdminEditPage, type TabConfig, type ActionButton } from '@/components/admin/AdminEditPage';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Shield, 
  BarChart3,
  Building2,
  Mail,
  Eye,
  EyeOff,
  Crown,
  UserCheck,
  Palette,
  Cog
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { platformUsersKeys, type PlatformUser } from '@/hooks/admin/usePlatformUsers';

// ============================================================================
// TYPES
// ============================================================================

interface PlatformUserEditClientProps {
  initialUserData: PlatformUser;
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
  isCreate: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlatformUserEditClient({ 
  initialUserData, 
  userContext, 
  isCreate 
}: PlatformUserEditClientProps) {
  const router = useRouter();
  const { trackClick } = useAuditTracking();
  const queryClient = useQueryClient();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [formData, setFormData] = React.useState(initialUserData);
  const [activeTab, setActiveTab] = React.useState('basic');
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Check if form has changes
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialUserData);

  // ============================================================================
  // API MUTATIONS
  // ============================================================================

  const saveUserMutation = useMutation({
    mutationFn: async (userData: PlatformUser) => {
      const url = isCreate 
        ? '/api/v1/admin/platform-users'
        : `/api/v1/admin/platform-users/${userData.uuid}`;
      
      const method = isCreate ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isCreate ? 'create' : 'update'} user`);
      }

      return response.json();
    },
    onMutate: async (newUserData) => {
      setIsSaving(true);
      setSaveError(null);
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: platformUsersKeys.lists() });

      // Optimistically update cache if editing existing user
      if (!isCreate) {
        queryClient.setQueriesData(
          { queryKey: platformUsersKeys.lists() },
          (old: any) => {
            if (!old?.users) return old;
            
            return {
              ...old,
              users: old.users.map((user: PlatformUser) => 
                user.uuid === newUserData.uuid ? newUserData : user
              )
            };
          }
        );
      }

      return { newUserData };
    },
    onError: (err, variables, context) => {
      const message = err instanceof Error ? err.message : 'Failed to save user';
      setSaveError(message);
      toast.error(message);
      browserLogger.error('Failed to save platform user', { 
        error: message, 
        isCreate,
        userId: variables.uuid 
      });
      
      // Rollback on error (for edits)
      if (!isCreate && context?.newUserData) {
        setFormData(initialUserData);
      }
    },
    onSuccess: (savedUser, variables) => {
      const action = isCreate ? 'created' : 'updated';
      toast.success(`Platform user ${action} successfully`);
      browserLogger.info(`Platform user ${action} successfully`, { 
        userId: variables.uuid,
        userRole: userContext.adminRole 
      });
      
      // Navigate back to list
      router.push('/admin/platform-users');
    },
    onSettled: () => {
      setIsSaving(false);
      // Always refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: platformUsersKeys.lists() });
    },
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    trackClick(`platform_user_${isCreate ? 'create' : 'edit'}`, { 
      userId: formData.uuid,
      userRole: userContext.adminRole 
    });
    
    await saveUserMutation.mutateAsync(formData);
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/admin/platform-users');
      }
    } else {
      router.push('/admin/platform-users');
    }
  };

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  // Available tenants (for platform users)
  const tenantOptions = [
    { value: '4', label: 'itellico Mono', description: 'Main platform tenant' },
    // Add more tenants as needed
  ];

  // User types
  const userTypeOptions = [
    { value: 'individual', label: 'Individual', description: 'Regular individual user', icon: User },
    { value: 'model', label: 'Model', description: 'Professional model', icon: User },
    { value: 'client', label: 'Client', description: 'Client/customer', icon: Building2 },
    { value: 'agency', label: 'Agency', description: 'Modeling agency', icon: Building2 },
    { value: 'photographer', label: 'Photographer', description: 'Professional photographer', icon: Palette },
  ];

  // Platform roles (for platform-wide access)
  const platformRoleOptions = [
    { value: 'user', label: 'User', description: 'Standard user access', icon: User },
    { value: 'moderator', label: 'Moderator', description: 'Content moderation', icon: UserCheck },
    { value: 'admin', label: 'Admin', description: 'Administrative access', icon: Shield },
    { value: 'super_admin', label: 'Super Admin', description: 'Full platform control', icon: Crown },
  ];

  // Tab configuration following AdminEditPage pattern
  const tabs: TabConfig[] = [
    {
      key: 'basic',
      title: 'Basic Information',
      description: 'Core user details and identification',
      icon: User,
      fields: [
        {
          key: 'firstName',
          label: 'First Name',
          type: 'text',
          required: true,
          placeholder: 'Enter first name',
          colSpan: 1,
        },
        {
          key: 'lastName',
          label: 'Last Name',
          type: 'text',
          required: true,
          placeholder: 'Enter last name',
          colSpan: 1,
        },
        {
          key: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'user@example.com',
          colSpan: 2,
          disabled: !isCreate, // Can't change email after creation
        },
        {
          key: 'userType',
          label: 'User Type',
          type: 'custom',
          required: true,
          colSpan: 2,
          render: (value, onChange) => (
            <SearchableSelect
              options={userTypeOptions}
              value={value}
              onValueChange={onChange}
              placeholder="Select user type..."
              searchPlaceholder="Search user types..."
            />
          ),
        },
      ],
      permission: {
        action: 'platform-users.update',
        resource: 'platform-users',
      },
    },
    {
      key: 'platform',
      title: 'Platform Settings',
      description: 'Platform-wide configuration and tenant assignment',
      icon: Settings,
      fields: [
        {
          key: 'tenantId',
          label: 'Primary Tenant',
          type: 'custom',
          required: true,
          description: 'Primary tenant this user belongs to',
          colSpan: 2,
          render: (value, onChange) => (
            <SearchableSelect
              options={tenantOptions}
              value={value?.toString()}
              onValueChange={(val) => onChange(parseInt(val))}
              placeholder="Select tenant..."
              searchPlaceholder="Search tenants..."
            />
          ),
        },
        {
          key: 'isActive',
          label: 'Account Active',
          type: 'switch',
          description: 'User can access the platform',
          colSpan: 1,
        },
        {
          key: 'isVerified',
          label: 'Email Verified',
          type: 'switch',
          description: 'Email address has been verified',
          colSpan: 1,
        },
      ],
      permission: {
        action: 'platform-users.manage',
        resource: 'platform-users',
      },
    },
    {
      key: 'permissions',
      title: 'Permissions',
      description: 'Platform-wide permissions and access control',
      icon: Shield,
      fields: [
        {
          key: 'platformRole',
          label: 'Platform Role',
          type: 'custom',
          description: 'Platform-wide role assignment',
          colSpan: 2,
          render: (value, onChange) => (
            <SearchableSelect
              options={platformRoleOptions}
              value={value || 'user'}
              onValueChange={onChange}
              placeholder="Select platform role..."
              searchPlaceholder="Search roles..."
            />
          ),
        },
      ],
      permission: {
        action: 'platform-users.manage',
        resource: 'platform-users',
      },
    },
    {
      key: 'stats',
      title: 'Statistics',
      description: 'User activity and platform statistics',
      icon: BarChart3,
      fields: [
        {
          key: 'createdAt',
          label: 'Created',
          type: 'text',
          disabled: true,
          render: (value) => (
            <div className="text-sm text-muted-foreground">
              {value ? new Date(value).toLocaleString() : 'Not available'}
            </div>
          ),
          colSpan: 1,
        },
        {
          key: 'lastLoginAt',
          label: 'Last Login',
          type: 'text',
          disabled: true,
          render: (value) => (
            <div className="text-sm text-muted-foreground">
              {value ? new Date(value).toLocaleString() : 'Never'}
            </div>
          ),
          colSpan: 1,
        },
        {
          key: 'sessionCount',
          label: 'Total Sessions',
          type: 'text',
          disabled: true,
          render: () => (
            <div className="text-sm text-muted-foreground">
              {formData.stats?.sessionCount || 0}
            </div>
          ),
          colSpan: 1,
        },
        {
          key: 'tenantInfo',
          label: 'Tenant Details',
          type: 'custom',
          disabled: true,
          colSpan: 1,
          render: () => (
            <div className="space-y-2">
              {formData.tenant ? (
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  <Building2 className="h-3 w-3" />
                  {formData.tenant.name}
                </Badge>
              ) : (
                <div className="text-sm text-muted-foreground">No tenant assigned</div>
              )}
            </div>
          ),
        },
      ],
    },
  ];

  // Action buttons configuration
  const actionButtons: ActionButton[] = [
    {
      key: 'save',
      label: isCreate ? 'Create User' : 'Save Changes',
      variant: 'default',
      icon: isCreate ? User : undefined,
      onClick: handleSave,
      loading: isSaving,
      disabled: !hasChanges && !isCreate,
      permission: {
        action: isCreate ? 'platform-users.create' : 'platform-users.update',
        resource: 'platform-users',
      },
    },
    {
      key: 'cancel',
      label: 'Cancel',
      variant: 'outline',
      onClick: handleCancel,
      disabled: isSaving,
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AdminEditPage<PlatformUser>
      title={isCreate ? 'Create Platform User' : `Edit ${formData.firstName} ${formData.lastName}`}
      subtitle={isCreate ? 'Create a new platform user with cross-tenant access' : `Platform user management for ${formData.email}`}
      backUrl="/admin/platform-users"
      backLabel="Back to Platform Users"
      entityData={formData}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onFieldChange={handleFormChange}
      actionButtons={actionButtons}
      isLoading={false}
      saveError={saveError}
      hasUnsavedChanges={hasChanges}
    />
  );
}