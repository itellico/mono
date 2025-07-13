/**
 * Admin Settings UI Store - Zustand UI state management ONLY
 * 
 * ⚠️ STORAGE STRATEGY COMPLIANCE:
 * - Contains ONLY UI state (filters, view preferences, selections)
 * - Server data (AdminSetting[]) moved to TanStack Query
 * - No authentication data or server-derived data stored
 * 
 * Features:
 * - Filtering and search state
 * - View preferences (table/cards, sorting, columns)
 * - Selection and bulk operation UI state
 * - Import/export progress tracking
 * - Pagination UI state
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// TYPES & INTERFACES  
// ============================================================================

// ❌ REMOVED: AdminSetting interface moved to server/API layer
// Server data types should be in TanStack Query hooks, not Zustand stores

// ✅ UI-only types for the store

export interface SettingsFilters {
  category?: string;
  search?: string;
  isGlobal?: boolean;
  type?: string;
  isPublic?: boolean;
}

export interface SettingsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BulkOperation {
  type: 'delete' | 'export' | 'update' | 'import';
  selectedIds: Set<string>;
  isLoading: boolean;
  progress?: number;
  error?: string;
}

export interface ImportExportState {
  isImporting: boolean;
  isExporting: boolean;
  importProgress?: number;
  exportProgress?: number;
  importResults?: {
    imported: number;
    skipped: number;
    errors: string[];
  };
  error?: string;
}

export interface SettingsViewState {
  viewMode: 'table' | 'cards';
  selectedRows: Set<string>;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  columnVisibility: Record<string, boolean>;
  expandedRows: Set<string>;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface AdminSettingsUIStore {
  // ✅ UI State ONLY - No server data
  filters: SettingsFilters;
  viewState: SettingsViewState;
  bulkOperation: BulkOperation;
  importExport: ImportExportState;
  
  // ❌ REMOVED: Server data moved to TanStack Query
  // settings: AdminSetting[];          // Use useAdminSettings() hook instead
  // categories: string[];              // Use useAdminCategories() hook instead
  // isLoading: boolean;                // Use TanStack Query loading states
  // error: string | null;              // Use TanStack Query error states
  // lastRefresh: Date | null;          // Use TanStack Query metadata

  // ❌ REMOVED: Server data management actions  
  // setSettings, addSetting, updateSetting, removeSetting moved to TanStack Query mutations
  
  // ✅ Actions - UI State Management
  setFilters: (filters: Partial<SettingsFilters>) => void;
  clearFilters: () => void;
  setSearch: (search: string) => void;
  
  // Actions - View State
  setViewMode: (mode: 'table' | 'cards') => void;
  toggleRowSelection: (id: string) => void;
  selectAllRows: (ids: string[]) => void;
  clearSelection: () => void;
  setSorting: (column: string, direction: 'asc' | 'desc') => void;
  toggleColumnVisibility: (column: string) => void;
  toggleRowExpansion: (id: string) => void;
  
  // Actions - Bulk Operations
  startBulkOperation: (type: BulkOperation['type'], selectedIds: Set<string>) => void;
  updateBulkProgress: (progress: number) => void;
  completeBulkOperation: () => void;
  cancelBulkOperation: () => void;
  setBulkError: (error: string) => void;
  
  // Actions - Import/Export (UI state only)
  startImport: () => void;
  updateImportProgress: (progress: number) => void;
  setImportResults: (results: ImportExportState['importResults']) => void;
  completeImport: () => void;
  startExport: () => void;
  updateExportProgress: (progress: number) => void;
  completeExport: () => void;
  setImportExportError: (error: string) => void;
  
  // Actions - General UI state
  reset: () => void;
  
  // ❌ REMOVED: Server data selectors moved to TanStack Query
  // getFilteredSettings, getSelectedSettings, getSettingByKey - use hooks instead
  
  // ✅ UI-only selectors
  canPerformBulkOperation: () => boolean;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  // ❌ REMOVED: Server data moved to TanStack Query
  // settings: [],                    // Use useAdminSettings() hook
  // categories: [],                  // Use useAdminCategories() hook

  // ✅ UI state only
  filters: {
    category: undefined,
    search: '',
    isGlobal: undefined,
    type: undefined,
    isPublic: undefined,
  },
  bulkOperation: {
    type: 'delete' as const,
    selectedIds: new Set<string>(),
    isLoading: false,
    progress: undefined,
    error: undefined,
  },
  importExport: {
    isImporting: false,
    isExporting: false,
    importProgress: undefined,
    exportProgress: undefined,
    importResults: undefined,
    error: undefined,
  },
  viewState: {
    viewMode: 'table' as const,
    selectedRows: new Set<string>(),
    sortBy: 'key',
    sortDirection: 'asc' as const,
    columnVisibility: {
      key: true,
      value: true,
      category: true,
      description: true,
      type: true,
      isPublic: false,
      tenantId: false,
      createdAt: false,
      updatedAt: true,
    },
    expandedRows: new Set<string>(),
  },
  // ❌ REMOVED: Server state moved to TanStack Query
  // isLoading: false,               // Use TanStack Query isLoading
  // error: null,                    // Use TanStack Query error
  // lastRefresh: null,              // Use TanStack Query metadata
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useAdminSettingsStore = create<AdminSettingsUIStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // ❌ REMOVED: Server data management actions
        // Server data (settings, categories) now managed by TanStack Query hooks
        // Use useAdminSettings(), useCreateSetting(), useUpdateSetting(), etc.

        // ✅ Filtering & Search (UI state only)
        setFilters: (filters) =>
          set((state) => {
            state.filters = { ...state.filters, ...filters };
          }),

        clearFilters: () =>
          set((state) => {
            state.filters = initialState.filters;
          }),

        setSearch: (search) =>
          set((state) => {
            state.filters.search = search;
          }),

        // View State
        setViewMode: (mode) =>
          set((state) => {
            state.viewState.viewMode = mode;
          }),

        toggleRowSelection: (id) =>
          set((state) => {
            if (state.viewState.selectedRows.has(id)) {
              state.viewState.selectedRows.delete(id);
            } else {
              state.viewState.selectedRows.add(id);
            }
          }),

        selectAllRows: (ids) =>
          set((state) => {
            state.viewState.selectedRows = new Set(ids);
          }),

        clearSelection: () =>
          set((state) => {
            state.viewState.selectedRows = new Set();
          }),

        setSorting: (column, direction) =>
          set((state) => {
            state.viewState.sortBy = column;
            state.viewState.sortDirection = direction;
          }),

        toggleColumnVisibility: (column) =>
          set((state) => {
            state.viewState.columnVisibility[column] = !state.viewState.columnVisibility[column];
          }),

        toggleRowExpansion: (id) =>
          set((state) => {
            if (state.viewState.expandedRows.has(id)) {
              state.viewState.expandedRows.delete(id);
            } else {
              state.viewState.expandedRows.add(id);
            }
          }),

        // Bulk Operations
        startBulkOperation: (type, selectedIds) =>
          set((state) => {
            state.bulkOperation = {
              type,
              selectedIds: new Set(selectedIds),
              isLoading: true,
              progress: 0,
              error: undefined,
            };
          }),

        updateBulkProgress: (progress) =>
          set((state) => {
            state.bulkOperation.progress = progress;
          }),

        completeBulkOperation: () =>
          set((state) => {
            state.bulkOperation = {
              ...initialState.bulkOperation,
              selectedIds: new Set(),
            };
            state.viewState.selectedRows = new Set();
          }),

        cancelBulkOperation: () =>
          set((state) => {
            state.bulkOperation = {
              ...initialState.bulkOperation,
              selectedIds: new Set(),
            };
          }),

        setBulkError: (error) =>
          set((state) => {
            state.bulkOperation.error = error;
            state.bulkOperation.isLoading = false;
          }),

        // Import/Export
        startImport: () =>
          set((state) => {
            state.importExport.isImporting = true;
            state.importExport.importProgress = 0;
            state.importExport.importResults = undefined;
            state.importExport.error = undefined;
          }),

        updateImportProgress: (progress) =>
          set((state) => {
            state.importExport.importProgress = progress;
          }),

        setImportResults: (results) =>
          set((state) => {
            state.importExport.importResults = results;
          }),

        completeImport: () =>
          set((state) => {
            state.importExport.isImporting = false;
            state.importExport.importProgress = undefined;
          }),

        startExport: () =>
          set((state) => {
            state.importExport.isExporting = true;
            state.importExport.exportProgress = 0;
            state.importExport.error = undefined;
          }),

        updateExportProgress: (progress) =>
          set((state) => {
            state.importExport.exportProgress = progress;
          }),

        completeExport: () =>
          set((state) => {
            state.importExport.isExporting = false;
            state.importExport.exportProgress = undefined;
          }),

        setImportExportError: (error) =>
          set((state) => {
            state.importExport.error = error;
            state.importExport.isImporting = false;
            state.importExport.isExporting = false;
          }),

        // General
        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
            if (error) {
              state.isLoading = false;
            }
          }),


        reset: () =>
          set(() => ({
            ...initialState,
            filters: { ...initialState.filters },
            bulkOperation: { ...initialState.bulkOperation, selectedIds: new Set() },
            importExport: { ...initialState.importExport },
            viewState: {
              ...initialState.viewState,
              selectedRows: new Set(),
              expandedRows: new Set(),
              columnVisibility: { ...initialState.viewState.columnVisibility },
            },
          })),

        // ❌ REMOVED: Server data selectors moved to TanStack Query
        // getFilteredSettings() -> Use TanStack Query with client-side filtering
        // getSelectedSettings() -> Use TanStack Query data with selected IDs
        // getSettingByKey() -> Use TanStack Query findSetting hook

        // ✅ UI-only selectors

        canPerformBulkOperation: () => {
          const state = get();
          return state.viewState.selectedRows.size > 0 && !state.bulkOperation.isLoading;
        },
      }))
    ),
    {
      name: 'admin-settings-ui-store',
      version: 2, // Incremented for breaking change - removed server data
    }
  )
);

// ============================================================================
// STORE SUBSCRIPTIONS & SIDE EFFECTS
// ============================================================================

// ❌ REMOVED: Server data subscriptions moved to TanStack Query
// Filter changes should trigger TanStack Query refetch, not Zustand subscriptions

// Subscribe to selection changes for bulk operation state
useAdminSettingsStore.subscribe(
  (state) => state.viewState.selectedRows,
  (selectedRows) => {
    // Update bulk operation selected IDs when selection changes
    useAdminSettingsStore.getState().bulkOperation.selectedIds = new Set(selectedRows);
  }
);

// ============================================================================
// STORE UTILITIES & HELPERS
// ============================================================================

export const settingsStoreUtils = {
  // Export UI state for debugging (server data moved to TanStack Query)
  exportState: () => {
    const state = useAdminSettingsStore.getState();
    return {
      filters: state.filters,
      selectedCount: state.viewState.selectedRows.size,
      viewMode: state.viewState.viewMode,
      bulkOperationActive: state.bulkOperation.isLoading,
      importExportActive: state.importExport.isImporting || state.importExport.isExporting,
    };
  },

  // Reset to clean state
  hardReset: () => {
    useAdminSettingsStore.getState().reset();
  },

  // ❌ REMOVED: Pagination info moved to TanStack Query
  // Use TanStack Query pagination metadata instead
};