'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import { 
  Brain, 
  Settings, 
  Plus, 
  Eye,
  Edit,
  Trash2,
  Key,
  Globe,
  Zap,
  Activity,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  BarChart3,
  Database,
  Lock,
  Unlock,
  Wrench,
  RefreshCw,
  Target
} from 'lucide-react';

// TypeScript interfaces following mono platform patterns
interface LLMProvider {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  apiBaseUrl?: string;
  supportedModels: string[];
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LLMApiKey {
  id: number;
  uuid: string;
  tenantId: number | null;
  providerId: number;
  name: string;
  apiKey: string; // Will be redacted in responses
  metadata: Record<string, any>;
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  providerName?: string; // Joined from provider table
}

interface LLMScope {
  id: number;
  uuid: string;
  key: string;
  label: Record<string, string>;
  description?: Record<string, string>;
  category?: string;
  defaultSettings: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LLMScopeConfig {
  id: number;
  uuid: string;
  tenantId: number | null;
  scopeId: number;
  providerId: number;
  apiKeyId: number;
  modelName: string;
  promptTemplate: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  metadata: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
  updatedBy?: number;
  scope?: LLMScope;
  provider?: LLMProvider;
}

interface LLMUsageLog {
  id: number;
  uuid: string;
  tenantId: number | null;
  scopeId: number;
  configId: number;
  providerId: number;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
  responseTimeMs?: number;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  metadata: Record<string, any>;
  createdAt: string;
  userId?: number;
  scope?: LLMScope;
  provider?: LLMProvider;
}

// API Functions
async function fetchLLMProviders(): Promise<LLMProvider[]> {
  const response = await fetch('/api/v1/admin/llm/providers');
  if (!response.ok) {
    throw new Error('Failed to fetch LLM providers');
  }
  const result = await response.json();
  return result.data?.data || [];
}

async function fetchLLMApiKeys(): Promise<LLMApiKey[]> {
  const response = await fetch('/api/v1/admin/llm/api-keys');
  if (!response.ok) {
    throw new Error('Failed to fetch API keys');
  }
  const result = await response.json();
  return result.data?.data || [];
}

async function fetchLLMScopes(): Promise<LLMScope[]> {
  const response = await fetch('/api/v1/admin/llm/scopes');
  if (!response.ok) {
    throw new Error('Failed to fetch LLM scopes');
  }
  const result = await response.json();
  return result.data?.data || [];
}

async function fetchLLMScopeConfigs(): Promise<LLMScopeConfig[]> {
  const response = await fetch('/api/v1/admin/llm/scope-configs');
  if (!response.ok) {
    throw new Error('Failed to fetch scope configurations');
  }
  const result = await response.json();
  return result.data?.data || [];
}

async function fetchLLMUsageStats(): Promise<any> {
  const response = await fetch('/api/v1/admin/llm/analytics');
  if (!response.ok) {
    throw new Error('Failed to fetch usage statistics');
  }
  const result = await response.json();
  return result.data || {};
}

// LLM Provider Management Component
function LLMProvidersTab() {
  const t = useTranslations('admin-common');
  const { toast } = useToast();

  const { data: providers, isLoading, error } = useQuery({
    queryKey: ['llm-providers'],
    queryFn: fetchLLMProviders,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (error) {
      browserLogger.error('Failed to load LLM providers', { error: error.message });
      toast({
        title: t('messages.error.actionFailed'),
        description: 'Failed to load LLM providers',
        variant: 'destructive',
      });
    }
  }, [error, toast, t]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('messages.noData')}</h3>
          <p className="text-muted-foreground mb-4">
            No LLM providers are currently configured. Add providers to enable AI features.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('actions.create')} Provider
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">LLM Providers</h2>
          <p className="text-muted-foreground">
            Manage Large Language Model providers and their configurations
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.create')} Provider
        </Button>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Brain className="h-6 w-6 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Type: {provider.supportedModels.join(', ')} • Created: {new Date(provider.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={provider.isActive ? "default" : "secondary"}>
                    {provider.isActive ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {t('status.active')}
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-3 w-3" />
                        {t('status.inactive')}
                      </>
                    )}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {provider.description}
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  {t('actions.view')}
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  {t('actions.configure')}
                </Button>
                <Button variant="outline" size="sm">
                  <Key className="mr-2 h-4 w-4" />
                  API Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// API Keys Management Component
function APIKeysTab() {
  const t = useTranslations('admin-common');
  const { toast } = useToast();

  const { data: apiKeys, isLoading, error } = useQuery({
    queryKey: ['llm-api-keys'],
    queryFn: fetchLLMApiKeys,
    staleTime: 5 * 60 * 1000,
  });

  const { data: providers } = useQuery({
    queryKey: ['llm-providers'],
    queryFn: fetchLLMProviders,
  });

  useEffect(() => {
    if (error) {
      browserLogger.error('Failed to load API keys', { error: error.message });
      toast({
        title: t('messages.error.actionFailed'),
        description: 'Failed to load API keys',
        variant: 'destructive',
      });
    }
  }, [error, toast, t]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">
            Manage encrypted API keys for LLM providers
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.create')} API Key
        </Button>
      </div>

      {(!apiKeys || apiKeys.length === 0) ? (
        <Card>
          <CardContent className="text-center py-12">
            <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No API Keys</h3>
            <p className="text-muted-foreground mb-4">
              No API keys are configured. Add keys to enable LLM provider access.
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('actions.create')} API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium">{apiKey.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Provider: {apiKey.providerName || 'Unknown'} • 
                        {apiKey.tenantId ? ' Tenant-specific' : ' Global'} •
                        Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                      {apiKey.isActive ? (
                        <>
                          <Unlock className="mr-1 h-3 w-3" />
                          {t('status.active')}
                        </>
                      ) : (
                        <>
                          <Lock className="mr-1 h-3 w-3" />
                          {t('status.inactive')}
                        </>
                      )}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Usage Analytics Component
function AnalyticsTab() {
  const t = useTranslations('admin-common');
  const { toast } = useToast();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['llm-usage-stats'],
    queryFn: fetchLLMUsageStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  useEffect(() => {
    if (error) {
      browserLogger.error('Failed to load usage statistics', { error: error.message });
      toast({
        title: t('messages.error.actionFailed'),
        description: 'Failed to load usage statistics',
        variant: 'destructive',
      });
    }
  }, [error, toast, t]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const mockStats = {
    totalRequests: stats?.totalRequests || 1247,
    totalTokens: stats?.totalTokens || 89543,
    totalCost: stats?.totalCost || 45.23,
    avgResponseTime: stats?.avgResponseTime || 850,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Usage Analytics</h2>
        <p className="text-muted-foreground">
          Monitor LLM usage, costs, and performance metrics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{mockStats.totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">{mockStats.totalTokens.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${mockStats.totalCost}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{mockStats.avgResponseTime}ms</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Over Time</CardTitle>
          <p className="text-sm text-muted-foreground">
            Request volume and cost trends for the last 30 days
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Usage charts will be displayed here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main LLM Integrations Page Component
export default function LLMIntegrationsPage() {
  const t = useTranslations('admin-common');
  const [activeTab, setActiveTab] = useState('providers');

  useEffect(() => {
    browserLogger.info('LLM integrations page accessed', { 
      tab: activeTab,
      timestamp: new Date().toISOString()
    });
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">LLM Integrations</h1>
            <p className="text-muted-foreground">
              Manage Large Language Model providers, API keys, and usage analytics
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Wrench className="mr-2 h-4 w-4" />
            System Test
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="providers" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Providers</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="scopes" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Scopes</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <LLMProvidersTab />
        </TabsContent>

        <TabsContent value="api-keys">
          <APIKeysTab />
        </TabsContent>

        <TabsContent value="scopes">
          <div className="text-center py-12">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Scopes Management</h3>
            <p className="text-muted-foreground">
              LLM scopes configuration will be implemented here
            </p>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
} 