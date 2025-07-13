'use client';

/**
 * Model Profile View Component
 * 
 * Displays Model professional profiles in a clean, organized layout
 * Shows all profile information including measurements, experience, and portfolio
 */

import React from 'react';
import { ProfessionalProfile } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Star, 
  Verified, 
  Heart,
  Share,
  Edit,
  Camera
} from 'lucide-react';
import { ModelIndustryData } from '@/lib/schemas/professional-profiles';

interface ModelProfileViewProps {
  profile: ProfessionalProfile & {
    user: {
      id: number;
      firstName: string | null;
      lastName: string | null;
      username: string | null;
      profilePhotoUrl: string | null;
      bio: string | null;
    };
    tenant: {
      id: number;
      name: string;
      domain: string;
    };
    media?: Array<{
      id: number;
      url: string;
      caption?: string | null;
      featured: boolean;
    }>;
    verifications?: Array<{
      id: number;
      verificationType: string;
      status: string;
    }>;
  };
  isOwner?: boolean;
  onEdit?: () => void;
  onContact?: () => void;
}

export default function ModelProfileView({ 
  profile, 
  isOwner = false, 
  onEdit, 
  onContact 
}: ModelProfileViewProps) {
  const industryData = profile.industryData as ModelIndustryData;
  const user = profile.user;
  
  const displayName = profile.professionalName || 
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username);

  const formatMeasurement = (measurement: any) => {
    if (!measurement?.value) return 'Not specified';
    return `${measurement.value}${measurement.unit || 'cm'}`;
  };

  const getVerificationBadge = () => {
    if (profile.verificationStatus === 'VERIFIED') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <Verified className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="relative">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                <Avatar className="w-32 h-32 mx-auto md:mx-0">
                  <AvatarImage 
                    src={user.profilePhotoUrl || '/api/placeholder/128/128'} 
                    alt={displayName || 'Profile'} 
                  />
                  <AvatarFallback className="text-2xl">
                    {displayName?.slice(0, 2)?.toUpperCase() || 'MP'}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">{displayName}</h1>
                    {profile.tagline && (
                      <p className="text-lg text-muted-foreground mt-1">{profile.tagline}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {getVerificationBadge()}
                      {profile.featured && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {profile.yearsExperience && profile.yearsExperience > 0 && (
                        <Badge variant="outline">
                          {profile.yearsExperience} years experience
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4 md:mt-0">
                    {isOwner ? (
                      <Button onClick={onEdit} variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button onClick={onContact}>
                          <Mail className="w-4 h-4 mr-2" />
                          Contact
                        </Button>
                        <Button variant="outline" size="icon">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Share className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact & Location Info */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile.baseLocation && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.baseLocation}
                    </div>
                  )}
                  {profile.professionalEmail && !isOwner && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {profile.professionalEmail}
                    </div>
                  )}
                  {profile.websiteUrl && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" 
                         className="hover:underline">
                        Portfolio Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Profile Completion */}
                {isOwner && profile.completionPercentage !== null && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Profile Completion</span>
                      <span className="text-sm text-muted-foreground">
                        {profile.completionPercentage}%
                      </span>
                    </div>
                    <Progress value={profile.completionPercentage} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Images */}
          {profile.media && profile.media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.media.map((image) => (
                    <div key={image.id} className="aspect-square relative group overflow-hidden rounded-lg">
                      <img
                        src={image.url}
                        alt={image.caption || 'Portfolio image'}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {image.featured && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="bg-white/90">
                            Featured
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          {industryData?.experience && (
            <Card>
              <CardHeader>
                <CardTitle>Experience & Background</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {industryData.experience.modelingSince && (
                  <div>
                    <h4 className="font-medium mb-2">Modeling Since</h4>
                    <p className="text-muted-foreground">{industryData.experience.modelingSince}</p>
                  </div>
                )}

                {industryData.experience.campaignTypes && industryData.experience.campaignTypes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Campaign Types</h4>
                    <div className="flex flex-wrap gap-1">
                      {industryData.experience.campaignTypes.map((type) => (
                        <Badge key={type} variant="outline">{type}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {industryData.experience.runwayExperience && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Runway Experience
                      </Badge>
                    </div>
                  )}
                  {industryData.experience.printExperience && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        Print Experience
                      </Badge>
                    </div>
                  )}
                  {industryData.experience.commercialExperience && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        Commercial Experience
                      </Badge>
                    </div>
                  )}
                  {industryData.experience.editorialExperience && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        Editorial Experience
                      </Badge>
                    </div>
                  )}
                </div>

                {industryData.experience.notableClients && industryData.experience.notableClients.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Notable Clients</h4>
                    <ul className="text-muted-foreground">
                      {industryData.experience.notableClients.map((client, index) => (
                        <li key={index}>• {client}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {industryData.experience.publications && industryData.experience.publications.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Publications</h4>
                    <ul className="text-muted-foreground">
                      {industryData.experience.publications.map((pub, index) => (
                        <li key={index}>• {pub}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Work Preferences */}
          {industryData?.preferences && (
            <Card>
              <CardHeader>
                <CardTitle>Work Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {industryData.preferences.workTypes && industryData.preferences.workTypes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Preferred Work Types</h4>
                    <div className="flex flex-wrap gap-1">
                      {industryData.preferences.workTypes.map((type) => (
                        <Badge key={type} variant="default">{type}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${industryData.preferences.travelAvailable ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Travel Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${industryData.preferences.overnightShoots ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Overnight Shoots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${industryData.preferences.weekendAvailable ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Weekend Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${industryData.preferences.shortNotice ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Short Notice</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Measurements */}
          {industryData?.measurements && (
            <Card>
              <CardHeader>
                <CardTitle>Measurements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {industryData.measurements.height && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Height:</span>
                    <span className="font-medium">{formatMeasurement(industryData.measurements.height)}</span>
                  </div>
                )}
                {industryData.measurements.weight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{formatMeasurement(industryData.measurements.weight)}</span>
                  </div>
                )}
                {industryData.measurements.bust && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bust:</span>
                    <span className="font-medium">{formatMeasurement(industryData.measurements.bust)}</span>
                  </div>
                )}
                {industryData.measurements.waist && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Waist:</span>
                    <span className="font-medium">{formatMeasurement(industryData.measurements.waist)}</span>
                  </div>
                )}
                {industryData.measurements.hips && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hips:</span>
                    <span className="font-medium">{formatMeasurement(industryData.measurements.hips)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Physical Attributes */}
          {industryData?.physicalAttributes && (
            <Card>
              <CardHeader>
                <CardTitle>Physical Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {industryData.physicalAttributes.hairColor && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hair:</span>
                    <span className="font-medium">{industryData.physicalAttributes.hairColor}</span>
                  </div>
                )}
                {industryData.physicalAttributes.eyeColor && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eyes:</span>
                    <span className="font-medium">{industryData.physicalAttributes.eyeColor}</span>
                  </div>
                )}
                {industryData.physicalAttributes.skinTone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skin Tone:</span>
                    <span className="font-medium">{industryData.physicalAttributes.skinTone}</span>
                  </div>
                )}
                {industryData.physicalAttributes.build && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Build:</span>
                    <span className="font-medium">{industryData.physicalAttributes.build}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline">{profile.availabilityType}</Badge>
              </div>
              {profile.travelRadius && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Travel Radius:</span>
                  <span className="font-medium">{profile.travelRadius} miles</span>
                </div>
              )}
              {profile.travelInternationally && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">International:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Available</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profile Views:</span>
                <span className="font-medium">{profile.profileViews || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">
                  {new Date(profile.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since:</span>
                <span className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}