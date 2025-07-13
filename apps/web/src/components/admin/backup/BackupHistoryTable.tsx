'use client';
import React from 'react';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Eye,
  Filter,
  Search
} from 'lucide-react';
/**
 * Backup History Table Component
 * Displays backup and GDPR export history with demo data
 * 
 * @component
 * @example
 * <BackupHistoryTable />
 */
export function BackupHistoryTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  // Demo data
  const backupHistory = [
    {
      id: '1',
      type: 'database',
      status: 'completed',
      startedAt: '2024-01-15T02:00:00Z',
      completedAt: '2024-01-15T02:15:00Z',
      fileSize: '2.3 GB',
      fileName: 'database_backup_20240115_020000.dump'
    },
    {
      id: '2',
      type: 'user_export',
      status: 'completed',
      startedAt: '2024-01-14T10:30:00Z',
      completedAt: '2024-01-14T10:32:00Z',
      fileSize: '15.2 MB',
      fileName: 'user_export_12345_20240114.json'
    },
    {
      id: '3',
      type: 'media',
      status: 'failed',
      startedAt: '2024-01-14T03:00:00Z',
      completedAt: null,
      fileSize: null,
      fileName: null,
      error: 'Storage connection timeout'
    },
    {
      id: '4',
      type: 'configuration',
      status: 'running',
      startedAt: '2024-01-15T09:45:00Z',
      completedAt: null,
      fileSize: null,
      fileName: null
    },
    {
      id: '5',
      type: 'account_export',
      status: 'completed',
      startedAt: '2024-01-13T14:20:00Z',
      completedAt: '2024-01-13T14:25:00Z',
      fileSize: '156.7 MB',
      fileName: 'account_export_98765_20240113.json'
    }
  ];
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'running':
        return <Badge variant="outline" className="text-blue-600"><Clock className="w-3 h-3 mr-1" />Running</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const getTypeBadge = (type: string) => {
    const typeConfig = {
      database: { label: 'Database', color: 'bg-blue-100 text-blue-800' },
      media: { label: 'Media', color: 'bg-green-100 text-green-800' },
      configuration: { label: 'Config', color: 'bg-purple-100 text-purple-800' },
      full_system: { label: 'Full System', color: 'bg-gray-100 text-gray-800' },
      user_export: { label: 'User Export', color: 'bg-orange-100 text-orange-800' },
      account_export: { label: 'Account Export', color: 'bg-yellow-100 text-yellow-800' },
      tenant_export: { label: 'Tenant Export', color: 'bg-red-100 text-red-800' },
      custom_export: { label: 'Custom Export', color: 'bg-indigo-100 text-indigo-800' }
    };
    const config = typeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  const formatDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const duration = Math.round((endTime - startTime) / 60000); // minutes
    return `${duration}m`;
  };
  const filteredHistory = backupHistory.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search backups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="database">Database</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="configuration">Configuration</SelectItem>
            <SelectItem value="user_export">User Export</SelectItem>
            <SelectItem value="account_export">Account Export</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* History Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>File Size</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {getTypeBadge(item.type)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(item.status)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDateTime(item.startedAt)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDuration(item.startedAt, item.completedAt)}
                </TableCell>
                <TableCell className="text-sm">
                  {item.fileSize || '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {item.status === 'completed' && item.fileName && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredHistory.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No backup history found matching your filters.
        </div>
      )}
    </div>
  );
} 