import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Terminal } from 'lucide-react';

export default function StyleTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Typography Test */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">Style Test Page</h1>
        <p className="text-lg text-muted-foreground">
          This page demonstrates the modern styling with Inter font and shadcn/ui components.
        </p>
      </section>

      {/* Font Test */}
      <Card>
        <CardHeader>
          <CardTitle>Typography & Fonts</CardTitle>
          <CardDescription>Testing Inter font family and sizes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h1 className="text-5xl font-bold">Heading 1 - Inter Bold</h1>
          <h2 className="text-4xl font-semibold">Heading 2 - Inter Semibold</h2>
          <h3 className="text-3xl font-medium">Heading 3 - Inter Medium</h3>
          <p className="text-base">
            Regular paragraph text using Inter font. This should look modern and clean,
            not like Times New Roman from the year 2000.
          </p>
          <p className="text-sm text-muted-foreground">
            Small muted text for descriptions and secondary information.
          </p>
          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
            const code = "JetBrains Mono font for code";
          </code>
        </CardContent>
      </Card>

      {/* Components Test */}
      <Card>
        <CardHeader>
          <CardTitle>shadcn/ui Components</CardTitle>
          <CardDescription>Modern component styling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div className="space-y-2">
            <h4 className="font-semibold">Buttons</h4>
            <div className="flex gap-2 flex-wrap">
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-2">
            <h4 className="font-semibold">Badges</h4>
            <div className="flex gap-2 flex-wrap">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>

          {/* Alert */}
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Modern Alert</AlertTitle>
            <AlertDescription>
              This alert uses modern styling with proper spacing and typography.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Tabs Example */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Components</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Account Information</h4>
                <p className="text-sm text-muted-foreground">
                  Update your account settings and preferences here.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="password" className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Password Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Change your password and security settings.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">General Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your application preferences.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>Modern neutral color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 bg-background border rounded"></div>
              <p className="text-sm font-medium">Background</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-foreground rounded"></div>
              <p className="text-sm font-medium">Foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-primary rounded"></div>
              <p className="text-sm font-medium">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-secondary rounded"></div>
              <p className="text-sm font-medium">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-muted rounded"></div>
              <p className="text-sm font-medium">Muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-accent rounded"></div>
              <p className="text-sm font-medium">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-destructive rounded"></div>
              <p className="text-sm font-medium">Destructive</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-border rounded"></div>
              <p className="text-sm font-medium">Border</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}