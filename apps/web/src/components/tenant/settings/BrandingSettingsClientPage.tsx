'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from '@/components/ui/loading-state';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Palette, 
  Upload, 
  Globe, 
  Mail, 
  Code,
  Save,
  RotateCcw,
  Eye,
  Download,
  Copy,
  Check,
  AlertCircle,
  Smartphone,
  Monitor,
  Image
} from 'lucide-react';
import { toast } from 'sonner';

interface BrandingSettings {
  logo: string;
  logoLight: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  customCss: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  emailHeader: string;
  emailFooter: string;
  brandName: string;
  tagline: string;
}

// Mock data for development
const mockBrandingSettings: BrandingSettings = {
  logo: '/assets/logo.png',
  logoLight: '/assets/logo-light.png',
  favicon: '/assets/favicon.ico',
  primaryColor: '#6366F1',
  secondaryColor: '#8B5CF6',
  accentColor: '#F59E0B',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  fontFamily: 'Inter',
  customCss: '',
  metaTitle: 'ClickDami - Professional Talent Marketplace',
  metaDescription: 'Connect with top models, photographers, and creative professionals',
  ogImage: '/assets/og-image.png',
  emailHeader: '<div style="text-align: center; padding: 20px;"><img src="{logo}" alt="{brandName}" style="max-width: 200px;"></div>',
  emailFooter: '<div style="text-align: center; padding: 20px; color: #666;"><p>&copy; {year} {brandName}. All rights reserved.</p></div>',
  brandName: 'ClickDami',
  tagline: 'Where Talent Meets Opportunity'
};

// API Functions
async function fetchBrandingSettings(): Promise<BrandingSettings> {
  // Mock API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockBrandingSettings), 500);
  });
}

async function updateBrandingSettings(settings: Partial<BrandingSettings>): Promise<void> {
  // Mock API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 500);
  });
}

function ColorPicker({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div 
          className="w-12 h-12 rounded-lg border cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => document.getElementById(`color-${label}`)?.click()}
        />
        <Input
          id={`color-${label}`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
      </div>
    </div>
  );
}

function ImageUpload({ value, onChange, label, aspectRatio }: { 
  value: string; 
  onChange: (value: string) => void; 
  label: string;
  aspectRatio?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file upload logic here
    toast.success('File uploaded successfully');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="space-y-4">
            <img 
              src={value} 
              alt={label} 
              className="mx-auto max-h-32 object-contain"
            />
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Replace
              </Button>
              <Button size="sm" variant="outline" onClick={() => onChange('')}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag and drop or click to upload
            </p>
            {aspectRatio && (
              <p className="text-xs text-muted-foreground">
                Recommended: {aspectRatio}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandingSettingsClientPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BrandingSettings>(mockBrandingSettings);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copied, setCopied] = useState(false);

  // Queries
  const { data: settings, isLoading } = useQuery({
    queryKey: ['branding-settings'],
    queryFn: fetchBrandingSettings,
    onSuccess: (data) => setFormData(data),
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: updateBrandingSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding-settings'] });
      toast.success('Branding settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update branding settings');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleReset = () => {
    if (settings) {
      setFormData(settings);
      toast.info('Settings reset to last saved state');
    }
  };

  const handleCopyCSS = () => {
    const cssVariables = `
:root {
  --primary: ${formData.primaryColor};
  --secondary: ${formData.secondaryColor};
  --accent: ${formData.accentColor};
  --background: ${formData.backgroundColor};
  --text: ${formData.textColor};
  --font-family: ${formData.fontFamily}, sans-serif;
}`.trim();

    navigator.clipboard.writeText(cssVariables);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('CSS variables copied to clipboard');
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branding & White Label</h1>
          <p className="text-muted-foreground">
            Customize your marketplace appearance and branding
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
              <CardDescription>
                Basic information about your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="Your Brand Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="Your Brand Tagline"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="metaTitle">SEO Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="Page title for search engines"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.metaTitle.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">SEO Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="Page description for search engines"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.metaDescription.length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Scheme</CardTitle>
              <CardDescription>
                Customize your brand colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ColorPicker
                  label="Primary Color"
                  value={formData.primaryColor}
                  onChange={(value) => setFormData({ ...formData, primaryColor: value })}
                />
                <ColorPicker
                  label="Secondary Color"
                  value={formData.secondaryColor}
                  onChange={(value) => setFormData({ ...formData, secondaryColor: value })}
                />
                <ColorPicker
                  label="Accent Color"
                  value={formData.accentColor}
                  onChange={(value) => setFormData({ ...formData, accentColor: value })}
                />
                <ColorPicker
                  label="Background Color"
                  value={formData.backgroundColor}
                  onChange={(value) => setFormData({ ...formData, backgroundColor: value })}
                />
                <ColorPicker
                  label="Text Color"
                  value={formData.textColor}
                  onChange={(value) => setFormData({ ...formData, textColor: value })}
                />
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <Select 
                    value={formData.fontFamily} 
                    onValueChange={(value) => setFormData({ ...formData, fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Color Preview</h4>
                  <Button size="sm" variant="outline" onClick={handleCopyCSS}>
                    {copied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy CSS Variables
                  </Button>
                </div>
                <div className="rounded-lg border p-4" style={{
                  backgroundColor: formData.backgroundColor,
                  color: formData.textColor,
                  fontFamily: `${formData.fontFamily}, sans-serif`
                }}>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold" style={{ color: formData.primaryColor }}>
                      {formData.brandName}
                    </h3>
                    <p>{formData.tagline}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        style={{
                          backgroundColor: formData.primaryColor,
                          color: formData.backgroundColor
                        }}
                      >
                        Primary Button
                      </Button>
                      <Button 
                        size="sm"
                        style={{
                          backgroundColor: formData.secondaryColor,
                          color: formData.backgroundColor
                        }}
                      >
                        Secondary
                      </Button>
                      <Button 
                        size="sm"
                        style={{
                          backgroundColor: formData.accentColor,
                          color: formData.backgroundColor
                        }}
                      >
                        Accent
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Assets</CardTitle>
              <CardDescription>
                Upload your logos and images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUpload
                  label="Logo (Dark Background)"
                  value={formData.logo}
                  onChange={(value) => setFormData({ ...formData, logo: value })}
                  aspectRatio="16:9 or square"
                />
                <ImageUpload
                  label="Logo (Light Background)"
                  value={formData.logoLight}
                  onChange={(value) => setFormData({ ...formData, logoLight: value })}
                  aspectRatio="16:9 or square"
                />
                <ImageUpload
                  label="Favicon"
                  value={formData.favicon}
                  onChange={(value) => setFormData({ ...formData, favicon: value })}
                  aspectRatio="1:1 (32x32px)"
                />
                <ImageUpload
                  label="Social Media Preview"
                  value={formData.ogImage}
                  onChange={(value) => setFormData({ ...formData, ogImage: value })}
                  aspectRatio="1200x630px"
                />
              </div>

              <Alert>
                <Image className="h-4 w-4" />
                <AlertDescription>
                  For best results, use high-quality images in PNG or SVG format. 
                  Logos should have transparent backgrounds.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Customize your email branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="emailHeader">Email Header HTML</Label>
                <Textarea
                  id="emailHeader"
                  value={formData.emailHeader}
                  onChange={(e) => setFormData({ ...formData, emailHeader: e.target.value })}
                  placeholder="HTML for email header"
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {'{logo}'}, {'{brandName}'}, {'{year}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailFooter">Email Footer HTML</Label>
                <Textarea
                  id="emailFooter"
                  value={formData.emailFooter}
                  onChange={(e) => setFormData({ ...formData, emailFooter: e.target.value })}
                  placeholder="HTML for email footer"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Email Preview</h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={previewMode === 'desktop' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewMode === 'mobile' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className={`border rounded-lg p-4 ${
                  previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
                }`}>
                  <div 
                    dangerouslySetInnerHTML={{
                      __html: formData.emailHeader
                        .replace('{logo}', formData.logo)
                        .replace('{brandName}', formData.brandName)
                        .replace('{year}', new Date().getFullYear().toString())
                    }}
                  />
                  <div className="py-8 px-4">
                    <p className="text-sm text-muted-foreground">
                      Email content goes here...
                    </p>
                  </div>
                  <div 
                    dangerouslySetInnerHTML={{
                      __html: formData.emailFooter
                        .replace('{brandName}', formData.brandName)
                        .replace('{year}', new Date().getFullYear().toString())
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
              <CardDescription>
                Add custom CSS to further customize your marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Custom CSS is an advanced feature. Invalid CSS may break your site's appearance.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="customCss">Custom CSS</Label>
                <Textarea
                  id="customCss"
                  value={formData.customCss}
                  onChange={(e) => setFormData({ ...formData, customCss: e.target.value })}
                  placeholder="/* Your custom CSS here */"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Changes
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Theme
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Reset all branding to defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">
                Reset All Branding Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}