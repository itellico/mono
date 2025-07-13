'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Eye, RotateCcw, Search, RefreshCw, GitBranch, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';

interface VersionEntry {
  id: number;
  tenantId: number;
  entityType: string;
  entityId: string;
  version: number;
  data: Record<string, any>;
  note?: string;
  createdBy: number;
  createdAt: string;
}

interface VersionHistoryBrowserProps {
  entityType?: string;
  entityId?: string;
  tenantId?: number;
  className?: string;
}

export function VersionHistoryBrowser({ 
  entityType: initialEntityType, 
  entityId: initialEntityId, 
  tenantId, 
  className 
}: VersionHistoryBrowserProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionEntry | null>(null);
  const [compareVersion, setCompareVersion] = useState<VersionEntry | null>(null);

  const [filters, setFilters] = useState({
    entityType: initialEntityType || '',
    entityId: initialEntityId || '',
    search: '',
    page: 1,
    limit: 25
  });

  const entityTypes = [
    'user', 'template', 'module', 'option', 'profile', 'job', 'application'
  ];

  /**
   * Fetch version history
   */
  const fetchVersions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.entityId && { entityId: filters.entityId }),
        ...(filters.search && { search: filters.search }),
        ...(tenantId && { tenantId: tenantId.toString() })
      });

      const response = await fetch(`/api/v1/admin/versions?${queryParams}`);

      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);

        browserLogger.info('Version history fetched', {
          count: data.versions?.length || 0,
          filters
        });
      } else {
        browserLogger.error('Failed to fetch version history', {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      browserLogger.error('Error fetching version history', {
        error: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Restore a version
   */
  const restoreVersion = async (version: VersionEntry) => {
    try {
      const response = await fetch('/api/v1/admin/versions/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: version.id,
          entityType: version.entityType,
          entityId: version.entityId
        })
      });

      if (response.ok) {
        browserLogger.info('Version restored', {
          versionId: version.id,
          entityType: version.entityType,
          entityId: version.entityId,
          version: version.version
        });

        // Refresh the versions list
        await fetchVersions();
        setSelectedVersion(null);
      } else {
        const errorData = await response.json();
        browserLogger.error('Failed to restore version', {
          error: errorData.error,
          versionId: version.id
        });
      }
    } catch (error) {
      browserLogger.error('Error restoring version', {
        error: (error as Error).message,
        versionId: version.id
      });
    }
  };

  /**
   * Calculate diff between two objects
   */
  const calculateDiff = (oldObj: Record<string, any>, newObj: Record<string, any>) => {
    const changes: Record<string, { old: any; new: any; type: 'added' | 'removed' | 'changed' }> = {};

    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    for (const key of allKeys) {
      const oldValue = oldObj?.[key];
      const newValue = newObj?.[key];

      if (oldValue === undefined && newValue !== undefined) {
        changes[key] = { old: undefined, new: newValue, type: 'added' };
      } else if (oldValue !== undefined && newValue === undefined) {
        changes[key] = { old: oldValue, new: undefined, type: 'removed' };
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = { old: oldValue, new: newValue, type: 'changed' };
      }
    }

    return changes;
  };

  /**
   * Render diff value
   */
  const renderDiffValue = (value: any, type: 'old' | 'new') => {
    if (value === undefined) return <span className="text-muted-foreground">undefined</span>;
    if (value === null) return <span className="text-muted-foreground">null</span>;

    const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

    return (
      <pre className={cn(
        'text-xs p-2 rounded whitespace-pre-wrap',
        type === 'old' ? 'bg-red-50 text-red-900' : 'bg-green-50 text-green-900'
      )}>
        {stringValue}
      </pre>
    );
  };

  /**
   * Update filter
   */
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  // Fetch versions when filters change
  useEffect(() => {
    fetchVersions();
  }, [filters]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Version History</h2>
          <p className="text-muted-foreground">
            Browse and manage entity version history
          </p>
        </div>
        <Button variant="outline" onClick={fetchVersions} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select value={filters.entityType || 'all'} onValueChange={(value) => updateFilter('entityType', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Entity ID</label>
              <Input
                placeholder="Entity ID"
                value={filters.entityId}
                onChange={(e) => updateFilter('entityId', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search in notes..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version List */}
      <Card>
        <CardHeader>
          <CardTitle>Version Entries ({versions.length})</CardTitle>
          <CardDescription>
            Historical snapshots of entity data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading...' : 'No version history found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            v{version.version}
                          </Badge>
                          <GitBranch className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{version.entityType}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {version.entityId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.createdBy}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(version.createdAt), 'MMM dd, HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {version.note || 'No note'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVersion(version)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Restore Version</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to restore this version? This will create a new version with the restored data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="my-4 p-4 bg-muted rounded-lg space-y-2">
                                <div><strong>Entity:</strong> {version.entityType} ({version.entityId})</div>
                                <div><strong>Version:</strong> v{version.version}</div>
                                <div><strong>Created:</strong> {format(new Date(version.createdAt), 'PPp')}</div>
                                <div><strong>Note:</strong> {version.note || 'No note'}</div>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => restoreVersion(version)}>
                                  Restore Version
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Version Detail Modal */}
      {selectedVersion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Version Details - v{selectedVersion.version}</CardTitle>
              <CardDescription>
                {selectedVersion.entityType} ({selectedVersion.entityId}) • {format(new Date(selectedVersion.createdAt), 'PPPp')}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <Tabs defaultValue="data" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="data">Version Data</TabsTrigger>
                  <TabsTrigger value="diff" disabled={!compareVersion}>
                    Compare ({compareVersion ? `v${compareVersion.version}` : 'Select Version'})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="data" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Compare with:</label>
                      <Select value={compareVersion?.id.toString() || ''} onValueChange={(value) => {
                        const version = versions.find(v => v.id.toString() === value);
                        setCompareVersion(version || null);
                      }}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions
                            .filter(v => v.id !== selectedVersion.id)
                            .map((version) => (
                              <SelectItem key={version.id} value={version.id.toString()}>
                                v{version.version} - {format(new Date(version.createdAt), 'MMM dd')}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Version Data</label>
                      <pre className="text-xs bg-muted p-4 rounded mt-2 overflow-auto">
                        {JSON.stringify(selectedVersion.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="diff" className="space-y-4">
                  {compareVersion && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted rounded">
                        <div>
                          <strong>Comparing:</strong> v{compareVersion.version} → v{selectedVersion.version}
                        </div>
                        <Badge variant="outline">
                          {Object.keys(calculateDiff(compareVersion.data, selectedVersion.data)).length} changes
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(calculateDiff(compareVersion.data, selectedVersion.data)).map(([key, change]) => (
                          <div key={key} className="border rounded p-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                change.type === 'added' ? 'default' : 
                                change.type === 'removed' ? 'destructive' : 
                                'secondary'
                              }>
                                {change.type}
                              </Badge>
                              <span className="font-medium">{key}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-red-600">Before (v{compareVersion.version})</label>
                                {renderDiffValue(change.old, 'old')}
                              </div>
                              <div>
                                <label className="text-sm font-medium text-green-600">After (v{selectedVersion.version})</label>
                                {renderDiffValue(change.new, 'new')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedVersion(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 