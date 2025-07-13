'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Ruler,
  Eye,
  Camera,
  Star,
  Award,
  Calendar,
  Heart,
  Instagram,
  Globe,
  Briefcase,
  Trophy,
  BookOpen
} from 'lucide-react';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

/**
 * 📚 Modelbook Page
 * 
 * Comprehensive modelbook (portfolio book) for models:
 * - Multi-page format with extensive portfolio
 * - Detailed work history and achievements
 * - Professional photos organized by category
 * - Client testimonials and case studies
 * - Downloadable as PDF for presentations
 */

// Mock profile data with extended modelbook content
const MOCK_PROFILE = {
  id: '1',
  firstName: 'Emma',
  lastName: 'Rodriguez',
  email: 'emma.rodriguez@example.com',
  phone: '+1 (555) 123-4567',
  age: 28,
  country: 'United States',
  city: 'New York',
  height: '175 cm / 5\'9"',
  weight: '62 kg / 137 lbs',
  bust: '86 cm / 34"',
  waist: '61 cm / 24"',
  hips: '89 cm / 35"',
  dress: '4 US / 36 EU',
  shoes: '8.5 US / 39 EU',
  eyeColor: 'Hazel',
  hairColor: 'Brown',
  category: 'Fashion Model',
  experience: 'Professional (5+ years)',
  bio: 'Professional fashion model with over 5 years of experience in runway, editorial, and commercial modeling. Specializing in high fashion and luxury brands with a focus on sustainable fashion. Featured in major fashion magazines and worked with renowned photographers worldwide.',
  specialties: ['Fashion Photography', 'Runway Modeling', 'Commercial Photography', 'Editorial Modeling'],
  languages: ['English', 'Spanish', 'French'],
  instagram: '@emma_model_nyc',
  website: 'https://emmamodeling.com',
  isVerified: true,
  rating: 4.9,
  totalBookings: 127,
  
  // Extended modelbook content
  portfolioSections: [
    {
      id: 1,
      title: 'Editorial Work',
      description: 'High fashion editorial shoots for major publications',
      photos: [
        { id: 1, title: 'Vogue Editorial', photographer: 'Mario Testino', year: '2024' },
        { id: 2, title: 'Harper\'s Bazaar', photographer: 'Annie Leibovitz', year: '2023' },
        { id: 3, title: 'Elle Magazine', photographer: 'Steven Meisel', year: '2023' },
        { id: 4, title: 'W Magazine', photographer: 'Craig McDean', year: '2022' },
      ]
    },
    {
      id: 2,
      title: 'Commercial Campaigns',
      description: 'Brand campaigns and commercial photography',
      photos: [
        { id: 5, title: 'Chanel Campaign', photographer: 'Karl Lagerfeld', year: '2024' },
        { id: 6, title: 'Dior Beauty', photographer: 'Patrick Demarchelier', year: '2023' },
        { id: 7, title: 'Gucci Campaign', photographer: 'Glen Luchford', year: '2023' },
        { id: 8, title: 'Versace Ads', photographer: 'Mert & Marcus', year: '2022' },
      ]
    },
    {
      id: 3,
      title: 'Runway Shows',
      description: 'Fashion week and designer runway appearances',
      photos: [
        { id: 9, title: 'Paris Fashion Week', photographer: 'Runway Photos', year: '2024' },
        { id: 10, title: 'Milan Fashion Week', photographer: 'Runway Photos', year: '2024' },
        { id: 11, title: 'New York Fashion Week', photographer: 'Runway Photos', year: '2023' },
        { id: 12, title: 'London Fashion Week', photographer: 'Runway Photos', year: '2023' },
      ]
    },
    {
      id: 4,
      title: 'Beauty & Lifestyle',
      description: 'Beauty campaigns and lifestyle photography',
      photos: [
        { id: 13, title: 'L\'Oréal Campaign', photographer: 'Beauty Team', year: '2024' },
        { id: 14, title: 'Estée Lauder', photographer: 'Beauty Team', year: '2023' },
        { id: 15, title: 'Lifestyle Shoot', photographer: 'Lifestyle Team', year: '2023' },
        { id: 16, title: 'Wellness Brand', photographer: 'Lifestyle Team', year: '2022' },
      ]
    }
  ],
  
  achievements: [
    { year: '2024', title: 'Model of the Year Nominee', organization: 'Fashion Awards' },
    { year: '2023', title: 'Rising Star Award', organization: 'New York Fashion Week' },
    { year: '2023', title: 'Best Editorial Model', organization: 'Fashion Photography Awards' },
    { year: '2022', title: 'Breakthrough Model', organization: 'Vogue Awards' },
  ],
  
  clientList: [
    'Chanel', 'Dior', 'Gucci', 'Versace', 'Prada', 'Louis Vuitton',
    'Hermès', 'Balenciaga', 'Saint Laurent', 'Givenchy', 'Fendi', 'Armani'
  ],
  
  publications: [
    'Vogue US', 'Vogue Paris', 'Harper\'s Bazaar', 'Elle', 'W Magazine',
    'Marie Claire', 'Cosmopolitan', 'Allure', 'Glamour', 'InStyle'
  ],
  
  testimonials: [
    {
      id: 1,
      client: 'Fashion Forward Studio',
      role: 'Creative Director',
      comment: 'Emma brings an incredible professionalism and artistic vision to every shoot. Her ability to interpret direction while adding her own creative flair makes her a standout model.',
      rating: 5,
      date: '2024-01-15'
    },
    {
      id: 2,
      client: 'Luxury Brand Co.',
      role: 'Photography Director',
      comment: 'Working with Emma has been exceptional. She understands the brand vision immediately and delivers consistently stunning results. A true professional.',
      rating: 5,
      date: '2024-01-10'
    },
    {
      id: 3,
      client: 'Elite Fashion House',
      role: 'Brand Manager',
      comment: 'Emma\'s versatility and work ethic are unmatched. From high fashion editorials to commercial campaigns, she adapts perfectly to any brief.',
      rating: 5,
      date: '2023-12-20'
    }
  ]
};

export default function ModelbookPage() {
  const params = useParams();
  const router = useRouter();
  const [profile] = useState(MOCK_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const { trackPageView, trackClick } = useAuditTracking();

  useEffect(() => {
    const loadModelbook = async () => {
      try {
        setIsLoading(true);
        
        trackPageView('modelbook_view', {
          profileId: params.id as string,
          profileName: `${profile.firstName} ${profile.lastName}`,
        });

        // Mock loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In real implementation, fetch modelbook data
        // const response = await fetch(`/api/v1/profiles/${params.id}/modelbook`);
        
      } catch (error) {
        browserLogger.error('Failed to load modelbook', { error, profileId: params.id });
      } finally {
        setIsLoading(false);
      }
    };

    loadModelbook();
  }, [params.id, trackPageView, profile.firstName, profile.lastName]);

  const handleDownloadPDF = () => {
    trackClick('modelbook_pdf_download', {
      profileId: profile.id,
      profileName: `${profile.firstName} ${profile.lastName}`,
    });
    
    browserLogger.userAction('modelbook_pdf_downloaded', {
      profileId: profile.id,
      profileName: `${profile.firstName} ${profile.lastName}`,
    });

    // In real implementation, generate comprehensive PDF modelbook
    alert('PDF download would start here - not implemented in demo');
  };

  const handlePrint = () => {
    trackClick('modelbook_print', { profileId: profile.id });
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading modelbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print-hidden navigation */}
      <div className="print:hidden bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          
          {/* Cover Page */}
          <Card className="overflow-hidden">
            <div className="relative h-96 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="relative h-full flex items-center justify-center text-center text-white">
                <div>
                  <h1 className="text-6xl font-bold mb-4">
                    {profile.firstName}<br />{profile.lastName}
                  </h1>
                  <p className="text-2xl text-gray-300 mb-2">{profile.category}</p>
                  <div className="flex items-center justify-center gap-4 text-lg">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-5 w-5" />
                      {profile.city}, {profile.country}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      {profile.rating} Rating
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <User className="h-6 w-6" />
                About Emma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <p className="text-lg leading-relaxed text-gray-700 mb-6">
                    {profile.bio}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.languages.map((language) => (
                          <Badge key={language} variant="outline">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{profile.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{profile.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-gray-500" />
                        <span>{profile.instagram}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span>Portfolio Website</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Measurements</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Height:</span>
                        <span>{profile.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bust:</span>
                        <span>{profile.bust}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Waist:</span>
                        <span>{profile.waist}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hips:</span>
                        <span>{profile.hips}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dress:</span>
                        <span>{profile.dress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shoes:</span>
                        <span>{profile.shoes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Camera className="h-6 w-6" />
                Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Section Navigation */}
              <div className="flex flex-wrap gap-2 mb-8">
                {profile.portfolioSections.map((section, index) => (
                  <Button
                    key={section.id}
                    variant={activeSection === index ? "default" : "outline"}
                    onClick={() => setActiveSection(index)}
                    className="mb-2"
                  >
                    {section.title}
                  </Button>
                ))}
              </div>

              {/* Active Section Content */}
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {profile.portfolioSections[activeSection].title}
                  </h3>
                  <p className="text-gray-600">
                    {profile.portfolioSections[activeSection].description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.portfolioSections[activeSection].photos.map((photo) => (
                    <div key={photo.id} className="space-y-3">
                      <div className="aspect-[3/4] bg-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <Camera className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-sm font-medium">{photo.title}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium text-gray-900">{photo.title}</h4>
                        <p className="text-sm text-gray-600">Photographer: {photo.photographer}</p>
                        <p className="text-sm text-gray-500">{photo.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Trophy className="h-6 w-6" />
                Achievements & Awards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {profile.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.organization}</p>
                      <p className="text-sm text-gray-500">{achievement.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Client List & Publications */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Client List
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {profile.clientList.map((client, index) => (
                    <div key={index} className="text-sm py-2 px-3 bg-gray-50 rounded">
                      {client}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Publications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {profile.publications.map((publication, index) => (
                    <div key={index} className="text-sm py-2 px-3 bg-gray-50 rounded">
                      {publication}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Testimonials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Heart className="h-6 w-6" />
                Client Testimonials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="p-6 bg-white border rounded-lg shadow-sm">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{testimonial.comment}"</p>
                    <div className="border-t pt-3">
                      <h4 className="font-semibold text-gray-900">{testimonial.client}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(testimonial.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8 border-t">
            <p className="text-gray-600 mb-2">
              Professional Modelbook • {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-gray-500">
              Generated {new Date().toLocaleDateString()} • For booking inquiries: {profile.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
