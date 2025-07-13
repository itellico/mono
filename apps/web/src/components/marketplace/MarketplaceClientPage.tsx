'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign,
  Users,
  TrendingUp,
  Grid3X3,
  List,
  MapPin,
  Award,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { GigCard } from './GigCard';
import { GigFilters } from './GigFilters';
import { CategoryMono } from './CategoryMono';
import { FeaturedGigs } from './FeaturedGigs';
import { TagFilter } from '@/components/tags';

interface GigData {
  id: number;
  uuid: string;
  title: string;
  category: string;
  subcategory?: string;
  startingPrice: number;
  currency: string;
  avgRating?: number;
  totalOrders: number;
  totalReviews: number;
  featured: boolean;
  status: string;
  publishedAt?: string;
  talent: {
    id: number;
    uuid: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  _count: {
    bookings: number;
    reviews: number;
  };
}

interface MarketplaceData {
  gigs: GigData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  categories?: Array<{
    name: string;
    count: number;
    subcategories?: Array<{
      name: string;
      count: number;
    }>;
  }>;
  featured?: GigData[];
}

interface MarketplaceFilters {
  page: number;
  limit: number;
  search: string;
  category: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  deliveryTime?: number;
  talentLevel?: string;
  avgRating?: number;
  sortBy: 'popularity' | 'rating' | 'price' | 'orders' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
}

interface UserContext {
  userId: string;
  adminRole: string;
  tenantId: number | null;
  permissions: string[];
}

interface MarketplaceClientPageProps {
  initialData: MarketplaceData;
  initialFilters: MarketplaceFilters;
  userContext: UserContext;
}

export function MarketplaceClientPage({ 
  initialData, 
  initialFilters, 
  userContext 
}: MarketplaceClientPageProps) {
  const [filters, setFilters] = useState<MarketplaceFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Fetch gigs with TanStack Query
  const { 
    data: gigsData = initialData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['marketplace-gigs', filters, selectedTags],
    queryFn: async () => {
      // TODO: Implement tag filtering when backend supports it
      const response = await apiClient.get('/api/v1/gigs', {
        params: {
          ...filters,
          // Add tag filtering when available
        }
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch gigs');
      }
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    initialData: initialData,
  });

  // Fetch featured gigs
  const { 
    data: featuredGigs = [], 
    isLoading: isLoadingFeatured 
  } = useQuery({
    queryKey: ['featured-gigs'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/gigs/featured', {
        params: { limit: 8 }
      });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch featured gigs');
      }
      return response.data.data.gigs;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories
  const { 
    data: categories = [] 
  } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async () => {
      // TODO: Implement categories endpoint
      // const response = await apiClient.get('/api/v1/categories', {
      //   params: { type: 'gig' }
      // });
      // return response.data.data.categories;
      
      // Mock data for now
      return [
        { name: 'Design & Creative', count: 1250, icon: '🎨' },
        { name: 'Development & Tech', count: 890, icon: '💻' },
        { name: 'Writing & Translation', count: 654, icon: '✍️' },
        { name: 'Digital Marketing', count: 432, icon: '📈' },
        { name: 'Video & Animation', count: 321, icon: '🎬' },
        { name: 'Music & Audio', count: 198, icon: '🎵' },
        { name: 'Photography', count: 156, icon: '📸' },
        { name: 'Business', count: 234, icon: '💼' },
      ];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof MarketplaceFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      ...initialFilters,
      search: '',
    });
    setSelectedTags([]);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryName: string) => {
    setFilters(prev => ({
      ...prev,
      category: categoryName,
      page: 1,
    }));
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Marketplace</h2>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== undefined && value !== initialFilters.page && value !== initialFilters.limit
  ) || selectedTags.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              Find the Perfect Talent for Your Project
            </h1>
            <p className="text-xl text-muted-foreground">
              Browse thousands of services from talented professionals ready to bring your ideas to life
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="What service are you looking for?"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-12 h-14 text-lg bg-background/80 backdrop-blur"
              />
              <Button 
                size="lg" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                Search
              </Button>
            </div>
            
            {/* Popular Searches */}
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {['Logo Design', 'Website Development', 'Content Writing', 'Social Media'].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearchChange(term)}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Featured Gigs Section */}
        {!filters.search && !filters.category && (
          <FeaturedGigs 
            gigs={featuredGigs} 
            isLoading={isLoadingFeatured}
            onGigClick={(gig) => {
              // Navigate to gig details
              window.location.href = `/marketplace/gig/${gig.uuid}`;
            }}
          />
        )}

        {/* Categories Section */}
        {!filters.search && !filters.category && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Browse by Category</h2>
              <Button variant="outline" asChild>
                <a href="/marketplace/categories">View All</a>
              </Button>
            </div>
            <CategoryMono 
              categories={categories} 
              onCategoryClick={handleCategoryClick}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Filters and Controls */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters */}
            <div className="lg:w-80 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="ml-auto"
                      >
                        Clear All
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GigFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    categories={categories}
                  />
                </CardContent>
              </Card>

              {/* Tag Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter by Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <TagFilter
                    selectedTags={selectedTags}
                    onTagsChange={setSelectedTags}
                    variant="compact"
                    category="skills"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 space-y-6">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">
                    {filters.category || filters.search ? 'Search Results' : 'All Services'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isLoading ? (
                      <Skeleton className="h-4 w-32" />
                    ) : (
                      `${gigsData.pagination.total} services found`
                    )}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Sort Dropdown */}
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="popularity">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price">Price: Low to High</option>
                    <option value="orders">Most Orders</option>
                    <option value="createdAt">Newest First</option>
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  {filters.category && (
                    <Badge variant="secondary" className="gap-1">
                      Category: {filters.category}
                      <button
                        onClick={() => handleFilterChange('category', '')}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.search && (
                    <Badge variant="secondary" className="gap-1">
                      Search: "{filters.search}"
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.minPrice && (
                    <Badge variant="secondary" className="gap-1">
                      Min: ${filters.minPrice}
                      <button
                        onClick={() => handleFilterChange('minPrice', undefined)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      {selectedTags.length} tags selected
                      <button
                        onClick={() => setSelectedTags([])}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              )}

              {/* Gigs Grid/List */}
              {isLoading ? (
                <div className={cn(
                  'grid gap-6',
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                )}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="h-48 w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : gigsData.gigs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">No services found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className={cn(
                  'grid gap-6',
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                )}>
                  {gigsData.gigs.map((gig) => (
                    <GigCard
                      key={gig.uuid}
                      gig={gig}
                      variant={viewMode}
                      onBookmark={(gigUuid) => {
                        // TODO: Implement bookmark functionality
                        console.log('Bookmark gig:', gigUuid);
                      }}
                      onClick={() => {
                        window.location.href = `/marketplace/gig/${gig.uuid}`;
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {gigsData.pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-8">
                  <Button
                    variant="outline"
                    disabled={filters.page <= 1}
                    onClick={() => handlePageChange(filters.page - 1)}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: Math.min(5, gigsData.pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={page === filters.page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    {gigsData.pagination.totalPages > 5 && (
                      <>
                        <span className="px-2 py-1">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(gigsData.pagination.totalPages)}
                        >
                          {gigsData.pagination.totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    disabled={filters.page >= gigsData.pagination.totalPages}
                    onClick={() => handlePageChange(filters.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}