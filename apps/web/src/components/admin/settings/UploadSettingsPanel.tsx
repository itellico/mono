'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ImageIcon, 
  VideoIcon,
  AudioLinesIcon,
  FileImageIcon, 
  FileVideoIcon,
  FileAudioIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SaveIcon,
  RefreshCwIcon
} from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';

// Media settings schema - organized by media type
const mediaSettingsSchema = z.object({
  // Picture Settings
  pictureMaxFileSizeMB: z.number().min(1).max(200),
  pictureAllowedFormats: z.array(z.string()).min(1),
  pictureMinWidth: z.number().min(100).max(10000),
  pictureMinHeight: z.number().min(100).max(10000),
  pictureAutoGenerateThumbnails: z.boolean(),
  pictureRequireOptimization: z.boolean(),
  pictureCompressionQuality: z.number().min(10).max(100),
  pictureAllowExifData: z.boolean(),

  // Video Settings
  videoMaxFileSizeMB: z.number().min(50).max(2000),
  videoAllowedFormats: z.array(z.string()).min(1),
  videoMaxDurationMinutes: z.number().min(1).max(60),
  videoMinResolutionWidth: z.number().min(480).max(3840),
  videoMinResolutionHeight: z.number().min(360).max(2160),
  videoAutoGenerateThumbnails: z.boolean(),
  videoAutoConvertToMp4: z.boolean(),
  videoCompressionQuality: z.enum(['low', 'medium', 'high']),

  // Audio Settings
  audioMaxFileSizeMB: z.number().min(1).max(100),
  audioAllowedFormats: z.array(z.string()).min(1),
  audioMaxDurationMinutes: z.number().min(1).max(30),
  audioRequireStereo: z.boolean(),
  audioMinQuality: z.enum(['low', 'medium', 'high']),
  audioAutoConvertToMp3: z.boolean(),
});

type MediaSettingsFormData = z.infer<typeof mediaSettingsSchema>;

// API functions for fetching and updating media settings
async function fetchMediaSettings(): Promise<MediaSettingsFormData> {
  try {
    const response = await fetch('/api/v1/admin/settings/media');
    if (!response.ok) throw new Error('Failed to fetch media settings');
    return response.json();
  } catch (error) {
    browserLogger.error('Failed to fetch media settings', { error });
    throw error;
  }
}

async function updateMediaSettings(data: MediaSettingsFormData): Promise<void> {
  try {
    const response = await fetch('/api/v1/admin/settings/media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update media settings');
  } catch (error) {
    browserLogger.error('Failed to update media settings', { error });
    throw error;
  }
}

export function UploadSettingsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Query for current settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin', 'settings', 'media'],
    queryFn: fetchMediaSettings,
    // Fallback data for development
    placeholderData: {
      // Picture Settings
      pictureMaxFileSizeMB: 25,
      pictureAllowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      pictureMinWidth: 1080,
      pictureMinHeight: 1080,
      pictureAutoGenerateThumbnails: true,
      pictureRequireOptimization: true,
      pictureCompressionQuality: 85,
      pictureAllowExifData: false,

      // Video Settings
      videoMaxFileSizeMB: 500,
      videoAllowedFormats: ['video/mp4', 'video/quicktime', 'video/webm'],
      videoMaxDurationMinutes: 15,
      videoMinResolutionWidth: 720,
      videoMinResolutionHeight: 480,
      videoAutoGenerateThumbnails: true,
      videoAutoConvertToMp4: true,
      videoCompressionQuality: 'medium' as const,

      // Audio Settings
      audioMaxFileSizeMB: 50,
      audioAllowedFormats: ['audio/mp3', 'audio/wav', 'audio/m4a'],
      audioMaxDurationMinutes: 10,
      audioRequireStereo: false,
      audioMinQuality: 'medium' as const,
      audioAutoConvertToMp3: true,
    }
  });

  // Form setup
  const form = useForm<MediaSettingsFormData>({
    resolver: zodResolver(mediaSettingsSchema),
    values: settings,
  });

  const { watch } = form;
  const watchedFields = watch();

  // Mutation for updating settings
  const updateMutation = useMutation({
    mutationFn: updateMediaSettings,
    onSuccess: () => {
      toast({
        title: 'Media Settings Updated',
        description: 'All media upload settings have been successfully updated.',
      });
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'media'] });
      browserLogger.info('Media settings updated successfully');
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: `Failed to update media settings: ${error.message}`,
        variant: 'destructive',
      });
      browserLogger.error('Failed to update media settings', { error: error.message });
    },
  });

  const onSubmit = (data: MediaSettingsFormData) => {
    updateMutation.mutate(data);
  };

  // Track unsaved changes
  const checkForChanges = () => {
    if (settings && JSON.stringify(watchedFields) !== JSON.stringify(settings)) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          Failed to load media settings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <Alert>
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Remember to save your settings before leaving this page.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* ================================================ */}
          {/* PICTURE SETTINGS CARD */}
          {/* ================================================ */}
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <ImageIcon className="h-6 w-6" />
                Picture Upload Settings
              </CardTitle>
              <CardDescription>
                Configure image formats, dimensions, and processing options for photos and pictures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Picture File Size & Quality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pictureMaxFileSizeMB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum File Size (MB)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="200"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum size for picture uploads (recommended: 25MB or less)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pictureCompressionQuality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compression Quality (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="10"
                          max="100"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        JPEG compression quality (higher = better quality + larger files)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Picture Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pictureMinWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Width (px)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="100"
                          max="10000"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pictureMinHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Height (px)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="100"
                          max="10000"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Picture Allowed Formats */}
              <div>
                <FormLabel className="text-base font-medium mb-3 block">Allowed Picture Formats</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif'].map((format) => (
                    <Badge
                      key={format}
                      variant={form.watch('pictureAllowedFormats')?.includes(format) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = form.getValues('pictureAllowedFormats') || [];
                        const updated = current.includes(format)
                          ? current.filter(f => f !== format)
                          : [...current, format];
                        form.setValue('pictureAllowedFormats', updated);
                        checkForChanges();
                      }}
                    >
                      {format.split('/')[1].toUpperCase()}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click to toggle formats. WebP recommended for best compression.
                </p>
              </div>

              <Separator />

              {/* Picture Processing Options */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="pictureAutoGenerateThumbnails"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-generate Thumbnails</FormLabel>
                        <FormDescription>
                          Automatically create thumbnail versions of uploaded pictures
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pictureRequireOptimization"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Require Image Optimization</FormLabel>
                        <FormDescription>
                          Automatically optimize pictures for web delivery (compression, format conversion)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pictureAllowExifData"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Preserve EXIF Data</FormLabel>
                        <FormDescription className="text-orange-600 dark:text-orange-400">
                          ⚠️ WARNING: EXIF data may contain location and camera information. Disable for privacy.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ================================================ */}
          {/* VIDEO SETTINGS CARD */}
          {/* ================================================ */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <VideoIcon className="h-6 w-6" />
                Video Upload Settings
              </CardTitle>
              <CardDescription>
                Configure video formats, resolution, duration limits, and processing options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Video File Size & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="videoMaxFileSizeMB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum File Size (MB)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="50"
                          max="2000"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum size for video uploads (recommended: 500MB or less)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="videoMaxDurationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="60"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum video length allowed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Video Resolution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="videoMinResolutionWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Width (px)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="480"
                          max="3840"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                      <FormDescription>720p recommended minimum</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="videoMinResolutionHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Height (px)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="360"
                          max="2160"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                      <FormDescription>480p recommended minimum</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Video Compression Quality */}
              <FormField
                control={form.control}
                name="videoCompressionQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Compression Quality</FormLabel>
                    <Select value={field.value} onValueChange={(value) => { field.onChange(value); checkForChanges(); }}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low (smaller files, lower quality)</SelectItem>
                        <SelectItem value="medium">Medium (balanced)</SelectItem>
                        <SelectItem value="high">High (larger files, better quality)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Balance between file size and video quality
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Video Allowed Formats */}
              <div>
                <FormLabel className="text-base font-medium mb-3 block">Allowed Video Formats</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-ms-wmv'].map((format) => (
                    <Badge
                      key={format}
                      variant={form.watch('videoAllowedFormats')?.includes(format) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = form.getValues('videoAllowedFormats') || [];
                        const updated = current.includes(format)
                          ? current.filter(f => f !== format)
                          : [...current, format];
                        form.setValue('videoAllowedFormats', updated);
                        checkForChanges();
                      }}
                    >
                      {format.split('/')[1].toUpperCase().replace('X-MS-', '').replace('X-', '')}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click to toggle formats. MP4 recommended for best compatibility.
                </p>
              </div>

              <Separator />

              {/* Video Processing Options */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="videoAutoGenerateThumbnails"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-generate Video Thumbnails</FormLabel>
                        <FormDescription>
                          Automatically create thumbnail images from video frames
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="videoAutoConvertToMp4"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-convert to MP4</FormLabel>
                        <FormDescription>
                          Automatically convert videos to MP4 format for universal compatibility
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ================================================ */}
          {/* AUDIO SETTINGS CARD */}
          {/* ================================================ */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <AudioLinesIcon className="h-6 w-6" />
                Audio Upload Settings
              </CardTitle>
              <CardDescription>
                Configure audio formats, duration limits, and quality requirements for voice portfolios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Audio File Size & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="audioMaxFileSizeMB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum File Size (MB)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum size for audio uploads (recommended: 50MB or less)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="audioMaxDurationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="30"
                          {...field}
                          onChange={(e) => {
                            field.onChange(Number(e.target.value));
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum audio length for voice portfolios
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Audio Quality Settings */}
              <FormField
                control={form.control}
                name="audioMinQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Audio Quality</FormLabel>
                    <Select value={field.value} onValueChange={(value) => { field.onChange(value); checkForChanges(); }}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low (32-64 kbps)</SelectItem>
                        <SelectItem value="medium">Medium (128 kbps)</SelectItem>
                        <SelectItem value="high">High (256+ kbps)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Minimum acceptable audio quality for uploads
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Audio Allowed Formats */}
              <div>
                <FormLabel className="text-base font-medium mb-3 block">Allowed Audio Formats</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'].map((format) => (
                    <Badge
                      key={format}
                      variant={form.watch('audioAllowedFormats')?.includes(format) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = form.getValues('audioAllowedFormats') || [];
                        const updated = current.includes(format)
                          ? current.filter(f => f !== format)
                          : [...current, format];
                        form.setValue('audioAllowedFormats', updated);
                        checkForChanges();
                      }}
                    >
                      {format.split('/')[1].toUpperCase()}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click to toggle formats. MP3 recommended for best compatibility.
                </p>
              </div>

              <Separator />

              {/* Audio Processing Options */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="audioRequireStereo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Require Stereo Audio</FormLabel>
                        <FormDescription>
                          Only accept stereo (2-channel) audio files, reject mono recordings
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="audioAutoConvertToMp3"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto-convert to MP3</FormLabel>
                        <FormDescription>
                          Automatically convert audio files to MP3 format for universal compatibility
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            checkForChanges();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending || !hasUnsavedChanges}
              className="min-w-32"
            >
              {updateMutation.isPending ? (
                <>
                  <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 