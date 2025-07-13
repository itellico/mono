'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  Key,
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Settings,
  ExternalLink,
  Webhook,
  Link,
  MessageSquare,
  CreditCard,
  BarChart3,
  Cloud,
  Database,
  Mail,
  FileText,
  Calendar,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  provider: string;
  category: 'communication' | 'analytics' | 'payment' | 'storage' | 'crm' | 'marketing' | 'automation';
  description: string;
  logoUrl: string;
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  isActive: boolean;
  configuration: any;
  lastSync?: string;
  metrics?: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    lastCall?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secretKey: string;
  isActive: boolean;
  retryCount: number;
  lastDelivery?: {
    status: number;
    timestamp: string;
    responseTime: number;
  };
  statistics: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
  };
  createdBy: string;
  createdAt: string;
}

interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  lastUsed?: string;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
}

// Mock data
const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Slack',
    provider: 'slack',
    category: 'communication',
    description: 'Send notifications and updates to your Slack channels',
    logoUrl: '/integrations/slack.png',
    status: 'connected',
    isActive: true,
    configuration: {
      webhookUrl: 'https://hooks.slack.com/services/...',
      defaultChannel: '#general'
    },
    lastSync: '2024-01-20T10:30:00Z',
    metrics: {
      totalCalls: 1247,
      successfulCalls: 1234,
      failedCalls: 13,
      lastCall: '2024-01-20T10:30:00Z'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T10:30:00Z'
  },
  {
    id: '2',
    name: 'Google Analytics',
    provider: 'google-analytics',
    category: 'analytics',
    description: 'Track user behavior and marketplace performance',
    logoUrl: '/integrations/google-analytics.png',
    status: 'connected',
    isActive: true,
    configuration: {
      trackingId: 'GA-XXXXXXXXX',
      domain: 'clickdami.com'
    },
    lastSync: '2024-01-20T09:00:00Z',
    metrics: {
      totalCalls: 5678,
      successfulCalls: 5650,
      failedCalls: 28,
      lastCall: '2024-01-20T09:00:00Z'
    },
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-20T09:00:00Z'
  },
  {
    id: '3',
    name: 'Stripe',
    provider: 'stripe',
    category: 'payment',
    description: 'Process payments and manage subscriptions',
    logoUrl: '/integrations/stripe.png',
    status: 'error',
    isActive: false,
    configuration: {
      publicKey: 'pk_test_...',
      webhookEndpoint: 'https://api.clickdami.com/webhooks/stripe'
    },
    lastSync: '2024-01-18T14:00:00Z',
    metrics: {
      totalCalls: 234,
      successfulCalls: 198,
      failedCalls: 36,
      lastCall: '2024-01-18T14:00:00Z'
    },
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-18T14:00:00Z'
  },
  {
    id: '4',
    name: 'Mailchimp',
    provider: 'mailchimp',
    category: 'marketing',
    description: 'Sync users and send marketing campaigns',
    logoUrl: '/integrations/mailchimp.png',
    status: 'disconnected',
    isActive: false,
    configuration: {},
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  }
];

const mockWebhooks: Webhook[] = [
  {
    id: '1',
    name: 'Application Updates',
    url: 'https://api.partner.com/webhooks/applications',
    events: ['application.submitted', 'application.approved', 'application.rejected'],
    secretKey: 'whsec_1234567890abcdef',
    isActive: true,
    retryCount: 3,
    lastDelivery: {
      status: 200,
      timestamp: '2024-01-20T10:30:00Z',
      responseTime: 145
    },
    statistics: {
      totalDeliveries: 156,
      successfulDeliveries: 148,
      failedDeliveries: 8
    },
    createdBy: 'John Doe',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'User Events',
    url: 'https://analytics.partner.com/events',
    events: ['user.created', 'user.updated', 'user.login'],
    secretKey: 'whsec_abcdef1234567890',
    isActive: true,
    retryCount: 5,
    lastDelivery: {
      status: 500,
      timestamp: '2024-01-19T15:20:00Z',
      responseTime: 3000
    },
    statistics: {
      totalDeliveries: 89,
      successfulDeliveries: 76,
      failedDeliveries: 13
    },
    createdBy: 'Sarah Wilson',
    createdAt: '2024-01-10T00:00:00Z'
  }
];

const mockAPIKeys: APIKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    keyPrefix: 'sk_live_1234',
    permissions: ['read:applications', 'write:applications', 'read:users'],
    isActive: true,
    lastUsed: '2024-01-20T10:30:00Z',
    expiresAt: '2024-12-31T23:59:59Z',
    createdBy: 'John Doe',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Development API Key',
    keyPrefix: 'sk_test_5678',
    permissions: ['read:applications', 'read:users'],
    isActive: true,
    lastUsed: '2024-01-19T14:20:00Z',
    createdBy: 'Sarah Wilson',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'Analytics API Key',
    keyPrefix: 'sk_live_9999',
    permissions: ['read:analytics'],
    isActive: false,
    lastUsed: '2024-01-10T09:00:00Z',
    expiresAt: '2024-06-30T23:59:59Z',
    createdBy: 'Mike Johnson',
    createdAt: '2024-01-05T00:00:00Z'
  }
];

const availableIntegrations = [
  { name: 'Discord', provider: 'discord', category: 'communication', description: 'Send notifications to Discord channels' },
  { name: 'Microsoft Teams', provider: 'teams', category: 'communication', description: 'Collaborate with your team in Microsoft Teams' },
  { name: 'Salesforce', provider: 'salesforce', category: 'crm', description: 'Sync leads and contacts with Salesforce CRM' },
  { name: 'HubSpot', provider: 'hubspot', category: 'crm', description: 'Manage customer relationships with HubSpot' },
  { name: 'PayPal', provider: 'paypal', category: 'payment', description: 'Accept payments through PayPal' },
  { name: 'Mixpanel', provider: 'mixpanel', category: 'analytics', description: 'Advanced product analytics and user tracking' },
  { name: 'Zapier', provider: 'zapier', category: 'automation', description: 'Connect with 5000+ apps through Zapier' },
  { name: 'Google Drive', provider: 'google-drive', category: 'storage', description: 'Store and share files with Google Drive' }
];

// API Functions
async function fetchIntegrations(): Promise<Integration[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockIntegrations), 500);
  });
}

async function fetchWebhooks(): Promise<Webhook[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockWebhooks), 500);
  });
}

async function fetchAPIKeys(): Promise<APIKey[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockAPIKeys), 500);
  });
}

async function createWebhook(webhook: Partial<Webhook>): Promise<Webhook> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      ...webhook,
      id: Date.now().toString(),
      secretKey: 'whsec_' + Math.random().toString(36).substr(2, 16),
      statistics: { totalDeliveries: 0, successfulDeliveries: 0, failedDeliveries: 0 },
      createdAt: new Date().toISOString(),
      createdBy: 'Current User'
    } as Webhook), 500);
  });
}

async function createAPIKey(apiKey: Partial<APIKey>): Promise<APIKey> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      ...apiKey,
      id: Date.now().toString(),
      keyPrefix: 'sk_live_' + Math.random().toString(36).substr(2, 8),
      createdAt: new Date().toISOString(),
      createdBy: 'Current User'
    } as APIKey), 500);
  });
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'communication': return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'analytics': return <BarChart3 className="h-4 w-4 text-green-500" />;
    case 'payment': return <CreditCard className="h-4 w-4 text-purple-500" />;
    case 'storage': return <Cloud className="h-4 w-4 text-orange-500" />;
    case 'crm': return <Users className="h-4 w-4 text-red-500" />;
    case 'marketing': return <Mail className="h-4 w-4 text-pink-500" />;
    case 'automation': return <Zap className="h-4 w-4 text-yellow-500" />;
    default: return <Globe className="h-4 w-4" />;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'configuring': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'disconnected': return <AlertCircle className="h-4 w-4 text-gray-400" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'connected':
      return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    case 'configuring':
      return <Badge variant="secondary">Configuring</Badge>;
    case 'disconnected':
      return <Badge variant="outline">Disconnected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function IntegrationsClientPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('integrations');

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
    retryCount: 3,
    isActive: true
  });

  const [newAPIKey, setNewAPIKey] = useState({
    name: '',
    permissions: [] as string[],
    expiresAt: '',
    isActive: true
  });

  // Queries
  const { data: integrations, isLoading: loadingIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: fetchIntegrations,
  });

  const { data: webhooks, isLoading: loadingWebhooks } = useQuery({
    queryKey: ['webhooks'],
    queryFn: fetchWebhooks,
  });

  const { data: apiKeys, isLoading: loadingAPIKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: fetchAPIKeys,
  });

  // Mutations
  const createWebhookMutation = useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setWebhookDialogOpen(false);
      setNewWebhook({ name: '', url: '', events: [], retryCount: 3, isActive: true });
      toast.success('Webhook created successfully');
    },
    onError: () => {
      toast.error('Failed to create webhook');
    },
  });

  const createAPIKeyMutation = useMutation({
    mutationFn: createAPIKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setApiKeyDialogOpen(false);
      setNewAPIKey({ name: '', permissions: [], expiresAt: '', isActive: true });
      toast.success('API key created successfully');
    },
    onError: () => {
      toast.error('Failed to create API key');
    },
  });

  const handleCreateWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast.error('Please fill in all required fields');
      return;
    }
    createWebhookMutation.mutate(newWebhook);
  };

  const handleCreateAPIKey = () => {
    if (!newAPIKey.name) {
      toast.error('Please enter an API key name');
      return;
    }
    createAPIKeyMutation.mutate(newAPIKey);
  };

  const handleTestWebhook = (webhook: Webhook) => {
    toast.success('Test webhook sent successfully');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredIntegrations = integrations?.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const connectedIntegrations = integrations?.filter(i => i.status === 'connected').length || 0;
  const totalWebhooks = webhooks?.length || 0;
  const activeAPIKeys = apiKeys?.filter(k => k.isActive).length || 0;
  const totalAPICalls = integrations?.reduce((sum, i) => sum + (i.metrics?.totalCalls || 0), 0) || 0;

  if (loadingIntegrations) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations & APIs</h1>
          <p className="text-muted-foreground">
            Connect your marketplace with external services and manage API access
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Documentation
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Browse Integrations
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedIntegrations}</div>
            <p className="text-xs text-muted-foreground">
              {integrations?.length || 0} total integrations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWebhooks}</div>
            <p className="text-xs text-muted-foreground">
              {webhooks?.filter(w => w.isActive).length || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAPIKeys}</div>
            <p className="text-xs text-muted-foreground">
              {apiKeys?.length || 0} total keys
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAPICalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="automation">Automation</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        {getCategoryIcon(integration.category)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Now
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Logs
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(integration.status)}
                    <Badge variant="outline" className="capitalize">
                      {integration.category}
                    </Badge>
                  </div>

                  {integration.metrics && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{integration.metrics.totalCalls}</div>
                        <div className="text-muted-foreground">Total Calls</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {Math.round((integration.metrics.successfulCalls / integration.metrics.totalCalls) * 100)}%
                        </div>
                        <div className="text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">
                          {integration.lastSync ? new Date(integration.lastSync).toLocaleDateString() : 'Never'}
                        </div>
                        <div className="text-muted-foreground">Last Sync</div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    {integration.status === 'connected' ? (
                      <>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="flex-1">
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Webhooks</h3>
              <p className="text-sm text-muted-foreground">
                Receive real-time notifications about events in your marketplace
              </p>
            </div>
            <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Webhook</DialogTitle>
                  <DialogDescription>
                    Set up a webhook to receive real-time event notifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-name">Name</Label>
                    <Input
                      id="webhook-name"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                      placeholder="Application Updates"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">URL</Label>
                    <Input
                      id="webhook-url"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      placeholder="https://api.yourservice.com/webhooks"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'user.created', 'user.updated', 'application.submitted',
                        'application.approved', 'application.rejected', 'message.sent'
                      ].map((event) => (
                        <div key={event} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={event}
                            checked={newWebhook.events.includes(event)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: [...newWebhook.events, event]
                                });
                              } else {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: newWebhook.events.filter(e => e !== event)
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={event} className="text-sm">
                            {event}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateWebhook} disabled={createWebhookMutation.isPending}>
                      Create Webhook
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks?.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{webhook.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Created by {webhook.createdBy}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm truncate max-w-[200px]">
                            {webhook.url}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(webhook.url)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.slice(0, 2).map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                          {webhook.events.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{webhook.events.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {webhook.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {Math.round((webhook.statistics.successfulDeliveries / Math.max(webhook.statistics.totalDeliveries, 1)) * 100)}%
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTestWebhook(webhook)}>
                              <Zap className="h-4 w-4 mr-2" />
                              Test Webhook
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Deliveries
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">API Keys</h3>
              <p className="text-sm text-muted-foreground">
                Manage API access keys for external applications
              </p>
            </div>
            <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key with specific permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key-name">Name</Label>
                    <Input
                      id="api-key-name"
                      value={newAPIKey.name}
                      onChange={(e) => setNewAPIKey({ ...newAPIKey, name: e.target.value })}
                      placeholder="Production API Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'read:users', 'write:users', 'read:applications',
                        'write:applications', 'read:analytics', 'write:analytics'
                      ].map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={permission}
                            checked={newAPIKey.permissions.includes(permission)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewAPIKey({
                                  ...newAPIKey,
                                  permissions: [...newAPIKey.permissions, permission]
                                });
                              } else {
                                setNewAPIKey({
                                  ...newAPIKey,
                                  permissions: newAPIKey.permissions.filter(p => p !== permission)
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={permission} className="text-sm">
                            {permission}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires-at">Expires At (Optional)</Label>
                    <Input
                      id="expires-at"
                      type="date"
                      value={newAPIKey.expiresAt}
                      onChange={(e) => setNewAPIKey({ ...newAPIKey, expiresAt: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAPIKey} disabled={createAPIKeyMutation.isPending}>
                      Create API Key
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys?.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{apiKey.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Created by {apiKey.createdBy}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {apiKey.keyPrefix}••••••••••••••••
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(apiKey.keyPrefix + '••••••••••••••••')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {apiKey.permissions.slice(0, 2).map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                          {apiKey.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{apiKey.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {apiKey.lastUsed ? 
                          new Date(apiKey.lastUsed).toLocaleDateString() : 
                          'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {apiKey.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {apiKey.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Usage
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Available Integrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableIntegrations.map((integration, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        {getCategoryIcon(integration.category)}
                        <Badge variant="outline" className="text-xs capitalize">
                          {integration.category}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-medium">{integration.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                      </div>
                      <Button size="sm" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}