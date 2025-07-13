'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Lock, Unlock, Search, RefreshCw, Clock, User, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';
interface ActiveLock {
  id: number;
  tenantId: number;
  entityType: string;
  entityId: string;
  lockedBy: number;
  lockedAt: string;
  expiresAt: string;
  reason?: string;
  isExpiring: boolean;
}
interface LockManagerProps {
  tenantId?: number;
  className?: string;
}
export function LockManager({ tenantId, className }: LockManagerProps) {
  const [locks, setLocks] = useState<ActiveLock[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLock, setSelectedLock] = useState<ActiveLock | null>(null);
  /**
   * Fetch active locks
   */
  const fetchActiveLocks = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(tenantId && { tenantId: tenantId.toString() }),
        ...(searchTerm && { search: searchTerm })
      });
      const response = await fetch(`/api/v1/admin/locks/active?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        const locksWithExpiration = (data.locks || []).map((lock: any) => ({
          ...lock,
          isExpiring: new Date(lock.expiresAt).getTime() - Date.now() < 15 * 60 * 1000 // 15 minutes
        }));
        setLocks(locksWithExpiration);
        browserLogger.info('Active locks fetched', {
          count: locksWithExpiration.length,
          searchTerm,
          tenantId
        });
      } else {
        browserLogger.error('Failed to fetch active locks', {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      browserLogger.error('Error fetching active locks', {
        error: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };
  /**
   * Force release a lock
   */
  const forceReleaseLock = async (lock: ActiveLock) => {
    try {
      const response = await fetch('/api/v1/locks/force-release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: lock.entityType,
          entityId: lock.entityId
        })
      });
      if (response.ok) {
        browserLogger.info('Lock force released', {
          lockId: lock.id,
          entityType: lock.entityType,
          entityId: lock.entityId
        });
        // Refresh the locks list
        await fetchActiveLocks();
        setSelectedLock(null);
      } else {
        const errorData = await response.json();
        browserLogger.error('Failed to force release lock', {
          error: errorData.error,
          lockId: lock.id
        });
      }
    } catch (error) {
      browserLogger.error('Error force releasing lock', {
        error: (error as Error).message,
        lockId: lock.id
      });
    }
  };
  /**
   * Check if lock is expired
   */
  const isLockExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) <= new Date();
  };
  /**
   * Get lock status badge
   */
  const getLockStatusBadge = (lock: ActiveLock) => {
    if (isLockExpired(lock.expiresAt)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (lock.isExpiring) {
      return <Badge variant="secondary">Expiring Soon</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };
  /**
   * Filter locks based on search term
   */
  const filteredLocks = locks.filter(lock => 
    lock.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lock.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lock.lockedBy.toString().includes(searchTerm) ||
    (lock.reason && lock.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchActiveLocks();
    const interval = setInterval(fetchActiveLocks, 30000);
    return () => clearInterval(interval);
  }, [tenantId, searchTerm]);
  const expiredCount = locks.filter(lock => isLockExpired(lock.expiresAt)).length;
  const expiringCount = locks.filter(lock => lock.isExpiring && !isLockExpired(lock.expiresAt)).length;
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lock Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage active record locks
          </p>
        </div>
        <Button variant="outline" onClick={fetchActiveLocks} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locks</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locks.length}</div>
            <p className="text-xs text-muted-foreground">
              Active record locks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringCount}</div>
            <p className="text-xs text-muted-foreground">
              Within 15 minutes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
            <p className="text-xs text-muted-foreground">
              Need cleanup
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(locks.map(lock => lock.lockedBy)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Holding locks
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Locks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by entity type, entity ID, user ID, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>
      {/* Active Locks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Locks ({filteredLocks.length})</CardTitle>
          <CardDescription>
            Currently active record locks across the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Locked By</TableHead>
                  <TableHead>Locked At</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading...' : 'No active locks found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLocks.map((lock) => (
                    <TableRow key={lock.id}>
                      <TableCell>
                        {getLockStatusBadge(lock)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lock.entityType}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {lock.entityId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {lock.lockedBy}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDistanceToNow(new Date(lock.lockedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className={cn(
                          isLockExpired(lock.expiresAt) && 'text-red-600',
                          lock.isExpiring && !isLockExpired(lock.expiresAt) && 'text-yellow-600'
                        )}>
                          {formatDistanceToNow(new Date(lock.expiresAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {lock.reason || 'No reason'}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Unlock className="h-3 w-3 mr-1" />
                              Force Release
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Force Release Lock</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to force release this lock? This action cannot be undone and may cause data conflicts if the user is actively editing.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="my-4 p-4 bg-muted rounded-lg space-y-2">
                              <div><strong>Entity:</strong> {lock.entityType} ({lock.entityId})</div>
                              <div><strong>Locked by:</strong> User {lock.lockedBy}</div>
                              <div><strong>Reason:</strong> {lock.reason || 'No reason'}</div>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => forceReleaseLock(lock)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Force Release
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 