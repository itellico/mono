'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Star, 
  CheckCircle, 
  Info,
  Building,
  Briefcase,
  Users,
  Zap,
  Shield,
  Crown,
  ArrowRight,
  Calendar,
  Tag
} from 'lucide-react';

interface IndustryTemplate {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category: string;
  features: any;
  defaultConfig: any;
  isActive: boolean;
  isFeatured: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}

interface CurrentTemplate {
  template: IndustryTemplate & {
    subscription: {
      id: number;
      planId: number;
      status: string;
      startDate: string;
      endDate?: string;
    };
  } | null;
}

interface TemplateCategory {
  category: string;
  count: number;
}

// API Functions
async function fetchIndustryTemplates(params?: any): Promise<{
  templates: IndustryTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams(params);
  const response = await fetch(`/api/v1/tenant/industry-templates?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch industry templates');
  }
  const result = await response.json();
  return result.data;
}

async function fetchCurrentTemplate(): Promise<CurrentTemplate> {
  const response = await fetch('/api/v1/tenant/industry-templates/current');
  if (!response.ok) {
    throw new Error('Failed to fetch current template');
  }
  const result = await response.json();
  return result.data;
}

async function fetchTemplateCategories(): Promise<TemplateCategory[]> {
  const response = await fetch('/api/v1/tenant/industry-templates/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch template categories');
  }
  const result = await response.json();
  return result.data.categories;
}

async function fetchTemplateDetails(id: number): Promise<IndustryTemplate> {
  const response = await fetch(`/api/v1/tenant/industry-templates/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch template details');
  }
  const result = await response.json();
  return result.data.template;
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case 'e-commerce': return <Briefcase className="h-5 w-5 text-blue-500" />;
    case 'marketplace': return <Users className="h-5 w-5 text-green-500" />;
    case 'saas': return <Zap className="h-5 w-5 text-purple-500" />;
    case 'agency': return <Building className="h-5 w-5 text-orange-500" />;
    case 'entertainment': return <Star className="h-5 w-5 text-pink-500" />;
    default: return <Building className="h-5 w-5 text-gray-500" />;
  }
}

export function IndustryTemplatesClientPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IndustryTemplate | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Queries
  const { data: templatesData, isLoading: loadingTemplates } = useQuery({
    queryKey: ['industry-templates', searchQuery, selectedCategory, showFeaturedOnly],
    queryFn: () => fetchIndustryTemplates({
      search: searchQuery || undefined,
      category: selectedCategory || undefined,
      featured: showFeaturedOnly || undefined,
      limit: 50,
    }),
  });

  const { data: currentTemplate, isLoading: loadingCurrent } = useQuery({
    queryKey: ['current-template'],
    queryFn: fetchCurrentTemplate,
  });

  const { data: categories } = useQuery({
    queryKey: ['template-categories'],
    queryFn: fetchTemplateCategories,
  });

  const { data: templateDetails } = useQuery({
    queryKey: ['template-details', selectedTemplate?.id],
    queryFn: () => selectedTemplate ? fetchTemplateDetails(selectedTemplate.id) : null,
    enabled: !!selectedTemplate,
  });

  const handleViewDetails = (template: IndustryTemplate) => {
    setSelectedTemplate(template);
    setDetailsDialogOpen(true);
  };

  if (loadingTemplates || loadingCurrent) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Industry Templates</h1>
        <p className="text-muted-foreground">
          Browse and select industry templates to configure your workspace
        </p>
      </div>

      {/* Current Template */}
      {currentTemplate?.template && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-yellow-500" />
                <div>
                  <CardTitle className="text-xl">Current Template</CardTitle>
                  <CardDescription>
                    Your active industry template and subscription
                  </CardDescription>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Template</Label>
                <div className="flex items-center gap-2">
                  {getCategoryIcon(currentTemplate.template.category)}
                  <span className="font-semibold">{currentTemplate.template.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentTemplate.template.description}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <Badge variant="outline">{currentTemplate.template.category}</Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Subscription</Label>
                <div className="space-y-1">
                  <Badge variant={currentTemplate.template.subscription.status === 'active' ? 'default' : 'destructive'}>
                    {currentTemplate.template.subscription.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Since {new Date(currentTemplate.template.subscription.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Templates</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showFeaturedOnly ? "default" : "outline"}
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
            >
              <Star className="h-4 w-4 mr-2" />
              Featured Only
            </Button>
          </div>

          {/* Templates Grid */}
          {templatesData && templatesData.templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templatesData.templates.map((template) => {
                const isCurrent = currentTemplate?.template?.id === template.id;
                
                return (
                  <Card 
                    key={template.id} 
                    className={`relative cursor-pointer transition-all hover:shadow-lg ${
                      isCurrent ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleViewDetails(template)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(template.category)}
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {template.isFeatured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          {isCurrent && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {template.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Version</span>
                          <Badge variant="secondary">v{template.version}</Badge>
                        </div>

                        <Separator />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(template.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Button size="sm" variant="ghost">
                            View Details
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Templates Found"
              description="No industry templates match your current search criteria."
            />
          )}

          {/* Pagination Info */}
          {templatesData && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {templatesData.templates.length} of {templatesData.pagination.total} templates
              </p>
              {templatesData.pagination.totalPages > 1 && (
                <p className="text-sm text-muted-foreground">
                  Page {templatesData.pagination.page} of {templatesData.pagination.totalPages}
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {categories && categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card 
                  key={category.category}
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => {
                    setSelectedCategory(category.category);
                    setShowFeaturedOnly(false);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(category.category)}
                        <CardTitle className="text-lg capitalize">
                          {category.category}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary">
                        {category.count}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      Browse {category.count} template{category.count !== 1 ? 's' : ''}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Categories Available"
              description="No template categories are currently available."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Template Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {selectedTemplate && getCategoryIcon(selectedTemplate.category)}
              <div>
                <DialogTitle className="text-2xl">
                  {selectedTemplate?.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedTemplate?.category} industry template
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {templateDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm capitalize">{templateDetails.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Version</Label>
                  <p className="text-sm">v{templateDetails.version}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={templateDetails.isActive ? 'default' : 'secondary'}>
                    {templateDetails.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {templateDetails.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {templateDetails.description}
                  </p>
                </div>
              )}

              {templateDetails.isFeatured && (
                <Alert>
                  <Star className="h-4 w-4" />
                  <AlertDescription>
                    This is a featured template, recommended for most businesses in this category.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label className="text-sm font-medium">Included Features</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Feature configuration details would be displayed here based on the template's feature set.
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Default Configuration</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Default settings and configuration options would be shown here.
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
                  Close
                </Button>
                {currentTemplate?.template?.id !== selectedTemplate?.id && (
                  <Button>
                    <Shield className="h-4 w-4 mr-2" />
                    Switch to This Template
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}