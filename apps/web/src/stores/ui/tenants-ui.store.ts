import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GetTenantsParams } from '@/lib/services/tenants.service';
import { browserLogger } from '@/lib/browser-logger';

/**
 * TenantsUIStore - itellico Mono Zustand Implementation
 * 
 * ✅ Mono PLATFORM COMPLIANCE:
 * - Domain-focused store (tenants UI state only)
 * - Full middleware stack (devtools + persist + immer)
 * - TypeScript interfaces for all state
 * - Tenant isolation where applicable
 * - Separation from server state (TanStack Query)
 * - UI state only (modals, forms, preferences)
 */

// ✅ TYPESCRIPT INTERFACES - Required for Mono platform

interface TenantFilters extends GetTenantsParams {
  page: number;
  limit: number;
  search: string;
  status: string;
  currency: string;
  userCountRange: string;
}

interface TenantFormState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  tenantUuid?: string;
  isSubmitting: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
}

interface TenantBulkActions {
  selectedTenants: Set<string>;
  isSelectionMode: boolean;
  bulkAction: 'activate' | 'deactivate' | 'delete' | null;
  isBulkActionInProgress: boolean;
}

interface TenantTablePreferences {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  visibleColumns: string[];
  density: 'compact' | 'comfortable' | 'spacious';
  pageSize: number;
}

interface TenantListViewState {
  viewMode: 'table' | 'grid' | 'cards';
  isFilterPanelOpen: boolean;
  isStatsExpanded: boolean;
  activeFilterCount: number;
  lastRefreshTime: Date | null;
}

interface TenantsUIState {
  // ✅ TENANT ISOLATION - Include tenant context where applicable
  currentTenantId: string | null;
  
  // Filter state
  filters: TenantFilters;
  savedFilters: Record<string, TenantFilters>;
  activeFilterPreset: string | null;
  
  // Form state
  form: TenantFormState;
  
  // Bulk actions
  bulkActions: TenantBulkActions;
  
  // Table preferences
  tablePreferences: TenantTablePreferences;
  
  // List view state
  listView: TenantListViewState;
  
  // UI state
  modals: {
    deleteConfirm: { isOpen: boolean; tenantUuid?: string; tenantName?: string };
    bulkActionConfirm: { isOpen: boolean; action?: string; count: number };
    exportData: { isOpen: boolean; format?: 'csv' | 'xlsx' | 'json' };
    importData: { isOpen: boolean; step: number };
  };
  
  // Notification preferences
  notifications: {
    showSuccessToasts: boolean;
    showErrorDetails: boolean;
    enableSounds: boolean;
  };
}

interface TenantsUIActions {
  // ✅ FILTER ACTIONS
  setFilters: (filters: Partial<TenantFilters>) => void;
  resetFilters: () => void;
  saveFilterPreset: (name: string, filters: TenantFilters) => void;
  loadFilterPreset: (name: string) => void;
  deleteFilterPreset: (name: string) => void;
  updateActiveFilterCount: () => void;
  
  // ✅ FORM ACTIONS
  openCreateForm: () => void;
  openEditForm: (tenantUuid: string) => void;
  openViewForm: (tenantUuid: string) => void;
  closeForm: () => void;
  setFormSubmitting: (isSubmitting: boolean) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  setFormDirty: (isDirty: boolean) => void;
  clearFormErrors: () => void;
  
  // ✅ BULK ACTION ACTIONS
  toggleTenantSelection: (tenantUuid: string) => void;
  selectAllTenants: (tenantUuids: string[]) => void;
  clearSelection: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  setBulkAction: (action: 'activate' | 'deactivate' | 'delete' | null) => void;
  setBulkActionProgress: (inProgress: boolean) => void;
  
  // ✅ TABLE PREFERENCE ACTIONS
  setSortBy: (column: string, order?: 'asc' | 'desc') => void;
  toggleColumnVisibility: (column: string) => void;
  setTableDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;
  setPageSize: (size: number) => void;
  resetTablePreferences: () => void;
  
  // ✅ LIST VIEW ACTIONS
  setViewMode: (mode: 'table' | 'grid' | 'cards') => void;
  toggleFilterPanel: () => void;
  toggleStatsExpanded: () => void;
  setLastRefreshTime: () => void;
  
  // ✅ MODAL ACTIONS
  openDeleteConfirm: (tenantUuid: string, tenantName: string) => void;
  closeDeleteConfirm: () => void;
  openBulkActionConfirm: (action: string, count: number) => void;
  closeBulkActionConfirm: () => void;
  openExportModal: () => void;
  closeExportModal: () => void;
  openImportModal: () => void;
  closeImportModal: () => void;
  setImportStep: (step: number) => void;
  
  // ✅ NOTIFICATION ACTIONS
  setNotificationPreferences: (preferences: Partial<TenantsUIState['notifications']>) => void;
  
  // ✅ UTILITY ACTIONS
  resetAllState: () => void;
  setCurrentTenant: (tenantId: string | null) => void;
}

// ✅ DEFAULT STATE
const defaultFilters: TenantFilters = {
  page: 1,
  limit: 20,
  search: '',
  status: 'all',
  currency: '',
  userCountRange: ''
};

const defaultTablePreferences: TenantTablePreferences = {
  sortBy: 'createdAt',
  sortOrder: 'desc',
  visibleColumns: ['name', 'domain', 'status', 'userCount', 'createdAt', 'actions'],
  density: 'comfortable',
  pageSize: 20
};

const initialState: TenantsUIState = {
  currentTenantId: null,
  
  filters: defaultFilters,
  savedFilters: {},
  activeFilterPreset: null,
  
  form: {
    isOpen: false,
    mode: 'create',
    tenantUuid: undefined,
    isSubmitting: false,
    errors: {},
    isDirty: false
  },
  
  bulkActions: {
    selectedTenants: new Set(),
    isSelectionMode: false,
    bulkAction: null,
    isBulkActionInProgress: false
  },
  
  tablePreferences: defaultTablePreferences,
  
  listView: {
    viewMode: 'table',
    isFilterPanelOpen: false,
    isStatsExpanded: true,
    activeFilterCount: 0,
    lastRefreshTime: null
  },
  
  modals: {
    deleteConfirm: { isOpen: false },
    bulkActionConfirm: { isOpen: false, count: 0 },
    exportData: { isOpen: false },
    importData: { isOpen: false, step: 1 }
  },
  
  notifications: {
    showSuccessToasts: true,
    showErrorDetails: true,
    enableSounds: false
  }
};

// ✅ ZUSTAND STORE WITH FULL MIDDLEWARE STACK
export const useTenantsUIStore = create<TenantsUIState & TenantsUIActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,
        
        // ✅ FILTER ACTIONS
        setFilters: (newFilters) => {
          set((state) => {
            Object.assign(state.filters, newFilters);
            state.listView.activeFilterCount = get().updateActiveFilterCount();
          });
          
          browserLogger.userAction('tenants_filter_changed', 'tenants', {
            filters: Object.keys(newFilters),
            page: get().filters.page
          });
        },
        
        resetFilters: () => {
          set((state) => {
            state.filters = { ...defaultFilters };
            state.activeFilterPreset = null;
            state.listView.activeFilterCount = 0;
          });
          
          browserLogger.userAction('tenants_filters_reset');
        },
        
        saveFilterPreset: (name, filters) => {
          set((state) => {
            state.savedFilters[name] = { ...filters };
            state.activeFilterPreset = name;
          });
          
          browserLogger.userAction('tenants_filter_preset_saved', { name });
        },
        
        loadFilterPreset: (name) => {
          const preset = get().savedFilters[name];
          if (preset) {
            set((state) => {
              state.filters = { ...preset };
              state.activeFilterPreset = name;
              state.listView.activeFilterCount = get().updateActiveFilterCount();
            });
            
            browserLogger.userAction('tenants_filter_preset_loaded', { name });
          }
        },
        
        deleteFilterPreset: (name) => {
          set((state) => {
            delete state.savedFilters[name];
            if (state.activeFilterPreset === name) {
              state.activeFilterPreset = null;
            }
          });
          
          browserLogger.userAction('tenants_filter_preset_deleted', { name });
        },
        
        updateActiveFilterCount: () => {
          const filters = get().filters;
          let count = 0;
          
          if (filters.search.trim()) count++;
          if (filters.status !== 'all') count++;
          if (filters.currency) count++;
          if (filters.userCountRange) count++;
          
          set((state) => {
            state.listView.activeFilterCount = count;
          });
          
          return count;
        },
        
        // ✅ FORM ACTIONS
        openCreateForm: () => {
          set((state) => {
            state.form = {
              isOpen: true,
              mode: 'create',
              tenantUuid: undefined,
              isSubmitting: false,
              errors: {},
              isDirty: false
            };
          });
          
          browserLogger.userAction('tenants_form_opened', { mode: 'create' });
        },
        
        openEditForm: (tenantUuid) => {
          set((state) => {
            state.form = {
              isOpen: true,
              mode: 'edit',
              tenantUuid,
              isSubmitting: false,
              errors: {},
              isDirty: false
            };
          });
          
          browserLogger.userAction('tenants_form_opened', { mode: 'edit', tenantUuid });
        },
        
        openViewForm: (tenantUuid) => {
          set((state) => {
            state.form = {
              isOpen: true,
              mode: 'view',
              tenantUuid,
              isSubmitting: false,
              errors: {},
              isDirty: false
            };
          });
          
          browserLogger.userAction('tenants_form_opened', { mode: 'view', tenantUuid });
        },
        
        closeForm: () => {
          const wasDirty = get().form.isDirty;
          
          set((state) => {
            state.form = {
              isOpen: false,
              mode: 'create',
              tenantUuid: undefined,
              isSubmitting: false,
              errors: {},
              isDirty: false
            };
          });
          
          browserLogger.userAction('tenants_form_closed', { wasDirty });
        },
        
        setFormSubmitting: (isSubmitting) => {
          set((state) => {
            state.form.isSubmitting = isSubmitting;
          });
        },
        
        setFormErrors: (errors) => {
          set((state) => {
            state.form.errors = errors;
          });
        },
        
        setFormDirty: (isDirty) => {
          set((state) => {
            state.form.isDirty = isDirty;
          });
        },
        
        clearFormErrors: () => {
          set((state) => {
            state.form.errors = {};
          });
        },
        
        // ✅ BULK ACTION ACTIONS
        toggleTenantSelection: (tenantUuid) => {
          set((state) => {
            if (state.bulkActions.selectedTenants.has(tenantUuid)) {
              state.bulkActions.selectedTenants.delete(tenantUuid);
            } else {
              state.bulkActions.selectedTenants.add(tenantUuid);
            }
          });
          
          const selectedCount = get().bulkActions.selectedTenants.size;
          browserLogger.userAction('tenants_selection_toggled', { 
            tenantUuid, 
            selectedCount 
          });
        },
        
        selectAllTenants: (tenantUuids) => {
          set((state) => {
            state.bulkActions.selectedTenants = new Set(tenantUuids);
          });
          
          browserLogger.userAction('tenants_select_all', { count: tenantUuids.length });
        },
        
        clearSelection: () => {
          set((state) => {
            state.bulkActions.selectedTenants.clear();
            state.bulkActions.isSelectionMode = false;
            state.bulkActions.bulkAction = null;
          });
          
          browserLogger.userAction('tenants_selection_cleared');
        },
        
        enterSelectionMode: () => {
          set((state) => {
            state.bulkActions.isSelectionMode = true;
          });
          
          browserLogger.userAction('tenants_selection_mode_entered');
        },
        
        exitSelectionMode: () => {
          set((state) => {
            state.bulkActions.isSelectionMode = false;
            state.bulkActions.selectedTenants.clear();
            state.bulkActions.bulkAction = null;
          });
          
          browserLogger.userAction('tenants_selection_mode_exited');
        },
        
        setBulkAction: (action) => {
          set((state) => {
            state.bulkActions.bulkAction = action;
          });
          
          if (action) {
            browserLogger.userAction('tenants_bulk_action_set', { 
              action,
              selectedCount: get().bulkActions.selectedTenants.size
            });
          }
        },
        
        setBulkActionProgress: (inProgress) => {
          set((state) => {
            state.bulkActions.isBulkActionInProgress = inProgress;
          });
        },
        
        // ✅ TABLE PREFERENCE ACTIONS
        setSortBy: (column, order) => {
          set((state) => {
            state.tablePreferences.sortBy = column;
            state.tablePreferences.sortOrder = order || 
              (state.tablePreferences.sortBy === column && state.tablePreferences.sortOrder === 'asc' 
                ? 'desc' 
                : 'asc');
          });
          
          browserLogger.userAction('tenants_sort_changed', { 
            column, 
            order: get().tablePreferences.sortOrder 
          });
        },
        
        toggleColumnVisibility: (column) => {
          set((state) => {
            const visibleColumns = state.tablePreferences.visibleColumns;
            const index = visibleColumns.indexOf(column);
            
            if (index > -1) {
              visibleColumns.splice(index, 1);
            } else {
              visibleColumns.push(column);
            }
          });
          
          browserLogger.userAction('tenants_column_toggled', { 
            column,
            visible: get().tablePreferences.visibleColumns.includes(column)
          });
        },
        
        setTableDensity: (density) => {
          set((state) => {
            state.tablePreferences.density = density;
          });
          
          browserLogger.userAction('tenants_table_density_changed', { density });
        },
        
        setPageSize: (size) => {
          set((state) => {
            state.tablePreferences.pageSize = size;
            state.filters.limit = size;
          });
          
          browserLogger.userAction('tenants_page_size_changed', { size });
        },
        
        resetTablePreferences: () => {
          set((state) => {
            state.tablePreferences = { ...defaultTablePreferences };
          });
          
          browserLogger.userAction('tenants_table_preferences_reset');
        },
        
        // ✅ LIST VIEW ACTIONS
        setViewMode: (mode) => {
          set((state) => {
            state.listView.viewMode = mode;
          });
          
          browserLogger.userAction('tenants_view_mode_changed', { mode });
        },
        
        toggleFilterPanel: () => {
          set((state) => {
            state.listView.isFilterPanelOpen = !state.listView.isFilterPanelOpen;
          });
          
          browserLogger.userAction('tenants_filter_panel_toggled', { 
            isOpen: get().listView.isFilterPanelOpen 
          });
        },
        
        toggleStatsExpanded: () => {
          set((state) => {
            state.listView.isStatsExpanded = !state.listView.isStatsExpanded;
          });
          
          browserLogger.userAction('tenants_stats_toggled', { 
            isExpanded: get().listView.isStatsExpanded 
          });
        },
        
        setLastRefreshTime: () => {
          set((state) => {
            state.listView.lastRefreshTime = new Date();
          });
        },
        
        // ✅ MODAL ACTIONS
        openDeleteConfirm: (tenantUuid, tenantName) => {
          set((state) => {
            state.modals.deleteConfirm = { isOpen: true, tenantUuid, tenantName };
          });
          
          browserLogger.userAction('tenants_delete_modal_opened', { tenantUuid });
        },
        
        closeDeleteConfirm: () => {
          set((state) => {
            state.modals.deleteConfirm = { isOpen: false };
          });
        },
        
        openBulkActionConfirm: (action, count) => {
          set((state) => {
            state.modals.bulkActionConfirm = { isOpen: true, action, count };
          });
          
          browserLogger.userAction('tenants_bulk_action_modal_opened', { action, count });
        },
        
        closeBulkActionConfirm: () => {
          set((state) => {
            state.modals.bulkActionConfirm = { isOpen: false, count: 0 };
          });
        },
        
        openExportModal: () => {
          set((state) => {
            state.modals.exportData = { isOpen: true };
          });
          
          browserLogger.userAction('tenants_export_modal_opened');
        },
        
        closeExportModal: () => {
          set((state) => {
            state.modals.exportData = { isOpen: false };
          });
        },
        
        openImportModal: () => {
          set((state) => {
            state.modals.importData = { isOpen: true, step: 1 };
          });
          
          browserLogger.userAction('tenants_import_modal_opened');
        },
        
        closeImportModal: () => {
          set((state) => {
            state.modals.importData = { isOpen: false, step: 1 };
          });
        },
        
        setImportStep: (step) => {
          set((state) => {
            state.modals.importData.step = step;
          });
        },
        
        // ✅ NOTIFICATION ACTIONS
        setNotificationPreferences: (preferences) => {
          set((state) => {
            Object.assign(state.notifications, preferences);
          });
          
          browserLogger.userAction('tenants_notification_preferences_changed', preferences);
        },
        
        // ✅ UTILITY ACTIONS
        resetAllState: () => {
          set(() => ({ ...initialState }));
          browserLogger.userAction('tenants_ui_state_reset');
        },
        
        setCurrentTenant: (tenantId) => {
          set((state) => {
            state.currentTenantId = tenantId;
          });
          
          browserLogger.userAction('tenants_current_tenant_changed', { tenantId });
        }
      })),
      {
        name: 'tenants-ui-store',
        // ✅ SELECTIVE PERSISTENCE - Only persist user preferences
        partialize: (state) => ({
          savedFilters: state.savedFilters,
          tablePreferences: state.tablePreferences,
          listView: {
            viewMode: state.listView.viewMode,
            isFilterPanelOpen: state.listView.isFilterPanelOpen,
            isStatsExpanded: state.listView.isStatsExpanded
          },
          notifications: state.notifications
        }),
        version: 1,
        // ✅ MIGRATION STRATEGY for future schema changes
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migration from version 0 to 1
            return {
              ...persistedState,
              // Add any new fields or transform existing ones
            };
          }
          return persistedState;
        }
      }
    ),
    {
      name: 'tenants-ui-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// ✅ SELECTORS WITH useShallow FOR PERFORMANCE
export const useTenantsUISelectors = {
  // Filter selectors
  filters: () => useTenantsUIStore((state) => state.filters),
  activeFilterCount: () => useTenantsUIStore((state) => state.listView.activeFilterCount),
  savedFilters: () => useTenantsUIStore((state) => state.savedFilters),
  
  // Form selectors
  form: () => useTenantsUIStore((state) => state.form),
  formErrors: () => useTenantsUIStore((state) => state.form.errors),
  isFormDirty: () => useTenantsUIStore((state) => state.form.isDirty),
  
  // Bulk action selectors
  selectedTenants: () => useTenantsUIStore((state) => state.bulkActions.selectedTenants),
  isSelectionMode: () => useTenantsUIStore((state) => state.bulkActions.isSelectionMode),
  selectedCount: () => useTenantsUIStore((state) => state.bulkActions.selectedTenants.size),
  
  // Table preference selectors
  tablePreferences: () => useTenantsUIStore((state) => state.tablePreferences),
  visibleColumns: () => useTenantsUIStore((state) => state.tablePreferences.visibleColumns),
  
  // List view selectors
  viewMode: () => useTenantsUIStore((state) => state.listView.viewMode),
  isFilterPanelOpen: () => useTenantsUIStore((state) => state.listView.isFilterPanelOpen),
  
  // Modal selectors
  modals: () => useTenantsUIStore((state) => state.modals),
  
  // Notification selectors
  notifications: () => useTenantsUIStore((state) => state.notifications)
}; 