'use client';

/**
 * 🎯 Enhanced Tenant Data Management Interface
 * 
 * Advanced template management system with visual components,
 * import wizards, and comprehensive template browsing capabilities.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Package, 
  Users, 
  Settings,
  Database,
  Calendar,
  TrendingUp,
  Info,
  Loader2,
  Grid,
  List,
  RefreshCw,
  Plus,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Temporarily commented out - components need to be created
// import { TemplateCard } from '@/components/admin/templates/TemplateCard';
// import { ImportWizard } from '@/components/admin/templates/ImportWizard';

interface Template {
  templateId: string;
  name: string;
  description: string;
  industry: string;
  subIndustry?: string;
  version: string;
  includes: {
    categories: number;
    optionSets: number;
    attributeDefinitions: number;
  };
  tags: string[];
  targetAudience: string[];
  stats?: {
    totalImports: number;
    lastImported: string;
    popularityScore: number;
  };
  compatibility?: {
    isCompatible: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    conflicts: string[];
    recommendations: string[];
  };
  features?: string[];
  businessValue?: string[];
}

interface Tenant {
  id: string;
  name: string;
  isActive: boolean;
}

/**
 * Enhanced tenant data management page with visual template browser
 * 
 * @component
 * @example
 * ```tsx
 * // Accessible at /admin/tenant-data-management/enhanced
 * <EnhancedTenantDataManagementPage />
 * ```
 */
export default function EnhancedTenantDataManagementPage() {
  const { toast } = useToast();
  
  // State management
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'recent'>('name');
  
  // Dialog states
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadTemplates();
    loadTenants();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch('/api/v1/admin/templates?includeStats=true');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data.templates);
      } else {
        // Fallback to mock data
        setTemplates(getMockTemplates());
      }
    } catch (error) {
      console.warn('Failed to load templates, using mock data:', error);
      setTemplates(getMockTemplates());
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/v1/admin/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data.data.tenants);
      } else {
        // Fallback to mock data
        setTenants(getMockTenants());
      }
    } catch (error) {
      console.warn('Failed to load tenants, using mock data:', error);
      setTenants(getMockTenants());
    }
  };

  // Filter and sort templates
  const filteredAndSortedTemplates = React.useMemo(() => {
    const filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesIndustry = selectedIndustry === 'all' || template.industry === selectedIndustry;
      
      return matchesSearch && matchesIndustry;
    });

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return (b.stats?.popularityScore || 0) - (a.stats?.popularityScore || 0);
        case 'recent':
          return new Date(b.stats?.lastImported || 0).getTime() - new Date(a.stats?.lastImported || 0).getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [templates, searchQuery, selectedIndustry, sortBy]);

  // Get unique industries for filter
  const industries = React.useMemo(() => 
    Array.from(new Set(templates.map(t => t.industry))), 
    [templates]
  );

  // Event handlers
  const handlePreview = (templateId: string) => {
    const template = templates.find(t => t.templateId === templateId);
    if (template) {
      setPreviewTemplate(template);
      setShowPreviewDialog(true);
    }
  };

  const handleImport = (templateId: string) => {
    const template = templates.find(t => t.templateId === templateId);
    if (template) {
      setSelectedTemplate(template);
      setShowImportWizard(true);
    }
  };

  const handleImportSubmit = async (config: any) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/v1/admin/templates/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Import Successful',
          description: `Template imported successfully. ${result.data.summary.categoriesImported} categories, ${result.data.summary.optionSetsImported} option sets, and ${result.data.summary.attributeDefinitionsImported} attributes imported.`,
        });
        
        // Refresh templates
        loadTemplates();
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import template. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleRefresh = () => {
    loadTemplates();
    loadTenants();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Industry Templates</h1>
          <p className="text-muted-foreground">
            Browse and import industry-specific data templates for your tenants
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {industries.length} industries
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.filter(t => t.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for imports
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.reduce((sum, t) => sum + (t.stats?.totalImports || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time imports
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Popularity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(templates.reduce((sum, t) => sum + (t.stats?.popularityScore || 0), 0) / templates.length || 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 10.0
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Browser</CardTitle>
              <CardDescription>
                Search and filter industry templates to find the perfect data model for your tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Industry Filter */}
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry} className="capitalize">
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: 'name' | 'popularity' | 'recent') => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="recent">Recently Used</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {loading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAndSortedTemplates.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No templates found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or browse all available templates.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('');
                    setSelectedIndustry('all');
                  }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filteredAndSortedTemplates.map((template) => (
                  <Card key={template.templateId} className={viewMode === 'list' ? 'flex flex-row' : ''}>
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(template.templateId)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleImport(template.templateId)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Import
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Template Analytics</CardTitle>
              <CardDescription>
                Usage statistics and insights for template imports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  Analytics dashboard coming soon. This will show template usage patterns, 
                  popular imports, and tenant adoption metrics.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                Track template imports across all tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Import history tracking coming soon. This will show detailed logs of 
                  all template imports, including success rates and error reports.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Wizard - Component needs to be created */}
      {/* <ImportWizard
        isOpen={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        template={selectedTemplate}
        tenants={tenants}
        onImport={handleImportSubmit}
      /> */}

      {/* Template Preview Dialog */}
      {previewTemplate && (
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Template Preview: {previewTemplate.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Template Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Industry</Label>
                  <div className="text-sm text-muted-foreground capitalize">
                    {previewTemplate.industry} / {previewTemplate.subIndustry}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Version</Label>
                  <div className="text-sm text-muted-foreground">
                    v{previewTemplate.version}
                  </div>
                </div>
              </div>

              {/* Features */}
              {previewTemplate.features && (
                <div>
                  <Label className="text-sm font-medium">Features</Label>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                    {previewTemplate.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Business Value */}
              {previewTemplate.businessValue && (
                <div>
                  <Label className="text-sm font-medium">Business Value</Label>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                    {previewTemplate.businessValue.map((value, index) => (
                      <li key={index}>{value}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Content Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span>Categories</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{previewTemplate.includes.categories}</div>
                    <p className="text-xs text-muted-foreground">Content organization</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Option Sets</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{previewTemplate.includes.optionSets}</div>
                    <p className="text-xs text-muted-foreground">Dropdown values</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Database className="h-4 w-4" />
                      <span>Attributes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{previewTemplate.includes.attributeDefinitions}</div>
                    <p className="text-xs text-muted-foreground">Form fields</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Mock data functions
function getMockTemplates(): Template[] {
  return [
    {
      templateId: 'modeling-industry-human',
      name: 'Human Modeling Industry',
      description: 'Complete data set for human modeling platforms including physical attributes, fashion categories, and modeling-specific workflows',
      industry: 'modeling',
      subIndustry: 'human',
      version: '1.0.0',
      includes: {
        categories: 18,
        optionSets: 15,
        attributeDefinitions: 22
      },
      tags: ['modeling', 'fashion', 'human', 'physical-attributes'],
      targetAudience: ['Fashion agencies', 'modeling platforms', 'talent management'],
      stats: {
        totalImports: 45,
        lastImported: '2024-01-15T10:30:00Z',
        popularityScore: 8
      },
      compatibility: {
        isCompatible: true,
        riskLevel: 'low',
        conflicts: [],
        recommendations: ['Consider backing up existing data before import']
      },
      features: [
        'Complete physical attribute management',
        'US/EU/UK clothing size conversions',
        'Modeling specialization categories',
        'Experience level tracking'
      ],
      businessValue: [
        'Streamlined model onboarding',
        'Standardized attribute collection',
        'International size compatibility',
        'Professional industry standards'
      ]
    },
    {
      templateId: 'pet-modeling-industry',
      name: 'Pet & Animal Modeling',
      description: 'Specialized data set for pet modeling, animal talent agencies, and animal-focused content platforms',
      industry: 'modeling',
      subIndustry: 'animals',
      version: '1.0.0',
      includes: {
        categories: 16,
        optionSets: 12,
        attributeDefinitions: 18
      },
      tags: ['pets', 'animals', 'modeling', 'veterinary'],
      targetAudience: ['Pet agencies', 'animal talent platforms', 'veterinary services'],
      stats: {
        totalImports: 23,
        lastImported: '2024-01-10T14:20:00Z',
        popularityScore: 6
      },
      compatibility: {
        isCompatible: true,
        riskLevel: 'low',
        conflicts: [],
        recommendations: ['Works well with base platform template']
      }
    },
    {
      templateId: 'voice-talent-industry',
      name: 'Voice Talent & Audio',
      description: 'Comprehensive data set for voice talent agencies, audio production, and voice-over platforms',
      industry: 'voice',
      subIndustry: 'talent',
      version: '1.0.0',
      includes: {
        categories: 14,
        optionSets: 10,
        attributeDefinitions: 16
      },
      tags: ['voice', 'audio', 'talent', 'production'],
      targetAudience: ['Voice agencies', 'audio production', 'podcast platforms'],
      stats: {
        totalImports: 31,
        lastImported: '2024-01-12T09:15:00Z',
        popularityScore: 7
      },
      compatibility: {
        isCompatible: true,
        riskLevel: 'low',
        conflicts: [],
        recommendations: ['Ideal for audio-focused platforms']
      }
    }
  ];
}

function getMockTenants(): Tenant[] {
  return [
    { id: '1', name: 'itellico Mono', isActive: true },
    { id: '2', name: 'Fashion Models Inc', isActive: true },
    { id: '3', name: 'Pet Talent Agency', isActive: true },
    { id: '4', name: 'Voice Pros Studio', isActive: true },
    { id: '5', name: 'Creative Collective', isActive: false }
  ];
} 