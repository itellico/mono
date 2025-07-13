'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  Grid,
  List,
  Star,
  Clock,
  Calendar,
  MapPin,
  Package,
  Sparkles,
  TrendingUp,
  Heart,
  Share2,
  MoreVertical,
  ShoppingCart,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  BadgeCheck,
  Zap,
  Award,
  Users,
  DollarSign,
  Camera,
  Video,
  Music,
  Palette,
  Edit3,
  Globe,
  Info,
  MessageSquare,
  Shield,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GigMarketplaceProps {
  /**
   * Current user info for filtering own gigs
   */
  currentUser?: {
    id: string;
    type: 'talent' | 'client' | 'both';
  };
  /**
   * Initial filter settings
   */
  initialFilters?: GigFilters;
  /**
   * Whether to show create gig button
   * @default true
   */
  showCreateButton?: boolean;
  /**
   * View mode
   * @default 'grid'
   */
  defaultView?: 'grid' | 'list';
  /**
   * Items per page
   * @default 12
   */
  itemsPerPage?: number;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Callback when gig is selected
   */
  onGigSelect?: (gig: GigOffering) => void;
  /**
   * Callback when booking is initiated
   */
  onBookGig?: (gig: GigOffering, package: string) => void;
  /**
   * Callback when creating new gig
   */
  onCreateGig?: () => void;
}

interface GigOffering {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  seller: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    verified: boolean;
    rating: number;
    responseTime: string;
    completedGigs: number;
    badges: string[];
  };
  packages: {
    basic: GigPackage;
    standard?: GigPackage;
    premium?: GigPackage;
  };
  media: {
    cover: string;
    gallery: string[];
    video?: string;
  };
  stats: {
    views: number;
    orders: number;
    saves: number;
    rating: number;
    reviews: number;
  };
  tags: string[];
  deliveryTime: string;
  revisions: number;
  features: string[];
  faqs?: { question: string; answer: string }[];
  availability: 'available' | 'busy' | 'vacation';
  responseTime: string;
  languages: string[];
  location?: string;
  createdAt: Date;
  featured?: boolean;
  promoted?: boolean;
}

interface GigPackage {
  name: string;
  title: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  deliveryTime: string;
  revisions: number;
  features: string[];
  popular?: boolean;
}

interface GigFilters {
  category?: string;
  priceRange?: [number, number];
  deliveryTime?: string;
  sellerLevel?: string[];
  rating?: number;
  location?: string;
  languages?: string[];
  search?: string;
}

// Mock data
const mockGigs: GigOffering[] = [
  {
    id: '1',
    title: 'Professional Fashion Photography Session',
    category: 'photography',
    subcategory: 'fashion',
    description: 'High-quality fashion photography for models, brands, and influencers',
    seller: {
      id: '1',
      name: 'Sarah Johnson',
      username: 'sarahj_photo',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      verified: true,
      rating: 4.9,
      responseTime: '1 hour',
      completedGigs: 156,
      badges: ['Top Rated', 'Quick Responder']
    },
    packages: {
      basic: {
        name: 'Basic',
        title: '1 Hour Shoot',
        description: '1 hour photoshoot with 10 edited images',
        price: { amount: 150, currency: 'USD' },
        deliveryTime: '3 days',
        revisions: 1,
        features: ['1 hour shoot', '10 edited photos', '1 outfit change']
      },
      standard: {
        name: 'Standard',
        title: 'Half Day Shoot',
        description: '4 hour photoshoot with 30 edited images',
        price: { amount: 450, currency: 'USD' },
        deliveryTime: '5 days',
        revisions: 2,
        features: ['4 hour shoot', '30 edited photos', '3 outfit changes', 'Makeup artist included'],
        popular: true
      },
      premium: {
        name: 'Premium',
        title: 'Full Day Shoot',
        description: '8 hour photoshoot with 60 edited images',
        price: { amount: 800, currency: 'USD' },
        deliveryTime: '7 days',
        revisions: 3,
        features: ['8 hour shoot', '60 edited photos', '5 outfit changes', 'Makeup & hair included', 'Multiple locations']
      }
    },
    media: {
      cover: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800',
      gallery: [
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
        'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800'
      ]
    },
    stats: {
      views: 2340,
      orders: 89,
      saves: 234,
      rating: 4.9,
      reviews: 67
    },
    tags: ['fashion', 'photography', 'portrait', 'editorial', 'commercial'],
    deliveryTime: '3-7 days',
    revisions: 2,
    features: ['Professional equipment', 'Studio available', 'Outdoor shoots', 'Post-processing included'],
    availability: 'available',
    responseTime: '1 hour',
    languages: ['English', 'Spanish'],
    location: 'New York, USA',
    createdAt: new Date('2024-01-15'),
    featured: true
  },
  {
    id: '2',
    title: 'Runway Model for Fashion Shows',
    category: 'modeling',
    subcategory: 'runway',
    description: 'Experienced runway model available for fashion shows and events',
    seller: {
      id: '2',
      name: 'Michael Chen',
      username: 'michael_model',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      verified: true,
      rating: 4.8,
      responseTime: '2 hours',
      completedGigs: 98,
      badges: ['Rising Talent']
    },
    packages: {
      basic: {
        name: 'Basic',
        title: 'Single Show',
        description: 'One fashion show appearance',
        price: { amount: 500, currency: 'USD' },
        deliveryTime: 'Event date',
        revisions: 0,
        features: ['1 show appearance', 'Professional walk', 'Fitting session included']
      },
      standard: {
        name: 'Standard',
        title: 'Fashion Week Package',
        description: 'Multiple shows during fashion week',
        price: { amount: 2000, currency: 'USD' },
        deliveryTime: 'Event dates',
        revisions: 0,
        features: ['Up to 5 shows', 'Fittings included', 'Backstage availability', 'Social media promotion']
      }
    },
    media: {
      cover: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
      gallery: [
        'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800'
      ]
    },
    stats: {
      views: 1560,
      orders: 43,
      saves: 178,
      rating: 4.8,
      reviews: 35
    },
    tags: ['runway', 'fashion', 'model', 'catwalk', 'events'],
    deliveryTime: 'Event based',
    revisions: 0,
    features: ['5\'11" height', 'Size 8', 'Professional training', 'Punctual'],
    availability: 'available',
    responseTime: '2 hours',
    languages: ['English', 'Mandarin'],
    location: 'Los Angeles, USA',
    createdAt: new Date('2024-02-01')
  }
];

const categories = [
  { id: 'all', name: 'All Categories', icon: <Grid className="h-4 w-4" /> },
  { id: 'photography', name: 'Photography', icon: <Camera className="h-4 w-4" /> },
  { id: 'modeling', name: 'Modeling', icon: <Users className="h-4 w-4" /> },
  { id: 'videography', name: 'Videography', icon: <Video className="h-4 w-4" /> },
  { id: 'music', name: 'Music & Audio', icon: <Music className="h-4 w-4" /> },
  { id: 'creative', name: 'Creative Services', icon: <Palette className="h-4 w-4" /> }
];

export function GigMarketplace({
  currentUser,
  initialFilters = {},
  showCreateButton = true,
  defaultView = 'grid',
  itemsPerPage = 12,
  className,
  onGigSelect,
  onBookGig,
  onCreateGig
}: GigMarketplaceProps) {
  const [filters, setFilters] = useState<GigFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGig, setSelectedGig] = useState<GigOffering | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [savedGigs, setSavedGigs] = useState<Set<string>>(new Set());

  // Filter and sort gigs
  const filteredGigs = useMemo(() => {
    let filtered = [...mockGigs];

    // Category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(gig => gig.category === filters.category);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(gig =>
        gig.title.toLowerCase().includes(searchLower) ||
        gig.description.toLowerCase().includes(searchLower) ||
        gig.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Price filter
    if (filters.priceRange) {
      filtered = filtered.filter(gig => {
        const lowestPrice = Math.min(
          gig.packages.basic.price.amount,
          gig.packages.standard?.price.amount || Infinity,
          gig.packages.premium?.price.amount || Infinity
        );
        return lowestPrice >= filters.priceRange![0] && lowestPrice <= filters.priceRange![1];
      });
    }

    // Rating filter
    if (filters.rating) {
      filtered = filtered.filter(gig => gig.stats.rating >= filters.rating!);
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.packages.basic.price.amount - b.packages.basic.price.amount);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.packages.basic.price.amount - a.packages.basic.price.amount);
        break;
      case 'rating':
        filtered.sort((a, b) => b.stats.rating - a.stats.rating);
        break;
      case 'orders':
        filtered.sort((a, b) => b.stats.orders - a.stats.orders);
        break;
      case 'newest':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    return filtered;
  }, [filters, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredGigs.length / itemsPerPage);
  const paginatedGigs = filteredGigs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleSaveGig = (gigId: string) => {
    setSavedGigs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gigId)) {
        newSet.delete(gigId);
        toast.success('Removed from saved gigs');
      } else {
        newSet.add(gigId);
        toast.success('Saved to your collection');
      }
      return newSet;
    });
  };

  const handleShare = (gig: GigOffering) => {
    navigator.clipboard.writeText(`${window.location.origin}/gigs/${gig.id}`);
    toast.success('Link copied to clipboard');
  };

  const renderGigCard = (gig: GigOffering) => (
    <Card
      key={gig.id}
      className={cn(
        "group cursor-pointer transition-all hover:shadow-lg",
        gig.featured && "ring-2 ring-primary"
      )}
      onClick={() => onGigSelect?.(gig)}
    >
      {/* Media */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={gig.media.cover}
          alt={gig.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {gig.featured && (
          <Badge className="absolute top-2 left-2" variant="default">
            <Sparkles className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleSaveGig(gig.id);
            }}
          >
            <Heart className={cn(
              "h-4 w-4",
              savedGigs.has(gig.id) && "fill-current text-red-500"
            )} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShare(gig)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Seller
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {gig.media.video && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-black/70 text-white">
              <Video className="h-3 w-3 mr-1" />
              Preview
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        {/* Seller info */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={gig.seller.avatar} />
            <AvatarFallback>{gig.seller.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium">{gig.seller.username}</span>
            {gig.seller.verified && (
              <BadgeCheck className="h-3 w-3 text-primary" />
            )}
            {gig.seller.badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="text-xs h-5">
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        {/* Title */}
        <CardTitle className="text-base line-clamp-2">
          {gig.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Stats */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-foreground">{gig.stats.rating}</span>
            <span>({gig.stats.reviews})</span>
          </div>
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" />
            <span>{gig.stats.orders} orders</span>
          </div>
        </div>

        {/* Quick features */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {gig.deliveryTime}
          </Badge>
          {gig.location && (
            <Badge variant="outline" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {gig.location.split(',')[0]}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-xs text-muted-foreground">Starting at</p>
            <p className="text-lg font-bold">
              ${gig.packages.basic.price.amount}
            </p>
          </div>
          <Button size="sm" onClick={(e) => {
            e.stopPropagation();
            setSelectedGig(gig);
          }}>
            View Details
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  const renderGigList = (gig: GigOffering) => (
    <Card key={gig.id} className="mb-4">
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg">
          <img
            src={gig.media.cover}
            alt={gig.title}
            className="w-full h-full object-cover"
          />
          {gig.featured && (
            <Badge className="absolute top-2 left-2" variant="default">
              <Sparkles className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg mb-1">{gig.title}</h3>
              <div className="flex items-center gap-2 text-sm">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={gig.seller.avatar} />
                  <AvatarFallback>{gig.seller.name[0]}</AvatarFallback>
                </Avatar>
                <span>{gig.seller.username}</span>
                {gig.seller.verified && (
                  <BadgeCheck className="h-3 w-3 text-primary" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleSaveGig(gig.id)}
              >
                <Heart className={cn(
                  "h-4 w-4",
                  savedGigs.has(gig.id) && "fill-current text-red-500"
                )} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleShare(gig)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Seller
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {gig.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{gig.stats.rating}</span>
                <span className="text-muted-foreground">({gig.stats.reviews})</span>
              </div>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {gig.deliveryTime}
              </Badge>
              <span className="text-muted-foreground">
                {gig.stats.orders} orders
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Starting at</p>
                <p className="text-lg font-bold">
                  ${gig.packages.basic.price.amount}
                </p>
              </div>
              <Button onClick={() => setSelectedGig(gig)}>
                View Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gig Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Find talented professionals offering their services
          </p>
        </div>
        {showCreateButton && currentUser?.type !== 'client' && (
          <Button onClick={onCreateGig}>
            <Plus className="h-4 w-4 mr-2" />
            Create a Gig
          </Button>
        )}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search gigs..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="orders">Most Orders</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <Tabs
        value={filters.category || 'all'}
        onValueChange={(value) => setFilters({ ...filters, category: value })}
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-2">
              {cat.icon}
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Advanced filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Price Range</Label>
                <div className="mt-2 space-y-2">
                  <Slider
                    value={filters.priceRange || [0, 1000]}
                    onValueChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
                    max={1000}
                    step={50}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${filters.priceRange?.[0] || 0}</span>
                    <span>${filters.priceRange?.[1] || 1000}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Minimum Rating</Label>
                <Select
                  value={filters.rating?.toString() || ''}
                  onValueChange={(value) => setFilters({ ...filters, rating: parseFloat(value) })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any rating</SelectItem>
                    <SelectItem value="4">4+ stars</SelectItem>
                    <SelectItem value="4.5">4.5+ stars</SelectItem>
                    <SelectItem value="4.8">4.8+ stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Delivery Time</Label>
                <Select
                  value={filters.deliveryTime || ''}
                  onValueChange={(value) => setFilters({ ...filters, deliveryTime: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any time</SelectItem>
                    <SelectItem value="24h">Within 24 hours</SelectItem>
                    <SelectItem value="3d">Within 3 days</SelectItem>
                    <SelectItem value="7d">Within 7 days</SelectItem>
                    <SelectItem value="custom">Custom delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setFilters({})}
              >
                Clear All
              </Button>
              <Button onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {paginatedGigs.length} of {filteredGigs.length} gigs
        </p>
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ ...filters, search: '' })}
          >
            Clear search
            <X className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      {/* Gig grid/list */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedGigs.map(renderGigCard)}
        </div>
      ) : (
        <div>
          {paginatedGigs.map(renderGigList)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] !== page - 1 && (
                  <span className="px-2">...</span>
                )}
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              </React.Fragment>
            ))}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Gig details dialog */}
      {selectedGig && (
        <Dialog open={!!selectedGig} onOpenChange={() => setSelectedGig(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedGig.seller.avatar} />
                    <AvatarFallback>{selectedGig.seller.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{selectedGig.seller.name}</span>
                      {selectedGig.seller.verified && (
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{selectedGig.seller.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleSaveGig(selectedGig.id)}
                  >
                    <Heart className={cn(
                      "h-4 w-4",
                      savedGigs.has(selectedGig.id) && "fill-current text-red-500"
                    )} />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleShare(selectedGig)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogTitle className="text-2xl mt-4">{selectedGig.title}</DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{selectedGig.stats.rating}</span>
                    <span className="text-muted-foreground">({selectedGig.stats.reviews} reviews)</span>
                  </div>
                  <Badge variant="secondary">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {selectedGig.stats.orders} orders
                  </Badge>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedGig.responseTime} response
                  </Badge>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Gallery */}
                <div>
                  <img
                    src={selectedGig.media.cover}
                    alt={selectedGig.title}
                    className="w-full rounded-lg"
                  />
                  {selectedGig.media.gallery.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {selectedGig.media.gallery.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">About This Gig</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedGig.description}
                  </p>
                </div>

                {/* Features */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">What's Included</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedGig.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seller info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">About The Seller</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedGig.seller.avatar} />
                          <AvatarFallback>{selectedGig.seller.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{selectedGig.seller.name}</h4>
                          <p className="text-sm text-muted-foreground">@{selectedGig.seller.username}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedGig.seller.badges.map((badge) => (
                              <Badge key={badge} variant="secondary">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Response time</p>
                              <p className="font-medium">{selectedGig.seller.responseTime}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Completed gigs</p>
                              <p className="font-medium">{selectedGig.seller.completedGigs}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Sidebar - Packages */}
              <div className="space-y-4">
                <Tabs defaultValue={selectedGig.packages.standard ? 'standard' : 'basic'}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    {selectedGig.packages.standard && (
                      <TabsTrigger value="standard">Standard</TabsTrigger>
                    )}
                    {selectedGig.packages.premium && (
                      <TabsTrigger value="premium">Premium</TabsTrigger>
                    )}
                  </TabsList>

                  {Object.entries(selectedGig.packages).map(([key, pkg]) => pkg && (
                    <TabsContent key={key} value={key}>
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{pkg.title}</CardTitle>
                            {pkg.popular && (
                              <Badge>Popular</Badge>
                            )}
                          </div>
                          <CardDescription>{pkg.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold mb-4">
                            ${pkg.price.amount}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              {pkg.price.currency}
                            </span>
                          </div>
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{pkg.deliveryTime} delivery</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <RefreshCw className="h-4 w-4 text-muted-foreground" />
                              <span>{pkg.revisions} revisions</span>
                            </div>
                          </div>
                          <Separator className="my-4" />
                          <div className="space-y-2">
                            {pkg.features.map((feature, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button
                            className="w-full"
                            onClick={() => onBookGig?.(selectedGig, key)}
                          >
                            Continue (${pkg.price.amount})
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Quick info */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Availability</span>
                      <Badge variant={selectedGig.availability === 'available' ? 'default' : 'secondary'}>
                        {selectedGig.availability}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Languages</span>
                      <span>{selectedGig.languages.join(', ')}</span>
                    </div>
                    {selectedGig.location && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span>{selectedGig.location}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button variant="outline" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default GigMarketplace;