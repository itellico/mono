'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  MoreHorizontal,
  Star,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { AdminListPage, type StatCard, type ColumnConfig, type FilterConfig, type BulkAction } from '@/components/admin/AdminListPage';
import { ConfirmationModal } from '@/components/admin/shared/ConfirmationModal';
import { toast } from 'sonner';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { PermissionGate } from '@/components/auth/PermissionGate';

interface JobData {
  id: string;
  uuid: string;
  title: string;
  company: string;
  status: string;
  applicationsCount: number;
  createdAt: string;
}

interface ApplicationData {
  id: string;
  uuid: string;
  applicantName: string;
  applicantEmail: string;
  applicantAvatar?: string;
  status: string;
  coverLetter?: string;
  portfolio?: string[];
  proposedRate?: string;
  experience: string;
  availability: string;
  appliedAt: string;
  viewedAt?: string;
  rating?: number;
}

interface ApplicationsResponse {
  applications: ApplicationData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface JobApplicationsClientProps {
  jobData: JobData;
  initialApplicationsData: ApplicationsResponse;
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
  experience: string[];
  availability: string[];
}

export function JobApplicationsClient({ 
  jobData,
  initialApplicationsData,
  userContext 
}: JobApplicationsClientProps) {
  const router = useRouter();
  const { trackClick, trackView } = useAuditTracking();

  const [filters, setFilters] = React.useState<ExtendedFilters>({
    page: 1,
    limit: 20,
    search: '',
    status: [],
    experience: [],
    availability: []
  });

  const [sortConfig, setSortConfig] = React.useState<{
    column: string;
    direction: 'asc' | 'desc' | null;
  }>({ column: 'appliedAt', direction: 'desc' });

  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({
    applicant: true,
    status: true,
    experience: true,
    proposed_rate: true,
    availability: true,
    applied_date: true,
    rating: true
  });

  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set());
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = React.useState(false);
  const [selectedApplication, setSelectedApplication] = React.useState<ApplicationData | null>(null);
  const [newStatus, setNewStatus] = React.useState<string>('');

  // Mock applications data
  const mockApplications: ApplicationData[] = [
    {
      id: '1',
      uuid: 'app-1-uuid',
      applicantName: 'Sarah Johnson',
      applicantEmail: 'sarah.johnson@email.com',
      applicantAvatar: '',
      status: 'pending',
      coverLetter: 'I am passionate about fashion and have 5 years of modeling experience...',
      portfolio: ['photo1.jpg', 'photo2.jpg'],
      proposedRate: '$2,500/day',
      experience: '5+ years',
      availability: 'Immediately',
      appliedAt: '2024-01-16T09:30:00Z',
      rating: 4
    },
    {
      id: '2',
      uuid: 'app-2-uuid',
      applicantName: 'Michael Chen',
      applicantEmail: 'michael.chen@email.com',
      status: 'reviewing',
      coverLetter: 'With extensive experience in commercial photography...',
      proposedRate: '$3,000/day',
      experience: '8+ years',
      availability: 'March 2024',
      appliedAt: '2024-01-15T14:20:00Z',
      viewedAt: '2024-01-16T10:00:00Z',
      rating: 5
    },
    {
      id: '3',
      uuid: 'app-3-uuid',
      applicantName: 'Emma Rodriguez',
      applicantEmail: 'emma.rodriguez@email.com',
      status: 'shortlisted',
      coverLetter: 'I specialize in high-fashion editorial work...',
      proposedRate: '$2,200/day',
      experience: '3-5 years',
      availability: 'February 2024',
      appliedAt: '2024-01-14T11:15:00Z',
      viewedAt: '2024-01-15T09:00:00Z',
      rating: 4
    }
  ];

  // Transform data
  const tableData: ApplicationData[] = React.useMemo(() => {
    let data = mockApplications;
    
    // Apply client-side sorting
    if (sortConfig.direction && sortConfig.column) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.column as keyof ApplicationData];
        const bValue = b[sortConfig.column as keyof ApplicationData];
        
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
    const applications = mockApplications;
    return {
      total: applications.length,
      pending: applications.filter(a => a.status === 'pending').length,
      reviewing: applications.filter(a => a.status === 'reviewing').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      avgRating: applications.reduce((sum, a) => sum + (a.rating || 0), 0) / applications.length || 0
    };
  }, []);

  const pagination = React.useMemo(() => ({
    page: filters.page,
    limit: filters.limit,
    total: mockApplications.length,
    totalPages: Math.ceil(mockApplications.length / filters.limit)
  }), [filters.page, filters.limit]);

  // Filter options
  const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Reviewing', value: 'reviewing' },
    { label: 'Shortlisted', value: 'shortlisted' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Accepted', value: 'accepted' }
  ];

  const experienceOptions = [
    { label: 'Entry Level', value: 'entry' },
    { label: '1-3 years', value: '1-3' },
    { label: '3-5 years', value: '3-5' },
    { label: '5+ years', value: '5+' },
    { label: '8+ years', value: '8+' }
  ];

  const availabilityOptions = [
    { label: 'Immediately', value: 'immediately' },
    { label: 'This Month', value: 'this-month' },
    { label: 'Next Month', value: 'next-month' },
    { label: 'Flexible', value: 'flexible' }
  ];

  // Statistics cards
  const statsCards: StatCard[] = [
    {
      title: 'Total Applications',
      value: stats.total,
      description: 'Applications received',
      icon: <Users className="h-4 w-4" />
    },
    {
      title: 'Pending Review',
      value: stats.pending,
      description: 'Awaiting review',
      icon: <Clock className="h-4 w-4" />
    },
    {
      title: 'Shortlisted',
      value: stats.shortlisted,
      description: 'Selected candidates',
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      title: 'Avg Rating',
      value: stats.avgRating.toFixed(1),
      description: 'Average candidate rating',
      icon: <Star className="h-4 w-4" />
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
      key: 'experience',
      title: 'Experience',
      type: 'multiSelect',
      options: experienceOptions
    },
    {
      key: 'availability',
      title: 'Availability',
      type: 'multiSelect',
      options: availabilityOptions
    }
  ];

  // Column configuration
  const columns: ColumnConfig<ApplicationData>[] = [
    {
      key: 'applicantName',
      title: 'Applicant',
      sortable: true,
      hideable: false,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.applicantAvatar} />
            <AvatarFallback>
              {row.applicantName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{value as string}</div>
            <div className="text-sm text-muted-foreground">{row.applicantEmail}</div>
          </div>
        </div>
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
          pending: 'secondary',
          reviewing: 'default',
          shortlisted: 'default',
          rejected: 'destructive',
          accepted: 'default'
        };
        return (
          <Badge variant={variants[status as keyof typeof variants] as any}>
            {status}
          </Badge>
        );
      }
    },
    {
      key: 'experience',
      title: 'Experience',
      sortable: false,
      hideable: true,
      render: (value) => (
        <span className="text-sm">{value as string}</span>
      )
    },
    {
      key: 'proposedRate',
      title: 'Proposed Rate',
      sortable: false,
      hideable: true,
      render: (value) => (
        <span className="text-sm font-medium">{value as string}</span>
      )
    },
    {
      key: 'availability',
      title: 'Availability',
      sortable: false,
      hideable: true,
      render: (value) => (
        <span className="text-sm">{value as string}</span>
      )
    },
    {
      key: 'appliedAt',
      title: 'Applied Date',
      sortable: true,
      hideable: true,
      render: (value) => new Date(value as string).toLocaleDateString()
    },
    {
      key: 'rating',
      title: 'Rating',
      sortable: true,
      hideable: true,
      render: (value) => (
        <div className="flex items-center space-x-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span className="text-sm">{value || 'N/A'}</span>
        </div>
      )
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
      experience: [],
      availability: [],
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

  // Application actions
  const handleApplicationAction = (action: string, applicationId: string) => {
    browserLogger.userAction('admin_application_action', `${action} on application ${applicationId}`);
    
    const application = tableData.find(a => a.uuid === applicationId);
    
    switch (action) {
      case 'view':
        router.push(`/admin/jobs/${jobData.uuid}/applications/${applicationId}`);
        break;
      case 'approve':
        handleStatusUpdate(applicationId, 'accepted');
        break;
      case 'reject':
        handleStatusUpdate(applicationId, 'rejected');
        break;
      case 'shortlist':
        handleStatusUpdate(applicationId, 'shortlisted');
        break;
      case 'contact':
        // TODO: Implement contact functionality
        toast.info('Contact feature coming soon');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleStatusUpdate = async (applicationId: string, status: string) => {
    try {
      toast.loading('Updating application status...');
      
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.dismiss();
      toast.success(`Application ${status} successfully`);
      browserLogger.userAction('admin_application_status_update', `Updated application ${applicationId} to ${status}`);
      
      // TODO: Refresh data
    } catch (err: any) {
      toast.dismiss();
      toast.error('Failed to update status: ' + err.message);
      browserLogger.error('admin_application_status_update_failed', { applicationId, status, error: err.message });
    }
  };

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      key: 'shortlist',
      label: 'Shortlist',
      variant: 'outline',
      permission: { action: 'update', resource: 'applications' },
      onClick: (selectedIds) => {
        toast.info(`Shortlisting ${selectedIds.size} applications...`);
      }
    },
    {
      key: 'reject',
      label: 'Reject',
      variant: 'destructive',
      permission: { action: 'update', resource: 'applications' },
      onClick: (selectedIds) => {
        toast.info(`Rejecting ${selectedIds.size} applications...`);
      }
    },
    {
      key: 'export',
      label: 'Export CSV',
      variant: 'outline',
      permission: { action: 'read', resource: 'applications' },
      onClick: (selectedIds) => {
        toast.info(`Exporting ${selectedIds.size} applications...`);
      }
    }
  ];

  // Row actions renderer
  const renderRowActions = (application: ApplicationData) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleApplicationAction('view', application.uuid)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleApplicationAction('contact', application.uuid)}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Contact Applicant
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <PermissionGate permissions={['applications.update']}>
          <DropdownMenuItem onClick={() => handleApplicationAction('shortlist', application.uuid)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Shortlist
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleApplicationAction('reject', application.uuid)}
            className="text-destructive"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </DropdownMenuItem>
        </PermissionGate>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Active filters
  const activeFilters = {
    status: filters.status,
    experience: filters.experience,
    availability: filters.availability
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header with Job Info */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/admin/jobs')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{jobData.title}</h1>
          <p className="text-muted-foreground">
            {jobData.company} • {stats.total} applications
          </p>
        </div>
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

      {/* Applications Table */}
      <AdminListPage<ApplicationData>
        statsCards={[]}
        addConfig={undefined}
        searchConfig={{
          placeholder: "Search applicants by name or email...",
          value: filters.search,
          suggestions: [],
          onChange: handleSearchChange
        }}
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        savedSearchConfig={{
          entityType: 'applications',
          enabled: false,
          activeSearchName: '',
          onLoadSearch: () => {},
          onSaveSearch: async () => {},
          canSave: false,
          canLoad: false
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
        onRowClick={(application) => {
          handleApplicationAction('view', application.uuid);
          browserLogger.info('Navigating to application details', { 
            applicationId: application.uuid,
            userRole: userContext.adminRole
          });
        }}
        renderRowActions={renderRowActions}
        userContext={userContext}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
      />
    </div>
  );
}