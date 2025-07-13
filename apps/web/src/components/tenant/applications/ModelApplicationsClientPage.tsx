/**
 * Model Applications Client Page Component
 * 
 * Main interface for managing model applications and talent database.
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminListPage } from '@/components/admin/AdminListPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Eye, Check, X, Star, Users, TrendingUp, Clock, 
  User, MapPin, Ruler, Calendar, Mail, Phone
} from 'lucide-react';
import Link from 'next/link';

interface ModelApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'on-hold';
  submittedAt: string;
  profileImage?: string;
  experience: string;
  age: number;
  height: number;
  weight?: number;
  location: string;
  bio?: string;
  specialties: string[];
  rating?: number;
  lastActive: string;
  isVerified: boolean;
  portfolioCount: number;
  applicationCount: number;
}

interface Stats {
  totalApplications: number;
  pendingReview: number;
  approvedModels: number;
  thisMonthApplications: number;
}

export function ModelApplicationsClientPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('applications');
  const [filters, setFilters] = useState({
    status: '',
    experience: '',
    location: '',
    specialty: '',
  });

  // Fetch applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['model-applications', filters, searchTerm, activeTab],
    queryFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockApplications: ModelApplication[] = [
        {
          id: '1',
          applicantName: 'Sophie Martin',
          applicantEmail: 'sophie.martin@email.com',
          applicantPhone: '+33 1 23 45 67 89',
          status: 'pending',
          submittedAt: '2024-01-18T14:30:00Z',
          profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b6b7f2d3?w=150&h=150&fit=crop&crop=face',
          experience: 'professional',
          age: 24,
          height: 178,
          weight: 58,
          location: 'Paris, France',
          bio: 'Professional runway model with 5+ years experience in high fashion.',
          specialties: ['Runway', 'Editorial', 'High Fashion'],
          rating: 4.8,
          lastActive: '2024-01-20T10:00:00Z',
          isVerified: true,
          portfolioCount: 45,
          applicationCount: 12
        },
        {
          id: '2',
          applicantName: 'Emma Johnson',
          applicantEmail: 'emma.j@email.com',
          applicantPhone: '+44 20 7123 4567',
          status: 'approved',
          submittedAt: '2024-01-17T09:15:00Z',
          profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
          experience: 'professional',
          age: 26,
          height: 180,
          weight: 60,
          location: 'London, UK',
          bio: 'International model specializing in editorial and commercial work.',
          specialties: ['Editorial', 'Commercial', 'Beauty'],
          rating: 4.6,
          lastActive: '2024-01-19T15:30:00Z',
          isVerified: true,
          portfolioCount: 67,
          applicationCount: 18
        },
        {
          id: '3',
          applicantName: 'Isabella Rodriguez',
          applicantEmail: 'isabella.r@email.com',
          status: 'reviewed',
          submittedAt: '2024-01-16T16:45:00Z',
          profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
          experience: 'intermediate',
          age: 22,
          height: 177,
          weight: 56,
          location: 'Madrid, Spain',
          bio: 'Rising star in the fashion world with unique editorial style.',
          specialties: ['Editorial', 'Alternative', 'Art'],
          rating: 4.9,
          lastActive: '2024-01-21T08:15:00Z',
          isVerified: false,
          portfolioCount: 23,
          applicationCount: 5
        },
        {
          id: '4',
          applicantName: 'Lucas Chen',
          applicantEmail: 'lucas.chen@email.com',
          status: 'pending',
          submittedAt: '2024-01-15T11:20:00Z',
          profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          experience: 'advanced',
          age: 28,
          height: 185,
          weight: 75,
          location: 'Tokyo, Japan',
          bio: 'Male model specializing in commercial and fitness photography.',
          specialties: ['Commercial', 'Fitness', 'Lifestyle'],
          rating: 4.4,
          lastActive: '2024-01-18T14:45:00Z',
          isVerified: true,
          portfolioCount: 34,
          applicationCount: 8
        }
      ];

      // Filter based on active tab
      let filteredApplications = mockApplications;
      if (activeTab === 'pending') {
        filteredApplications = mockApplications.filter(app => app.status === 'pending');
      } else if (activeTab === 'approved') {
        filteredApplications = mockApplications.filter(app => app.status === 'approved');
      }
      
      return filteredApplications.filter(app => 
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.specialties.some(specialty => specialty.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    },
    refetchInterval: 30000,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['model-applications-stats'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockStats: Stats = {
        totalApplications: 127,
        pendingReview: 23,
        approvedModels: 89,
        thisMonthApplications: 15
      };
      
      return mockStats;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'on-hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'reviewed', label: 'Reviewed' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'on-hold', label: 'On Hold' }
      ]
    },
    {
      key: 'experience',
      label: 'Experience',
      options: [
        { value: '', label: 'All Levels' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
        { value: 'professional', label: 'Professional' }
      ]
    },
    {
      key: 'specialty',
      label: 'Specialty',
      options: [
        { value: '', label: 'All Specialties' },
        { value: 'runway', label: 'Runway' },
        { value: 'editorial', label: 'Editorial' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'fitness', label: 'Fitness' },
        { value: 'beauty', label: 'Beauty' },
        { value: 'alternative', label: 'Alternative' }
      ]
    }
  ];

  const bulkActions = [
    { label: 'Approve Applications', value: 'approved' },
    { label: 'Mark as Reviewed', value: 'reviewed' },
    { label: 'Put on Hold', value: 'on-hold' },
    { label: 'Reject Applications', value: 'rejected' }
  ];

  const handleBulkAction = (action: string, selectedIds: string[]) => {
    console.log(`Performing ${action} on applications:`, selectedIds);
    // Implement bulk actions
  };

  const renderApplicationCard = (application: ModelApplication) => (
    <Card key={application.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={application.profileImage} alt={application.applicantName} />
              <AvatarFallback>
                {application.applicantName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{application.applicantName}</h3>
                {application.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{application.applicantEmail}</span>
              </div>
              
              {application.applicantPhone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{application.applicantPhone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{application.age} years</span>
                </div>
                <div className="flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  <span>{application.height}cm</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{application.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{application.experience}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {application.specialties.map((specialty) => (
                  <Badge key={specialty} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>

              {application.rating && (
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{application.rating}</span>
                  <span className="text-xs text-muted-foreground">
                    ({application.portfolioCount} portfolio items)
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <Badge className={getStatusColor(application.status)}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Applied {new Date(application.submittedAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {application.applicationCount} applications
              </p>
            </div>
          </div>
        </div>

        {application.bio && (
          <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
            {application.bio}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Link href={`/tenant/applications/${application.id}`}>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Application
              </Button>
            </Link>
            
            <Link href={`/tenant/models/${application.id}`}>
              <Button size="sm" variant="outline">
                <User className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </Link>
          </div>
          
          <div className="flex gap-2">
            {application.status === 'pending' && (
              <>
                <Button size="sm" variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Review
                </Button>
                <Button size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button size="sm" variant="destructive">
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            
            {application.status === 'reviewed' && (
              <>
                <Button size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button size="sm" variant="destructive">
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStatsCards = () => {
    if (!stats) return null;

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Models</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedModels}</div>
            <p className="text-xs text-muted-foreground">Active talent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthApplications}</div>
            <p className="text-xs text-muted-foreground">New applications</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const headerActions = (
    <div className="flex gap-2">
      <Link href="/tenant/models">
        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Browse Models
        </Button>
      </Link>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Invite Model
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderStatsCards()}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="applications">All Applications</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({stats?.pendingReview || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({stats?.approvedModels || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          <AdminListPage
            title=""
            description=""
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFiltersChange={setFilters}
            filterOptions={filterOptions}
            selectedItems={selectedApplications}
            onSelectionChange={setSelectedApplications}
            bulkActions={bulkActions}
            onBulkAction={handleBulkAction}
            headerActions={headerActions}
            isLoading={isLoading}
            showHeader={false}
          >
            <div className="space-y-4">
              {applications.map(renderApplicationCard)}
            </div>
            
            {applications.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No applications found
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {activeTab === 'pending' 
                    ? 'No pending applications to review.'
                    : activeTab === 'approved'
                    ? 'No approved models yet.'
                    : 'No applications match your current filters.'
                  }
                </p>
              </div>
            )}
          </AdminListPage>
        </TabsContent>
      </Tabs>
    </div>
  );
}