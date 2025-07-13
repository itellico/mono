'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AdminListPage, type StatCard, type ColumnConfig, type FilterConfig } from '@/components/admin/AdminListPage';
import { ConfirmationModal } from '@/components/admin/shared/ConfirmationModal';
import { toast } from 'sonner';
import { useAdminTenantsList } from '@/hooks/admin/useTenants';
import { useAuth } from '@/contexts/auth-context';
// Removed Collapsible - unified design

// Import the BulkAction interface from AdminListPage
import type { BulkAction } from '@/components/admin/AdminListPage';

interface TenantData {
  id: string;
  uuid: string;
  name: string;
  domain: string;
  isActive: boolean;
  userCount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface Tenant {
  id: string;
  uuid: string;
  name: string;
  domain: string;
  isActive: boolean;
  userCount?: number;
  defaultCurrency?: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantsResponse {
  tenants: Tenant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface TenantsClientPageProps {
  initialData: TenantsResponse;
  initialFilters: {
    page: number;
    limit: number;
    search: string;
    status: 'active' | 'inactive' | 'all';
  };
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
}

// Extended filters interface for multi-select functionality
interface ExtendedFilters {
  page: number;
  limit: number;
  search: string;
  status: string[];
  currencies: string[];
  userCountRange: string[];
}

/**
 * Enterprise-grade Client Component for Tenants Management
 * 
 * ✅ mono BEST PRACTICES:
 * - Uses TanStack Query for automatic cache management
 * - Client component with 'use client' directive
 * - Browser logger for client-side logging
 * - Permission gates for UI elements
 * - URL state management for filters
 * - Multi-select filters with ShadCN components
 * - Row selection and pagination
 * - Automatic refetch when cache is invalidated
 */
export function TenantsClientPage({ 
  initialData, 
  initialFilters, 
  userContext 
}: TenantsClientPageProps) {
  const t = useTranslations('admin-tenants');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // ✅ AUDIT TRACKING: Track user interactions
  const { trackClick, trackView, trackSearch, trackFilter } = useAuditTracking();

  const [filters, setFilters] = React.useState<ExtendedFilters>({
    page: initialFilters.page,
    limit: initialFilters.limit,
    search: initialFilters.search,
    status: initialFilters.status === 'all' ? [] : [initialFilters.status],
    currencies: [],
    userCountRange: []
  });

  // State for sorting
  const [sortConfig, setSortConfig] = React.useState<{
    column: string;
    direction: 'asc' | 'desc' | null;
  }>({ column: 'createdAt', direction: 'desc' });

  // State for column visibility  
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({
    name: true,
    domain: true,
    status: true,
    users: true,
    currency: true,
    created: true
  });

  // Selection state
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  
  // Modal state management
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = React.useState(false);
  const [selectedTenant, setSelectedTenant] = React.useState<TenantData | null>(null);

  // Add state for tracking active saved search name
  const [activeSearchName, setActiveSearchName] = React.useState<string>('');
  
  // Track if user has interacted with filters (to prevent auto-loading defaults)
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  
  // Track if default has been loaded (to prevent multiple loads)
  const [defaultLoaded, setDefaultLoaded] = React.useState(false);

  // Enhanced search state
  // Removed showAdvancedFilters - unified design handles this
  const [searchSuggestions, setSearchSuggestions] = React.useState<string[]>([]);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  // ✅ FIXED: Use TanStack Query hook BEFORE any useEffect that depends on data
  const { 
    data, 
    error, 
    isLoading, 
    refetch, 
    isFetching 
  } = useAdminTenantsList({
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    status: filters.status.length > 0 ? filters.status.join(',') : undefined,
    currency: filters.currencies.length > 0 ? filters.currencies.join(',') : undefined,
    userCountRange: filters.userCountRange.length > 0 ? filters.userCountRange.join(',') : undefined
  });

  // Generate search suggestions based on current data
  React.useEffect(() => {
    if (!data?.tenants) return;

    const suggestions: string[] = [];
    const domains = [...new Set(data.tenants.map(t => t.domain))];
    const currencies = [...new Set(data.tenants.map(t => t.defaultCurrency).filter(Boolean))];

    // Add domain suggestions
    domains.slice(0, 3).forEach((domain) => {
      suggestions.push(domain);
    });

    // Add currency-based suggestions
    currencies.slice(0, 2).forEach((currency) => {
      suggestions.push(`${currency} tenants`);
    });

    // Add status suggestions
    const activeCount = data.tenants.filter(t => t.isActive).length;
    const inactiveCount = data.tenants.filter(t => !t.isActive).length;
    
    if (activeCount > 0) {
      suggestions.push('active tenants');
    }

    if (inactiveCount > 0) {
      suggestions.push('inactive tenants');
    }

    setSearchSuggestions(suggestions);
  }, [data]);

  // Load recent searches from localStorage
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('tenants-recent-searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      browserLogger.debug('Failed to load recent searches', { error });
    }
  }, []);

  // Save recent searches when search changes
  React.useEffect(() => {
    if (filters.search && filters.search.length > 2) {
      const newRecentSearches = [
        filters.search,
        ...recentSearches.filter(s => s !== filters.search)
      ].slice(0, 5);
      
      setRecentSearches(newRecentSearches);
      
      try {
        localStorage.setItem('tenants-recent-searches', JSON.stringify(newRecentSearches));
      } catch (error) {
        browserLogger.debug('Failed to save recent searches', { error });
      }
    }
  }, [filters.search]);


  // Log TanStack Query state with detailed filter debugging
  React.useEffect(() => {
    browserLogger.info('🔍 TanStack Query state changed - CURRENCY DEBUG', {
      isLoading,
      isFetching,
      hasData: !!data,
      hasError: !!error,
      filters,
      currencyParam: filters.currencies.length > 0 ? filters.currencies.join(',') : 'NO_CURRENCY_FILTER',
      currencyArray: filters.currencies,
      dataReceived: data ? data.tenants.length : 0,
      firstTenantCurrency: data?.tenants?.[0]?.defaultCurrency || 'NO_DATA'
    });
  }, [isLoading, isFetching, data, error, filters]);

  // Listen for custom cache clear events
  React.useEffect(() => {
    const handleCacheInvalidation = () => {
      browserLogger.info('🔄 Cache invalidation detected, refetching tenants data');
      refetch();
    };

    // Listen for custom cache clear events
    window.addEventListener('clearTanStackCache', handleCacheInvalidation);

    return () => {
      window.removeEventListener('clearTanStackCache', handleCacheInvalidation);
    };
  }, [refetch]);

  // This effect will be moved after savedSearchConfig is defined

  // Refetch data when user navigates back to this page
  React.useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // If the page is being restored from cache (back/forward navigation)
      if (event.persisted) {
        browserLogger.info('🔄 Page restored from cache, refetching data');
        refetch();
      }
    };

    // Listen for page show events (back/forward navigation)
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [refetch]);

  // Log data changes
  React.useEffect(() => {
    if (data && data.tenants) {
      browserLogger.info('Tenants data loaded via TanStack Query', { 
        count: data.tenants.length,
        total: data.pagination?.total || 0,
        filters,
        userRole: userContext.adminRole,
        fromCache: !isLoading && !isFetching
      });
    }
  }, [data, filters, userContext.adminRole, isLoading, isFetching]);

  // Log errors
  React.useEffect(() => {
    if (error) {
      browserLogger.error('Failed to load tenants data via TanStack Query', { 
        error: error.message,
        filters,
        userRole: userContext.adminRole
      });
    }
  }, [error, filters, userContext.adminRole]);

  // Transform data for table
  const tableData: TenantData[] = React.useMemo(() => {
    if (!data?.tenants) return [];
    
    const transformedData = data.tenants.map(tenant => ({
      id: tenant.id,
      uuid: tenant.uuid,
      name: tenant.name,
      domain: tenant.domain,
      isActive: tenant.isActive,
      userCount: tenant.userCount || 0,
      currency: tenant.defaultCurrency || 'EUR',
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt
    }));

    // Apply client-side sorting
    if (sortConfig.direction && sortConfig.column) {
      transformedData.sort((a, b) => {
        const aValue = a[sortConfig.column as keyof TenantData];
        const bValue = b[sortConfig.column as keyof TenantData];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
      });
    }
    
    return transformedData;
  }, [data, sortConfig]);

  // Statistics for overview cards
  const stats = React.useMemo(() => {
    if (!data?.tenants) return null;
    const tenants = data.tenants;
    return {
      total: tenants.length,
      active: tenants.filter((t: Tenant) => t.isActive === true).length,
      inactive: tenants.filter((t: Tenant) => t.isActive === false).length,
      totalUsers: tenants.reduce((sum: number, t: Tenant) => sum + (t.userCount || 0), 0)
    };
  }, [data]);

  // ✅ FIXED: Use TanStack Query pagination data
  const pagination = React.useMemo(() => ({
    page: filters.page,
    limit: filters.limit,
    total: data?.pagination?.total || 0,
    totalPages: data?.pagination?.totalPages || 1
  }), [filters.page, filters.limit, data?.pagination]);

  // Filter options
  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suspended', value: 'suspended' }
  ];

  const currencyOptions = [
    { label: 'EUR', value: 'EUR' },
    { label: 'USD', value: 'USD' },
    { label: 'GBP', value: 'GBP' },
    { label: 'CAD', value: 'CAD' }
  ];

  const userCountOptions = [
    { label: '0-10 users', value: '0-10' },
    { label: '11-50 users', value: '11-50' },
    { label: '51-100 users', value: '51-100' },
    { label: '100+ users', value: '100+' }
  ];

  // Statistics cards configuration
  const statsCards: StatCard[] = React.useMemo(() => {
    if (!stats) return [];
    
    return [
      {
        title: 'Total Tenants',
        value: stats.total,
        description: 'All registered tenants'
      },
      {
        title: 'Active Tenants',
        value: stats.active,
        description: 'Currently active tenants'
      },
      {
        title: 'Inactive Tenants',
        value: stats.inactive,
        description: 'Currently inactive tenants'
      },
      {
        title: 'Total Users',
        value: stats.totalUsers.toLocaleString(),
        description: 'Users across all tenants'
      }
    ];
  }, [stats]);

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      title: 'Status',
      type: 'multiSelect',
      options: statusOptions
    },
    {
      key: 'currencies',
      title: 'Currency',
      type: 'multiSelect',
      options: currencyOptions
    },
    {
      key: 'userCountRange',
      title: 'User Count',
      type: 'multiSelect',
      options: userCountOptions
    }
  ];

  // Column configuration
  const columns: ColumnConfig<TenantData>[] = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      hideable: false,
      render: (value, row) => (
        <span className="font-medium">{value as string}</span>
      )
    },
    {
      key: 'domain',
      title: 'Domain',
      sortable: true,
      hideable: true,
      render: (value) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {value as string}
        </code>
      )
    },
    {
      key: 'isActive',
      title: 'Status',
      sortable: true,
      hideable: false,
      render: (value) => (
        <Badge 
          variant={(value as boolean) ? 'default' : 'secondary'}
          className="capitalize"
        >
          {(value as boolean) ? 'active' : 'inactive'}
        </Badge>
      )
    },
    {
      key: 'userCount',
      title: 'Users',
      sortable: true,
      hideable: true,
      render: (value) => (
        <span>{(value as number).toLocaleString()}</span>
      )
    },
    {
      key: 'currency',
      title: 'Currency',
      sortable: true,
      hideable: true,
      render: (value) => (
        <Badge variant="outline" className="text-xs">
          {value as string}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      hideable: true,
      render: (value) => new Date(value as string).toLocaleDateString()
    }
  ];

  // Event handlers
  const handleFilterChange = (key: string, values: string[]) => {
    setHasUserInteracted(true); // Mark that user has interacted
    setFilters(prev => ({
      ...prev,
      [key]: values,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handleClearFilters = () => {
    setFilters(prev => ({
      ...prev,
      status: [],
      currencies: [],
      userCountRange: [],
      page: 1
    }));
  };

  const handleSearchChange = (value: string) => {
    setHasUserInteracted(true); // Mark that user has interacted
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  // Handle column sorting
  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        // Toggle direction: asc -> desc -> null -> asc
        const nextDirection = prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc';
        return { column, direction: nextDirection };
      } else {
        // New column, start with asc
        return { column, direction: 'asc' };
      }
    });
  };

  // Handle column visibility changes
  const handleColumnVisibilityChange = (visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility);
  };

  // ============================================================================
  // SAVED SEARCH HANDLERS
  // ============================================================================

  const handleLoadSavedSearch = (config: {
    filters: Record<string, string[]>;
    sortConfig: { column: string; direction: 'asc' | 'desc' | null } | null;
    columnVisibility: Record<string, boolean>;
    searchValue?: string;
    paginationLimit?: number;
    searchName: string;
  }) => {
    browserLogger.userAction('Loaded saved search', 'saved_search_load', {
      entityType: 'tenants',
      searchName: config.searchName,
      hasFilters: Object.keys(config.filters).length > 0,
      hasSort: Boolean(config.sortConfig?.column),
      hasColumnConfig: Boolean(config.columnVisibility),
      hasSearch: Boolean(config.searchValue),
      hasPagination: Boolean(config.paginationLimit)
    });

    // Set the active search name
    setActiveSearchName(config.searchName);

    // Apply search value
    if (config.searchValue !== undefined) {
      setFilters(prev => ({ ...prev, search: config.searchValue || '' }));
    }

    // Apply filters
    const newFilters = { ...filters };
    Object.entries(config.filters).forEach(([key, values]) => {
      if (key === 'search') {
        newFilters.search = values[0] || '';
      } else if (key === 'status') {
        newFilters.status = values;
      } else if (key === 'currencies') {
        newFilters.currencies = values;
      } else if (key === 'userCountRange') {
        newFilters.userCountRange = values;
      }
    });
    setFilters(newFilters);

    // Apply sort configuration
    if (config.sortConfig) {
      setSortConfig(config.sortConfig);
    }

    // Apply column visibility
    if (config.columnVisibility && Object.keys(config.columnVisibility).length > 0) {
      setColumnVisibility(config.columnVisibility);
    }

    // Apply pagination limit
    if (config.paginationLimit) {
      setFilters(prev => ({ ...prev, limit: config.paginationLimit!, page: 1 }));
    }
  };

  const handleSaveSavedSearch = async (searchData: {
    name: string;
    description?: string;
    filters?: Record<string, unknown>;
    sortBy?: string;
    sortOrder?: string;
    columnConfig?: Record<string, boolean>;
    searchValue?: string;
    paginationLimit?: number;
    isDefault: boolean;
    isPublic: boolean;
  }) => {
    try {
      // Capture ALL current state - filters, sort, columns, search, pagination
      const currentFilters: Record<string, unknown> = {
        status: filters.status,
        currencies: filters.currencies,
        userCountRange: filters.userCountRange
      };
      
      const saveData = {
        name: searchData.name,
        description: searchData.description,
        entityType: 'tenants',
        filters: searchData.filters || currentFilters,
        sortBy: searchData.sortBy || sortConfig.column || 'name',
        sortOrder: searchData.sortOrder || sortConfig.direction || 'asc',
        columnConfig: searchData.columnConfig || columnVisibility,
        searchValue: searchData.searchValue !== undefined ? searchData.searchValue : filters.search,
        paginationLimit: searchData.paginationLimit || filters.limit,
        isDefault: searchData.isDefault,
        isPublic: searchData.isPublic
      };

      // Log complete save data for debugging
      console.log('📾 SAVING SEARCH WITH COMPLETE STATE:', {
        name: saveData.name,
        filters: saveData.filters,
        sortBy: saveData.sortBy,
        sortOrder: saveData.sortOrder,
        columnConfig: saveData.columnConfig,
        searchValue: saveData.searchValue,
        paginationLimit: saveData.paginationLimit,
        isDefault: saveData.isDefault,
        isPublic: saveData.isPublic
      });
      
      browserLogger.userAction('Saving search', 'saved_search_create', {
        entityType: 'tenants',
        searchName: searchData.name,
        isDefault: searchData.isDefault,
        isPublic: searchData.isPublic,
        hasFilters: Object.keys(saveData.filters || {}).length > 0,
        hasSort: !!saveData.sortBy,
        hasColumnConfig: !!saveData.columnConfig,
        hasSearch: !!saveData.searchValue,
        paginationLimit: saveData.paginationLimit
      });

      const response = await fetch('/api/v1/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if it's a duplicate name error
        if (response.status === 409) {
          toast.error(`A saved search named "${searchData.name}" already exists. Please choose a different name.`);
          throw new Error('Duplicate name');
        }
        
        throw new Error(errorData.error || 'Failed to save search');
      }

      browserLogger.userAction('Search saved successfully', 'saved_search_success', {
        entityType: 'tenants',
        searchName: searchData.name
      });

      // Show success message
      toast.success(`Saved search "${searchData.name}" created successfully!`);
      
    } catch (error) {
      browserLogger.userAction('Search save failed', 'saved_search_error', {
        entityType: 'tenants',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't show duplicate errors - already shown in the if block above
      if (error instanceof Error && error.message !== 'Duplicate name') {
        toast.error('Failed to save search: ' + error.message);
      }
    }
  };

  // Helper function to check permissions with wildcard support
  const hasPermissionWithWildcard = (permissions: string[], requiredPermission: string): boolean => {
    // Direct match
    if (permissions.includes(requiredPermission)) {
      return true;
    }
    
    // Wildcard match
    const requiredParts = requiredPermission.split('.');
    for (const userPerm of permissions) {
      const userParts = userPerm.split('.');
      if (userParts.length === requiredParts.length) {
        const matches = userParts.every((part, index) => 
          part === '*' || part === requiredParts[index]
        );
        if (matches) {
          return true;
        }
      }
    }
    return false;
  };

  // Saved search configuration
  // Super admin should always have full access
  const isSuperAdmin = userContext.adminRole === 'super_admin' || 
                      userContext.permissions.includes('*') ||
                      userContext.permissions.includes('admin:*');
  
  const savedSearchConfig = {
    entityType: 'tenants',
    enabled: true,
    activeSearchName: activeSearchName,
    onLoadSearch: handleLoadSavedSearch,
    onSaveSearch: handleSaveSavedSearch,
    canSave: isSuperAdmin || 
             hasPermissionWithWildcard(userContext.permissions, 'saved_searches.create.own') || 
             hasPermissionWithWildcard(userContext.permissions, 'saved_searches.manage.global') ||
             hasPermissionWithWildcard(userContext.permissions, 'saved_searches.create.global') ||
             userContext.permissions.includes('saved_searches.*.global') ||
             userContext.permissions.includes('saved_searches.*.tenant'),
    canLoad: isSuperAdmin ||
             hasPermissionWithWildcard(userContext.permissions, 'saved_searches.read.own') || 
             hasPermissionWithWildcard(userContext.permissions, 'saved_searches.read.global') ||
             hasPermissionWithWildcard(userContext.permissions, 'saved_searches.read.tenant') ||
             userContext.permissions.includes('saved_searches.*.global') ||
             userContext.permissions.includes('saved_searches.*.tenant'),
  };

  // 🔍 DEBUG: Log saved search configuration - EXPANDED
  React.useEffect(() => {
    console.log('🔍 DEBUG: EXPANDED Saved Search Config Analysis', {
      enabled: savedSearchConfig.enabled,
      entityType: savedSearchConfig.entityType,
      canSave: savedSearchConfig.canSave,
      canLoad: savedSearchConfig.canLoad,
      userPermissions: userContext.permissions,
      allPermissions: userContext.permissions,
      permissionChecks: {
        'saved_searches.create.own': userContext.permissions.includes('saved_searches.create.own'),
        'saved_searches.manage.global': userContext.permissions.includes('saved_searches.manage.global'),
        'create:saved_searches': userContext.permissions.includes('create:saved_searches'),
        'manage:saved_searches_global': userContext.permissions.includes('manage:saved_searches_global'),
        'saved_searches.read.own': userContext.permissions.includes('saved_searches.read.own'),
        'saved_searches.read.global': userContext.permissions.includes('saved_searches.read.global'),
        'read:saved_searches': userContext.permissions.includes('read:saved_searches'),
        'read:saved_searches_all': userContext.permissions.includes('read:saved_searches_all'),
      },
      savedSearchPermissions: userContext.permissions.filter(p => p.includes('saved_search')),
      userRole: userContext.adminRole,
      userId: userContext.userId
    });
  }, [savedSearchConfig, userContext.permissions]);

  // ============================================================================
  // ROW SELECTION HANDLERS
  // ============================================================================

  const handleRowSelect = (id: string, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(tableData.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      toast.loading('Deleting tenant...');
      
      const response = await fetch(`/api/v1/admin/tenants/${tenantId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete tenant');
      }
      
      toast.dismiss();
      toast.success(tCommon('messages.deleteSuccess', { entity: t('tenant') }));
      browserLogger.userAction('admin_tenant_delete', `Deleted tenant ${tenantId}`);
      queryClient.invalidateQueries({ queryKey: ['adminTenants'] });
      refetch(); // Refetch data
    } catch (err: any) {
      toast.dismiss();
      toast.error(tCommon('messages.deleteError', { entity: t('tenant'), message: err.message }));
      browserLogger.error('admin_tenant_delete_failed', { tenantId, error: err.message });
    }
  };

  const handleSuspendTenant = async (tenantId: string, isActive: boolean) => {
    try {
      toast.loading('Updating tenant status...');
      
      const response = await fetch(`/api/v1/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update tenant');
      }
      
      toast.dismiss();
      toast.success(tCommon('messages.updateSuccess', { entity: t('tenant') }));
      browserLogger.userAction('admin_tenant_status_change', `Updated tenant ${tenantId} status to ${isActive ? 'active' : 'inactive'}`);
      queryClient.invalidateQueries({ queryKey: ['adminTenants'] });
      refetch(); // Refetch data
    } catch (err: any) {
      toast.dismiss();
      toast.error(tCommon('messages.updateError', { entity: t('tenant'), message: err.message }));
      browserLogger.error('admin_tenant_status_change_failed', { tenantId, isActive, error: err.message });
    }
  };

  const handleBulkDelete = async (selectedIds: Set<string>) => {
    browserLogger.userAction('admin_tenants_bulk_delete_initiated', `Bulk delete initiated for ${selectedIds.size} tenants`);
    for (const id of Array.from(selectedIds)) {
      await handleDeleteTenant(id);
    }
    setSelectedRows(new Set());
    toast.info(tCommon('messages.bulkDeleteCompleted', { count: selectedIds.size, entity: t('tenants') }));
  };

  const handleBulkStatusChange = async (status: 'active' | 'inactive', selectedIds: Set<string>) => {
    const isActive = status === 'active';
    browserLogger.userAction('admin_tenants_bulk_status_change_initiated', `Bulk status change to ${status} initiated for ${selectedIds.size} tenants`);
    for (const id of Array.from(selectedIds)) {
      await handleSuspendTenant(id, isActive);
    }
    setSelectedRows(new Set());
    toast.info(tCommon('messages.bulkUpdateCompleted', { count: selectedIds.size, entity: t('tenants') }));
  };

  // Enhanced bulk actions configuration - DISABLED
  /* const enhancedBulkActions: EnhancedBulkAction[] = [
    {
      key: 'export',
      label: 'Export CSV',
      icon: MoreHorizontal, // Will be replaced with Download icon
      variant: 'outline',
      description: 'Export selected tenants to CSV file',
      onClick: async (selectedIds) => {
        browserLogger.userAction('admin_tenants_bulk_export', `Exporting ${selectedIds.size} tenants`);
        // TODO: Implement CSV export
        toast.info(`Exporting ${selectedIds.size} tenants...`);
      }
    },
    {
      key: 'activate',
      label: 'Activate',
      icon: MoreHorizontal, // Will be replaced with appropriate icon
      variant: 'outline',
      description: 'Activate selected tenants',
      onClick: (selectedIds) => handleBulkStatusChange('active', selectedIds)
    },
    {
      key: 'deactivate',
      label: 'Deactivate',
      icon: MoreHorizontal, // Will be replaced with appropriate icon
      variant: 'outline',
      description: 'Deactivate selected tenants',
      onClick: (selectedIds) => handleBulkStatusChange('inactive', selectedIds)
    },
    {
      key: 'email',
      label: 'Send Email',
      icon: MoreHorizontal, // Will be replaced with Mail icon
      variant: 'outline',
      description: 'Send email to tenant administrators',
      onClick: async (selectedIds) => {
        browserLogger.userAction('admin_tenants_bulk_email', `Sending email to ${selectedIds.size} tenants`);
        // TODO: Implement bulk email
        toast.info(`Preparing email for ${selectedIds.size} tenants...`);
      }
    },
    {
      key: 'delete',
      label: 'Delete Selected',
      icon: MoreHorizontal, // Will be replaced with Trash icon
      variant: 'destructive',
      confirmationRequired: true,
      description: 'Permanently delete selected tenants',
      onClick: handleBulkDelete
    }
  ]; */

  // Standard bulk actions for AdminListPage compatibility
  const bulkActions: BulkAction[] = [
    {
      key: 'activate',
      label: 'Activate',
      variant: 'outline',
      permission: { action: 'update', resource: 'tenants' },
      onClick: (selectedIds) => handleBulkStatusChange('active', selectedIds)
    },
    {
      key: 'deactivate',
      label: 'Deactivate',
      variant: 'outline',
      permission: { action: 'update', resource: 'tenants' },
      onClick: (selectedIds) => handleBulkStatusChange('inactive', selectedIds)
    },
    {
      key: 'delete',
      label: 'Delete Selected',
      variant: 'destructive',
      permission: { action: 'delete', resource: 'tenants' },
      onClick: handleBulkDelete
    }
  ];

  // Debug: Log bulk actions configuration
  React.useEffect(() => {
    browserLogger.info('🔧 Bulk actions configured', {
      actionsCount: bulkActions.length,
      actions: bulkActions.map(a => ({ key: a.key, label: a.label, permission: a.permission })),
      userPermissions: userContext.permissions,
      adminRole: userContext.adminRole
    });
  }, [bulkActions, userContext.permissions, userContext.adminRole]);

  const handleTenantAction = (action: string, tenantId: string) => {
    browserLogger.userAction('admin_tenant_action', `${action} on tenant ${tenantId}`);
    
    const tenant = tableData.find(t => t.uuid === tenantId);
    
    switch (action) {
      case 'view':
        router.push(`/admin/tenants/${tenantId}`);
        break;
      case 'edit':
        router.push(`/admin/tenants/${tenantId}/edit`);
        break;
      case 'users':
        router.push(`/admin/tenants/${tenantId}/users`);
        break;
      case 'settings':
        router.push(`/admin/tenants/${tenantId}/settings`);
        break;
      case 'suspend':
        if (tenant) {
          setSelectedTenant(tenant);
          setSuspendModalOpen(true);
        }
        break;
      case 'delete':
        if (tenant) {
          setSelectedTenant(tenant);
          setDeleteModalOpen(true);
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Row actions renderer
  const renderRowActions = (tenant: TenantData) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <PermissionGate permissions={['tenants.update']}>
          <DropdownMenuItem onClick={() => handleTenantAction('edit', tenant.uuid)}>
            <Edit className="mr-2 h-4 w-4" />
            {t('actions.edit')}
          </DropdownMenuItem>
        </PermissionGate>
        <PermissionGate permissions={['tenants.delete']}>
          <DropdownMenuItem 
            onClick={() => handleTenantAction('delete', tenant.uuid)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('actions.delete')}
          </DropdownMenuItem>
        </PermissionGate>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Active filters for the composite component
  const activeFilters = {
    status: filters.status,
    currencies: filters.currencies,
    userCountRange: filters.userCountRange
  };

  // 🔍 ADDITIONAL DEBUG: Log when FilterBar would render saved search controls
  React.useEffect(() => {
    console.log('🔍 DEBUG: FilterBar rendering conditions', {
      savedSearchConfigEnabled: savedSearchConfig?.enabled,
      canLoad: savedSearchConfig?.canLoad,
      canSave: savedSearchConfig?.canSave,
      hasActiveFilters: Object.values(activeFilters).some(arr => arr.length > 0),
      activeFilters,
      searchValue: filters.search,
      fullSavedSearchConfig: savedSearchConfig
    });
  }, [savedSearchConfig, activeFilters, filters.search]);

  // Load default saved search on initial mount (best practice)
  React.useEffect(() => {
    const loadDefaultSearch = async () => {
      // Only load if:
      // 1. User hasn't interacted with filters yet
      // 2. Default hasn't been loaded already
      // 3. User has permission to load saved searches
      if (!hasUserInteracted && !defaultLoaded && savedSearchConfig.canLoad) {
        try {
          // Fetch the default saved search for this entity type
          const response = await fetch(`/api/v1/saved-searches/default?entityType=${savedSearchConfig.entityType}`);
          
          if (response.ok) {
            const result = await response.json();
            
            if (result.success && result.data) {
              const defaultSearch = result.data;
              
              // Apply the default search configuration
              handleLoadSavedSearch({
                filters: defaultSearch.filterCriteria || {},
                sortConfig: defaultSearch.sortConfig || null,
                columnVisibility: defaultSearch.columnConfig || {},
                searchValue: defaultSearch.searchValue,
                paginationLimit: defaultSearch.paginationLimit,
                searchName: defaultSearch.name
              });
              
              setDefaultLoaded(true);
              
              browserLogger.info('📋 Default saved search loaded', {
                searchName: defaultSearch.name,
                entityType: savedSearchConfig.entityType
              });
            }
          }
        } catch (error) {
          // Silently fail - default search is optional enhancement
          browserLogger.debug('No default saved search found', { 
            entityType: savedSearchConfig.entityType,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(loadDefaultSearch, 500);
    
    return () => clearTimeout(timer);
  }, [hasUserInteracted, defaultLoaded, savedSearchConfig.canLoad, savedSearchConfig.entityType, handleLoadSavedSearch]);

  // Removed enhancedActiveFilters - using activeFilters directly
  /* const enhancedActiveFilters = [
    {
      key: 'status',
      label: 'Status',
      values: activeFilters.status,
      onRemove: (key: string, value?: string) => {
        if (value) {
          handleFilterChange(key, activeFilters.status.filter(v => v !== value));
        } else {
          handleFilterChange(key, []);
        }
      }
    },
    {
      key: 'currencies',
      label: 'Currency',
      values: activeFilters.currencies,
      onRemove: (key: string, value?: string) => {
        if (value) {
          handleFilterChange(key, activeFilters.currencies.filter(v => v !== value));
        } else {
          handleFilterChange(key, []);
        }
      }
    },
    {
      key: 'userCountRange',
      label: 'User Count',
      values: activeFilters.userCountRange,
      onRemove: (key: string, value?: string) => {
        if (value) {
          handleFilterChange(key, activeFilters.userCountRange.filter(v => v !== value));
        } else {
          handleFilterChange(key, []);
        }
      }
    }
  ]; */

  return (
    <div className="space-y-6 p-8">
      {/* Header with Stats Cards */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Tenant Management</h1>
        <p className="text-muted-foreground">
          Manage platform tenants and their configurations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All-in-One Data Table with Integrated Controls */}
      <AdminListPage<TenantData>
        statsCards={[]} // Stats handled separately above
        addConfig={{
          onClick: () => router.push('/admin/tenants/new'),
          label: t('create.addTenant'),
          permission: { action: 'create', resource: 'tenants' }
        }}
        searchConfig={{
          placeholder: "Search by name, domain, or tenant ID...",
          value: filters.search,
          suggestions: searchSuggestions,
          onChange: handleSearchChange
        }}
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        savedSearchConfig={{
          entityType: 'tenants',
          enabled: true,
          activeSearchName: activeSearchName,
          onLoadSearch: handleLoadSavedSearch,
          onSaveSearch: handleSaveSavedSearch,
          canSave: userContext.permissions.includes('admin:tenants:write') || userContext.permissions.includes('*'),
          canLoad: userContext.permissions.includes('admin:tenants:read') || userContext.permissions.includes('*')
        }}
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        fetchError={error?.message || null}
        selectedRows={selectedRows}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
        getRowId={(row) => row.id}
        bulkActions={bulkActions}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        sortConfig={sortConfig}
        onSort={handleSort}
        onRowClick={(tenant) => {
          handleTenantAction('view', tenant.uuid);
          browserLogger.info('Navigating to tenant details', { 
            tenantId: tenant.uuid,
            userRole: userContext.adminRole
          });
        }}
        rowClassName={(tenant) => 
          !tenant.isActive ? 'opacity-60' : ''
        }
        renderRowActions={renderRowActions}
        userContext={userContext}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        savedSearchConfig={savedSearchConfig}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Tenant"
        description={
          selectedTenant 
            ? `Are you sure you want to delete "${selectedTenant.name}"? This action cannot be undone and will permanently remove all associated data.`
            : 'Are you sure you want to delete this tenant?'
        }
        confirmText="Delete Tenant"
        variant="destructive"
        icon="delete"
        onConfirm={async () => {
          if (selectedTenant) {
            await handleDeleteTenant(selectedTenant.uuid);
            setSelectedTenant(null);
            setDeleteModalOpen(false);
          }
        }}
        onCancel={() => {
          setSelectedTenant(null);
          setDeleteModalOpen(false);
        }}
      />

      {/* Suspend Confirmation Modal */}
      <ConfirmationModal
        open={suspendModalOpen}
        onOpenChange={setSuspendModalOpen}
        title="Suspend Tenant"
        description={
          selectedTenant 
            ? `Are you sure you want to suspend "${selectedTenant.name}"? This will deactivate the tenant and prevent access to their services.`
            : 'Are you sure you want to suspend this tenant?'
        }
        confirmText="Suspend Tenant"
        variant="warning"
        icon="suspend"
        onConfirm={async () => {
          if (selectedTenant) {
            await handleSuspendTenant(selectedTenant.uuid);
            setSelectedTenant(null);
            setSuspendModalOpen(false);
          }
        }}
        onCancel={() => {
          setSelectedTenant(null);
          setSuspendModalOpen(false);
        }}
      />
    </div>
  );
} 