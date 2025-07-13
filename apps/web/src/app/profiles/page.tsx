'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  MapPin, 
  Star,
  Award,
  Search,
  Filter,
  Eye,
  Heart,
  Download,
  Plus,
  Grid,
  List
} from 'lucide-react';
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

/**
 * 👥 Profiles Index Page
 * 
 * Browse and discover model profiles with:
 * - Search and filtering capabilities
 * - Grid and list view options
 * - Quick actions (view, sedcard, modelbook)
 * - Integration with your existing search system
 */

// Mock profiles data
const MOCK_PROFILES = [
  {
    id: '1',
    firstName: 'Emma',
    lastName: 'Rodriguez',
    category: 'Fashion Model',
    city: 'New York',
    country: 'United States',
    height: '175 cm',
    eyeColor: 'Hazel',
    hairColor: 'Brown',
    experience: 'Professional (5+ years)',
    hourlyRate: '$250/hour',
    rating: 4.9,
    totalBookings: 127,
    isVerified: true,
    profileImage: '/api/placeholder/300/400',
    specialties: ['Fashion Photography', 'Runway Modeling'],
    bio: 'Professional fashion model with over 5 years of experience...'
  },
  {
    id: '2',
    firstName: 'Sofia',
    lastName: 'Chen',
    category: 'Commercial Model',
    city: 'Los Angeles',
    country: 'United States',
    height: '168 cm',
    eyeColor: 'Brown',
    hairColor: 'Black',
    experience: 'Intermediate (2-5 years)',
    hourlyRate: '$180/hour',
    rating: 4.7,
    totalBookings: 89,
    isVerified: true,
    profileImage: '/api/placeholder/300/400',
    specialties: ['Commercial Photography', 'Lifestyle Modeling'],
    bio: 'Versatile commercial model specializing in lifestyle brands...'
  },
  {
    id: '3',
    firstName: 'Marcus',
    lastName: 'Johnson',
    category: 'Fitness Model',
    city: 'Miami',
    country: 'United States',
    height: '185 cm',
    eyeColor: 'Blue',
    hairColor: 'Blonde',
    experience: 'Professional (5+ years)',
    hourlyRate: '$200/hour',
    rating: 4.8,
    totalBookings: 156,
    isVerified: false,
    profileImage: '/api/placeholder/300/400',
    specialties: ['Fitness Photography', 'Athletic Wear'],
    bio: 'Dedicated fitness model with extensive experience in sports...'
  },
  {
    id: '4',
    firstName: 'Isabella',
    lastName: 'Rossi',
    category: 'Editorial Model',
    city: 'Milan',
    country: 'Italy',
    height: '178 cm',
    eyeColor: 'Green',
    hairColor: 'Red',
    experience: 'Expert (10+ years)',
    hourlyRate: '$300/hour',
    rating: 4.9,
    totalBookings: 203,
    isVerified: true,
    profileImage: '/api/placeholder/300/400',
    specialties: ['Editorial Photography', 'High Fashion'],
    bio: 'International editorial model with extensive magazine experience...'
  }
];

const CATEGORIES = [
  'All Categories',
  'Fashion Model',
  'Commercial Model',
  'Fitness Model',
  'Editorial Model',
  'Runway Model',
  'Glamour Model'
];

const EXPERIENCE_LEVELS = [
  'All Levels',
  'Beginner (0-2 years)',
  'Intermediate (2-5 years)',
  'Professional (5+ years)',
  'Expert (10+ years)'
];

export default function ProfilesIndexPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [filteredProfiles, setFilteredProfiles] = useState(MOCK_PROFILES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedExperience, setSelectedExperience] = useState('All Levels');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const { trackPageView, trackClick, trackSearch } = useAuditTracking();

  usePageTracking('profiles_browse');

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setIsLoading(true);
        
        trackPageView('profiles_browse', {
          totalProfiles: profiles.length,
        });

        // Mock loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In real implementation:
        // const response = await fetch('/api/v1/profiles');
        // const profilesData = await response.json();
        // setProfiles(profilesData);
        
      } catch (error) {
        browserLogger.error('Failed to load profiles', { error });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfiles();
  }, [trackPageView, profiles.length]);

  // Filter profiles based on search and filters
  useEffect(() => {
    let filtered = profiles;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(profile =>
        `${profile.firstName} ${profile.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.specialties.some(specialty => specialty.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(profile => profile.category === selectedCategory);
    }

    // Experience filter
    if (selectedExperience !== 'All Levels') {
      filtered = filtered.filter(profile => profile.experience === selectedExperience);
    }

    setFilteredProfiles(filtered);

    // Track search if query exists
    if (searchQuery) {
      trackSearch('profiles', {
        query: searchQuery,
        category: selectedCategory,
        experience: selectedExperience,
        resultCount: filtered.length,
      });
    }
  }, [searchQuery, selectedCategory, selectedExperience, profiles, trackSearch]);

  const handleProfileClick = (profileId: string) => {
    trackClick('profile_view', { profileId });
    router.push(`/profiles/${profileId}`);
  };

  const handleSedcardClick = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    trackClick('sedcard_view', { profileId });
    router.push(`/profiles/${profileId}/sedcard`);
  };

  const handleModelbookClick = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    trackClick('modelbook_view', { profileId });
    router.push(`/profiles/${profileId}/modelbook`);
  };

  const handleCreateProfile = () => {
    trackClick('profile_create_start');
    router.push('/profiles/create');
  };

  const renderGridView = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredProfiles.map((profile) => (
        <Card 
          key={profile.id} 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleProfileClick(profile.id)}
        >
          <div className="aspect-[3/4] bg-gray-200 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <User className="h-16 w-16" />
            </div>
            {profile.isVerified && (
              <Badge className="absolute top-2 left-2 bg-blue-100 text-blue-800">
                <Award className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            <div className="absolute top-2 right-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-white/80">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-lg">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{profile.category}</p>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {profile.city}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {profile.rating}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Height:</span>
                <span className="font-medium">{profile.height}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium text-green-600">{profile.hourlyRate}</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={(e) => handleSedcardClick(profile.id, e)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Sedcard
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={(e) => handleModelbookClick(profile.id, e)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Book
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredProfiles.map((profile) => (
        <Card 
          key={profile.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleProfileClick(profile.id)}
        >
          <CardContent className="p-6">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-20 w-20">
                  <AvatarFallback>
                    {profile.firstName[0]}{profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-grow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold">
                        {profile.firstName} {profile.lastName}
                      </h3>
                      {profile.isVerified && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          <Award className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{profile.category}</p>
                    <p className="text-sm text-gray-600 mb-3 max-w-2xl">{profile.bio}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.city}, {profile.country}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {profile.rating} ({profile.totalBookings} bookings)
                      </div>
                      <span>Height: {profile.height}</span>
                      <span>Experience: {profile.experience}</span>
                      <span className="text-green-600 font-medium">{profile.hourlyRate}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => handleSedcardClick(profile.id, e)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Sedcard
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => handleModelbookClick(profile.id, e)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Modelbook
                    </Button>
                    <Button size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Model Profiles</h1>
            <p className="text-muted-foreground mt-2">
              Discover talented models for your next project
            </p>
          </div>
          <Button onClick={handleCreateProfile}>
            <Plus className="h-4 w-4 mr-2" />
            Create Profile
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, category, location, or specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredProfiles.length} of {profiles.length} profiles
          </p>
        </div>

        {/* Profiles Display */}
        {filteredProfiles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No profiles found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
                setSelectedExperience('All Levels');
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          viewMode === 'grid' ? renderGridView() : renderListView()
        )}
      </div>
    </div>
  );
}
