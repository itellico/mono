'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
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
  Target,
  TrendingUp,
  Users,
  Star,
  Clock,
  Calendar,
  DollarSign,
  MapPin,
  Briefcase,
  Heart,
  Eye,
  Send,
  MoreVertical,
  Filter,
  RefreshCw,
  Settings,
  Bell,
  BellOff,
  Zap,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Sparkles,
  Award,
  MessageSquare,
  Bookmark,
  Share2,
  Download,
  Upload,
  BarChart3,
  PieChart,
  Activity,
  Crown,
  Flame,
  ShoppingBag,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface JobMatchingDashboardProps {
  /**
   * Current user profile
   */
  userProfile: TalentProfile;
  /**
   * Whether to show notification settings
   * @default true
   */
  showNotificationSettings?: boolean;
  /**
   * Whether to show match statistics
   * @default true
   */
  showStatistics?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when job is applied to
   */
  onApplyToJob?: (jobId: string) => void;
  /**
   * Callback when job is saved
   */
  onSaveJob?: (jobId: string) => void;
  /**
   * Callback when preferences are updated
   */
  onUpdatePreferences?: (preferences: JobPreferences) => void;
}

interface TalentProfile {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  category: string;
  skills: string[];
  location: string;
  rating: number;
  completedJobs: number;
  verified: boolean;
  level: 'new' | 'rising' | 'established' | 'top';
  availability: 'available' | 'busy' | 'selective';
}

interface JobPreferences {
  categories: string[];
  compensationTypes: ('paid' | 'tfp' | 'both')[];
  minimumRate?: number;
  maxTravelDistance: number;
  availabilityStatus: 'available' | 'busy' | 'selective';
  notifications: {
    instant: boolean;
    daily: boolean;
    weekly: boolean;
    channels: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  filters: {
    verifiedClients: boolean;
    minimumBudget?: number;
    keywords: string[];
  };
}

interface JobMatch {
  id: string;
  job: {
    id: string;
    title: string;
    category: string;
    description: string;
    client: {
      name: string;
      avatar?: string;
      verified: boolean;
      rating: number;
    };
    compensation: {
      type: 'hourly' | 'fixed' | 'negotiable' | 'tfp';
      amount?: number;
      currency?: string;
    };
    location: {
      city: string;
      remote: boolean;
    };
    deadline: Date;
    featured: boolean;
  };
  matchScore: number;
  matchReasons: string[];
  status: 'new' | 'viewed' | 'applied' | 'saved' | 'dismissed';
  createdAt: Date;
  urgency: 'low' | 'medium' | 'high';
}

interface MatchStatistics {
  totalMatches: number;
  applicationsSubmitted: number;
  responseRate: number;
  avgMatchScore: number;
  topCategories: { category: string; count: number }[];
  weeklyTrend: { week: string; matches: number; applications: number }[];
}

// Mock data
const mockProfile: TalentProfile = {
  id: '1',
  name: 'Alexandra Smith',
  username: 'alexandra_model',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alexandra',
  category: 'Fashion Model',
  skills: ['Editorial', 'Commercial', 'Runway', 'Fitness'],
  location: 'New York, NY',
  rating: 4.8,
  completedJobs: 47,
  verified: true,
  level: 'established',
  availability: 'available'
};

const mockMatches: JobMatch[] = [
  {
    id: '1',
    job: {
      id: 'job-1',
      title: 'Fashion Editorial Shoot - NYC Magazine',
      category: 'Editorial Photography',
      description: 'Looking for a confident fashion model for an editorial shoot featuring summer collections...',
      client: {
        name: 'NYC Fashion Magazine',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=NYC',
        verified: true,
        rating: 4.9
      },
      compensation: {
        type: 'fixed',
        amount: 1200,
        currency: 'USD'
      },
      location: {
        city: 'New York, NY',
        remote: false
      },
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      featured: true
    },
    matchScore: 98,
    matchReasons: [
      'Perfect category match (Editorial)',
      'Location match (New York)',
      'High client rating',
      'Budget matches your rate preference'
    ],
    status: 'new',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    urgency: 'high'
  },
  {
    id: '2',
    job: {
      id: 'job-2',
      title: 'Commercial Beauty Campaign',
      category: 'Commercial Photography',
      description: 'Seeking models for a major beauty brand campaign launching this fall...',
      client: {
        name: 'Bella Cosmetics',
        verified: true,
        rating: 4.7
      },
      compensation: {
        type: 'hourly',
        amount: 150,
        currency: 'USD'
      },
      location: {
        city: 'Brooklyn, NY',
        remote: false
      },
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      featured: false
    },
    matchScore: 85,
    matchReasons: [
      'Good category match (Commercial)',
      'Nearby location',
      'Rate within your preference'
    ],
    status: 'viewed',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    urgency: 'medium'
  },
  {
    id: '3',
    job: {
      id: 'job-3',
      title: 'Fitness Brand TFP Collaboration',
      category: 'Fitness Photography',
      description: 'Exciting TFP opportunity with emerging athletic wear brand...',
      client: {
        name: 'FitActive Wear',
        verified: false,
        rating: 4.2
      },
      compensation: {
        type: 'tfp'
      },
      location: {
        city: 'Manhattan, NY',
        remote: false
      },
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      featured: false
    },
    matchScore: 72,
    matchReasons: [
      'Skills match (Fitness)',
      'TFP preference enabled',
      'Location match'
    ],
    status: 'saved',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    urgency: 'low'
  }
];

const mockStats: MatchStatistics = {
  totalMatches: 156,
  applicationsSubmitted: 23,
  responseRate: 78,
  avgMatchScore: 82,
  topCategories: [
    { category: 'Editorial', count: 45 },
    { category: 'Commercial', count: 38 },
    { category: 'Fashion', count: 32 },
    { category: 'Beauty', count: 28 },
    { category: 'Fitness', count: 13 }
  ],
  weeklyTrend: [
    { week: 'Week 1', matches: 12, applications: 3 },
    { week: 'Week 2', matches: 18, applications: 5 },
    { week: 'Week 3', matches: 24, applications: 7 },
    { week: 'Week 4', matches: 22, applications: 8 }
  ]
};

export function JobMatchingDashboard({
  userProfile = mockProfile,
  showNotificationSettings = true,
  showStatistics = true,
  className,
  onApplyToJob,
  onSaveJob,
  onUpdatePreferences
}: JobMatchingDashboardProps) {
  const [matches, setMatches] = useState<JobMatch[]>(mockMatches);
  const [preferences, setPreferences] = useState<JobPreferences>({
    categories: ['Editorial', 'Commercial', 'Fashion'],
    compensationTypes: ['paid', 'tfp'],
    minimumRate: 100,
    maxTravelDistance: 50,
    availabilityStatus: userProfile.availability,
    notifications: {
      instant: true,
      daily: true,
      weekly: false,
      channels: { email: true, push: true, sms: false }
    },
    filters: {
      verifiedClients: false,
      minimumBudget: 500,
      keywords: []
    }
  });
  const [selectedMatch, setSelectedMatch] = useState<JobMatch | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filter matches
  const filteredMatches = useMemo(() => {
    if (filterStatus === 'all') return matches;
    return matches.filter(match => match.status === filterStatus);
  }, [matches, filterStatus]);

  // Handle job actions
  const handleApplyToJob = (jobId: string) => {
    setMatches(prev => prev.map(match => 
      match.job.id === jobId 
        ? { ...match, status: 'applied' }
        : match
    ));
    onApplyToJob?.(jobId);
    toast.success('Application submitted successfully!');
  };

  const handleSaveJob = (jobId: string) => {
    setMatches(prev => prev.map(match => 
      match.job.id === jobId 
        ? { ...match, status: match.status === 'saved' ? 'viewed' : 'saved' }
        : match
    ));
    onSaveJob?.(jobId);
    toast.success(matches.find(m => m.job.id === jobId)?.status === 'saved' ? 'Removed from saved' : 'Job saved!');
  };

  const handleDismissJob = (jobId: string) => {
    setMatches(prev => prev.map(match => 
      match.job.id === jobId 
        ? { ...match, status: 'dismissed' }
        : match
    ));
    toast.success('Job dismissed');
  };

  const handleViewJob = (match: JobMatch) => {
    setMatches(prev => prev.map(m => 
      m.id === match.id && m.status === 'new'
        ? { ...m, status: 'viewed' }
        : m
    ));
    setSelectedMatch(match);
  };

  const renderMatchCard = (match: JobMatch) => (
    <Card
      key={match.id}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        match.status === 'new' && "ring-2 ring-primary/20",
        match.job.featured && "border-yellow-200 bg-yellow-50/30",
        match.urgency === 'high' && "border-red-200"
      )}
      onClick={() => handleViewJob(match)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant={match.status === 'new' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {match.matchScore}% match
              </Badge>
              {match.job.featured && (
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {match.urgency === 'high' && (
                <Badge variant="destructive" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Urgent
                </Badge>
              )}
              {match.status === 'new' && (
                <Badge variant="default" className="text-xs">
                  New
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg line-clamp-2">{match.job.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {match.job.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSaveJob(match.job.id)}>
                <Bookmark className="h-4 w-4 mr-2" />
                {match.status === 'saved' ? 'Unsave' : 'Save'} Job
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDismissJob(match.job.id)}>
                <X className="h-4 w-4 mr-2" />
                Not Interested
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Client info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={match.job.client.avatar} />
            <AvatarFallback>{match.job.client.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{match.job.client.name}</span>
              {match.job.client.verified && (
                <CheckCircle className="h-3 w-3 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{match.job.client.rating}</span>
            </div>
          </div>
        </div>

        {/* Job details */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>
              {match.job.compensation.type === 'tfp' 
                ? 'TFP' 
                : `$${match.job.compensation.amount}${match.job.compensation.type === 'hourly' ? '/hr' : ''}`
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{match.job.location.city}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Apply by {format(match.job.deadline, 'MMM d')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(match.createdAt, 'h:mm a')}</span>
          </div>
        </div>

        {/* Match reasons */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Why this matches:</p>
          <div className="space-y-1">
            {match.matchReasons.slice(0, 2).map((reason, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>{reason}</span>
              </div>
            ))}
            {match.matchReasons.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{match.matchReasons.length - 2} more reasons
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {match.status !== 'applied' ? (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleApplyToJob(match.job.id);
              }}
              className="flex-1"
            >
              <Send className="h-3 w-3 mr-1" />
              Apply Now
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled className="flex-1">
              <CheckCircle className="h-3 w-3 mr-1" />
              Applied
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleSaveJob(match.job.id);
            }}
          >
            <Heart className={cn(
              "h-3 w-3",
              match.status === 'saved' && "fill-current text-red-500"
            )} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStatistics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Matches</p>
              <p className="text-2xl font-bold">{mockStats.totalMatches}</p>
            </div>
            <Target className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Applications</p>
              <p className="text-2xl font-bold">{mockStats.applicationsSubmitted}</p>
            </div>
            <Send className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Response Rate</p>
              <p className="text-2xl font-bold">{mockStats.responseRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Match Score</p>
              <p className="text-2xl font-bold">{mockStats.avgMatchScore}%</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Matches</h1>
          <p className="text-muted-foreground mt-1">
            Personalized job recommendations based on your profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreferences(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Matches
          </Button>
        </div>
      </div>

      {/* Profile summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userProfile.avatar} />
              <AvatarFallback>{userProfile.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{userProfile.name}</h3>
                {userProfile.verified && (
                  <CheckCircle className="h-4 w-4 text-primary" />
                )}
                <Badge variant="secondary">
                  {userProfile.level === 'new' && <Crown className="h-3 w-3 mr-1" />}
                  {userProfile.level === 'rising' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {userProfile.level === 'established' && <Award className="h-3 w-3 mr-1" />}
                  {userProfile.level === 'top' && <Flame className="h-3 w-3 mr-1" />}
                  {userProfile.level.charAt(0).toUpperCase() + userProfile.level.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {userProfile.category} • {userProfile.location}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{userProfile.rating}</span>
                </div>
                <span>{userProfile.completedJobs} completed jobs</span>
                <Badge 
                  variant={userProfile.availability === 'available' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {userProfile.availability}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{filteredMatches.length}</p>
              <p className="text-xs text-muted-foreground">Active matches</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {showStatistics && renderStatistics()}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by status:</span>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Matches</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="saved">Saved</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">
            {filteredMatches.length} of {matches.length} matches
          </span>
        </div>
      </div>

      {/* Matches grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredMatches.map(renderMatchCard)}
      </div>

      {filteredMatches.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-4">
              {filterStatus === 'all' 
                ? "We haven't found any matches for your profile yet."
                : `No matches with status "${filterStatus}".`
              }
            </p>
            <Button onClick={() => setShowPreferences(true)}>
              Update Preferences
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Job details dialog */}
      {selectedMatch && (
        <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">{selectedMatch.matchScore}% match</Badge>
                {selectedMatch.job.featured && (
                  <Badge variant="outline">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl">{selectedMatch.job.title}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedMatch.job.client.avatar} />
                    <AvatarFallback>{selectedMatch.job.client.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{selectedMatch.job.client.name}</span>
                  {selectedMatch.job.client.verified && (
                    <CheckCircle className="h-3 w-3 text-primary" />
                  )}
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{selectedMatch.job.client.rating}</span>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Job details */}
              <div>
                <h4 className="font-semibold mb-2">Job Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedMatch.job.description}
                </p>
              </div>

              {/* Compensation & logistics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Compensation</h4>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedMatch.job.compensation.type === 'tfp' 
                        ? 'Time for Print (TFP)' 
                        : `$${selectedMatch.job.compensation.amount} ${selectedMatch.job.compensation.currency}${selectedMatch.job.compensation.type === 'hourly' ? ' per hour' : ''}`
                      }
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Location</h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedMatch.job.location.city}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Application Deadline</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(selectedMatch.job.deadline, 'MMMM d, yyyy')}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Category</h4>
                  <Badge variant="secondary">{selectedMatch.job.category}</Badge>
                </div>
              </div>

              {/* Match analysis */}
              <div>
                <h4 className="font-semibold mb-2">Why This Matches You</h4>
                <div className="space-y-2">
                  {selectedMatch.matchReasons.map((reason, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match score breakdown */}
              <div>
                <h4 className="font-semibold mb-2">Match Score Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Skills & Experience</span>
                    <div className="flex items-center gap-2">
                      <Progress value={95} className="w-20 h-2" />
                      <span className="text-sm">95%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Location Preference</span>
                    <div className="flex items-center gap-2">
                      <Progress value={100} className="w-20 h-2" />
                      <span className="text-sm">100%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Compensation Range</span>
                    <div className="flex items-center gap-2">
                      <Progress value={90} className="w-20 h-2" />
                      <span className="text-sm">90%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Client Rating</span>
                    <div className="flex items-center gap-2">
                      <Progress value={98} className="w-20 h-2" />
                      <span className="text-sm">98%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleSaveJob(selectedMatch.job.id)}
              >
                <Heart className={cn(
                  "h-4 w-4 mr-2",
                  selectedMatch.status === 'saved' && "fill-current text-red-500"
                )} />
                {selectedMatch.status === 'saved' ? 'Saved' : 'Save Job'}
              </Button>
              {selectedMatch.status !== 'applied' ? (
                <Button onClick={() => handleApplyToJob(selectedMatch.job.id)}>
                  <Send className="h-4 w-4 mr-2" />
                  Apply Now
                </Button>
              ) : (
                <Button disabled>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Applied
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Preferences dialog */}
      {showPreferences && (
        <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Job Matching Preferences</DialogTitle>
              <DialogDescription>
                Customize your job matching criteria and notification settings
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="matching">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="matching">Matching</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>

              <TabsContent value="matching" className="space-y-4">
                <div>
                  <Label>Job Categories</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['Editorial', 'Commercial', 'Fashion', 'Beauty', 'Fitness', 'Portrait'].map((category) => (
                      <label key={category} className="flex items-center space-x-2">
                        <Checkbox
                          checked={preferences.categories.includes(category)}
                          onCheckedChange={(checked) => {
                            const newCategories = checked
                              ? [...preferences.categories, category]
                              : preferences.categories.filter(c => c !== category);
                            setPreferences({ ...preferences, categories: newCategories });
                          }}
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Compensation Types</Label>
                  <div className="flex gap-4 mt-2">
                    {['paid', 'tfp'].map((type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <Checkbox
                          checked={preferences.compensationTypes.includes(type as any)}
                          onCheckedChange={(checked) => {
                            const newTypes = checked
                              ? [...preferences.compensationTypes, type as any]
                              : preferences.compensationTypes.filter(t => t !== type);
                            setPreferences({ ...preferences, compensationTypes: newTypes });
                          }}
                        />
                        <span className="text-sm">{type.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Minimum Rate (USD/hour)</Label>
                  <Select
                    value={preferences.minimumRate?.toString()}
                    onValueChange={(value) => setPreferences({ ...preferences, minimumRate: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No minimum</SelectItem>
                      <SelectItem value="50">$50+</SelectItem>
                      <SelectItem value="100">$100+</SelectItem>
                      <SelectItem value="150">$150+</SelectItem>
                      <SelectItem value="200">$200+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Only verified clients</Label>
                  <Switch
                    checked={preferences.filters.verifiedClients}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      filters: { ...preferences.filters, verifiedClients: checked }
                    })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Instant notifications</Label>
                  <Switch
                    checked={preferences.notifications.instant}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, instant: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Daily digest</Label>
                  <Switch
                    checked={preferences.notifications.daily}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, daily: checked }
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Weekly summary</Label>
                  <Switch
                    checked={preferences.notifications.weekly}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      notifications: { ...preferences.notifications, weekly: checked }
                    })}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Notification Channels</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email</span>
                      <Switch
                        checked={preferences.notifications.channels.email}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            channels: { ...preferences.notifications.channels, email: checked }
                          }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Push notifications</span>
                      <Switch
                        checked={preferences.notifications.channels.push}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            channels: { ...preferences.notifications.channels, push: checked }
                          }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SMS</span>
                      <Switch
                        checked={preferences.notifications.channels.sms}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            channels: { ...preferences.notifications.channels, sms: checked }
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreferences(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                onUpdatePreferences?.(preferences);
                setShowPreferences(false);
                toast.success('Preferences updated successfully!');
              }}>
                Save Preferences
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default JobMatchingDashboard;