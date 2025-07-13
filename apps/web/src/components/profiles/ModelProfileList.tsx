'use client';

/**
 * Model Profile List Component
 * 
 * Displays a searchable, filterable list of Model professional profiles
 * Includes advanced search filters and grid/list view options
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfessionalProfile, ProfileType } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  MapPin, 
  Star, 
  Verified, 
  ChevronDown,
  SlidersHorizontal,
  Heart
} from 'lucide-react';
import { ModelSearchFilters, ModelSearchFiltersSchema } from '@/lib/schemas/professional-profiles';
import { professionalProfilesService } from '@/lib/services/professional-profiles.service';

interface ModelProfileListProps {
  tenantId: number;
  onProfileClick: (profile: ProfessionalProfile) => void;
  showCreateButton?: boolean;
  onCreateProfile?: () => void;
}

type ViewMode = 'grid' | 'list';

const hairColors = [
  'Black', 'Brown', 'Blonde', 'Red', 'Auburn', 'Gray', 'White', 
  'Platinum', 'Strawberry Blonde', 'Other'
];

const eyeColors = [
  'Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Other'
];

const skinTones = [
  'Very Fair', 'Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Dark', 'Deep'
];

const experienceTypes = [
  'fashion', 'commercial', 'lifestyle', 'beauty', 'fitness', 
  'lingerie', 'swimwear', 'artistic', 'editorial', 'beauty'
];

export default function ModelProfileList({
  tenantId,
  onProfileClick,
  showCreateButton = false,
  onCreateProfile,
}: ModelProfileListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ModelSearchFilters>({});
  
  // Search and filter state
  const [location, setLocation] = useState('');
  const [heightMin, setHeightMin] = useState<number | undefined>();
  const [heightMax, setHeightMax] = useState<number | undefined>();
  const [selectedHairColors, setSelectedHairColors] = useState<string[]>([]);
  const [selectedEyeColors, setSelectedEyeColors] = useState<string[]>([]);
  const [selectedSkinTones, setSelectedSkinTones] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  // Update filters when filter state changes
  useEffect(() => {
    const newFilters: ModelSearchFilters = {
      location: location || undefined,
      heightMin,
      heightMax,
      hairColor: selectedHairColors.length > 0 ? selectedHairColors : undefined,
      eyeColor: selectedEyeColors.length > 0 ? selectedEyeColors : undefined,
      skinTone: selectedSkinTones.length > 0 ? selectedSkinTones : undefined,
      experience: selectedExperience.length > 0 ? selectedExperience : undefined,
      verified: verifiedOnly || undefined,
      featured: featuredOnly || undefined,
    };
    
    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, value]) => value !== undefined)
    );
    
    setFilters(cleanFilters as ModelSearchFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, [location, heightMin, heightMax, selectedHairColors, selectedEyeColors, selectedSkinTones, selectedExperience, verifiedOnly, featuredOnly]);

  // Fetch profiles with search and filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['model-profiles', tenantId, filters, currentPage, searchQuery],
    queryFn: async () => {
      return await professionalProfilesService.searchProfiles(
        filters,
        ProfileType.MODEL,
        tenantId,
        currentPage,
        20
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const clearFilters = () => {
    setLocation('');
    setHeightMin(undefined);
    setHeightMax(undefined);
    setSelectedHairColors([]);
    setSelectedEyeColors([]);
    setSelectedSkinTones([]);
    setSelectedExperience([]);
    setVerifiedOnly(false);
    setFeaturedOnly(false);
  };

  const toggleArrayValue = (array: string[], value: string, setter: (newArray: string[]) => void) => {
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
    setter(newArray);
  };

  const renderProfileCard = (profile: ProfessionalProfile & { 
    user: { firstName: string | null; lastName: string | null; profilePhotoUrl: string | null; };
    media?: Array<{ url: string; featured: boolean; }>;
  }) => {
    const displayName = profile.professionalName || 
      (profile.user.firstName && profile.user.lastName ? 
        `${profile.user.firstName} ${profile.user.lastName}` : 
        'Model Profile');

    const featuredImage = profile.media?.find(m => m.featured)?.url || 
      profile.user.profilePhotoUrl || 
      '/api/placeholder/300/400';

    return (
      <Card 
        key={profile.id} 
        className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
        onClick={() => onProfileClick(profile)}
      >
        <CardContent className="p-0">
          {viewMode === 'grid' ? (
            <div>
              {/* Image */}
              <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                <img
                  src={featuredImage}
                  alt={displayName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {profile.featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {profile.verificationStatus === 'VERIFIED' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Verified className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
                <div className="absolute bottom-2 right-2">
                  <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2">
                <div>
                  <h3 className="font-semibold text-lg truncate">{displayName}</h3>
                  {profile.tagline && (
                    <p className="text-sm text-muted-foreground truncate">{profile.tagline}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {profile.baseLocation && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{profile.baseLocation}</span>
                    </div>
                  )}
                </div>

                {/* Quick stats */}
                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-muted-foreground">
                    {profile.yearsExperience ? `${profile.yearsExperience} years` : 'New'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {profile.completionPercentage}% complete
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // List view
            <div className="p-4 flex gap-4">
              <Avatar className="w-16 h-16 flex-shrink-0">
                <AvatarImage src={featuredImage} alt={displayName} />
                <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg truncate">{displayName}</h3>
                    {profile.tagline && (
                      <p className="text-sm text-muted-foreground truncate">{profile.tagline}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    {profile.featured && (
                      <Badge variant="outline" className="text-yellow-600">Featured</Badge>
                    )}
                    {profile.verificationStatus === 'VERIFIED' && (
                      <Badge variant="outline" className="text-green-600">Verified</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {profile.baseLocation && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.baseLocation}
                    </div>
                  )}
                  {profile.yearsExperience && (
                    <span>{profile.yearsExperience} years experience</span>
                  )}
                  <span>{profile.completionPercentage}% complete</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Model Profiles</h1>
          <p className="text-muted-foreground">
            {data?.pagination.total || 0} models found
          </p>
        </div>

        <div className="flex items-center gap-2">
          {showCreateButton && onCreateProfile && (
            <Button onClick={onCreateProfile}>
              Create Profile
            </Button>
          )}
          
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search models by name, location, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {Object.keys(filters).length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {Object.keys(filters).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Advanced Filters</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Location */}
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, State, Country"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  {/* Height Range */}
                  <div>
                    <Label>Height Range (cm)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Min"
                        type="number"
                        value={heightMin || ''}
                        onChange={(e) => setHeightMin(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                      <Input
                        placeholder="Max"
                        type="number"
                        value={heightMax || ''}
                        onChange={(e) => setHeightMax(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified"
                        checked={verifiedOnly}
                        onCheckedChange={setVerifiedOnly}
                      />
                      <Label htmlFor="verified">Verified Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={featuredOnly}
                        onCheckedChange={setFeaturedOnly}
                      />
                      <Label htmlFor="featured">Featured Only</Label>
                    </div>
                  </div>
                </div>

                {/* Hair Color */}
                <div>
                  <Label>Hair Color</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hairColors.map((color) => (
                      <Badge
                        key={color}
                        variant={selectedHairColors.includes(color) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue(selectedHairColors, color, setSelectedHairColors)}
                      >
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Experience Types */}
                <div>
                  <Label>Experience Types</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {experienceTypes.map((type) => (
                      <Badge
                        key={type}
                        variant={selectedExperience.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayValue(selectedExperience, type, setSelectedExperience)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Results */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-0">
                  <div className="aspect-[3/4] bg-gray-200 rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Error loading profiles. Please try again.</p>
          </div>
        ) : data?.profiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No models found matching your criteria.</p>
            {Object.keys(filters).length > 0 && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {data?.profiles.map((profile) => renderProfileCard(profile))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm">
            Page {currentPage} of {data.pagination.pages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === data.pagination.pages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}