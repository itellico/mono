'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// Types
interface Translation {
  id: string;
  tenantId: number | null;
  entityType: string;
  entityId: string;
  languageCode: string;
  key: string;
  value: string;
  context: string | null;
  isAutoTranslated: boolean | null;
  needsReview: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: number | null;
  updatedBy: number | null;
}

interface TranslationFilters {
  page?: number;
  limit?: number;
  entityType?: string;
  entityId?: string;
  languageCode?: string;
  key?: string;
  search?: string;
  needsReview?: boolean;
  isAutoTranslated?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface TranslationKey {
  key: string;
  entityType: string;
  entityId: string;
  translations: Array<{
    id: string;
    languageCode: string;
    value: string;
    isAutoTranslated: boolean;
    needsReview: boolean;
  }>;
}

interface LanguageStatistics {
  languages: Array<{
    code: string;
    name: string;
    nativeName: string;
    isDefault: boolean;
    totalTranslations: number;
    completedTranslations: number;
    pendingReview: number;
    autoTranslated: number;
    completionPercentage: number;
  }>;
  totalKeys: number;
  entityTypes: string[];
}

interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean | null;
  isActive: boolean | null;
  tenantId: string | null;
  completionPercentage: string | null;
  isLive: boolean | null;
  fallbackLanguageCode: string | null;
  translationPriority: number | null;
  lastTranslationUpdate: string | null;
  autoTranslateEnabled: boolean | null;
  qualityThreshold: string | null;
  metadata: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ExtractedString {
  key: string;
  value: string;
  context?: string;
  location: {
    line?: number;
    column?: number;
    function?: string;
    attribute?: string;
  };
  category: string;
  confidence: number;
}

// Hook for listing translations
export function useTranslations(filters: TranslationFilters = {}) {
  return useQuery({
    queryKey: ['translations', filters],
    queryFn: async () => {
      const response = await apiClient.getTranslations(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch translations');
      }
      return response.data;
    },
    staleTime: 30000, // 30 seconds
  });
}

// Hook for getting translation keys
export function useTranslationKeys(entityType?: string) {
  return useQuery({
    queryKey: ['translation-keys', entityType],
    queryFn: async () => {
      const response = await apiClient.getTranslationKeys(entityType);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch translation keys');
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
}

// Hook for getting translation statistics
export function useTranslationStatistics() {
  return useQuery({
    queryKey: ['translation-statistics'],
    queryFn: async () => {
      const response = await apiClient.getTranslationStatistics();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch translation statistics');
      }
      return response.data;
    },
    staleTime: 300000, // 5 minutes
  });
}

// Hook for getting supported languages
export function useSupportedLanguages(activeOnly = true, includeGlobal = true) {
  return useQuery({
    queryKey: ['supported-languages', activeOnly, includeGlobal],
    queryFn: async () => {
      const response = await apiClient.getSupportedLanguages(activeOnly, includeGlobal);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch supported languages');
      }
      return response.data;
    },
    staleTime: 300000, // 5 minutes
  });
}

// Hook for getting default language
export function useDefaultLanguage() {
  return useQuery({
    queryKey: ['default-language'],
    queryFn: async () => {
      const response = await apiClient.getDefaultLanguage();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch default language');
      }
      return response.data;
    },
    staleTime: 3600000, // 1 hour
  });
}

// Hook for creating translations
export function useCreateTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      entityType: string;
      entityId: string;
      languageCode: string;
      key: string;
      value: string;
      context?: string;
      isAutoTranslated?: boolean;
      needsReview?: boolean;
    }) => {
      const response = await apiClient.createTranslation(data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create translation');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Translation created successfully');
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      queryClient.invalidateQueries({ queryKey: ['translation-keys'] });
      queryClient.invalidateQueries({ queryKey: ['translation-statistics'] });
    },
    onError: (error) => {
      toast.error(`Failed to create translation: ${error.message}`);
    },
  });
}

// Hook for updating translations
export function useUpdateTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updateData
    }: {
      id: string;
      value?: string;
      context?: string;
      isAutoTranslated?: boolean;
      needsReview?: boolean;
    }) => {
      const response = await apiClient.updateTranslation(id, updateData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update translation');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Translation updated successfully');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      queryClient.invalidateQueries({ queryKey: ['translation-keys'] });
      queryClient.invalidateQueries({ queryKey: ['translation-statistics'] });
    },
    onError: (error) => {
      toast.error(`Failed to update translation: ${error.message}`);
    },
  });
}

// Hook for deleting translations
export function useDeleteTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteTranslation(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete translation');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Translation deleted successfully');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      queryClient.invalidateQueries({ queryKey: ['translation-keys'] });
      queryClient.invalidateQueries({ queryKey: ['translation-statistics'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete translation: ${error.message}`);
    },
  });
}

// Hook for auto-translating text
export function useAutoTranslate() {
  return useMutation({
    mutationFn: async (data: {
      text: string;
      fromLanguage: string;
      toLanguage: string;
      context?: string;
    }) => {
      const response = await apiClient.autoTranslateText(data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to auto-translate text');
      }
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('Text translated successfully');
    },
    onError: (error) => {
      toast.error(`Auto-translation failed: ${error.message}`);
    },
  });
}

// Hook for bulk updating translations
export function useBulkUpdateTranslations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      filters: {
        entityType?: string;
        entityId?: string;
        languageCode?: string;
        key?: string;
        needsReview?: boolean;
        isAutoTranslated?: boolean;
      };
      updates: {
        value?: string;
        isAutoTranslated?: boolean;
        needsReview?: boolean;
      };
    }) => {
      const response = await apiClient.bulkUpdateTranslations(data.filters, data.updates);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to bulk update translations');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.updatedCount} translations updated successfully`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      queryClient.invalidateQueries({ queryKey: ['translation-statistics'] });
    },
    onError: (error) => {
      toast.error(`Bulk update failed: ${error.message}`);
    },
  });
}

// Hook for translation lookup with fallback
export function useTranslationLookup(
  entityType: string,
  entityId: string,
  languageCode: string,
  key: string,
  enabled = true
) {
  return useQuery({
    queryKey: ['translation-lookup', entityType, entityId, languageCode, key],
    queryFn: async () => {
      const response = await apiClient.lookupTranslation(entityType, entityId, languageCode, key);
      if (!response.success) {
        throw new Error(response.error || 'Failed to lookup translation');
      }
      return response.data;
    },
    enabled: enabled && !!entityType && !!entityId && !!languageCode && !!key,
    staleTime: 300000, // 5 minutes
  });
}

// Hook for managing language settings
export function useCreateLanguageSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      nativeName: string;
      isActive?: boolean;
      isLive?: boolean;
      fallbackLanguageCode?: string;
      translationPriority?: number;
      autoTranslateEnabled?: boolean;
      qualityThreshold?: number;
      metadata?: any;
    }) => {
      const response = await apiClient.createLanguageSettings(data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create language settings');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Language settings for ${data.name} created successfully`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supported-languages'] });
    },
    onError: (error) => {
      toast.error(`Failed to create language settings: ${error.message}`);
    },
  });
}

// Hook for updating language settings
export function useUpdateLanguageSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      ...updateData
    }: {
      code: string;
      isActive?: boolean;
      isLive?: boolean;
      fallbackLanguageCode?: string;
      translationPriority?: number;
      autoTranslateEnabled?: boolean;
      qualityThreshold?: number;
      metadata?: any;
    }) => {
      const response = await apiClient.updateLanguageSettings(code, updateData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update language settings');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Language settings for ${data.name} updated successfully`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supported-languages'] });
    },
    onError: (error) => {
      toast.error(`Failed to update language settings: ${error.message}`);
    },
  });
}

// Hook for calculating completion percentages
export function useCalculateCompletionPercentages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.calculateCompletionPercentages();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to calculate completion percentages');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Completion percentages updated for ${data.updated.length} languages`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['supported-languages'] });
      queryClient.invalidateQueries({ queryKey: ['translation-statistics'] });
    },
    onError: (error) => {
      toast.error(`Failed to calculate completion percentages: ${error.message}`);
    },
  });
}

// Hook for extracting strings from content
export function useExtractStrings() {
  return useMutation({
    mutationFn: async (data: {
      content: string;
      contentType: 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'vue' | 'html' | 'json' | 'yaml';
      extractionRules?: {
        patterns?: string[];
        functions?: string[];
        attributes?: string[];
        excludePatterns?: string[];
      };
      context?: {
        filePath?: string;
        project?: string;
        component?: string;
      };
    }) => {
      const response = await apiClient.extractStrings(data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to extract strings');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Extracted ${data.extractedStrings.length} translatable strings`);
    },
    onError: (error) => {
      toast.error(`String extraction failed: ${error.message}`);
    },
  });
}

// Hook for scanning project files
export function useScanProjectStrings() {
  return useMutation({
    mutationFn: async (data: {
      projectPath: string;
      filePatterns?: string[];
      excludePatterns?: string[];
      extractionRules?: {
        patterns?: string[];
        functions?: string[];
        attributes?: string[];
      };
      maxFiles?: number;
    }) => {
      const response = await apiClient.scanProjectStrings(data);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to scan project for strings');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(
        `Scanned ${data.statistics.scannedFiles} files and found ${data.statistics.uniqueStrings} unique translatable strings`
      );
    },
    onError: (error) => {
      toast.error(`Project scan failed: ${error.message}`);
    },
  });
}

// Utility functions
export const TranslationUtils = {
  // Get status color for translations
  getTranslationStatusColor: (translation: Translation) => {
    if (translation.needsReview) {
      return 'text-yellow-600 bg-yellow-100';
    }
    if (translation.isAutoTranslated) {
      return 'text-blue-600 bg-blue-100';
    }
    return 'text-green-600 bg-green-100';
  },

  // Get status icon for translations
  getTranslationStatusIcon: (translation: Translation) => {
    if (translation.needsReview) {
      return '⚠️';
    }
    if (translation.isAutoTranslated) {
      return '🤖';
    }
    return '✅';
  },

  // Format completion percentage
  formatCompletionPercentage: (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  },

  // Get category color for extracted strings
  getCategoryColor: (category: string) => {
    const colors = {
      ui: 'bg-blue-100 text-blue-800',
      validation: 'bg-red-100 text-red-800',
      message: 'bg-green-100 text-green-800',
      label: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800',
    };
    
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  },

  // Get confidence indicator
  getConfidenceIndicator: (confidence: number) => {
    if (confidence >= 0.8) return { label: 'High', color: 'text-green-600' };
    if (confidence >= 0.6) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-red-600' };
  },

  // Generate translation key from text
  generateTranslationKey: (text: string, maxLength = 50) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, maxLength)
      .replace(/^_+|_+$/g, '');
  },

  // Validate translation data
  validateTranslation: (translation: Partial<Translation>) => {
    const errors: string[] = [];
    
    if (!translation.entityType?.trim()) {
      errors.push('Entity type is required');
    }
    
    if (!translation.entityId?.trim()) {
      errors.push('Entity ID is required');
    }
    
    if (!translation.languageCode?.trim()) {
      errors.push('Language code is required');
    }
    
    if (!translation.key?.trim()) {
      errors.push('Translation key is required');
    }
    
    if (!translation.value?.trim()) {
      errors.push('Translation value is required');
    }
    
    return errors;
  },

  // Get language display name
  getLanguageDisplayName: (language: SupportedLanguage) => {
    return `${language.name} (${language.nativeName})`;
  },

  // Check if language is complete
  isLanguageComplete: (completionPercentage: string | null, threshold = 95) => {
    if (!completionPercentage) return false;
    return parseFloat(completionPercentage) >= threshold;
  },
};

// Pre-defined entity types
export const EntityTypes = {
  field: 'Form Field',
  option: 'Option Set',
  email_template: 'Email Template',
  ui: 'User Interface',
  validation: 'Validation Message',
  notification: 'Notification',
  error: 'Error Message',
  success: 'Success Message',
};

// Common language codes
export const LanguageCodes = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Spanish (Spain)',
  'es-MX': 'Spanish (Mexico)',
  'fr-FR': 'French (France)',
  'fr-CA': 'French (Canada)',
  'de-DE': 'German (Germany)',
  'it-IT': 'Italian (Italy)',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  'nl-NL': 'Dutch (Netherlands)',
  'pl-PL': 'Polish (Poland)',
  'ru-RU': 'Russian (Russia)',
  'ja-JP': 'Japanese (Japan)',
  'ko-KR': 'Korean (South Korea)',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
};