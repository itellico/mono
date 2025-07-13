/**
 * Casting Details Client Page Component
 * 
 * Detailed view of individual casting calls with management options.
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Edit, Share2, MoreHorizontal, Calendar, MapPin, 
  DollarSign, Users, Clock, Target, CheckCircle, XCircle 
} from 'lucide-react';
import Link from 'next/link';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

interface CastingDetailsClientPageProps {
  castingId: string;
}

interface Casting {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'open' | 'closed' | 'completed';
  location: string;
  budget: number;
  currency: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  applicationsCount: number;
  viewsCount: number;
  requirements: {
    ageRange: { min: number; max: number };
    gender: string[];
    height: { min: number; max: number };
    experience: string;
    skills?: string[];
    languages?: string[];
  };
  isUrgent: boolean;
  allowRemoteWork: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Application {
  id: string;
  applicantName: string;
  applicantEmail: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  submittedAt: string;
  profileImage?: string;
  experience: string;
  age: number;
  height: number;
  location: string;
}

export function CastingDetailsClientPage({ castingId }: CastingDetailsClientPageProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch casting details
  const { data: casting, isLoading: castingLoading } = useQuery({
    queryKey: ['casting', castingId],
    queryFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockCasting: Casting = {
        id: castingId,
        title: 'Fashion Week Runway Models',
        description: 'We are seeking professional runway models for the upcoming Paris Fashion Week 2024. This is a high-profile event featuring luxury brands and will be attended by international fashion industry professionals. Models will walk for multiple designers over a 3-day period.\n\nThis is an exclusive opportunity to work with top-tier fashion brands and gain exposure in the international fashion scene. All models must be available for the full duration of the event including rehearsals.',
        category: 'Fashion Show',
        status: 'open',
        location: 'Paris, France',
        budget: 5000,
        currency: 'EUR',
        startDate: '2024-03-15',
        endDate: '2024-03-25',
        applicationDeadline: '2024-02-28',
        applicationsCount: 45,
        viewsCount: 1247,
        requirements: {
          ageRange: { min: 18, max: 30 },
          gender: ['female'],
          height: { min: 175, max: 185 },
          experience: 'professional',
          skills: ['Runway', 'Editorial', 'High Fashion'],
          languages: ['English', 'French']
        },
        isUrgent: true,
        allowRemoteWork: false,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
      };
      
      return mockCasting;
    },
  });

  // Fetch applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ['casting-applications', castingId],
    queryFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockApplications: Application[] = [
        {
          id: '1',
          applicantName: 'Sophie Martin',
          applicantEmail: 'sophie.martin@email.com',
          status: 'pending',
          submittedAt: '2024-01-18T14:30:00Z',
          profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b6b7f2d3?w=150&h=150&fit=crop&crop=face',
          experience: 'professional',
          age: 24,
          height: 178,
          location: 'Paris, France'
        },
        {
          id: '2',
          applicantName: 'Emma Johnson',
          applicantEmail: 'emma.j@email.com',
          status: 'reviewed',
          submittedAt: '2024-01-17T09:15:00Z',
          profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
          experience: 'professional',
          age: 26,
          height: 180,
          location: 'London, UK'
        },
        {
          id: '3',
          applicantName: 'Isabella Rodriguez',
          applicantEmail: 'isabella.r@email.com',
          status: 'accepted',
          submittedAt: '2024-01-16T16:45:00Z',
          profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
          experience: 'professional',
          age: 22,
          height: 177,
          location: 'Madrid, Spain'
        }
      ];
      
      return mockApplications;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Updating casting ${castingId} status to ${newStatus}`);
    },
    onSuccess: () => {
      // Refetch casting data
    },
  });

  if (castingLoading) {
    return <LoadingState />;
  }

  if (!casting) {
    return <EmptyState title="Casting not found" description="The casting you're looking for doesn't exist." />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApplicationStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tenant/castings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Castings
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Link href={`/tenant/castings/${castingId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Casting Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{casting.title}</CardTitle>
                {casting.isUrgent && (
                  <Badge variant="destructive">Urgent</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{casting.category}</span>
                <span>•</span>
                <span>{casting.viewsCount} views</span>
                <span>•</span>
                <span>Created {new Date(casting.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <Badge className={getStatusColor(casting.status)}>
              {casting.status.charAt(0).toUpperCase() + casting.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{casting.applicationsCount}</div>
                <div className="text-xs text-muted-foreground">Applications</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{casting.budget} {casting.currency}</div>
                <div className="text-xs text-muted-foreground">Budget</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{casting.location}</div>
                <div className="text-xs text-muted-foreground">Location</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{new Date(casting.applicationDeadline).toLocaleDateString()}</div>
                <div className="text-xs text-muted-foreground">Deadline</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({casting.applicationsCount})
          </TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {casting.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{casting.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">{casting.budget} {casting.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{casting.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remote Work</span>
                  <span className="font-medium">{casting.allowRemoteWork ? 'Allowed' : 'Not Allowed'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Application Deadline</span>
                  <span className="font-medium">{new Date(casting.applicationDeadline).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Start</span>
                  <span className="font-medium">{new Date(casting.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project End</span>
                  <span className="font-medium">{new Date(casting.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">
                    {Math.ceil((new Date(casting.endDate).getTime() - new Date(casting.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {applicationsLoading ? (
            <LoadingState />
          ) : applications.length === 0 ? (
            <EmptyState 
              title="No applications yet" 
              description="Applications will appear here once people start applying to this casting."
            />
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {application.profileImage && (
                          <img 
                            src={application.profileImage} 
                            alt={application.applicantName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-medium">{application.applicantName}</h3>
                          <p className="text-sm text-muted-foreground">{application.applicantEmail}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{application.age} years</span>
                            <span>{application.height}cm</span>
                            <span>{application.location}</span>
                            <span>{application.experience}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {getApplicationStatusIcon(application.status)}
                            <Badge className={getApplicationStatusColor(application.status)}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Applied {new Date(application.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View Profile</Button>
                          {application.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline">Accept</Button>
                              <Button size="sm" variant="outline">Reject</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
              <CardDescription>Detailed requirements for this casting call</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age Range</span>
                    <span className="font-medium">
                      {casting.requirements.ageRange.min} - {casting.requirements.ageRange.max} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Height Range</span>
                    <span className="font-medium">
                      {casting.requirements.height.min} - {casting.requirements.height.max} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gender</span>
                    <span className="font-medium">
                      {casting.requirements.gender.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience Level</span>
                    <span className="font-medium">
                      {casting.requirements.experience.charAt(0).toUpperCase() + casting.requirements.experience.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {casting.requirements.skills && casting.requirements.skills.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Required Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {casting.requirements.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {casting.requirements.languages && casting.requirements.languages.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Languages</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {casting.requirements.languages.map((language) => (
                          <Badge key={language} variant="secondary">{language}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>Important dates and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">Casting Created</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(casting.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">Application Deadline</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(casting.applicationDeadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">Project Start Date</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(casting.startDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">Project End Date</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(casting.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}