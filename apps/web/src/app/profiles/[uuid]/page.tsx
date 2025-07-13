'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Ruler,
  Heart,
  Share2,
  Download,
  Camera,
  Instagram,
  Twitter,
  Globe,
  Star,
  Award
} from 'lucide-react';
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

/**
 * 🎭 Profile Display Page
 * 
 * Professional model profile display with comprehensive information
 */

// Mock profile data
const MOCK_PROFILE = {
  id: '1',
  firstName: 'Emma',
  lastName: 'Rodriguez',
  email: 'emma.rodriguez@example.com',
  phone: '+1 (555) 123-4567',
  age: 28,
  country: 'United States',
  city: 'New York',
  height: '175 cm',
  weight: '62 kg',
  eyeColor: 'Hazel',
  hairColor: 'Brown',
  category: 'Fashion Model',
  experience: 'Professional (5+ years)',
  availability: 'Full-time',
  hourlyRate: '$250/hour',
  bio: 'Professional fashion model with over 5 years of experience in runway, editorial, and commercial modeling.',
  specialties: ['Fashion Photography', 'Runway Modeling'],
  languages: ['English', 'Spanish', 'French'],
  instagram: '@emma_model_nyc',
  twitter: '@emma_rodriguez',
  website: 'https://emmamodeling.com',
  isVerified: true,
  rating: 4.9,
  totalBookings: 127,
  portfolioImages: [
    { id: 1, title: 'Fashion Editorial', category: 'Editorial' },
    { id: 2, title: 'Commercial Shoot', category: 'Commercial' },
    { id: 3, title: 'Runway Show', category: 'Runway' },
  ],
  reviews: [
    {
      id: 1,
      clientName: 'Fashion Forward Studio',
      rating: 5,
      comment: 'Emma was absolutely professional and delivered stunning results.',
      date: '2024-01-15'
    }
  ]
};

export default function ProfileDisplayPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [profile] = useState(MOCK_PROFILE);
  const { trackPageView, trackClick } = useAuditTracking();

  usePageTracking('profile_view');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        trackPageView('profile_view', {
          profileId: params.id as string,
          profileCategory: profile.category,
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        browserLogger.error('Failed to fetch profile', { error, profileId: params.id });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [params.id, trackPageView, profile.category]);

  const handleContactClick = () => {
    trackClick('profile_contact', { profileId: profile.id });
    browserLogger.userAction('profile_contact_clicked', { profileId: profile.id });
    window.location.href = `mailto:${profile.email}`;
  };

  const handleSedcardDownload = () => {
    trackClick('sedcard_download', { profileId: profile.id });
    router.push(`/profiles/${profile.id}/sedcard`);
  };

  const handleModelbookDownload = () => {
    trackClick('modelbook_download', { profileId: profile.id });
    router.push(`/profiles/${profile.id}/modelbook`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="relative h-64 bg-gradient-to-r from-purple-500 to-pink-500">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="sm" variant="secondary">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarFallback className="text-2xl">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-grow space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    {profile.isVerified && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Award className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile.city}, {profile.country}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {profile.category}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {profile.rating} ({profile.totalBookings} bookings)
                    </div>
                  </div>
                </div>
                
                <p className="text-muted-foreground leading-relaxed">
                  {profile.bio}
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{profile.age}</div>
                    <div className="text-sm text-muted-foreground">Years Old</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{profile.height}</div>
                    <div className="text-sm text-muted-foreground">Height</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{profile.experience.split(' ')[0]}</div>
                    <div className="text-sm text-muted-foreground">Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{profile.hourlyRate}</div>
                    <div className="text-sm text-muted-foreground">Rate</div>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleContactClick} className="flex-1 min-w-[120px]">
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </Button>
              <Button variant="outline" onClick={handleSedcardDownload}>
                <Download className="h-4 w-4 mr-2" />
                Sedcard
              </Button>
              <Button variant="outline" onClick={handleModelbookDownload}>
                <Download className="h-4 w-4 mr-2" />
                Modelbook
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Book Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    Physical Attributes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Height:</span>
                    <span className="font-medium">{profile.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{profile.weight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eye Color:</span>
                    <span className="font-medium">{profile.eyeColor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hair Color:</span>
                    <span className="font-medium">{profile.hairColor}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Professional Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{profile.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience:</span>
                    <span className="font-medium">{profile.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Availability:</span>
                    <span className="font-medium">{profile.availability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hourly Rate:</span>
                    <span className="font-medium text-green-600">{profile.hourlyRate}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {profile.portfolioImages.map((image) => (
                    <div key={image.id} className="group relative overflow-hidden rounded-lg">
                      <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                        <Camera className="h-12 w-12 text-gray-400" />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-center text-white">
                          <h3 className="font-semibold">{image.title}</h3>
                          <Badge variant="secondary" className="mt-1">
                            {image.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-4 w-4 mr-2" />
                        {profile.instagram}
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {profile.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{review.clientName}</h4>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
