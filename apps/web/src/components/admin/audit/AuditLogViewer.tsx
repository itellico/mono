'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, Download, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';
import apiClient from '@/lib/api-client-secure';
interface AuditLogEntry {
  id: number;
  tenantId: number;
  userId: number;
  entityType: string;
  entityId: string;
  action: string;
  changes?: Record<string, any>;
  context?: Record<string, any>;
  timestamp: string;
}
interface AuditLogFilters {
  search: string;
  entityType: string;
  action: string;
  userId: string;
  startDate: Date | null;
  endDate: Date | null;
  page: number;
  limit: number;
}
interface AuditLogViewerProps {
  tenantId?: number;
  className?: string;
}
export function AuditLogViewer({ tenantId, className }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    search: '',
    entityType: '',
    action: '',
    userId: '',
    startDate: null,
    endDate: null,
    page: 1,
    limit: 25
  });
  const actionTypes = [
    'create', 'update', 'delete', 'login_success', 'login_fail', 'logout',
    'email_sent', 'export_data', 'import_data', 'record_locked', 'record_unlocked'
  ];
  const entityTypes = [
    'user', 'template', 'module', 'option', 'profile', 'job', 'application'
  ];
  /**
   * Fetch audit logs with current filters
   */
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.entityType && { resource: filters.entityType }), // Map entityType to resource
        ...(filters.action && { action: filters.action }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { dateFrom: filters.startDate.toISOString() }), // Map to dateFrom
        ...(filters.endDate && { dateTo: filters.endDate.toISOString() }), // Map to dateTo
        ...(tenantId && { tenantId: tenantId })
      };
      
      // Use local Next.js API for audit logs instead of Fastify
      const response = await fetch(`/api/v1/audit?${new URLSearchParams(params as any)}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.data) {
        // Transform the API response to match the expected format
        const transformedLogs = data.data.logs?.map((log: any) => ({
          id: log.id,
          tenantId: log.tenantId,
          userId: log.userId,
          entityType: log.resource, // Map resource to entityType
          entityId: log.resourceId || '', // Map resourceId to entityId
          action: log.action,
          changes: log.metadata, // Map metadata to changes
          context: log.metadata, // Also include metadata as context
          timestamp: log.timestamp,
        })) || [];
        setLogs(transformedLogs);
        setTotalCount(data.data.pagination?.total || 0);
        browserLogger.info('Audit logs fetched', {
          count: transformedLogs.length,
          total: data.data.pagination?.total || 0,
          filters
        });
      } else {
        browserLogger.error('Failed to fetch audit logs', {
          status: response.status,
          error: data.error,
          message: data.message
        });
      }
    } catch (error) {
      browserLogger.error('Error fetching audit logs', {
        error: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };
  /**
   * Handle filter changes
   */
  const updateFilter = (key: keyof AuditLogFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };
  /**
   * Export audit logs
   */
  const exportLogs = async () => {
    try {
      // Build export URL with query params
      const params = new URLSearchParams({
        format: 'csv',
        limit: '10000',
        ...(filters.search && { search: filters.search }),
        ...(filters.entityType && { resource: filters.entityType }),
        ...(filters.action && { action: filters.action }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { dateFrom: filters.startDate.toISOString() }),
        ...(filters.endDate && { dateTo: filters.endDate.toISOString() }),
        ...(tenantId && { tenantId: tenantId.toString() })
      });
      
      // Use local Next.js API for export
      const response = await fetch(`/api/v1/audit/export?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        browserLogger.info('Audit logs exported');
      } else {
        browserLogger.error('Failed to export audit logs', {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      browserLogger.error('Failed to export audit logs', {
        error: (error as Error).message
      });
    }
  };
  /**
   * Get action badge variant
   */
  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      case 'login_success': return 'default';
      case 'login_fail': return 'destructive';
      case 'logout': return 'secondary';
      default: return 'outline';
    }
  };
  /**
   * Format changes for display
   */
  const formatChanges = (changes: Record<string, any> | undefined) => {
    if (!changes || Object.keys(changes).length === 0) return 'No changes';
    const changeCount = Object.keys(changes).length;
    return `${changeCount} field${changeCount > 1 ? 's' : ''} changed`;
  };
  // Fetch logs when component mounts or filters change
  useEffect(() => {
    fetchLogs();
  }, [filters]);
  const totalPages = Math.ceil(totalCount / filters.limit);
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Logs</h2>
          <p className="text-muted-foreground">
            Track all system activities and changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {/* Entity Type */}
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
            {/* Action */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={filters.action || 'all'} onValueChange={(value) => updateFilter('action', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.replace('_', ' ').charAt(0).toUpperCase() + action.replace('_', ' ').slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* User ID */}
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) => updateFilter('userId', e.target.value)}
              />
            </div>
          </div>
          {/* Date Range - Simplified without Calendar component */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => updateFilter('startDate', e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => updateFilter('endDate', e.target.value ? new Date(e.target.value) : null)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Audit Log Entries ({totalCount.toLocaleString()})
          </CardTitle>
          <CardDescription>
            Page {filters.page} of {totalPages} • Showing {logs.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                      </TableCell>
                      <TableCell>{log.userId}</TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.entityType}</div>
                          <div className="text-sm text-muted-foreground">{log.entityId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatChanges(log.changes)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, totalCount)} of {totalCount} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('page', Math.min(totalPages, filters.page + 1))}
                  disabled={filters.page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <CardTitle>Audit Log Details</CardTitle>
              <CardDescription>
                {format(new Date(selectedLog.timestamp), 'PPPp')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">User ID</label>
                  <div className="text-sm">{selectedLog.userId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Action</label>
                  <div>
                    <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                      {selectedLog.action.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Entity Type</label>
                  <div className="text-sm">{selectedLog.entityType}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Entity ID</label>
                  <div className="text-sm font-mono">{selectedLog.entityId}</div>
                </div>
              </div>
              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Changes</label>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.context && Object.keys(selectedLog.context).length > 0 && (
                <div>
                  <label className="text-sm font-medium">Context</label>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(selectedLog.context, null, 2)}
                  </pre>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedLog(null)}>
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