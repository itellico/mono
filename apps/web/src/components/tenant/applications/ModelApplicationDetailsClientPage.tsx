/**
 * Model Application Details Client Page Component
 * 
 * Detailed view of individual model applications.
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, Check, X, Star, MessageCircle, Download, Edit,
  Calendar, MapPin, Ruler, User, Mail, Phone, Instagram, Twitter, Linkedin,
  Camera, Video, Globe, Heart
} from 'lucide-react';
import Link from 'next/link';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

interface ModelApplicationDetailsClientPageProps {
  applicationId: string;
}

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
  eyeColor?: string;
  hairColor?: string;
  location: string;
  bio?: string;
  specialties: string[];
  skills: string[];
  languages: string[];
  rating?: number;
  portfolio: {
    images: string[];
    videos: string[];
  };
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  experience_details: {
    yearsOfExperience: number;
    previousWork: string[];
    education?: string;
    awards?: string[];
  };
  availability: {
    fullTime: boolean;
    partTime: boolean;
    freelance: boolean;
    travel: boolean;
    relocate: boolean;
  };
  measurements?: {
    bust?: number;
    waist?: number;
    hips?: number;
    shoes?: number;
    dress?: string;
  };
  notes?: string;
  internalNotes?: string;
  reviewer?: string;
  reviewedAt?: string;
}

export function ModelApplicationDetailsClientPage({ applicationId }: ModelApplicationDetailsClientPageProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [internalNotes, setInternalNotes] = useState('');

  // Fetch application details
  const { data: application, isLoading } = useQuery({
    queryKey: ['model-application', applicationId],
    queryFn: async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockApplication: ModelApplication = {
        id: applicationId,
        applicantName: 'Sophie Martin',
        applicantEmail: 'sophie.martin@email.com',
        applicantPhone: '+33 1 23 45 67 89',
        status: 'pending',
        submittedAt: '2024-01-18T14:30:00Z',
        profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b6b7f2d3?w=300&h=300&fit=crop&crop=face',
        experience: 'professional',
        age: 24,
        height: 178,
        weight: 58,
        eyeColor: 'Blue',
        hairColor: 'Blonde',
        location: 'Paris, France',
        bio: 'Professional runway model with 5+ years experience in high fashion. I have worked with major brands including Chanel, Dior, and Hermès. My passion for fashion started early, and I have trained extensively in runway techniques and commercial photography. I am dedicated to maintaining peak physical condition and professional standards.',
        specialties: ['Runway', 'Editorial', 'High Fashion', 'Luxury Brands'],
        skills: ['Runway Walking', 'Photo Posing', 'Commercial Acting', 'Voice Over', 'Dancing'],
        languages: ['French', 'English', 'Italian'],
        rating: 4.8,
        portfolio: {
          images: [
            'https://images.unsplash.com/photo-1494790108755-2616b6b7f2d3?w=400&h=600&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1485231183945-fffde7cc051e?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop'
          ],
          videos: [
            'https://example.com/portfolio-video-1.mp4',
            'https://example.com/runway-demo.mp4'
          ]
        },
        socialMedia: {
          instagram: '@sophiemartin_model',
          linkedin: 'sophie-martin-model',
          website: 'sophiemartin.com'
        },
        experience_details: {
          yearsOfExperience: 6,
          previousWork: [
            'Chanel Spring/Summer 2023 Collection',
            'Dior Haute Couture Campaign',
            'Hermès Jewelry Campaign',
            'Paris Fashion Week 2022-2023',
            'Vogue France Editorial Shoots'
          ],
          education: 'École Supérieure des Arts Appliqués, Fashion Design',
          awards: [
            'Best New Model - Paris Fashion Week 2019',
            'Rising Star Award - Fashion Model Awards 2020'
          ]
        },
        availability: {
          fullTime: true,
          partTime: true,
          freelance: true,
          travel: true,
          relocate: false
        },
        measurements: {
          bust: 86,
          waist: 60,
          hips: 90,
          shoes: 40,
          dress: 'EU 36'
        },
        notes: 'Very professional and reliable. Excellent runway presence and camera skills.',
        internalNotes: 'Top candidate for luxury brand campaigns. Strong portfolio and excellent references.'
      };
      
      return mockApplication;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Updating application ${applicationId} status to ${newStatus}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-application', applicationId] });
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Saving internal notes for application ${applicationId}:`, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model-application', applicationId] });
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (!application) {
    return <EmptyState title="Application not found" description="The application you're looking for doesn't exist." />;
  }

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

  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate(status);
  };

  const handleSaveNotes = () => {
    saveNotesMutation.mutate(internalNotes);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tenant/applications">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Portfolio
          </Button>
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Link href={`/tenant/models/${applicationId}`}>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Application Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={application.profileImage} alt={application.applicantName} />
                <AvatarFallback className="text-lg">
                  {application.applicantName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold">{application.applicantName}</h1>
                  <p className="text-muted-foreground">{application.experience} Model</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{application.applicantEmail}</span>
                  </div>
                  {application.applicantPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{application.applicantPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{application.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Applied {new Date(application.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{application.age} years</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{application.height}cm</span>
                  </div>
                  {application.weight && (
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{application.weight}kg</span>
                    </div>
                  )}
                  {application.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{application.rating}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {application.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary">{specialty}</Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              <Badge className={getStatusColor(application.status)}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Badge>
              
              {application.status === 'pending' && (
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => handleStatusUpdate('approved')}>
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatusUpdate('reviewed')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Mark Reviewed
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate('rejected')}>
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-medium">{application.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Height</span>
                  <span className="font-medium">{application.height}cm</span>
                </div>
                {application.weight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight</span>
                    <span className="font-medium">{application.weight}kg</span>
                  </div>
                )}
                {application.eyeColor && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eye Color</span>
                    <span className="font-medium">{application.eyeColor}</span>
                  </div>
                )}
                {application.hairColor && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hair Color</span>
                    <span className="font-medium">{application.hairColor}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{application.location}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience Level</span>
                  <span className="font-medium">{application.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Years of Experience</span>
                  <span className="font-medium">{application.experience_details.yearsOfExperience} years</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Languages</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {application.languages.map((language) => (
                      <Badge key={language} variant="outline">{language}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Skills</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {application.skills.map((skill) => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {application.bio && (
            <Card>
              <CardHeader>
                <CardTitle>Biography</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{application.bio}</p>
              </CardContent>
            </Card>
          )}

          {application.socialMedia && (
            <Card>
              <CardHeader>
                <CardTitle>Social Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {application.socialMedia.instagram && (
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-500" />
                      <span className="text-sm">{application.socialMedia.instagram}</span>
                    </div>
                  )}
                  {application.socialMedia.twitter && (
                    <div className="flex items-center gap-2">
                      <Twitter className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{application.socialMedia.twitter}</span>
                    </div>
                  )}
                  {application.socialMedia.linkedin && (
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{application.socialMedia.linkedin}</span>
                    </div>
                  )}
                  {application.socialMedia.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{application.socialMedia.website}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          {application.portfolio.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Portfolio Images ({application.portfolio.images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {application.portfolio.images.map((image, index) => (
                    <div key={index} className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                      <img 
                        src={image} 
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {application.portfolio.videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Portfolio Videos ({application.portfolio.videos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {application.portfolio.videos.map((video, index) => (
                    <div key={index} className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Video className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Video {index + 1}</p>
                        <Button size="sm" variant="outline" className="mt-2">
                          Play Video
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="experience" className="space-y-6">
          {application.experience_details.previousWork.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous Work</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {application.experience_details.previousWork.map((work, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>{work}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {application.experience_details.education && (
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{application.experience_details.education}</p>
              </CardContent>
            </Card>
          )}

          {application.experience_details.awards && application.experience_details.awards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Awards & Recognition</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {application.experience_details.awards.map((award, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span>{award}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="measurements" className="space-y-6">
          {application.measurements && (
            <Card>
              <CardHeader>
                <CardTitle>Body Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {application.measurements.bust && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{application.measurements.bust}cm</div>
                      <div className="text-sm text-muted-foreground">Bust</div>
                    </div>
                  )}
                  {application.measurements.waist && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{application.measurements.waist}cm</div>
                      <div className="text-sm text-muted-foreground">Waist</div>
                    </div>
                  )}
                  {application.measurements.hips && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{application.measurements.hips}cm</div>
                      <div className="text-sm text-muted-foreground">Hips</div>
                    </div>
                  )}
                  {application.measurements.shoes && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{application.measurements.shoes}</div>
                      <div className="text-sm text-muted-foreground">Shoe Size</div>
                    </div>
                  )}
                  {application.measurements.dress && (
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{application.measurements.dress}</div>
                      <div className="text-sm text-muted-foreground">Dress Size</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Work Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${application.availability.fullTime ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Full Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${application.availability.partTime ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Part Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${application.availability.freelance ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Freelance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${application.availability.travel ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Travel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${application.availability.relocate ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span>Relocate</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          {application.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Application Notes</CardTitle>
                <CardDescription>Notes provided by the applicant</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{application.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>Private notes for internal use only</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="internal-notes">Add or update internal notes</Label>
                <Textarea
                  id="internal-notes"
                  placeholder="Add your notes about this application..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleSaveNotes}
                disabled={saveNotesMutation.isPending}
              >
                {saveNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
              </Button>
              
              {application.internalNotes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Existing Notes:</h4>
                  <p className="text-sm text-muted-foreground">{application.internalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}