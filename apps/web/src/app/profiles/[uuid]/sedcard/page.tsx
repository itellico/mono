'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  Ruler,
  Eye,
  Palette,
  Calendar,
  Star,
  Award,
  Camera,
  Instagram,
  Globe
} from 'lucide-react';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

/**
 * 📄 Sedcard Page
 * 
 * Professional sedcard (composite card) layout for models:
 * - Single page format optimized for printing
 * - Essential model information and measurements
 * - Professional photos in standard sedcard layout
 * - Downloadable as PDF for industry use
 */

// Mock profile data - same as profile page
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
  availability: 'Full-time',
  hourlyRate: '$250/hour',
  bio: 'Professional fashion model with over 5 years of experience in runway, editorial, and commercial modeling. Specializing in high fashion and luxury brands.',
  specialties: ['Fashion Photography', 'Runway Modeling', 'Commercial Photography', 'Editorial Modeling'],
  languages: ['English', 'Spanish', 'French'],
  instagram: '@emma_model_nyc',
  website: 'https://emmamodeling.com',
  isVerified: true,
  rating: 4.9,
  totalBookings: 127,
  
  // Sedcard specific photos - typically 4-6 photos showing different looks
  sedcardPhotos: [
    { id: 1, type: 'headshot', title: 'Professional Headshot', description: 'Clean beauty shot' },
    { id: 2, type: 'full-body', title: 'Full Body Shot', description: 'Fashion pose in jeans' },
    { id: 3, type: 'fashion', title: 'Fashion Editorial', description: 'High fashion look' },
    { id: 4, type: 'commercial', title: 'Commercial Style', description: 'Approachable smile' },
    { id: 5, type: 'lifestyle', title: 'Lifestyle Shot', description: 'Casual outdoor look' },
  ]
};

export default function SedcardPage() {
  const params = useParams();
  const router = useRouter();
  const [profile] = useState(MOCK_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const { trackPageView, trackClick } = useAuditTracking();

  useEffect(() => {
    const loadSedcard = async () => {
      try {
        setIsLoading(true);
        
        trackPageView('sedcard_view', {
          profileId: params.id as string,
          profileName: `${profile.firstName} ${profile.lastName}`,
        });

        // Mock loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In real implementation, fetch sedcard data
        // const response = await fetch(`/api/v1/profiles/${params.id}/sedcard`);
        
      } catch (error) {
        browserLogger.error('Failed to load sedcard', { error, profileId: params.id });
      } finally {
        setIsLoading(false);
      }
    };

    loadSedcard();
  }, [params.id, trackPageView, profile.firstName, profile.lastName]);

  const handleDownloadPDF = () => {
    trackClick('sedcard_pdf_download', {
      profileId: profile.id,
      profileName: `${profile.firstName} ${profile.lastName}`,
    });
    
    browserLogger.userAction('sedcard_pdf_downloaded', {
      profileId: profile.id,
      profileName: `${profile.firstName} ${profile.lastName}`,
    });

    // In real implementation, generate and download PDF
    // This would call an API endpoint that generates a PDF using libraries like:
    // - Puppeteer (headless browser)
    // - jsPDF (client-side PDF generation)
    // - Server-side PDF generation with proper fonts and layout
    
    alert('PDF download would start here - not implemented in demo');
  };

  const handlePrint = () => {
    trackClick('sedcard_print', { profileId: profile.id });
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sedcard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
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

      {/* Sedcard Layout - Optimized for A4 printing */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 print:p-4 print:max-w-none">
        <div className="space-y-6">
          
          {/* Header Section */}
          <div className="text-center border-b pb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {profile.firstName} {profile.lastName}
            </h1>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge className="bg-gray-900 text-white">
                {profile.category}
              </Badge>
              {profile.isVerified && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Award className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {profile.city}, {profile.country}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {profile.rating} Rating
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-3 gap-6">
            
            {/* Left Column - Photos */}
            <div className="col-span-2 space-y-4">
              {/* Main Photo */}
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Camera className="h-16 w-16 mx-auto mb-2" />
                  <p className="text-sm">Main Portfolio Photo</p>
                  <p className="text-xs">{profile.sedcardPhotos[0]?.title}</p>
                </div>
              </div>
              
              {/* Secondary Photos Grid */}
              <div className="grid grid-cols-2 gap-2">
                {profile.sedcardPhotos.slice(1, 5).map((photo) => (
                  <div key={photo.id} className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Camera className="h-8 w-8 mx-auto mb-1" />
                      <p className="text-xs">{photo.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Information */}
            <div className="space-y-6">
              
              {/* Contact Information */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-gray-500" />
                      <span className="text-xs">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-500" />
                      <span className="text-xs">{profile.phone}</span>
                    </div>
                    {profile.instagram && (
                      <div className="flex items-center gap-2">
                        <Instagram className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">{profile.instagram}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-gray-500" />
                        <span className="text-xs">Portfolio</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Measurements */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Measurements
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Height:</span>
                      <span className="font-medium">{profile.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium">{profile.weight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bust:</span>
                      <span className="font-medium">{profile.bust}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waist:</span>
                      <span className="font-medium">{profile.waist}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hips:</span>
                      <span className="font-medium">{profile.hips}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dress:</span>
                      <span className="font-medium">{profile.dress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shoes:</span>
                      <span className="font-medium">{profile.shoes}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Physical Features */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Features
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Eyes:</span>
                      <span className="font-medium">{profile.eyeColor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hair:</span>
                      <span className="font-medium">{profile.hairColor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{profile.age}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Info */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Professional
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Experience:</span>
                      <span className="font-medium text-xs">{profile.experience}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate:</span>
                      <span className="font-medium text-green-600">{profile.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bookings:</span>
                      <span className="font-medium">{profile.totalBookings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Specialties */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Specialties</h3>
                  <div className="flex flex-wrap gap-1">
                    {profile.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs px-2 py-1">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Languages</h3>
                  <div className="flex flex-wrap gap-1">
                    {profile.languages.map((language) => (
                      <Badge key={language} variant="secondary" className="text-xs px-2 py-1">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-center text-xs text-gray-500">
            <p>Professional Sedcard • Generated {new Date().toLocaleDateString()}</p>
            <p className="mt-1">For booking inquiries: {profile.email} • {profile.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
