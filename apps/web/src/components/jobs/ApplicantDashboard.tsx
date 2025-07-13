'use client';

/**
 * Applicant Dashboard Component
 * 
 * Allows users to track their job applications, view status updates,
 * and manage their application history.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  BriefcaseIcon, 
  CalendarIcon, 
  DollarSignIcon, 
  MapPinIcon, 
  ClockIcon,
  SearchIcon,
  FilterIcon,
  MessageCircleIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  Clock3Icon,
  PlusCircleIcon,
  TrendingUpIcon,
  StarIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobApplication {
  id: number;
  jobPosting: {
    id: number;
    uuid: string;
    title: string;
    companyName?: string;
    type: string;
    category: string;
    compensation: {
      type: string;
      amount?: number;
      currency?: string;
      description?: string;
    };
    applicationDeadline: string;
    location?: string;
  };
  status: 'submitted' | 'under_review' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
  appliedAt: string;
  coverLetter?: string;
  proposedRate?: {
    amount: number;
    currency: string;
    type: string;
  };
  lastUpdated: string;
  notes?: string;
  employer: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  responses?: Array<{
    message: string;
    createdAt: string;
    fromEmployer: boolean;
  }>;
}

interface ApplicantStats {
  totalApplications: number;
  activeApplications: number;
  interviewRequests: number;
  offers: number;
  responseRate: number;
  avgResponseTime: number; // in days
}

interface ApplicantDashboardProps {
  applications: JobApplication[];
  stats: ApplicantStats;
  onViewJob: (jobId: string) => void;
  onWithdrawApplication: (applicationId: number) => void;
  onMessageEmployer: (applicationId: number) => void;
  onViewApplication: (applicationId: number) => void;
  className?: string;
}

export function ApplicantDashboard({
  applications,
  stats,
  onViewJob,
  onWithdrawApplication,
  onMessageEmployer,
  onViewApplication,
  className
}: ApplicantDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('appliedAt');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-500';
      case 'under_review':
        return 'bg-yellow-500';
      case 'interviewing':
        return 'bg-purple-500';
      case 'offered':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'withdrawn':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <PlusCircleIcon className="h-4 w-4" />;
      case 'under_review':
        return <EyeIcon className="h-4 w-4" />;
      case 'interviewing':
        return <MessageCircleIcon className="h-4 w-4" />;
      case 'offered':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      case 'withdrawn':
        return <Clock3Icon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = searchTerm === '' || 
        app.jobPosting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobPosting.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'appliedAt':
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        case 'lastUpdated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'deadline':
          return new Date(a.jobPosting.applicationDeadline).getTime() - new Date(b.jobPosting.applicationDeadline).getTime();
        default:
          return 0;
      }
    });

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground">
          Track your job applications and manage your opportunities
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              All time applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeApplications}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Requests</CardTitle>
            <MessageCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interviewRequests}</div>
            <p className="text-xs text-muted-foreground">
              Pending interviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <StarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <p className="text-xs text-muted-foreground">
              Avg response time: {stats.avgResponseTime} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2 flex-1">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="interviewing">Interviewing</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appliedAt">Applied Date</SelectItem>
                  <SelectItem value="lastUpdated">Last Updated</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="board">Board View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BriefcaseIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No applications found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Start applying to jobs to see them here'
                    }
                  </p>
                  <Button onClick={() => onViewJob('')}>Browse Jobs</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 
                            className="font-medium text-lg cursor-pointer hover:text-primary"
                            onClick={() => onViewJob(application.jobPosting.uuid)}
                          >
                            {application.jobPosting.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{application.jobPosting.companyName || 'Company'}</span>
                            <Badge variant="outline">{application.jobPosting.type}</Badge>
                            <Badge variant="outline">{application.jobPosting.category}</Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-white', getStatusColor(application.status))}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1">{formatStatus(application.status)}</span>
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          Applied {getTimeAgo(application.appliedAt)}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4 text-muted-foreground" />
                          Updated {getTimeAgo(application.lastUpdated)}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                          {application.jobPosting.compensation.amount 
                            ? `${application.jobPosting.compensation.currency || '$'}${application.jobPosting.compensation.amount}`
                            : 'Negotiable'
                          }
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          Deadline: {new Date(application.jobPosting.applicationDeadline).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Employer */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={application.employer.avatar} />
                          <AvatarFallback className="text-xs">
                            {application.employer.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {application.employer.name}
                        </span>
                        {application.employer.verified && (
                          <Badge variant="outline" className="h-5 text-xs">Verified</Badge>
                        )}
                      </div>

                      {/* Recent Response */}
                      {application.responses && application.responses.length > 0 && (
                        <Alert>
                          <MessageCircleIcon className="h-4 w-4" />
                          <AlertDescription>
                            Latest message: {application.responses[application.responses.length - 1].message.substring(0, 100)}...
                            <span className="text-xs text-muted-foreground ml-2">
                              {getTimeAgo(application.responses[application.responses.length - 1].createdAt)}
                            </span>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewApplication(application.id)}
                      >
                        View Details
                      </Button>
                      
                      {(application.status === 'submitted' || application.status === 'under_review') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMessageEmployer(application.id)}
                        >
                          <MessageCircleIcon className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      )}
                      
                      {application.status !== 'rejected' && application.status !== 'withdrawn' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onWithdrawApplication(application.id)}
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="board">
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {['submitted', 'under_review', 'interviewing', 'offered'].map((status) => (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(status)}
                    {formatStatus(status)}
                    <Badge variant="secondary" className="ml-auto">
                      {filteredApplications.filter(app => app.status === status).length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredApplications
                    .filter(app => app.status === status)
                    .map((application) => (
                      <Card key={application.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                          <h4 className="font-medium text-sm mb-1">
                            {application.jobPosting.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {application.jobPosting.companyName}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Applied {getTimeAgo(application.appliedAt)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ApplicantDashboard;