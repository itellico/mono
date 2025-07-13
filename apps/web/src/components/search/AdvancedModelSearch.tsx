'use client';
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionGate } from '@/components/reusable/PermissionGate';
import { useTenantContext } from '@/hooks/use-tenant-context';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Ruler,
  Users,
  Star,
  Eye,
  Heart,
  Camera,
  User,
  Briefcase,
  Award,
  Clock,
  SlidersHorizontal,
  Grid,
  List
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';
interface ModelProfile {
  id: string;
  userId: string;
  name: string;
  stageName?: string;
  avatar: string;
  location: string;
  country: string;
  age: number;
  height: number;
  experience: string;
  specialties: string[];
  portfolioImages: string[];
  totalViews: number;
  totalLikes: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  priceRange: string;
  lastActive: Date;
  joinedDate: Date;
  completionPercentage: number;
  languages: string[];
  workTypes: string[];
}
interface SearchFilters {
  query: string;
  location: string;
  country: string;
  ageRange: [number, number];
  heightRange: [number, number];
  experience: string[];
  specialties: string[];
  workTypes: string[];
  languages: string[];
  availability: string;
  priceRange: string;
  rating: number;
  verified: boolean;
  hasPortfolio: boolean;
  recentlyActive: boolean;
  sortBy: string;
}
interface AdvancedModelSearchProps {
  showFilters?: boolean;
  showSorting?: boolean;
  viewMode?: 'grid' | 'list';
  maxResults?: number;
  className?: string;
  onModelSelect?: (model: ModelProfile) => void;
  initialFilters?: Partial<SearchFilters>;
  context?: 'public' | 'casting' | 'admin';
}
const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Experienced', 'Professional'];
const SPECIALTIES = [
  'Fashion', 'Commercial', 'Editorial', 'Beauty', 'Fitness', 'Lifestyle',
  'Portrait', 'Runway', 'Hand Model', 'Plus Size', 'Petite', 'Alternative'
];
const WORK_TYPES = [
  'Photography', 'Video', 'Runway', 'Events', 'Promotional', 'Trade Shows',
  'E-commerce', 'Catalog', 'Art', 'Glamour'
];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese'];
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating-desc', label: 'Highest Rated' },
  { value: 'views-desc', label: 'Most Viewed' },
  { value: 'recent', label: 'Recently Active' },
  { value: 'newest', label: 'Newest Profiles' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'location', label: 'Nearest to Me' }
];
export const AdvancedModelSearch: React.FC<AdvancedModelSearchProps> = ({
  showFilters = true,
  showSorting = true,
  viewMode: initialViewMode = 'grid',
  maxResults = 50,
  className = '',
  onModelSelect,
  initialFilters = {},
  context = 'public'
}) => {
  const t = useTranslations('model-search');
  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    country: '',
    ageRange: [18, 65],
    heightRange: [150, 200],
    experience: [],
    specialties: [],
    workTypes: [],
    languages: [],
    availability: 'all',
    priceRange: 'all',
    rating: 0,
    verified: false,
    hasPortfolio: false,
    recentlyActive: false,
    sortBy: 'relevance',
    ...initialFilters
  });
  // Debounced search query
  const debouncedQuery = useDebounce(filters.query, 300);
  // Data fetching
  const { data: searchResults = [], isLoading, error } = useQuery({
    queryKey: ['model-search', debouncedQuery, filters, maxResults],
    queryFn: async () => {
      const params = new URLSearchParams({
        query: debouncedQuery,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value && value !== 'all' && value !== '' && value !== false && value !== 0) {
            if (Array.isArray(value)) {
              if (value.length > 0) {
                acc[key] = value.join(',');
              }
            } else if (key === 'ageRange' || key === 'heightRange') {
              acc[key] = value.join('-');
            } else {
              acc[key] = value.toString();
            }
          }
          return acc;
        }, {} as Record<string, string>),
        limit: maxResults.toString(),
        context
      });
      const response = await fetch(`/api/search/models?${params}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: debouncedQuery.length >= 2 || Object.values(filters).some(v => 
      Array.isArray(v) ? v.length > 0 : v !== '' && v !== 'all' && v !== false && v !== 0
    )
  });
  // Filter update handlers
  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  const toggleArrayFilter = useCallback((key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).includes(value)
        ? (prev[key] as string[]).filter(item => item !== value)
        : [...(prev[key] as string[]), value]
    }));
  }, []);
  const clearAllFilters = useCallback(() => {
    setFilters({
      query: '',
      location: '',
      country: '',
      ageRange: [18, 65],
      heightRange: [150, 200],
      experience: [],
      specialties: [],
      workTypes: [],
      languages: [],
      availability: 'all',
      priceRange: 'all',
      rating: 0,
      verified: false,
      hasPortfolio: false,
      recentlyActive: false,
      sortBy: 'relevance'
    });
  }, []);
  // Active filters count
  const activeFiltersCount = (() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.location) count++;
    if (filters.country) count++;
    if (filters.experience.length > 0) count++;
    if (filters.specialties.length > 0) count++;
    if (filters.workTypes.length > 0) count++;
    if (filters.languages.length > 0) count++;
    if (filters.availability !== 'all') count++;
    if (filters.priceRange !== 'all') count++;
    if (filters.rating > 0) count++;
    if (filters.verified) count++;
    if (filters.hasPortfolio) count++;
    if (filters.recentlyActive) count++;
    return count;
  })();
  // Render functions
  const renderSearchBar = () => (
    <div className="flex items-center space-x-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          placeholder={t('searchPlaceholder')}
          value={filters.query}
          onChange={(e) => updateFilter('query', e.target.value)}
          className="pl-12 text-lg h-12"
        />
      </div>
      <Button
        variant={showAdvancedFilters ? 'default' : 'outline'}
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        className="h-12 px-6"
      >
        <SlidersHorizontal className="mr-2 h-5 w-5" />
        {t('globalSearch.filters')}
        {activeFiltersCount > 0 && (
          <Badge className="ml-2 bg-primary-foreground text-primary">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>
      {showSorting && (
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
          <SelectTrigger className="w-48 h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex border rounded-lg p-1">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grid')}
          className="h-10"
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="h-10"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
  const renderAdvancedFilters = () => {
    if (!showAdvancedFilters) return null;
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Advanced Filters</span>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All ({activeFiltersCount})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                <MapPin className="inline mr-1 h-4 w-4" />
                City/Location
              </label>
              <Input
                placeholder="Enter city or location"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select value={filters.country} onValueChange={(value) => updateFilter('country', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="IT">Italy</SelectItem>
                  <SelectItem value="ES">Spain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Age and Height Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-3 block">
                <Calendar className="inline mr-1 h-4 w-4" />
                Age Range: {filters.ageRange[0]} - {filters.ageRange[1]} years
              </label>
              <Slider
                value={filters.ageRange}
                onValueChange={(value) => updateFilter('ageRange', value)}
                min={18}
                max={65}
                step={1}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-3 block">
                <Ruler className="inline mr-1 h-4 w-4" />
                Height Range: {filters.heightRange[0]} - {filters.heightRange[1]} cm
              </label>
              <Slider
                value={filters.heightRange}
                onValueChange={(value) => updateFilter('heightRange', value)}
                min={150}
                max={200}
                step={1}
                className="w-full"
              />
            </div>
          </div>
          {/* Experience and Specialties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-3 block">
                <Award className="inline mr-1 h-4 w-4" />
                Experience Level
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map(level => (
                  <Badge
                    key={level}
                    variant={filters.experience.includes(level) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayFilter('experience', level)}
                  >
                    {level}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-3 block">
                <Camera className="inline mr-1 h-4 w-4" />
                Specialties
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {SPECIALTIES.map(specialty => (
                  <Badge
                    key={specialty}
                    variant={filters.specialties.includes(specialty) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleArrayFilter('specialties', specialty)}
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          {/* Additional Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={filters.verified}
                onCheckedChange={(checked) => updateFilter('verified', checked)}
              />
              <label htmlFor="verified" className="text-sm cursor-pointer">
                Verified Models
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPortfolio"
                checked={filters.hasPortfolio}
                onCheckedChange={(checked) => updateFilter('hasPortfolio', checked)}
              />
              <label htmlFor="hasPortfolio" className="text-sm cursor-pointer">
                Has Portfolio
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recentlyActive"
                checked={filters.recentlyActive}
                onCheckedChange={(checked) => updateFilter('recentlyActive', checked)}
              />
              <label htmlFor="recentlyActive" className="text-sm cursor-pointer">
                Recently Active
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  const renderModelCard = (model: ModelProfile) => {
    const cardContent = (
      <div className="group relative">
        <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-gray-100">
          <img
            src={model.portfolioImages[0] || model.avatar}
            alt={model.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-2">
                <Button variant="secondary" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {/* Status badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {model.isVerified && (
              <Badge className="bg-blue-500 text-white text-xs">
                <Star className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {model.isAvailable && (
              <Badge className="bg-green-500 text-white text-xs">
                Available
              </Badge>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <Badge className="bg-black/60 text-white text-xs">
              {model.portfolioImages.length} photos
            </Badge>
          </div>
        </div>
        {/* Model info */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg truncate">
              {model.stageName || model.name}
            </h3>
            <div className="flex items-center text-sm text-yellow-600">
              <Star className="h-4 w-4 mr-1 fill-current" />
              {model.rating.toFixed(1)}
            </div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            {model.location}, {model.country}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
            <span>{model.age} years • {model.height}cm</span>
            <span className="font-medium text-primary">{model.priceRange}</span>
          </div>
          {/* Specialties */}
          <div className="flex flex-wrap gap-1 mb-3">
            {model.specialties.slice(0, 3).map(specialty => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {model.specialties.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{model.specialties.length - 3}
              </Badge>
            )}
          </div>
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {model.totalViews.toLocaleString()}
              </span>
              <span className="flex items-center">
                <Heart className="h-3 w-3 mr-1" />
                {model.totalLikes.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{Math.floor((Date.now() - model.lastActive.getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
            </div>
          </div>
        </div>
      </div>
    );
    return (
      <Card
        key={model.id}
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onModelSelect?.(model)}
      >
        <CardContent className="p-0">
          {cardContent}
        </CardContent>
      </Card>
    );
  };
  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-[3/4] bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    if (error) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Search Error</h3>
            <p className="text-muted-foreground mb-4">
              We encountered an error while searching. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }
    if (searchResults.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">No Models Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters to find more models.
            </p>
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      );
    }
    const gridClass = viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
      : 'grid grid-cols-1 gap-4';
    return (
      <div className={gridClass}>
        {searchResults.map(renderModelCard)}
      </div>
    );
  };
  return (
    <div className={className}>
      {renderSearchBar()}
      {showFilters && renderAdvancedFilters()}
      {/* Results count */}
      {searchResults.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Found {searchResults.length} models
            {debouncedQuery && ` for "${debouncedQuery}"`}
          </p>
        </div>
      )}
      {renderResults()}
    </div>
  );
}