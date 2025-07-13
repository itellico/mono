'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  List
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface VideoLibraryItem {
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
}

// Video categories for the video library
const VIDEO_CATEGORIES = [
  { id: 'all', name: 'All Videos', icon: Video },
  { id: 'portfolio', name: 'Portfolio', icon: FileVideo },
  { id: 'commercial', name: 'Commercial', icon: Eye },
  { id: 'fashion', name: 'Fashion', icon: Calendar },
  { id: 'editorial', name: 'Editorial', icon: Clock },
  { id: 'lifestyle', name: 'Lifestyle', icon: Play },
  { id: 'fitness', name: 'Fitness', icon: Video }
];

export default function VideoLibraryPage() {
  const { toast } = useToast();
  const logger = useBrowserLogger('VideoLibrary');
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data for now - in real implementation this would come from API
  const mockVideos: VideoLibraryItem[] = [
    {
      id: 1,
      fileName: 'portfolio_video_1.mp4',
      originalName: 'Fashion Runway Walk.mp4',
      cdnUrl: '/media/videos/portfolio_video_1.mp4',
      duration: 120,
      fileSize: 45000000,
      category: 'fashion',
      title: 'Fashion Runway Walk',
      description: 'Professional runway presentation',
      isPublic: true,
      viewCount: 245,
      createdAt: '2024-01-15T10:30:00Z',
      processingStatus: 'completed',
      isOptimized: true,
      thumbnailUrl: '/media/thumbnails/video_1_thumb.jpg'
    },
    {
      id: 2,
      fileName: 'commercial_shoot.mp4',
      originalName: 'Brand Commercial.mp4',
      cdnUrl: '/media/videos/commercial_shoot.mp4',
      duration: 90,
      fileSize: 67000000,
      category: 'commercial',
      title: 'Brand Commercial',
      description: 'Commercial advertisement shoot',
      isPublic: false,
      viewCount: 89,
      createdAt: '2024-01-12T14:20:00Z',
      processingStatus: 'processing',
      isOptimized: false
    }
  ];

  // Fetch user&apos;s video library
  const { data: videos = [], isLoading, error } = useQuery({
    queryKey: ['video-library'],
    queryFn: async (): Promise<VideoLibraryItem[]> => {
      // For now, return mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockVideos;
    },
    staleTime: 30000,
    refetchInterval: 10000
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      // Mock delete - in real implementation this would call the API
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-library'] });
      toast({
        title: "Video deleted",
        description: "The video has been removed from your library.",
      });
    },
    onError: (error) => {
      logger.error('Failed to delete video', { error });
      toast({
        title: "Delete failed",
        description: "There was an error deleting the video. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleVideoUpload = (mediaAssets: MediaAsset[]) => {
    logger.info('Videos uploaded successfully', { count: mediaAssets.length });

    mediaAssets.forEach(asset => {
      toast({
        title: "Video uploaded",
        description: `${asset.originalName} has been added to your library.`,
      });
    });

    // Refresh the video library
    queryClient.invalidateQueries({ queryKey: ['video-library'] });
  };

  const handleVideoDelete = (videoId: number) => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  const formatDuration = (seconds?: number) => {
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

  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter(video => video.category === selectedCategory);

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Failed to load video library</h3>
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
          <h1 className="text-3xl font-bold">Video Library</h1>
          <p className="text-muted-foreground">
            Manage your video portfolio and showcase your work
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Stats Cards */}
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
                  {videos.reduce((sum, video) => sum + video.viewCount, 0)}
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
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">
                  {videos.filter(v => v.processingStatus === 'processing').length}
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

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Videos</TabsTrigger>
          <TabsTrigger value="library">Video Library</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload New Videos
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add videos to your portfolio. Videos will be processed and optimized automatically.
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
              <CardTitle>Video Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Technical Requirements</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Maximum file size: 500MB</li>
                    <li>• Supported formats: MP4, MOV, WebM, AVI</li>
                    <li>• Maximum duration: 15 minutes</li>
                    <li>• Minimum resolution: 720p (HD)</li>
                    <li>• Maximum resolution: 4K</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Best Practices</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use good lighting and stable camera</li>
                    <li>• Keep videos focused and professional</li>
                    <li>• Add clear titles and descriptions</li>
                    <li>• Consider your target audience</li>
                    <li>• Showcase your best work first</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-6">
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

          {/* Video Library Grid/List */}
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
                    ? "Upload your first video to get started"
                    : `No videos in the ${VIDEO_CATEGORIES.find(c => c.id === selectedCategory)?.name} category`
                  }
                </p>
                <Button onClick={() => setSelectedCategory('all')}>
                  <Upload className="h-4 w-4 mr-2" />
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
                <Card key={video.id} className="overflow-hidden">
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

                        {/* Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                          <Button size="sm" className="rounded-full">
                            <Play className="h-4 w-4" />
                          </Button>
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
                      </div>

                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h3 className="font-semibold truncate">
                            {video.title || video.originalName}
                          </h3>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{formatDate(video.createdAt)}</span>
                            <span>{formatFileSize(video.fileSize)}</span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{video.viewCount} views</span>
                            </div>

                            <Badge variant={video.isPublic ? 'default' : 'secondary'}>
                              {video.isPublic ? 'Public' : 'Private'}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              <Play className="h-3 w-3 mr-1" />
                              Play
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleVideoDelete(video.id)}
                              disabled={deleteVideoMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    /* List View */
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-24 h-16 bg-muted rounded overflow-hidden">
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
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {video.title || video.originalName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatDate(video.createdAt)}</span>
                            <span>{formatDuration(video.duration)}</span>
                            <span>{formatFileSize(video.fileSize)}</span>
                            <span>{video.viewCount} views</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={video.isPublic ? 'default' : 'secondary'}>
                            {video.isPublic ? 'Public' : 'Private'}
                          </Badge>

                          <Button size="sm" variant="outline">
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>

                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleVideoDelete(video.id)}
                            disabled={deleteVideoMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 