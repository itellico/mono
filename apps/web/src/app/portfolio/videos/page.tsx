'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useBrowserLogger } from '@/lib/browser-logger';
import { UniversalMediaUploader, type MediaAsset } from '@/components/media/UniversalMediaUploader';
import { 
  Video, 
  Upload, 
  Play, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  Clock,
  FileVideo,
  Settings,
  Filter,
  Grid3X3,
  List,
  Plus,
  MoreVertical,
  Edit,
  Share2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VideoPortfolioItem {
  id: number;
  fileName: string;
  originalName: string;
  cdnUrl: string;
  duration?: number;
  fileSize: number;
  category: string;
  title?: string;
  description?: string;
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  processingStatus: string;
  isOptimized: boolean;
  thumbnailUrl?: string;
  tags?: string[];
}

// Video categories for portfolio organization
const VIDEO_CATEGORIES = [
  { id: 'all', name: 'All Videos', icon: Video },
  { id: 'headshots', name: 'Headshots', icon: Eye },
  { id: 'runway', name: 'Runway', icon: Calendar },
  { id: 'commercial', name: 'Commercial', icon: FileVideo },
  { id: 'editorial', name: 'Editorial', icon: Clock },
  { id: 'behind_scenes', name: 'Behind the Scenes', icon: Play },
  { id: 'testimonials', name: 'Testimonials', icon: Video }
];

export default function PortfolioVideosPage() {
  const { toast } = useToast();
  const logger = useBrowserLogger('PortfolioVideos');
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data for demonstration
  const mockVideos: VideoPortfolioItem[] = [
    {
      id: 1,
      fileName: 'runway_walk_fw2024.mp4',
      originalName: 'Fashion Week Runway Walk.mp4',
      cdnUrl: '/media/videos/runway_walk_fw2024.mp4',
      duration: 45,
      fileSize: 25000000,
      category: 'runway',
      title: 'Fashion Week Runway Walk',
      description: 'Milan Fashion Week 2024 runway presentation',
      isPublic: true,
      viewCount: 1250,
      createdAt: '2024-01-15T10:30:00Z',
      processingStatus: 'completed',
      isOptimized: true,
      thumbnailUrl: '/media/thumbnails/runway_thumb.jpg',
      tags: ['fashion week', 'runway', 'milan', '2024']
    },
    {
      id: 2,
      fileName: 'commercial_shoot_beauty.mp4',
      originalName: 'Beauty Commercial Behind Scenes.mp4',
      cdnUrl: '/media/videos/commercial_shoot_beauty.mp4',
      duration: 90,
      fileSize: 45000000,
      category: 'commercial',
      title: 'Beauty Commercial BTS',
      description: 'Behind the scenes of luxury skincare commercial',
      isPublic: false,
      viewCount: 89,
      createdAt: '2024-01-12T14:20:00Z',
      processingStatus: 'completed',
      isOptimized: true,
      thumbnailUrl: '/media/thumbnails/commercial_thumb.jpg',
      tags: ['commercial', 'beauty', 'behind the scenes']
    },
    {
      id: 3,
      fileName: 'headshot_reel_2024.mp4',
      originalName: 'Professional Headshot Reel.mp4',
      cdnUrl: '/media/videos/headshot_reel_2024.mp4',
      duration: 60,
      fileSize: 30000000,
      category: 'headshots',
      title: 'Professional Headshot Reel',
      description: 'Compilation of professional headshots for casting',
      isPublic: true,
      viewCount: 456,
      createdAt: '2024-01-10T09:15:00Z',
      processingStatus: 'processing',
      isOptimized: false,
      tags: ['headshots', 'casting', 'professional']
    }
  ];

  // Fetch user&apos;s video portfolio
  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: ['portfolio-videos'],
    queryFn: async (): Promise<VideoPortfolioItem[]> => {
      // For now, return mock data with loading simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockVideos;
    },
    staleTime: 30000,
    refetchInterval: 10000
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-videos'] });
      toast({
        title: "Video removed",
        description: "The video has been removed from your portfolio.",
      });
    },
    onError: (error) => {
      logger.error('Failed to delete video', { error });
      toast({
        title: "Delete failed",
        description: "There was an error removing the video. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleVideoUpload = (mediaAssets: MediaAsset[]) => {
    logger.info('Videos uploaded successfully', { count: mediaAssets.length });

    mediaAssets.forEach(asset => {
      toast({
        title: "Video uploaded",
        description: `${asset.originalName} has been added to your portfolio.`,
      });
    });

    queryClient.invalidateQueries({ queryKey: ['portfolio-videos'] });
  };

  const handleVideoDelete = (videoId: number) => {
    if (window.confirm('Are you sure you want to remove this video from your portfolio?')) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  const handleVideoEdit = (videoId: number) => {
    toast({
      title: "Edit video",
      description: "Video editing feature coming soon!",
    });
  };

  const handleVideoShare = (videoId: number) => {
    navigator.clipboard.writeText(`${window.location.origin}/portfolio/videos/${videoId}`);
    toast({
      title: "Link copied",
      description: "Video link has been copied to your clipboard.",
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatViews = (views: number) => {
    if (views < 1000) return views.toString();
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K`;
    return `${(views / 1000000).toFixed(1)}M`;
  };

  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter(video => video.category === selectedCategory);

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Failed to load video portfolio</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading your videos. Please try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Portfolio</h1>
          <p className="text-muted-foreground">
            Showcase your best work with professional video content
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share Portfolio
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Videos</p>
                <p className="text-2xl font-bold">{videos.length}</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">
                  {formatViews(videos.reduce((sum, video) => sum + video.viewCount, 0))}
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Public Videos</p>
                <p className="text-2xl font-bold">
                  {videos.filter(v => v.isPublic).length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-2xl font-bold">
                  {formatFileSize(videos.reduce((sum, video) => sum + video.fileSize, 0))}
                </p>
              </div>
              <Download className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
          <TabsTrigger value="upload">Upload Videos</TabsTrigger>
        </TabsList>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-6">
          {/* Category Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter by category:</span>
                {VIDEO_CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center gap-1"
                  >
                    <category.icon className="h-3 w-3" />
                    {category.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Video Portfolio Grid/List */}
          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-40 w-full mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedCategory === 'all' 
                    ? "Upload your first video to start building your portfolio"
                    : `No videos in the ${VIDEO_CATEGORIES.find(c => c.id === selectedCategory)?.name} category`
                  }
                </p>
                <Button onClick={() => setSelectedCategory('all')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden group">
                  {viewMode === 'grid' ? (
                    <>
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video bg-muted">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title || video.originalName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}

                        {/* Processing Status Overlay */}
                        {video.processingStatus === 'processing' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <Settings className="h-6 w-6 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Processing...</p>
                            </div>
                          </div>
                        )}

                        {/* Hover Controls */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" className="rounded-full mr-2">
                            <Play className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="secondary" className="rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleVideoEdit(video.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleVideoShare(video.id)}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleVideoDelete(video.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Duration Badge */}
                        {video.duration && (
                          <Badge 
                            variant="secondary" 
                            className="absolute bottom-2 right-2 text-xs"
                          >
                            {formatDuration(video.duration)}
                          </Badge>
                        )}

                        {/* Privacy Badge */}
                        <Badge 
                          variant={video.isPublic ? 'default' : 'secondary'} 
                          className="absolute top-2 left-2 text-xs"
                        >
                          {video.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </div>

                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold truncate">
                            {video.title || video.originalName}
                          </h3>

                          {video.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {video.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{formatDate(video.createdAt)}</span>
                            <span>{formatFileSize(video.fileSize)}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{formatViews(video.viewCount)} views</span>
                            </div>

                            <Badge variant="outline" className="text-xs">
                              {VIDEO_CATEGORIES.find(c => c.id === video.category)?.name || video.category}
                            </Badge>
                          </div>

                          {video.tags && video.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2">
                              {video.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {video.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{video.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    /* List View */
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-32 h-20 bg-muted rounded overflow-hidden relative">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title || video.originalName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}

                          {video.duration && (
                            <Badge 
                              variant="secondary" 
                              className="absolute bottom-1 right-1 text-xs"
                            >
                              {formatDuration(video.duration)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold truncate">
                                {video.title || video.originalName}
                              </h3>
                              {video.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                  {video.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                <span>{formatDate(video.createdAt)}</span>
                                <span>{formatFileSize(video.fileSize)}</span>
                                <span>{formatViews(video.viewCount)} views</span>
                                <Badge 
                                  variant={video.isPublic ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {video.isPublic ? 'Public' : 'Private'}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Button size="sm" variant="outline">
                                <Play className="h-3 w-3 mr-1" />
                                Play
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleVideoEdit(video.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleVideoShare(video.id)}>
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleVideoDelete(video.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Portfolio Videos
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add professional videos to showcase your work and attract opportunities.
              </p>
            </CardHeader>
            <CardContent>
              <UniversalMediaUploader
                context="video_library"
                maxFiles={10}
                showPreview={true}
                showProgress={true}
                showOptimizationStatus={true}
                onUploadComplete={handleVideoUpload}
                onUploadError={(error) => {
                  logger.error('Video upload failed', { error });
                  toast({
                    title: "Upload failed",
                    description: error,
                    variant: "destructive",
                  });
                }}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Upload Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Video Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Technical Requirements</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• <strong>File Size:</strong> Maximum 500MB per video</li>
                    <li>• <strong>Formats:</strong> MP4, MOV, WebM, AVI, WMV</li>
                    <li>• <strong>Duration:</strong> Up to 15 minutes</li>
                    <li>• <strong>Resolution:</strong> Minimum 720p (HD)</li>
                    <li>• <strong>Quality:</strong> Professional presentation required</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Content Guidelines</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• <strong>Professional:</strong> High-quality work samples only</li>
                    <li>• <strong>Relevant:</strong> Industry-appropriate content</li>
                    <li>• <strong>Current:</strong> Recent work (within 2 years)</li>
                    <li>• <strong>Rights:</strong> Ensure you have permission to share</li>
                    <li>• <strong>Diversity:</strong> Show range of skills and styles</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">💡 Portfolio Tips</h4>
                <p className="text-sm text-muted-foreground">
                  Create a compelling video portfolio by including headshots, behind-the-scenes content, 
                  runway walks, and commercial work. Quality over quantity - choose your best pieces 
                  that demonstrate your range and professionalism.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 