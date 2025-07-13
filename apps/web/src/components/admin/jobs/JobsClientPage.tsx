'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2, Eye, Users, DollarSign, Calendar, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { AdminListPage, type StatCard, type ColumnConfig, type FilterConfig, type BulkAction } from '@/components/admin/AdminListPage';
import { ConfirmationModal } from '@/components/admin/shared/ConfirmationModal';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

interface JobData {
  id: string;
  uuid: string;
  title: string;
  company: string;
  category: string;
  type: string;
  status: string;
  applications: number;
  compensation: string;
  location: string;
  publishedAt: string;
  applicationDeadline: string;
  tenantName: string;
  createdAt: string;
  updatedAt: string;
}

interface JobsResponse {
  jobs: JobData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface JobsClientPageProps {
  initialData: JobsResponse;
  initialFilters: {
    page: number;
    limit: number;
    search: string;
    status: 'published' | 'draft' | 'closed' | 'filled' | 'all';
  };
  userContext: {
    userId: string;
    adminRole: string;
    tenantId: string | null;
    permissions: string[];
  };
}

interface ExtendedFilters {
  page: number;
  limit: number;
  search: string;
  status: string[];
  category: string[];
  type: string[];
  compensation: string[];
}

export function JobsClientPage({ 
  initialData, 
  initialFilters, 
  userContext 
}: JobsClientPageProps) {
  const t = useTranslations('admin-jobs');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { trackClick, trackView, trackSearch, trackFilter } = useAuditTracking();

  const [filters, setFilters] = React.useState<ExtendedFilters>({
    page: initialFilters.page,
    limit: initialFilters.limit,
    search: initialFilters.search,
    status: initialFilters.status === 'all' ? [] : [initialFilters.status],
    category: [],
    type: [],
    compensation: []
  });

  const [sortConfig, setSortConfig] = React.useState<{
    column: string;
    direction: 'asc' | 'desc' | null;
  }>({ column: 'createdAt', direction: 'desc' });

  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({
    title: true,
    company: true,
    category: true,
    type: true,
    status: true,
    applications: true,
    compensation: true,
    deadline: true,
    created: true
  });

  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<JobData | null>(null);
  const [activeSearchName, setActiveSearchName] = React.useState<string>('');

  // Mock data for development - replace with actual API call
  const mockJobs: JobData[] = [
    {
      id: '1',
      uuid: 'job-1-uuid',
      title: 'Senior Model for Fashion Campaign',
      company: 'Elite Fashion Co.',
      category: 'modeling',
      type: 'freelance',
      status: 'published',
      applications: 24,
      compensation: '$2,000 - $5,000',
      location: 'New York, NY',
      publishedAt: '2024-01-15T10:00:00Z',
      applicationDeadline: '2024-02-15T23:59:59Z',
      tenantName: 'Go Models',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      uuid: 'job-2-uuid',
      title: 'Commercial Photography Model',
      company: 'Brand Studio Inc.',
      category: 'modeling',
      type: 'contract',
      status: 'published',
      applications: 31,
      compensation: '$500 - $1,200/day',
      location: 'Los Angeles, CA',
      publishedAt: '2024-01-14T14:30:00Z',
      applicationDeadline: '2024-02-10T23:59:59Z',
      tenantName: 'Go Models',
      createdAt: '2024-01-14T14:30:00Z',
      updatedAt: '2024-01-14T14:30:00Z'
    }
  ];

  // Transform mock data
  const tableData: JobData[] = React.useMemo(() => {
    let data = mockJobs;
    
    // Apply client-side sorting
    if (sortConfig.direction && sortConfig.column) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.column as keyof JobData];
        const bValue = b[sortConfig.column as keyof JobData];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
      });
    }
    
    return data;
  }, [sortConfig]);

  // Statistics
  const stats = React.useMemo(() => {
    const jobs = mockJobs;
    return {
      total: jobs.length,
      published: jobs.filter(j => j.status === 'published').length,
      draft: jobs.filter(j => j.status === 'draft').length,
      totalApplications: jobs.reduce((sum, j) => sum + j.applications, 0)
    };
  }, []);

  const pagination = React.useMemo(() => ({
    page: filters.page,
    limit: filters.limit,
    total: mockJobs.length,
    totalPages: Math.ceil(mockJobs.length / filters.limit)
  }), [filters.page, filters.limit]);

  // Filter options
  const statusOptions = [
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Closed', value: 'closed' },
    { label: 'Filled', value: 'filled' }
  ];

  const categoryOptions = [
    { label: 'Modeling', value: 'modeling' },
    { label: 'Photography', value: 'photography' },
    { label: 'Creative Direction', value: 'creative-direction' },
    { label: 'Styling', value: 'styling' }
  ];

  const typeOptions = [
    { label: 'Full-time', value: 'full-time' },
    { label: 'Part-time', value: 'part-time' },
    { label: 'Contract', value: 'contract' },
    { label: 'Freelance', value: 'freelance' }
  ];

  const compensationOptions = [
    { label: 'Under $500', value: 'under-500' },
    { label: '$500 - $1,000', value: '500-1000' },
    { label: '$1,000 - $5,000', value: '1000-5000' },
    { label: 'Over $5,000', value: 'over-5000' }
  ];

  // Statistics cards
  const statsCards: StatCard[] = [
    {
      title: 'Total Jobs',
      value: stats.total,
      description: 'All job postings',
      icon: <Users className="h-4 w-4" />
    },
    {
      title: 'Published Jobs',
      value: stats.published,
      description: 'Currently active jobs',
      icon: <Eye className="h-4 w-4" />
    },
    {
      title: 'Draft Jobs',
      value: stats.draft,
      description: 'Pending publication',
      icon: <Edit className="h-4 w-4" />
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications.toLocaleString(),
      description: 'Applications received',
      icon: <Users className="h-4 w-4" />
    }
  ];

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      title: 'Status',
      type: 'multiSelect',
      options: statusOptions
    },
    {
      key: 'category',
      title: 'Category',
      type: 'multiSelect',
      options: categoryOptions
    },
    {
      key: 'type',
      title: 'Job Type',
      type: 'multiSelect',
      options: typeOptions
    },
    {
      key: 'compensation',
      title: 'Compensation',
      type: 'multiSelect',
      options: compensationOptions
    }
  ];

  // Column configuration
  const columns: ColumnConfig<JobData>[] = [
    {
      key: 'title',
      title: 'Job Title',
      sortable: true,
      hideable: false,
      render: (value, row) => (
        <div className="space-y-1">
          <span className="font-medium">{value as string}</span>
          <div className="text-sm text-muted-foreground">{row.company}</div>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      hideable: true,
      render: (value) => (
        <Badge variant="outline" className="capitalize">
          {(value as string).replace('-', ' ')}
        </Badge>
      )
    },
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      hideable: true,
      render: (value) => (
        <Badge variant="secondary" className="capitalize">
          {(value as string).replace('-', ' ')}
        </Badge>
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      hideable: false,
      render: (value) => {
        const status = value as string;
        const variants = {
          published: 'default',
          draft: 'secondary',
          closed: 'outline',
          filled: 'destructive'
        };
        return (
          <Badge variant={variants[status as keyof typeof variants] as any}>
            {status}
          </Badge>
        );
      }
    },
    {
      key: 'applications',
      title: 'Applications',
      sortable: true,
      hideable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Users className="h-3 w-3" />
          <span>{value as number}</span>
        </div>
      )
    },
    {
      key: 'compensation',
      title: 'Compensation',
      sortable: false,
      hideable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <DollarSign className="h-3 w-3" />
          <span className="text-sm">{value as string}</span>
        </div>
      )
    },
    {
      key: 'applicationDeadline',
      title: 'Deadline',
      sortable: true,
      hideable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span className="text-sm">{new Date(value as string).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      title: 'Created',
      sortable: true,
      hideable: true,
      render: (value) => new Date(value as string).toLocaleDateString()
    }
  ];

  // Event handlers
  const handleFilterChange = (key: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: values,
      page: 1
    }));
  };

  const handleClearFilters = () => {
    setFilters(prev => ({
      ...prev,
      status: [],
      category: [],
      type: [],
      compensation: [],
      page: 1
    }));
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (column: string) => {
    setSortConfig(prev => {
      if (prev.column === column) {
        const nextDirection = prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc';
        return { column, direction: nextDirection };
      } else {
        return { column, direction: 'asc' };
      }
    });
  };

  const handleColumnVisibilityChange = (visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility);
  };

  // Row selection handlers
  const handleRowSelect = (id: string, selected: boolean) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(tableData.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Job actions
  const handleJobAction = (action: string, jobId: string) => {
    browserLogger.userAction('admin_job_action', `${action} on job ${jobId}`);
    
    const job = tableData.find(j => j.uuid === jobId);
    
    switch (action) {
      case 'view':
        router.push(`/admin/jobs/${jobId}`);
        break;
      case 'edit':
        router.push(`/admin/jobs/${jobId}/edit`);
        break;
      case 'applications':
        router.push(`/admin/jobs/${jobId}/applications`);
        break;
      case 'duplicate':
        // TODO: Implement job duplication
        toast.info('Job duplication feature coming soon');
        break;
      case 'delete':
        if (job) {
          setSelectedJob(job);
          setDeleteModalOpen(true);
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      toast.loading('Deleting job...');
      
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.dismiss();
      toast.success('Job deleted successfully');
      browserLogger.userAction('admin_job_delete', `Deleted job ${jobId}`);
      
      // TODO: Refresh data
    } catch (err: any) {
      toast.dismiss();
      toast.error('Failed to delete job: ' + err.message);
      browserLogger.error('admin_job_delete_failed', { jobId, error: err.message });
    }
  };

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      key: 'publish',
      label: 'Publish',
      variant: 'outline',
      permission: { action: 'update', resource: 'jobs' },
      onClick: (selectedIds) => {
        toast.info(`Publishing ${selectedIds.size} jobs...`);
      }
    },
    {
      key: 'close',
      label: 'Close',
      variant: 'outline',
      permission: { action: 'update', resource: 'jobs' },
      onClick: (selectedIds) => {
        toast.info(`Closing ${selectedIds.size} jobs...`);
      }
    },
    {
      key: 'delete',
      label: 'Delete Selected',
      variant: 'destructive',
      permission: { action: 'delete', resource: 'jobs' },
      onClick: async (selectedIds) => {
        for (const id of Array.from(selectedIds)) {
          await handleDeleteJob(id);
        }
        setSelectedRows(new Set());
      }
    }
  ];

  // Row actions renderer
  const renderRowActions = (job: JobData) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleJobAction('view', job.uuid)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <PermissionGate permissions={['jobs.update']}>
          <DropdownMenuItem onClick={() => handleJobAction('edit', job.uuid)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Job
          </DropdownMenuItem>
        </PermissionGate>
        <DropdownMenuItem onClick={() => handleJobAction('applications', job.uuid)}>
          <Users className="mr-2 h-4 w-4" />
          Applications ({job.applications})
        </DropdownMenuItem>
        <PermissionGate permissions={['jobs.delete']}>
          <DropdownMenuItem 
            onClick={() => handleJobAction('delete', job.uuid)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Job
          </DropdownMenuItem>
        </PermissionGate>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Active filters
  const activeFilters = {
    status: filters.status,
    category: filters.category,
    type: filters.type,
    compensation: filters.compensation
  };

  // Saved search handlers (simplified for now)
  const handleLoadSavedSearch = (config: any) => {
    // TODO: Implement saved search loading
    console.log('Loading saved search:', config);
  };

  const handleSaveSavedSearch = async (searchData: any) => {
    // TODO: Implement saved search saving
    console.log('Saving search:', searchData);
    toast.success('Search saved successfully!');
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Job Management</h1>
        <p className="text-muted-foreground">
          Manage job postings and applications across all tenants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Jobs Table */}
      <AdminListPage<JobData>
        statsCards={[]}
        addConfig={{
          onClick: () => router.push('/admin/jobs/new'),
          label: 'Create Job Posting',
          permission: { action: 'create', resource: 'jobs' }
        }}
        searchConfig={{
          placeholder: "Search jobs by title, company, or category...",
          value: filters.search,
          suggestions: [],
          onChange: handleSearchChange
        }}
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        savedSearchConfig={{
          entityType: 'jobs',
          enabled: true,
          activeSearchName: activeSearchName,
          onLoadSearch: handleLoadSavedSearch,
          onSaveSearch: handleSaveSavedSearch,
          canSave: userContext.permissions.includes('admin:jobs:write') || userContext.permissions.includes('*'),
          canLoad: userContext.permissions.includes('admin:jobs:read') || userContext.permissions.includes('*')
        }}
        columns={columns}
        data={tableData}
        isLoading={false}
        fetchError={null}
        selectedRows={selectedRows}
        onRowSelect={handleRowSelect}
        onSelectAll={handleSelectAll}
        getRowId={(row) => row.id}
        bulkActions={bulkActions}
        pagination={pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        sortConfig={sortConfig}
        onSort={handleSort}
        onRowClick={(job) => {
          handleJobAction('view', job.uuid);
          browserLogger.info('Navigating to job details', { 
            jobId: job.uuid,
            userRole: userContext.adminRole
          });
        }}
        rowClassName={(job) => 
          job.status === 'draft' ? 'opacity-60' : ''
        }
        renderRowActions={renderRowActions}
        userContext={userContext}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title="Delete Job"
        description={
          selectedJob 
            ? `Are you sure you want to delete "${selectedJob.title}"? This action cannot be undone and will remove all associated applications.`
            : 'Are you sure you want to delete this job?'
        }
        confirmText="Delete Job"
        variant="destructive"
        icon="delete"
        onConfirm={async () => {
          if (selectedJob) {
            await handleDeleteJob(selectedJob.uuid);
            setSelectedJob(null);
            setDeleteModalOpen(false);
          }
        }}
        onCancel={() => {
          setSelectedJob(null);
          setDeleteModalOpen(false);
        }}
      />
    </div>
  );
}