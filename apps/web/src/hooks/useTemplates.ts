'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// Types
interface Template {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  category: string;
  industry?: string;
  version: string;
  status: string;
  isPublic: boolean;
  usageCount: number;
  rating?: number;
  preview?: string;
  tags: string[];
  author: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

interface TemplateDetail extends Template {
  content: any;
  config?: any;
  variables?: Array<{
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
    description?: string;
  }>;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  versions: Array<{
    version: string;
    createdAt: string;
    changelog?: string;
  }>;
}

interface TemplateFilters {
  page?: number;
  limit?: number;
  category?: string;
  industry?: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface TemplateVariable {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

// Hook for listing templates
export function useTemplates(filters: TemplateFilters = {}) {
  return useQuery({
    queryKey: ['templates', filters],
    queryFn: async () => {
      const response = await apiClient.getTemplates(filters);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch templates');
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
}

// Hook for getting a single template
export function useTemplate(uuid: string, enabled = true) {
  return useQuery({
    queryKey: ['template', uuid],
    queryFn: async () => {
      const response = await apiClient.getTemplate(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch template');
      }
      return response.data;
    },
    enabled: enabled && !!uuid,
  });
}

// Hook for creating templates
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      category,
      industry,
      content,
      config,
      variables,
      isPublic = false,
      tags = [],
      preview,
    }: {
      name: string;
      description?: string;
      category: string;
      industry?: string;
      content: any;
      config?: any;
      variables?: TemplateVariable[];
      isPublic?: boolean;
      tags?: string[];
      preview?: string;
    }) => {
      const response = await apiClient.createTemplate({
        name,
        description,
        category,
        industry,
        content,
        config,
        variables,
        isPublic,
        tags,
        preview,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create template');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Template "${data.name}" created successfully`);
      
      // Invalidate templates list to show new template
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

// Hook for updating templates
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      uuid,
      ...updateData
    }: {
      uuid: string;
      name?: string;
      description?: string;
      category?: string;
      industry?: string;
      content?: any;
      config?: any;
      variables?: TemplateVariable[];
      status?: string;
      isPublic?: boolean;
      tags?: string[];
      preview?: string;
      versionBump?: string;
      changelog?: string;
    }) => {
      const response = await apiClient.updateTemplate(uuid, updateData);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update template');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`Template "${data.name}" updated successfully`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template', variables.uuid] });
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

// Hook for deleting templates
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uuid: string) => {
      const response = await apiClient.deleteTemplate(uuid);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete template');
      }
      return response.data;
    },
    onSuccess: (data, uuid) => {
      toast.success('Template deleted successfully');
      
      // Remove from cache and invalidate list
      queryClient.removeQueries({ queryKey: ['template', uuid] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

// Hook for cloning templates
export function useCloneTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      uuid,
      name,
      description,
      isPublic = false,
    }: {
      uuid: string;
      name: string;
      description?: string;
      isPublic?: boolean;
    }) => {
      const response = await apiClient.cloneTemplate(uuid, {
        name,
        description,
        isPublic,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to clone template');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Template cloned as "${data.name}"`);
      
      // Invalidate templates list to show cloned template
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => {
      toast.error(`Failed to clone template: ${error.message}`);
    },
  });
}

// Hook for rating templates
export function useRateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      uuid,
      rating,
      review,
    }: {
      uuid: string;
      rating: number;
      review?: string;
    }) => {
      const response = await apiClient.rateTemplate(uuid, { rating, review });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to rate template');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Rating submitted successfully');
      
      // Invalidate template to show updated rating
      queryClient.invalidateQueries({ queryKey: ['template', variables.uuid] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error) => {
      toast.error(`Failed to rate template: ${error.message}`);
    },
  });
}

// Utility functions
export const TemplateUtils = {
  // Get status color
  getStatusColor: (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-600 bg-green-100';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100';
      case 'archived':
        return 'text-gray-600 bg-gray-100';
      case 'deleted':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  // Get status icon
  getStatusIcon: (status: string) => {
    switch (status) {
      case 'published':
        return '✅';
      case 'draft':
        return '📝';
      case 'archived':
        return '📦';
      case 'deleted':
        return '🗑️';
      default:
        return '❓';
    }
  },

  // Format rating
  formatRating: (rating?: number) => {
    if (!rating) return 'No rating';
    return `${rating.toFixed(1)} ⭐`;
  },

  // Get category color
  getCategoryColor: (category: string) => {
    const colors = {
      'web': 'bg-blue-100 text-blue-800',
      'mobile': 'bg-green-100 text-green-800',
      'email': 'bg-purple-100 text-purple-800',
      'document': 'bg-orange-100 text-orange-800',
      'landing-page': 'bg-pink-100 text-pink-800',
      'dashboard': 'bg-indigo-100 text-indigo-800',
    };
    
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  },

  // Validate template content
  validateTemplate: (template: Partial<TemplateDetail>) => {
    const errors: string[] = [];
    
    if (!template.name?.trim()) {
      errors.push('Template name is required');
    }
    
    if (!template.category?.trim()) {
      errors.push('Category is required');
    }
    
    if (!template.content) {
      errors.push('Template content is required');
    }
    
    // Validate variables
    if (template.variables) {
      template.variables.forEach((variable, index) => {
        if (!variable.name?.trim()) {
          errors.push(`Variable ${index + 1}: Name is required`);
        }
        if (!variable.type?.trim()) {
          errors.push(`Variable ${index + 1}: Type is required`);
        }
      });
    }
    
    return errors;
  },

  // Process template variables
  processVariables: (content: any, variables: Record<string, any>) => {
    if (typeof content === 'string') {
      return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] !== undefined ? variables[varName] : match;
      });
    }
    
    if (typeof content === 'object' && content !== null) {
      const processed = Array.isArray(content) ? [] : {};
      
      Object.entries(content).forEach(([key, value]) => {
        (processed as any)[key] = TemplateUtils.processVariables(value, variables);
      });
      
      return processed;
    }
    
    return content;
  },

  // Extract variables from content
  extractVariables: (content: any): string[] => {
    const variables = new Set<string>();
    
    const extract = (obj: any) => {
      if (typeof obj === 'string') {
        const matches = obj.match(/\{\{(\w+)\}\}/g);
        if (matches) {
          matches.forEach(match => {
            const varName = match.slice(2, -2);
            variables.add(varName);
          });
        }
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(extract);
      }
    };
    
    extract(content);
    return Array.from(variables);
  },

  // Generate template preview
  generatePreview: (content: any, maxLength = 200) => {
    const stringify = (obj: any): string => {
      if (typeof obj === 'string') return obj;
      if (typeof obj === 'object' && obj !== null) {
        return JSON.stringify(obj, null, 2);
      }
      return String(obj);
    };
    
    const preview = stringify(content);
    return preview.length > maxLength 
      ? preview.substring(0, maxLength) + '...'
      : preview;
  },

  // Parse version number
  parseVersion: (version: string) => {
    const [major, minor, patch] = version.split('.').map(Number);
    return { major: major || 0, minor: minor || 0, patch: patch || 0 };
  },

  // Compare versions
  compareVersions: (a: string, b: string) => {
    const versionA = TemplateUtils.parseVersion(a);
    const versionB = TemplateUtils.parseVersion(b);
    
    if (versionA.major !== versionB.major) return versionA.major - versionB.major;
    if (versionA.minor !== versionB.minor) return versionA.minor - versionB.minor;
    return versionA.patch - versionB.patch;
  },
};

// Pre-defined template categories
export const TemplateCategories = {
  'web': 'Web Application',
  'mobile': 'Mobile App',
  'email': 'Email Template',
  'document': 'Document',
  'landing-page': 'Landing Page',
  'dashboard': 'Dashboard',
  'component': 'UI Component',
  'workflow': 'Workflow',
  'api': 'API Schema',
  'database': 'Database Schema',
};

// Variable types
export const VariableTypes = {
  'string': 'Text',
  'number': 'Number',
  'boolean': 'Boolean',
  'array': 'Array',
  'object': 'Object',
  'date': 'Date',
  'url': 'URL',
  'email': 'Email',
  'color': 'Color',
  'image': 'Image URL',
};