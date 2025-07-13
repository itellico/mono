'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UniversalFileUpload } from '@/components/reusable/UniversalFileUpload';
import { PermissionGate } from '@/components/reusable/PermissionGate';
import { useTenantContext } from '@/hooks/use-tenant-context';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SortAsc, 
  SortDesc, 
  Calendar,
  Eye,
  Heart,
  Download,
  Share2,
  MoreHorizontal,
  Upload,
  Tag,
  Star,
  Image as ImageIcon,
  Video,
  Trash2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
interface MediaAsset {
  id: string;
  url: string;
  thumbnail: string;
  type: 'image' | 'video';
  title: string;
  description?: string;
  category: string;
  tags: string[];
  uploadedAt: Date;
  fileSize: number;
  dimensions: { width: number; height: number };
  views: number;
  likes: number;
  isPrivate: boolean;
  isFeatured: boolean;
  metadata?: {
    camera?: string;
    lens?: string;
    settings?: string;
    location?: string;
  };
}
interface PortfolioGalleryProps {
  userId?: string;
  showUpload?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  viewMode?: 'grid' | 'list' | 'masonry';
  maxItems?: number;
  categories?: string[];
  className?: string;
  isEditable?: boolean;
}
const CATEGORIES = [
  'Fashion', 'Commercial', 'Editorial', 'Beauty', 'Fitness', 'Lifestyle', 
  'Portrait', 'Headshots', 'Runway', 'Product', 'Art', 'Documentary'
];
const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'views-desc', label: 'Most Viewed' },
  { value: 'likes-desc', label: 'Most Liked' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' }
];
export function PortfolioGallery({
  userId,
  showUpload = true,
  showFilters = true,
  showStats = true,
  viewMode: initialViewMode = 'masonry',
  maxItems,
  categories = CATEGORIES,
  className = '',
  isEditable = true
}: PortfolioGalleryProps) {
  const t = useTranslations('portfolio');
  const { toast } = useToast();
  // State management
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'masonry'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  // Data fetching
  const { data: mediaAssets = [], isLoading, refetch } = useQuery({
    queryKey: ['portfolio-media', userId, selectedCategory, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(userId && { userId }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        sort: sortBy,
        ...(maxItems && { limit: maxItems.toString() })
      });
      const response = await fetch(`/api/portfolio/media?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media');
      return response.json();
    }
  });
  // Filtered and sorted data
  const filteredAssets = useMemo(() => {
    let filtered = mediaAssets;
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((asset: MediaAsset) =>
        asset.title.toLowerCase().includes(query) ||
        asset.description?.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [mediaAssets, searchQuery]);
  // Stats calculation
  const stats = (() => {
    const totalAssets = filteredAssets.length;
    const totalViews = filteredAssets.reduce((sum, asset) => sum + (asset.views || 0), 0);
    const totalLikes = filteredAssets.reduce((sum, asset) => sum + (asset.likes || 0), 0);
    const imageCount = filteredAssets.filter(asset => asset.type === 'image').length;
    const videoCount = filteredAssets.filter(asset => asset.type === 'video').length;
    return { totalAssets, totalViews, totalLikes, imageCount, videoCount };
  })();
  // Event handlers
  const handleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);
  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedItems.length === 0) return;
    try {
      const response = await fetch('/api/portfolio/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, mediaIds: selectedItems })
      });
      if (!response.ok) throw new Error('Bulk action failed');
      toast({
        title: t('bulkAction.success'),
        description: `${selectedItems.length} items ${action}ed successfully`
      });
      setSelectedItems([]);
      refetch();
    } catch (error) {
      logger.error('Bulk action failed', { action, selectedItems, error: error.message });
      toast({
        title: t('bulkAction.error'),
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [selectedItems, refetch, toast, t]);
  const handleUploadComplete = useCallback(() => {
    refetch();
    setShowUploadModal(false);
    toast({
      title: t('upload.success'),
      description: t('upload.successDescription')
    });
  }, [refetch, toast, t]);
  // Render functions
  const renderStatsCards = () => {
    if (!showStats) return null;
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalAssets}</div>
                <p className="text-xs text-muted-foreground">Total Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.imageCount}</div>
                <p className="text-xs text-muted-foreground">Images</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.videoCount}</div>
                <p className="text-xs text-muted-foreground">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  const renderFilters = () => {
    if (!showFilters) return null;
    return (
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('category.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('category.all')}</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SortAsc className="mr-2 h-4 w-4" />
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
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg p-1">
            <Button
              variant={viewMode === 'masonry' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('masonry')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {showUpload && isEditable && (
            <PermissionGate action="upload" resource="media" showFallback={false}>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                {t('upload.button')}
              </Button>
            </PermissionGate>
          )}
        </div>
      </div>
    );
  };
  const renderMediaItem = (asset: MediaAsset) => {
    const isSelected = selectedItems.includes(asset.id);
    const itemContent = (
      <div 
        className={`relative group cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => isEditable && handleSelectItem(asset.id)}
      >
        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
          <img
            src={asset.thumbnail}
            alt={asset.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Overlay */}
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
                  <Share2 className="h-4 w-4" />
                </Button>
                {isEditable && (
                  <Button variant="secondary" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          {/* Asset type indicator */}
          {asset.type === 'video' && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-black/60 text-white">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Badge>
            </div>
          )}
          {/* Featured indicator */}
          {asset.isFeatured && (
            <div className="absolute top-2 right-2">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
            </div>
          )}
        </div>
        {/* Asset info */}
        <div className="p-3">
          <h3 className="font-medium text-sm truncate">{asset.title}</h3>
          <div className="flex items-center justify-between mt-1">
            <Badge variant="outline" className="text-xs">
              {asset.category}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground space-x-2">
              <span className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {asset.views}
              </span>
              <span className="flex items-center">
                <Heart className="h-3 w-3 mr-1" />
                {asset.likes}
              </span>
            </div>
          </div>
          {/* Tags */}
          {asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {asset.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {asset.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{asset.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
    return (
      <Card key={asset.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-0">
          {itemContent}
        </CardContent>
      </Card>
    );
  };
  const renderGallery = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    if (filteredAssets.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-muted-foreground mb-4">{t('empty.description')}</p>
            {showUpload && isEditable && (
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                {t('upload.firstPhoto')}
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }
    const gridClass = viewMode === 'masonry' 
      ? 'columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6'
      : viewMode === 'grid'
      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
      : 'grid grid-cols-1 gap-4';
    return (
      <div className={gridClass}>
        {filteredAssets.map(renderMediaItem)}
      </div>
    );
  };
  return (
    <div className={className}>
      {renderStatsCards()}
      {renderFilters()}
      {/* Bulk actions */}
      {selectedItems.length > 0 && isEditable && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedItems.length} {t('selected.items')}
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('feature')}>
                  <Star className="h-4 w-4 mr-2" />
                  {t('actions.feature')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('download')}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('actions.download')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('delete')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('actions.delete')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {renderGallery()}
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('upload.title')}</h3>
              <UniversalFileUpload
                context="media_assets"
                resource="media"
                onUploadSuccess={handleUploadComplete}
              />
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                  {t('upload.close')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}