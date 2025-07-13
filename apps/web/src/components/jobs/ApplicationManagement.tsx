'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Star,
  Clock,
  Calendar,
  MapPin,
  Briefcase,
  Eye,
  MessageSquare,
  MoreVertical,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Mail,
  Phone,
  FileText,
  Image,
  ExternalLink,
  Search,
  SortAsc,
  SortDesc,
  Calendar as CalendarIcon,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  AlertTriangle,
  Crown,
  Award,
  Bookmark,
  Flag,
  Archive,
  Trash2,
  Send,
  Ban,
  CheckCheck,
  Zap,
  Heart,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ApplicationManagementProps {
  /**
   * Current user type (for permission checks)
   */
  userType: 'client' | 'talent' | 'agency';
  /**
   * Job ID if viewing applications for specific job
   */
  jobId?: string;
  /**
   * Whether to show bulk actions
   * @default true
   */
  showBulkActions?: boolean;
  /**
   * Items per page
   * @default 10
   */
  itemsPerPage?: number;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when application status changes
   */
  onStatusChange?: (applicationId: string, status: ApplicationStatus) => void;
  /**
   * Callback when message is sent
   */
  onSendMessage?: (applicationId: string, message: string) => void;
  /**
   * Callback when interview is scheduled
   */
  onScheduleInterview?: (applicationId: string, interview: InterviewDetails) => void;
}

enum ApplicationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEWED = 'interviewed',
  SELECTED = 'selected',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  HIRED = 'hired'
}

interface JobApplication {
  id: string;
  job: {
    id: string;
    title: string;
    category: string;
    client: string;
    deadline: Date;
    status: 'active' | 'closed' | 'filled';
  };
  applicant: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    verified: boolean;
    rating: number;
    level: 'new' | 'rising' | 'established' | 'top';
    location: string;
    responseTime: string;
    completedJobs: number;
    skills: string[];
  };
  application: {
    coverLetter?: string;
    portfolio: {
      images: string[];
      links: string[];
    };
    proposedRate?: {
      amount: number;
      currency: string;
      notes?: string;
    };
    availability: {
      confirmedDates: boolean;
      notes?: string;
    };
    answers: {
      questionId: string;
      question: string;
      answer: string;
    }[];
  };
  status: ApplicationStatus;
  submittedAt: Date;
  lastActivity: Date;
  notes?: string;
  rating?: number;
  flags: {
    priority: boolean;
    archived: boolean;
    flagged: boolean;
  };
  communication: {
    unreadMessages: number;
    lastMessage?: Date;
    interviewScheduled?: {
      date: Date;
      type: 'phone' | 'video' | 'in_person';
      location?: string;
      notes?: string;
    };
  };
  matchScore?: number;
}

interface InterviewDetails {
  date: Date;
  type: 'phone' | 'video' | 'in_person';
  location?: string;
  notes?: string;
}

// Mock data
const mockApplications: JobApplication[] = [
  {
    id: '1',
    job: {
      id: 'job-1',
      title: 'Fashion Editorial Shoot - NYC Magazine',
      category: 'Editorial Photography',
      client: 'NYC Fashion Magazine',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    applicant: {
      id: 'user-1',
      name: 'Emma Thompson',
      username: 'emma_model',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      verified: true,
      rating: 4.9,
      level: 'established',
      location: 'New York, NY',
      responseTime: '2 hours',
      completedJobs: 78,
      skills: ['Editorial', 'Fashion', 'Runway', 'Commercial']
    },
    application: {
      coverLetter: 'I am excited to apply for this editorial shoot. My experience in high fashion and editorial work makes me a perfect fit for this opportunity. I have worked with several major publications and have a strong portfolio of editorial work.',
      portfolio: {
        images: [
          'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'
        ],
        links: ['https://portfolio.emma-model.com', 'https://instagram.com/emma_model']
      },
      proposedRate: {
        amount: 1200,
        currency: 'USD',
        notes: 'Rate includes styling consultation and social media usage rights'
      },
      availability: {
        confirmedDates: true,
        notes: 'Available all dates mentioned, with 2 days notice preferred'
      },
      answers: [
        {
          questionId: '1',
          question: 'What is your experience with editorial photography?',
          answer: 'I have over 5 years of experience in editorial photography, having worked with Vogue, Harper\'s Bazaar, and Elle. I\'m comfortable with both studio and location shoots.'
        }
      ]
    },
    status: ApplicationStatus.SHORTLISTED,
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000),
    rating: 5,
    flags: {
      priority: true,
      archived: false,
      flagged: false
    },
    communication: {
      unreadMessages: 2,
      lastMessage: new Date(Date.now() - 3 * 60 * 60 * 1000),
      interviewScheduled: {
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        type: 'video',
        notes: 'Portfolio review and project discussion'
      }
    },
    matchScore: 98
  },
  {
    id: '2',
    job: {
      id: 'job-2',
      title: 'Commercial Beauty Campaign',
      category: 'Commercial Photography',
      client: 'Bella Cosmetics',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    applicant: {
      id: 'user-2',
      name: 'Sofia Rodriguez',
      username: 'sofia_beauty',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
      verified: false,
      rating: 4.6,
      level: 'rising',
      location: 'Los Angeles, CA',
      responseTime: '4 hours',
      completedJobs: 23,
      skills: ['Beauty', 'Commercial', 'Portrait', 'Lifestyle']
    },
    application: {
      coverLetter: 'I would love to be part of your beauty campaign. My natural look and experience with beauty photography would be perfect for your brand aesthetic.',
      portfolio: {
        images: [
          'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400'
        ],
        links: ['https://instagram.com/sofia_beauty']
      },
      availability: {
        confirmedDates: true
      },
      answers: []
    },
    status: ApplicationStatus.UNDER_REVIEW,
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000),
    flags: {
      priority: false,
      archived: false,
      flagged: false
    },
    communication: {
      unreadMessages: 0
    },
    matchScore: 85
  },
  {
    id: '3',
    job: {
      id: 'job-1',
      title: 'Fashion Editorial Shoot - NYC Magazine',
      category: 'Editorial Photography',
      client: 'NYC Fashion Magazine',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    applicant: {
      id: 'user-3',
      name: 'Marcus Johnson',
      username: 'marcus_fashion',
      verified: true,
      rating: 4.7,
      level: 'established',
      location: 'Brooklyn, NY',
      responseTime: '1 hour',
      completedJobs: 156,
      skills: ['Fashion', 'Male Model', 'Editorial', 'Streetwear']
    },
    application: {
      coverLetter: 'Professional male model with extensive editorial experience. Available for the dates mentioned.',
      portfolio: {
        images: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
        ],
        links: ['https://portfolio.marcus-fashion.com']
      },
      availability: {
        confirmedDates: true
      },
      answers: []
    },
    status: ApplicationStatus.PENDING,
    submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 8 * 60 * 60 * 1000),
    flags: {
      priority: false,
      archived: false,
      flagged: false
    },
    communication: {
      unreadMessages: 0
    },
    matchScore: 92
  }
];

export function ApplicationManagement({
  userType,
  jobId,
  showBulkActions = true,
  itemsPerPage = 10,
  className,
  onStatusChange,
  onSendMessage,
  onScheduleInterview
}: ApplicationManagementProps) {
  const [applications, setApplications] = useState<JobApplication[]>(mockApplications);
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterJob, setFilterJob] = useState<string>(jobId || 'all');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [interviewDetails, setInterviewDetails] = useState<InterviewDetails>({
    date: new Date(),
    type: 'video'
  });

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    let filtered = [...applications];

    // Filter by job
    if (filterJob !== 'all') {
      filtered = filtered.filter(app => app.job.id === filterJob);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a;
      let bValue: any = b;

      // Navigate to nested properties
      const sortPath = sortBy.split('.');
      for (const key of sortPath) {
        aValue = aValue?.[key];
        bValue = bValue?.[key];
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return filtered;
  }, [applications, filterJob, filterStatus, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status statistics
  const statusStats = useMemo(() => {
    const stats = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  }, [applications]);

  // Handle status change
  const handleStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId 
        ? { ...app, status: newStatus, lastActivity: new Date() }
        : app
    ));
    onStatusChange?.(applicationId, newStatus);
    toast.success(`Application ${newStatus.replace('_', ' ')}`);
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    const selectedIds = Array.from(selectedApplications);
    
    switch (action) {
      case 'shortlist':
        selectedIds.forEach(id => handleStatusChange(id, ApplicationStatus.SHORTLISTED));
        break;
      case 'reject':
        selectedIds.forEach(id => handleStatusChange(id, ApplicationStatus.REJECTED));
        break;
      case 'archive':
        setApplications(prev => prev.map(app => 
          selectedIds.includes(app.id) 
            ? { ...app, flags: { ...app.flags, archived: true } }
            : app
        ));
        break;
    }
    
    setSelectedApplications(new Set());
    setShowBulkDialog(false);
    toast.success(`Bulk action "${action}" applied to ${selectedIds.length} applications`);
  };

  // Get status color
  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case ApplicationStatus.UNDER_REVIEW:
        return 'bg-blue-100 text-blue-800';
      case ApplicationStatus.SHORTLISTED:
        return 'bg-purple-100 text-purple-800';
      case ApplicationStatus.INTERVIEW_SCHEDULED:
        return 'bg-orange-100 text-orange-800';
      case ApplicationStatus.SELECTED:
        return 'bg-green-100 text-green-800';
      case ApplicationStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case ApplicationStatus.HIRED:
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get level badge
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'new':
        return <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />New</Badge>;
      case 'rising':
        return <Badge variant="secondary"><TrendingUp className="h-3 w-3 mr-1" />Rising</Badge>;
      case 'established':
        return <Badge variant="secondary"><Award className="h-3 w-3 mr-1" />Established</Badge>;
      case 'top':
        return <Badge variant="default"><Crown className="h-3 w-3 mr-1" />Top</Badge>;
      default:
        return null;
    }
  };

  const renderApplicationCard = (application: JobApplication) => (
    <Card key={application.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {showBulkActions && userType === 'client' && (
              <input
                type="checkbox"
                checked={selectedApplications.has(application.id)}
                onChange={(e) => {
                  const newSet = new Set(selectedApplications);
                  if (e.target.checked) {
                    newSet.add(application.id);
                  } else {
                    newSet.delete(application.id);
                  }
                  setSelectedApplications(newSet);
                }}
                className="mt-1"
              />
            )}
            <Avatar className="h-12 w-12">
              <AvatarImage src={application.applicant.avatar} />
              <AvatarFallback>{application.applicant.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{application.applicant.name}</h3>
                {application.applicant.verified && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
                {getLevelBadge(application.applicant.level)}
                {application.flags.priority && (
                  <Badge variant="destructive">
                    <Flag className="h-3 w-3 mr-1" />
                    Priority
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                @{application.applicant.username} • {application.applicant.location}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{application.applicant.rating}</span>
                </div>
                <span>{application.applicant.completedJobs} jobs</span>
                <span>{application.applicant.responseTime} response</span>
                {application.matchScore && (
                  <Badge variant="outline">
                    {application.matchScore}% match
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(application.status)}>
              {application.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {application.communication.unreadMessages > 0 && (
              <Badge variant="destructive">
                {application.communication.unreadMessages} new
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedApplication(application)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedApplication(application);
                  setShowMessageDialog(true);
                }}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </DropdownMenuItem>
                {userType === 'client' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(application.id, ApplicationStatus.SHORTLISTED)}
                      disabled={application.status === ApplicationStatus.SHORTLISTED}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Shortlist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedApplication(application);
                      setShowInterviewDialog(true);
                    }}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Interview
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(application.id, ApplicationStatus.REJECTED)}
                      className="text-destructive"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Job info */}
        <div className="mb-3">
          <h4 className="font-medium text-sm">{application.job.title}</h4>
          <p className="text-xs text-muted-foreground">{application.job.client} • {application.job.category}</p>
        </div>

        {/* Application details */}
        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
          <div>
            <p className="text-muted-foreground">Applied</p>
            <p className="font-medium">{formatDistanceToNow(application.submittedAt)} ago</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last Activity</p>
            <p className="font-medium">{formatDistanceToNow(application.lastActivity)} ago</p>
          </div>
          {application.application.proposedRate && (
            <div>
              <p className="text-muted-foreground">Proposed Rate</p>
              <p className="font-medium">
                ${application.application.proposedRate.amount} {application.application.proposedRate.currency}
              </p>
            </div>
          )}
        </div>

        {/* Cover letter preview */}
        {application.application.coverLetter && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Cover Letter:</p>
            <p className="text-sm line-clamp-2">{application.application.coverLetter}</p>
          </div>
        )}

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {application.applicant.skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {application.applicant.skills.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{application.applicant.skills.length - 4} more
            </Badge>
          )}
        </div>

        {/* Interview info */}
        {application.communication.interviewScheduled && (
          <div className="bg-blue-50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Interview Scheduled</span>
            </div>
            <p className="text-sm text-blue-700">
              {format(application.communication.interviewScheduled.date, 'MMM d, yyyy h:mm a')} •{' '}
              {application.communication.interviewScheduled.type}
            </p>
          </div>
        )}

        {/* Quick actions */}
        {userType === 'client' && (
          <div className="flex gap-2">
            {application.status === ApplicationStatus.PENDING && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(application.id, ApplicationStatus.SHORTLISTED)}
                >
                  <UserCheck className="h-3 w-3 mr-1" />
                  Shortlist
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange(application.id, ApplicationStatus.REJECTED)}
                >
                  <UserX className="h-3 w-3 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {application.status === ApplicationStatus.SHORTLISTED && (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedApplication(application);
                  setShowInterviewDialog(true);
                }}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Schedule Interview
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedApplication(application);
                setShowMessageDialog(true);
              }}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Message
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {userType === 'client' ? 'Application Management' : 'My Applications'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userType === 'client' 
              ? 'Review and manage job applications'
              : 'Track your job applications and their status'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {showBulkActions && selectedApplications.size > 0 && userType === 'client' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  Bulk Actions ({selectedApplications.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  setBulkAction('shortlist');
                  setShowBulkDialog(true);
                }}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Shortlist Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setBulkAction('reject');
                  setShowBulkDialog(true);
                }}>
                  <UserX className="h-4 w-4 mr-2" />
                  Reject Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setBulkAction('archive');
                  setShowBulkDialog(true);
                }}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(statusStats).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {status.replace('_', ' ')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and sorting */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label>Status:</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!jobId && (
              <div className="flex items-center gap-2">
                <Label>Job:</Label>
                <Select value={filterJob} onValueChange={setFilterJob}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {Array.from(new Set(applications.map(app => app.job.id))).map(jobId => {
                      const job = applications.find(app => app.job.id === jobId)?.job;
                      return job ? (
                        <SelectItem key={jobId} value={jobId}>
                          {job.title}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Label>Sort by:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submittedAt">Date Applied</SelectItem>
                  <SelectItem value="lastActivity">Last Activity</SelectItem>
                  <SelectItem value="applicant.rating">Rating</SelectItem>
                  <SelectItem value="matchScore">Match Score</SelectItem>
                  <SelectItem value="applicant.name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications list */}
      <div>
        {paginatedApplications.map(renderApplicationCard)}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Application details dialog */}
      {selectedApplication && !showMessageDialog && !showInterviewDialog && (
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedApplication.applicant.avatar} />
                  <AvatarFallback>{selectedApplication.applicant.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl">{selectedApplication.applicant.name}</DialogTitle>
                  <DialogDescription>
                    Application for {selectedApplication.job.title}
                  </DialogDescription>
                </div>
              </div>
              <Badge className={getStatusColor(selectedApplication.status)}>
                {selectedApplication.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </DialogHeader>

            <Tabs defaultValue="application">
              <TabsList>
                <TabsTrigger value="application">Application</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>

              <TabsContent value="application" className="space-y-4">
                {selectedApplication.application.coverLetter && (
                  <div>
                    <h4 className="font-semibold mb-2">Cover Letter</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedApplication.application.coverLetter}
                    </p>
                  </div>
                )}

                {selectedApplication.application.proposedRate && (
                  <div>
                    <h4 className="font-semibold mb-2">Proposed Rate</h4>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="font-medium">
                        ${selectedApplication.application.proposedRate.amount} {selectedApplication.application.proposedRate.currency}
                      </p>
                      {selectedApplication.application.proposedRate.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedApplication.application.proposedRate.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedApplication.application.answers.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Question Responses</h4>
                    <div className="space-y-3">
                      {selectedApplication.application.answers.map((answer, index) => (
                        <div key={index} className="bg-muted rounded-lg p-3">
                          <p className="font-medium text-sm mb-1">{answer.question}</p>
                          <p className="text-sm">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-4">
                {selectedApplication.application.portfolio.images.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Portfolio Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedApplication.application.portfolio.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedApplication.application.portfolio.links.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Portfolio Links</h4>
                    <div className="space-y-2">
                      {selectedApplication.application.portfolio.links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Basic Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Username:</span>
                        <span>@{selectedApplication.applicant.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{selectedApplication.applicant.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rating:</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {selectedApplication.applicant.rating}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Level:</span>
                        <span className="capitalize">{selectedApplication.applicant.level}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Experience</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed Jobs:</span>
                        <span>{selectedApplication.applicant.completedJobs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Response Time:</span>
                        <span>{selectedApplication.applicant.responseTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Verified:</span>
                        <span>{selectedApplication.applicant.verified ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.applicant.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Communication history will be displayed here</p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                Close
              </Button>
              {userType === 'client' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMessageDialog(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  {selectedApplication.status !== ApplicationStatus.REJECTED && (
                    <Button
                      onClick={() => handleStatusChange(selectedApplication.id, ApplicationStatus.SHORTLISTED)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Shortlist
                    </Button>
                  )}
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Message dialog */}
      {showMessageDialog && selectedApplication && (
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to {selectedApplication.applicant.name}
              </DialogDescription>
            </DialogHeader>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowMessageDialog(false);
                setMessageText('');
              }}>
                Cancel
              </Button>
              <Button onClick={() => {
                onSendMessage?.(selectedApplication.id, messageText);
                setShowMessageDialog(false);
                setMessageText('');
                toast.success('Message sent successfully');
              }}>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Interview dialog */}
      {showInterviewDialog && selectedApplication && (
        <Dialog open={showInterviewDialog} onOpenChange={setShowInterviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
              <DialogDescription>
                Schedule an interview with {selectedApplication.applicant.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Interview Type</Label>
                <Select
                  value={interviewDetails.type}
                  onValueChange={(value) => setInterviewDetails({
                    ...interviewDetails,
                    type: value as any
                  })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={interviewDetails.notes || ''}
                  onChange={(e) => setInterviewDetails({
                    ...interviewDetails,
                    notes: e.target.value
                  })}
                  placeholder="Interview agenda, preparation notes, etc..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInterviewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                onScheduleInterview?.(selectedApplication.id, interviewDetails);
                handleStatusChange(selectedApplication.id, ApplicationStatus.INTERVIEW_SCHEDULED);
                setShowInterviewDialog(false);
                toast.success('Interview scheduled successfully');
              }}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Interview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk action confirmation */}
      {showBulkDialog && (
        <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to {bulkAction} {selectedApplications.size} selected applications?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleBulkAction(bulkAction)}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default ApplicationManagement;