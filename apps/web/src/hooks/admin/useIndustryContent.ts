'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { browserLogger } from '@/lib/browser-logger';

interface Industry {
  key: string;
  name: string;
  description: string;
}

interface IndustryConfig {
  name: string;
  description: string;
  defaultCategories: Array<{
    slug: string;
    name: string;
    description: string;
    subcategories?: Array<{
      slug: string;
      name: string;
    }>;
  }>;
  defaultTags: Array<{
    slug: string;
    name: string;
    category: string;
    type: string;
  }>;
}

interface IndustryTag {
  id: number;
  name: string;
  slug: string;
  type: string;
  category: string;
}

interface IndustryCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parentId?: number;
  subcategories?: Array<{ id: number; name: string; slug: string }>;
}

interface SeedingResult {
  created: number;
  updated: number;
  errors: string[];
}

interface SetupResults {
  categories: SeedingResult;
  tags: SeedingResult;
  success: boolean;
}

/**
 * Get available industries from platform config
 */
export function useAvailableIndustries() {
  return useQuery({
    queryKey: ['industries', 'available'],
    queryFn: async (): Promise<Industry[]> => {
      const response = await fetch('/api/v1/admin/industry-content?action=industries');
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to fetch industries');
      }

      const data = await response.json();
      browserLogger.info('Available industries fetched', {
        count: data.data.count
      });
      
      return data.data.industries;
    },
    staleTime: 600000, // 10 minutes - industries don't change often
    gcTime: 1800000, // 30 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Get configuration for a specific industry
 */
export function useIndustryConfig(industryKey: string) {
  return useQuery({
    queryKey: ['industries', 'config', industryKey],
    queryFn: async (): Promise<IndustryConfig> => {
      const response = await fetch(`/api/v1/admin/industry-content?action=config&industry=${industryKey}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `Failed to fetch config for industry ${industryKey}`);
      }

      const data = await response.json();
      browserLogger.info('Industry config fetched', {
        industry: industryKey,
        categoriesCount: data.data.config.defaultCategories.length,
        tagsCount: data.data.config.defaultTags.length
      });
      
      return data.data.config;
    },
    enabled: !!industryKey,
    staleTime: 600000, // 10 minutes
    gcTime: 1800000, // 30 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Get industry-relevant tags for a tenant
 */
export function useIndustryTags(
  tenantId: number, 
  industryKey: string,
  options: {
    includeGlobal?: boolean;
    tagType?: string;
  } = {}
) {
  const { includeGlobal = true, tagType } = options;
  
  return useQuery({
    queryKey: ['industries', 'tags', tenantId, industryKey, { includeGlobal, tagType }],
    queryFn: async (): Promise<IndustryTag[]> => {
      const params = new URLSearchParams({
        action: 'tags',
        industry: industryKey,
        tenantId: tenantId.toString(),
        includeGlobal: includeGlobal.toString()
      });
      
      if (tagType) {
        params.append('type', tagType);
      }
      
      const response = await fetch(`/api/v1/admin/industry-content?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to fetch industry tags');
      }

      const data = await response.json();
      browserLogger.info('Industry tags fetched', {
        industry: industryKey,
        tenantId,
        count: data.data.count,
        tagType
      });
      
      return data.data.tags;
    },
    enabled: !!tenantId && !!industryKey,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Get industry-relevant categories for a tenant
 */
export function useIndustryCategories(
  tenantId: number,
  industryKey: string,
  options: {
    includeGlobal?: boolean;
    includeSubcategories?: boolean;
  } = {}
) {
  const { includeGlobal = true, includeSubcategories = true } = options;
  
  return useQuery({
    queryKey: ['industries', 'categories', tenantId, industryKey, { includeGlobal, includeSubcategories }],
    queryFn: async (): Promise<IndustryCategory[]> => {
      const params = new URLSearchParams({
        action: 'categories',
        industry: industryKey,
        tenantId: tenantId.toString(),
        includeGlobal: includeGlobal.toString(),
        includeSubcategories: includeSubcategories.toString()
      });
      
      const response = await fetch(`/api/v1/admin/industry-content?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to fetch industry categories');
      }

      const data = await response.json();
      browserLogger.info('Industry categories fetched', {
        industry: industryKey,
        tenantId,
        count: data.data.count
      });
      
      return data.data.categories;
    },
    enabled: !!tenantId && !!industryKey,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false
  });
}

/**
 * Setup complete industry content (categories + tags)
 */
export function useSetupIndustryContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tenantId: number;
      industry: string;
      options?: {
        replaceExisting?: boolean;
        includeGlobalContent?: boolean;
      };
    }): Promise<SetupResults> => {
      const response = await fetch('/api/v1/admin/industry-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'setup',
          tenantId: params.tenantId,
          industry: params.industry,
          options: params.options || {}
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to setup industry content');
      }

      const data = await response.json();
      return data.data.results;
    },
    onSuccess: (results, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['industries', 'tags', variables.tenantId, variables.industry] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['industries', 'categories', variables.tenantId, variables.industry] 
      });
      queryClient.invalidateQueries({ queryKey: ['adminTags'] });
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });

      const totalCreated = results.categories.created + results.tags.created;
      const totalUpdated = results.categories.updated + results.tags.updated;
      
      if (results.success) {
        toast.success(`Industry content setup completed successfully! Created ${totalCreated} items, updated ${totalUpdated} items.`);
      } else {
        toast.warning(`Industry content setup completed with some errors. Created ${totalCreated} items, updated ${totalUpdated} items.`);
      }

      browserLogger.userAction('industry_content_setup_success', {
        industry: variables.industry,
        tenantId: variables.tenantId,
        results
      });
    },
    onError: (error: Error, variables) => {
      toast.error(`Failed to setup industry content: ${error.message}`);
      browserLogger.error('industry_content_setup_failed', {
        industry: variables.industry,
        tenantId: variables.tenantId,
        error: error.message
      });
    }
  });
}

/**
 * Seed only categories for an industry
 */
export function useSeedIndustryCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tenantId: number;
      industry: string;
      options?: {
        replaceExisting?: boolean;
        includeGlobalCategories?: boolean;
      };
    }): Promise<SeedingResult> => {
      const response = await fetch('/api/v1/admin/industry-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'seed-categories',
          tenantId: params.tenantId,
          industry: params.industry,
          options: params.options || {}
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to seed industry categories');
      }

      const data = await response.json();
      return data.data.results;
    },
    onSuccess: (results, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['industries', 'categories', variables.tenantId, variables.industry] 
      });
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });

      toast.success(`Categories seeded: ${results.created} created, ${results.updated} updated`);
      browserLogger.userAction('industry_categories_seeded', {
        industry: variables.industry,
        tenantId: variables.tenantId,
        results
      });
    },
    onError: (error: Error, variables) => {
      toast.error(`Failed to seed categories: ${error.message}`);
      browserLogger.error('industry_categories_seed_failed', {
        industry: variables.industry,
        tenantId: variables.tenantId,
        error: error.message
      });
    }
  });
}

/**
 * Seed only tags for an industry
 */
export function useSeedIndustryTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tenantId: number;
      industry: string;
      options?: {
        replaceExisting?: boolean;
        includeGlobalTags?: boolean;
      };
    }): Promise<SeedingResult> => {
      const response = await fetch('/api/v1/admin/industry-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'seed-tags',
          tenantId: params.tenantId,
          industry: params.industry,
          options: params.options || {}
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to seed industry tags');
      }

      const data = await response.json();
      return data.data.results;
    },
    onSuccess: (results, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['industries', 'tags', variables.tenantId, variables.industry] 
      });
      queryClient.invalidateQueries({ queryKey: ['adminTags'] });

      toast.success(`Tags seeded: ${results.created} created, ${results.updated} updated`);
      browserLogger.userAction('industry_tags_seeded', {
        industry: variables.industry,
        tenantId: variables.tenantId,
        results
      });
    },
    onError: (error: Error, variables) => {
      toast.error(`Failed to seed tags: ${error.message}`);
      browserLogger.error('industry_tags_seed_failed', {
        industry: variables.industry,
        tenantId: variables.tenantId,
        error: error.message
      });
    }
  });
}