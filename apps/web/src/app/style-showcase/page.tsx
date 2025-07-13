'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';

export default function StyleShowcasePage() {
  const [sliderValue, setSliderValue] = useState([50]);
  const [switchValue, setSwitchValue] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-12">
      <div className="container mx-auto px-4 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Modern Style Showcase
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the power of modern web design with shadcn/ui components, 
            Inter font family, and beautiful Tailwind CSS styling.
          </p>
        </div>

        {/* Typography Showcase */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <CardTitle className="text-3xl">Typography Excellence</CardTitle>
            <CardDescription className="text-blue-100">
              Modern typography with Inter font family
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold">Beautiful Headings</h2>
                <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                  Sub-headings that complement
                </h3>
                <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                  Body text that's easy to read with perfect line height and spacing. 
                  The Inter font family provides excellent readability across all devices.
                </p>
                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400">
                  "Great typography is the foundation of great design"
                </blockquote>
              </div>
              <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <h4 className="font-semibold text-lg mb-2">Font Weights</h4>
                <p className="font-thin">Thin (100)</p>
                <p className="font-light">Light (300)</p>
                <p className="font-normal">Regular (400)</p>
                <p className="font-medium">Medium (500)</p>
                <p className="font-semibold">Semibold (600)</p>
                <p className="font-bold">Bold (700)</p>
                <p className="font-black">Black (900)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component Gallery */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Form Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
              <CardDescription>Modern input components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Type your message here" />
              </div>
              <div>
                <Label htmlFor="select">Choose Option</Label>
                <Select>
                  <SelectTrigger id="select">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="airplane-mode"
                  checked={switchValue}
                  onCheckedChange={setSwitchValue}
                />
                <Label htmlFor="airplane-mode">Airplane Mode</Label>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Interactive Elements</CardTitle>
              <CardDescription>Sliders and progress bars</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Volume Control</Label>
                <Slider
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  max={100}
                  step={1}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Value: {sliderValue[0]}%
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Upload Progress</Label>
                <Progress value={33} className="h-2" />
                <Progress value={66} className="h-2" />
                <Progress value={100} className="h-2" />
              </div>
              <Separator />
              <div className="flex gap-2">
                <Badge>New</Badge>
                <Badge variant="secondary">Popular</Badge>
                <Badge variant="destructive">Hot</Badge>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Avatar and user info</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">Jane Doe</h3>
                  <p className="text-sm text-muted-foreground">jane@example.com</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">Pro User</Badge>
                    <Badge variant="outline">Verified</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">View Profile</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Button Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Button Collection</CardTitle>
            <CardDescription>All button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Variants */}
            <div>
              <h4 className="font-semibold mb-4">Variants</h4>
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            
            {/* Sizes */}
            <div>
              <h4 className="font-semibold mb-4">Sizes</h4>
              <div className="flex items-center gap-2">
                <Button size="sm">Small</Button>
                <Button>Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h4 className="font-semibold mb-4">States</h4>
              <div className="flex gap-2">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
                <Button className="animate-pulse">Loading...</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>Modern color system with CSS variables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Background', class: 'bg-background' },
                { name: 'Foreground', class: 'bg-foreground' },
                { name: 'Primary', class: 'bg-primary' },
                { name: 'Secondary', class: 'bg-secondary' },
                { name: 'Muted', class: 'bg-muted' },
                { name: 'Accent', class: 'bg-accent' },
                { name: 'Destructive', class: 'bg-destructive' },
                { name: 'Border', class: 'bg-border' },
              ].map((color) => (
                <div key={color.name} className="text-center">
                  <div className={`h-24 rounded-lg ${color.class} border shadow-sm`} />
                  <p className="mt-2 text-sm font-medium">{color.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modern Effects */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle>Modern Effects</CardTitle>
            <CardDescription className="text-purple-100">
              Gradients, shadows, and animations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-800">
                <h4 className="font-semibold mb-2">Gradient Background</h4>
                <p className="text-sm">Subtle gradients add depth</p>
              </div>
              <div className="p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800">
                <h4 className="font-semibold mb-2">Shadow Effects</h4>
                <p className="text-sm">Modern shadow for elevation</p>
              </div>
              <div className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors">
                <h4 className="font-semibold mb-2">Hover Effects</h4>
                <p className="text-sm">Smooth transitions on hover</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg">
            Built with ❤️ using{' '}
            <span className="font-semibold text-foreground">shadcn/ui</span>,{' '}
            <span className="font-semibold text-foreground">Tailwind CSS</span>, and{' '}
            <span className="font-semibold text-foreground">Inter font</span>
          </p>
          <p className="mt-2">
            No more Times New Roman from the year 2000! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}