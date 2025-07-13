/**
 * Casting Applications Client Page Component
 * 
 * Manage applications for a specific casting call.
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminListPage } from '@/components/admin/AdminListPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, Eye, Check, X, Star, MessageCircle, Download,
  Calendar, MapPin, Ruler, User, Mail, Phone
} from 'lucide-react';
import Link from 'next/link';

interface CastingApplicationsClientPageProps {
  castingId: string;
}

interface Application {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'shortlisted';
  submittedAt: string;
  profileImage?: string;
  experience: string;
  age: number;
  height: number;
  weight?: number;
  location: string;
  bio?: string;
  portfolio: {
    images: string[];
    videos: string[];
  };
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  availability: {
    startDate: string;
    endDate: string;
    flexible: boolean;
  };
  rating?: number;
  notes?: string;
}

export function CastingApplicationsClientPage({ castingId }: CastingApplicationsClientPageProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    experience: '',
    location: '',
  });
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  // Fetch applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['casting-applications', castingId, filters, searchTerm],
    queryFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockApplications: Application[] = [
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
          bio: 'Professional runway model with 5+ years experience in high fashion. Worked with major brands including Chanel, Dior, and Hermès.',
          portfolio: {
            images: [
              'https://images.unsplash.com/photo-1494790108755-2616b6b7f2d3?w=400&h=600&fit=crop&crop=face',
              'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop',
              'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop'
            ],
            videos: []
          },
          socialMedia: {
            instagram: '@sophiemartin',
            linkedin: 'sophie-martin-model'
          },
          availability: {
            startDate: '2024-03-10',
            endDate: '2024-03-30',
            flexible: true
          },
          rating: 4.8
        },
        {
          id: '2',
          applicantName: 'Emma Johnson',
          applicantEmail: 'emma.j@email.com',
          applicantPhone: '+44 20 7123 4567',
          status: 'reviewed',
          submittedAt: '2024-01-17T09:15:00Z',
          profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
          experience: 'professional',
          age: 26,
          height: 180,
          weight: 60,
          location: 'London, UK',
          bio: 'International model specializing in editorial and commercial work. Featured in Vogue, Elle, and Harper\'s Bazaar.',
          portfolio: {
            images: [
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face',
              'https://images.unsplash.com/photo-1506629905587-4b8dc0e8b90b?w=400&h=600&fit=crop'
            ],
            videos: ['https://example.com/video1.mp4']
          },
          socialMedia: {
            instagram: '@emmajohnsonmodel',
            twitter: '@emmaj_model'
          },
          availability: {
            startDate: '2024-03-15',
            endDate: '2024-03-25',
            flexible: false
          },
          rating: 4.6,
          notes: 'Excellent portfolio, great for high-fashion campaigns'
        },
        {
          id: '3',
          applicantName: 'Isabella Rodriguez',
          applicantEmail: 'isabella.r@email.com',
          status: 'shortlisted',
          submittedAt: '2024-01-16T16:45:00Z',
          profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
          experience: 'professional',
          age: 22,
          height: 177,
          weight: 56,
          location: 'Madrid, Spain',
          bio: 'Rising star in the fashion world. Specializes in runway and editorial work with a unique editorial style.',
          portfolio: {
            images: [
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face',
              'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop'
            ],
            videos: []
          },
          availability: {
            startDate: '2024-03-15',
            endDate: '2024-03-25',
            flexible: true
          },
          rating: 4.9
        }
      ];
      
      return mockApplications.filter(app => 
        app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    refetchInterval: 30000,
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Updating application ${applicationId} status to ${status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casting-applications', castingId] });
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ applicationIds, status }: { applicationIds: string[]; status: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Bulk updating applications ${applicationIds.join(', ')} status to ${status}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['casting-applications', castingId] });
      setSelectedApplications([]);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'shortlisted': return 'bg-purple-100 text-purple-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
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
        { value: 'shortlisted', label: 'Shortlisted' },
        { value: 'accepted', label: 'Accepted' },
        { value: 'rejected', label: 'Rejected' }
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
    }
  ];

  const bulkActions = [
    { label: 'Mark as Reviewed', value: 'reviewed' },
    { label: 'Shortlist', value: 'shortlisted' },
    { label: 'Accept', value: 'accepted' },
    { label: 'Reject', value: 'rejected' }
  ];

  const handleBulkAction = (action: string, selectedIds: string[]) => {
    bulkUpdateStatusMutation.mutate({ applicationIds: selectedIds, status: action });
  };

  const handleStatusUpdate = (applicationId: string, status: string) => {
    updateApplicationStatusMutation.mutate({ applicationId, status });
  };

  const renderApplicationCard = (application: Application) => (
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
              <h3 className="font-semibold text-lg">{application.applicantName}</h3>
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

              {application.rating && (
                <div className="flex items-center gap-1 mt-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{application.rating}</span>
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
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setSelectedApplication(application)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{application.applicantName}</DialogTitle>
                  <DialogDescription>Application Details</DialogDescription>
                </DialogHeader>
                {selectedApplication && <ApplicationDetailView application={selectedApplication} />}
              </DialogContent>
            </Dialog>
            
            <Button size="sm" variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
          
          <div className="flex gap-2">
            {application.status === 'pending' && (
              <>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleStatusUpdate(application.id, 'shortlisted')}
                  disabled={updateApplicationStatusMutation.isPending}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Shortlist
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleStatusUpdate(application.id, 'accepted')}
                  disabled={updateApplicationStatusMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleStatusUpdate(application.id, 'rejected')}
                  disabled={updateApplicationStatusMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </>
            )}
            
            {application.status === 'shortlisted' && (
              <>
                <Button 
                  size="sm"
                  onClick={() => handleStatusUpdate(application.id, 'accepted')}
                  disabled={updateApplicationStatusMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleStatusUpdate(application.id, 'rejected')}
                  disabled={updateApplicationStatusMutation.isPending}
                >
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

  const headerActions = (
    <div className="flex gap-2">
      <Button variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Export Applications
      </Button>
      <Link href={`/tenant/castings/${castingId}`}>
        <Button variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Casting
        </Button>
      </Link>
    </div>
  );

  return (
    <AdminListPage
      title="Casting Applications"
      description="Review and manage applications for this casting call"
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
      isLoading={isLoading || bulkUpdateStatusMutation.isPending}
    >
      <div className="space-y-4">
        {applications.map(renderApplicationCard)}
      </div>
      
      {applications.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No applications found
          </h3>
          <p className="text-sm text-muted-foreground">
            Applications will appear here as people apply to your casting.
          </p>
        </div>
      )}
    </AdminListPage>
  );
}

function ApplicationDetailView({ application }: { application: Application }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <Avatar className="w-24 h-24">
          <AvatarImage src={application.profileImage} alt={application.applicantName} />
          <AvatarFallback className="text-lg">
            {application.applicantName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <h2 className="text-2xl font-bold">{application.applicantName}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Email:</span>
              <span className="ml-2">{application.applicantEmail}</span>
            </div>
            {application.applicantPhone && (
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <span className="ml-2">{application.applicantPhone}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Age:</span>
              <span className="ml-2">{application.age} years</span>
            </div>
            <div>
              <span className="text-muted-foreground">Height:</span>
              <span className="ml-2">{application.height}cm</span>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>
              <span className="ml-2">{application.location}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Experience:</span>
              <span className="ml-2">{application.experience}</span>
            </div>
          </div>
          
          {application.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{application.rating}/5</span>
            </div>
          )}
        </div>
        
        <Badge className={getStatusColor(application.status)}>
          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
        </Badge>
      </div>

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>
        
        <TabsContent value="portfolio" className="space-y-4">
          {application.bio && (
            <div>
              <h3 className="font-semibold mb-2">Bio</h3>
              <p className="text-muted-foreground">{application.bio}</p>
            </div>
          )}
          
          {application.portfolio.images.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Portfolio Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {application.portfolio.images.map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`Portfolio ${index + 1}`}
                    className="aspect-[3/4] object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Physical Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Height:</span>
                  <span>{application.height}cm</span>
                </div>
                {application.weight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight:</span>
                    <span>{application.weight}kg</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span>{application.age} years</span>
                </div>
              </div>
            </div>
            
            {application.socialMedia && (
              <div>
                <h3 className="font-semibold mb-3">Social Media</h3>
                <div className="space-y-2 text-sm">
                  {application.socialMedia.instagram && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Instagram:</span>
                      <span>{application.socialMedia.instagram}</span>
                    </div>
                  )}
                  {application.socialMedia.twitter && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Twitter:</span>
                      <span>{application.socialMedia.twitter}</span>
                    </div>
                  )}
                  {application.socialMedia.linkedin && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LinkedIn:</span>
                      <span>{application.socialMedia.linkedin}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {application.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{application.notes}</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="availability" className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Availability</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available from:</span>
                <span>{new Date(application.availability.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available until:</span>
                <span>{new Date(application.availability.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flexible dates:</span>
                <span>{application.availability.flexible ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}