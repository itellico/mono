'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { browserLogger } from '@/lib/browser-logger';
import { Plus, Search, Settings, BarChart3, Puzzle, CheckCircle, AlertCircle, XCircle, Edit, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  useIntegrationsList, 
  useIntegrationsStatistics,
  useCreateIntegration,
  useUpdateIntegration,
  useDeleteIntegration,
  integrationsQueryKeys
} from '@/hooks/admin/useIntegrations';
import type { Integration, IntegrationsListQuery } from '@/types/integrations';

export default function AdminIntegrationsPage() {
  const t = useTranslations('admin-common');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Query parameters for filtering
  const queryParams: IntegrationsListQuery = {
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
    page: 1,
    limit: 20,
  };

  // Hooks for data fetching
  const { 
    data: integrationsData, 
    isLoading: isLoadingIntegrations, 
    error: integrationsError 
  } = useIntegrationsList({ params: queryParams });

  const { 
    data: statisticsData, 
    isLoading: isLoadingStats 
  } = useIntegrationsStatistics();

  // Mutation hooks
  const createMutation = useCreateIntegration();
  const updateMutation = useUpdateIntegration();
  const deleteMutation = useDeleteIntegration();

  const integrations = integrationsData?.data || [];
  const pagination = integrationsData?.pagination;
  const statistics = statisticsData;

  // Log component render for debugging
  browserLogger.info('Admin integrations page rendered', {
    integrationsCount: integrations.length,
    searchQuery,
    selectedCategory,
    isLoading: isLoadingIntegrations,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    browserLogger.info('Integration search initiated', { query });
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    browserLogger.info('Integration category filter applied', { category });
  };

  const handleEditClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsEditDialogOpen(true);
    browserLogger.info('Integration edit dialog opened', { 
      slug: integration.slug,
      name: integration.name 
    });
  };

  const handleDeleteClick = async (integration: Integration) => {
    if (confirm(t('integrations.confirmDelete', { name: integration.name }))) {
      try {
        await deleteMutation.mutateAsync(integration.slug);
        browserLogger.info('Integration delete initiated', { 
          slug: integration.slug 
        });
      } catch (error) {
        browserLogger.error('Integration delete failed', { 
          slug: integration.slug,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analytics':
        return <BarChart3 className="h-4 w-4" />;
      case 'workflow':
        return <Settings className="h-4 w-4" />;
      case 'external':
        return <Puzzle className="h-4 w-4" />;
      default:
        return <Wrench className="h-4 w-4" />;
    }
  };

  // Error state
  if (integrationsError) {
    browserLogger.error('Integrations page error', { 
      error: integrationsError instanceof Error ? integrationsError.message : 'Unknown error' 
    });
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              {t('integrations.states.error')}
            </h3>
            <p className="text-red-600">
              {integrationsError instanceof Error ? integrationsError.message : t('integrations.states.unknownError')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('integrations.title')}</h1>
          <p className="text-muted-foreground">{t('integrations.subtitle')}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('integrations.addIntegration')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('integrations.dialogs.create.title')}</DialogTitle>
            </DialogHeader>
            {/* TODO: Add integration creation form */}
            <p className="text-muted-foreground">{t('integrations.dialogs.create.comingSoon')}</p>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('integrations.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                onClick={() => handleCategoryFilter('')}
                size="sm"
              >
                {t('integrations.filters.all')}
              </Button>
              <Button
                variant={selectedCategory === 'analytics' ? 'default' : 'outline'}
                onClick={() => handleCategoryFilter('analytics')}
                size="sm"
              >
                {t('integrations.categories.analytics')}
              </Button>
              <Button
                variant={selectedCategory === 'workflow' ? 'default' : 'outline'}
                onClick={() => handleCategoryFilter('workflow')}
                size="sm"
              >
                {t('integrations.categories.workflow')}
              </Button>
              <Button
                variant={selectedCategory === 'external' ? 'default' : 'outline'}
                onClick={() => handleCategoryFilter('external')}
                size="sm"
              >
                {t('integrations.categories.external')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t('integrations.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="integrations">{t('integrations.tabs.integrations')}</TabsTrigger>
          <TabsTrigger value="statistics">{t('integrations.tabs.statistics')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {isLoadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('integrations.overview.totalIntegrations')}
                      </p>
                      <p className="text-3xl font-bold">{statistics?.totalIntegrations || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('integrations.overview.availableIntegrations')}
                      </p>
                    </div>
                    <Puzzle className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('integrations.overview.active')}
                      </p>
                      <p className="text-3xl font-bold">{statistics?.activeIntegrations || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('integrations.overview.currentlyEnabled')}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('integrations.overview.categories')}
                      </p>
                      <p className="text-3xl font-bold">{Object.keys(statistics?.byCategory || {}).length}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('integrations.overview.differentTypes')}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t('integrations.overview.temporalReady')}
                      </p>
                      <p className="text-3xl font-bold">{statistics?.temporalEnabled || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('integrations.overview.workflowEnabled')}
                      </p>
                    </div>
                    <Settings className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{t('integrations.recentActivity.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{t('integrations.recentActivity.events.installed')}</p>
                      <p className="text-sm text-muted-foreground">{t('integrations.recentActivity.events.installedTime')}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{t('integrations.categories.analytics')}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{t('integrations.recentActivity.events.configured')}</p>
                      <p className="text-sm text-muted-foreground">{t('integrations.recentActivity.events.configuredTime')}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{t('integrations.categories.workflow')}</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Puzzle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">{t('integrations.recentActivity.events.updated')}</p>
                      <p className="text-sm text-muted-foreground">{t('integrations.recentActivity.events.updatedTime')}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{t('integrations.categories.external')}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {isLoadingIntegrations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : integrations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Puzzle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? t('integrations.states.noResults') : t('integrations.states.noIntegrations')}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery 
                    ? t('integrations.states.noResultsDescription') 
                    : t('integrations.states.noIntegrationsDescription')
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('integrations.addIntegration')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => (
                <Card key={integration.slug} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {integration.iconUrl ? (
                          <img 
                            src={integration.iconUrl} 
                            alt={integration.name}
                            className="h-8 w-8 rounded"
                          />
                        ) : (
                          getCategoryIcon(integration.category)
                        )}
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(integration.enabled ? 'active' : 'inactive')}
                            <Badge variant={integration.enabled ? 'default' : 'secondary'}>
                              {integration.enabled ? t('integrations.status.active') : t('integrations.status.inactive')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(integration)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {integration.description || t('integrations.states.noDescription')}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('integrations.details.category')}:</span>
                        <Badge variant="outline">
                          {t(`integrations.categories.${integration.category}`)}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('integrations.details.version')}:</span>
                        <span className="font-mono text-xs">{integration.version}</span>
                      </div>

                      {integration.isTemporalEnabled && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t('integrations.details.workflow')}:</span>
                          <Badge variant="outline" className="text-green-600">
                            {t('integrations.details.enabled')}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(integration)}>
                        <Settings className="h-4 w-4 mr-2" />
                        {t('integrations.actions.configure')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(integration)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          t('integrations.states.deleting')
                        ) : (
                          t('integrations.actions.remove')
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {t('integrations.pagination.showing', {
                      start: ((pagination.page - 1) * pagination.limit) + 1,
                      end: Math.min(pagination.page * pagination.limit, pagination.total),
                      total: pagination.total
                    })}
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={pagination.page <= 1}
                    >
                      {t('integrations.pagination.previous')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      {t('integrations.pagination.next')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          {isLoadingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('integrations.statistics.categoryDistribution')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(statistics?.byCategory || {}).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category)}
                          <span>{t(`integrations.categories.${category}`)}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('integrations.statistics.statusDistribution')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(statistics?.byStatus || {}).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(status)}
                          <span>{t(`integrations.status.${status}`)}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('integrations.statistics.systemHealth')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>{t('integrations.statistics.totalRequests')}</span>
                      <Badge variant="outline">{statistics?.totalRequests || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('integrations.statistics.successRate')}</span>
                      <Badge variant="outline">{statistics?.successRate || 0}%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('integrations.statistics.avgResponseTime')}</span>
                      <Badge variant="outline">{statistics?.avgResponseTime || 0}ms</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Errors */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('integrations.statistics.recentErrors')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {statistics?.recentErrors?.length ? (
                      statistics.recentErrors.map((error, index) => (
                        <div key={index} className="p-3 bg-red-50 rounded-lg">
                          <p className="text-sm font-medium text-red-800">{error.integration}</p>
                          <p className="text-xs text-red-600">{error.message}</p>
                          <p className="text-xs text-red-500 mt-1">{error.timestamp}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t('integrations.statistics.noRecentErrors')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Integration Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedIntegration?.name && typeof selectedIntegration.name === 'string'
                ? t('integrations.dialogs.edit.title', { name: selectedIntegration.name })
                : 'Edit Integration'
              }
            </DialogTitle>
          </DialogHeader>
          {selectedIntegration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('integrations.form.name')}</label>
                  <Input value={selectedIntegration.name} readOnly />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('integrations.form.category')}</label>
                  <Input value={selectedIntegration.category} readOnly />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{t('integrations.form.description')}</label>
                <Input value={selectedIntegration.description || ''} readOnly />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('integrations.dialogs.edit.comingSoon')}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 