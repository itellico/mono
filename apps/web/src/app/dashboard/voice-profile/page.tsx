import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Mic, Upload, Play, Pause, Volume2, Music, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Voice Profile | mono',
  description: 'Manage your voice portfolio and audio samples',
};

export default async function VoiceProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard/voice-profile');
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Profile</h1>
          <p className="text-muted-foreground mt-2">
            Showcase your voice talents and audio portfolio
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Audio
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Record Sample
          </Button>
        </div>
      </div>

      {/* Voice Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audio Samples</CardTitle>
            <Volume2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Ready to upload your first sample
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice Categories</CardTitle>
            <Music className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Showcase different styles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
            <Play className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Portfolio engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Complete</CardTitle>
            <Mic className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15%</div>
            <p className="text-xs text-muted-foreground">
              Add voice samples to complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Voice Profile Management */}
      <Tabs defaultValue="samples" className="space-y-6">
        <TabsList>
          <TabsTrigger value="samples" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Audio Samples
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Voice Categories
          </TabsTrigger>
          <TabsTrigger value="reel" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Voice Reel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="samples">
          <Card>
            <CardHeader>
              <CardTitle>Audio Samples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-20 text-muted-foreground">
                <Mic className="h-16 w-16 mx-auto mb-6 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-3">Build Your Voice Portfolio</h3>
                <p className="text-base mb-6 max-w-md mx-auto">
                  Upload high-quality audio samples to showcase your voice talents. 
                  Include different styles, accents, and delivery methods.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload First Sample
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Record Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Voice Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Commercial', description: 'TV and radio advertisements', count: 0, color: 'bg-blue-100 text-blue-800' },
                  { name: 'Narration', description: 'Documentary and storytelling', count: 0, color: 'bg-emerald-100 text-emerald-800' },
                  { name: 'Character', description: 'Animation and gaming voices', count: 0, color: 'bg-purple-100 text-purple-800' },
                  { name: 'IVR/Phone', description: 'Phone systems and messaging', count: 0, color: 'bg-orange-100 text-orange-800' },
                  { name: 'Audiobook', description: 'Book narration and reading', count: 0, color: 'bg-teal-100 text-teal-800' },
                  { name: 'Podcast', description: 'Podcast hosting and intro/outro', count: 0, color: 'bg-pink-100 text-pink-800' }
                ].map((category) => (
                  <Card key={category.name} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{category.name}</h4>
                        <Badge className={category.color}>
                          {category.count} samples
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                      <Button size="sm" variant="outline" className="mt-3 w-full">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Sample
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reel">
          <Card>
            <CardHeader>
              <CardTitle>Voice Reel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16 text-muted-foreground">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 max-w-md mx-auto">
                  <Play className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-semibold mb-2">Create Your Voice Reel</h3>
                  <p className="text-sm mb-4">
                    Combine your best samples into a professional demo reel that showcases your range and versatility.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span>Reel Progress</span>
                      <span>0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                  </div>
                  <Button className="w-full">
                    Start Creating Reel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Voice Profile Guidelines */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Voice Profile Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Audio Quality Standards</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Minimum 44.1kHz sample rate</li>
                <li>• 16-bit or higher bit depth</li>
                <li>• Low background noise (under -60dB)</li>
                <li>• Consistent volume levels</li>
                <li>• Clear pronunciation and diction</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Content Recommendations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 30-60 second sample length</li>
                <li>• Show range and versatility</li>
                <li>• Include different emotions/tones</li>
                <li>• Professional script content</li>
                <li>• Multiple accent/style examples</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 