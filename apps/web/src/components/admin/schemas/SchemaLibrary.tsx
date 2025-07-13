/**
 * @fileoverview Schema Library Component - Template gallery and management
 * @version 1.0.0
 * @author itellico Mono
 * 
 * @description
 * Comprehensive schema library for browsing, filtering, and managing
 * schema templates across multiple industries with subscription-aware
 * access control.
 * 
 * @component SchemaLibrary
 * @example
 * ```tsx
 * <SchemaLibrary
 *   tenantId={1}
 *   onTemplateSelect={(template) => console.log('Selected:', template)}
 *   subscriptionTier="premium"
 *   userPermissions={permissions}
 * />
 * ```
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Star, 
  Clock, 
  Users, 
  Tag,
  Zap,
  Crown,
  Building,
  PawPrint,
  Camera,
  User
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { browserLogger } from '@/lib/browser-logger';

// Schema template structure
interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  category: string;
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  isPublic: boolean;
  isPremium: boolean;
  isFeatured: boolean;
  authorId: number;
  authorName: string;
  tenantId?: number | null;
  usageCount: number;
  rating: number;
  ratingCount: number;
  tags: string[];
  fields: SchemaField[];
  metadata: {
    version: string;
    lastUpdated: string;
    complexity: 'simple' | 'moderate' | 'complex';
    estimatedTime: number; // minutes to complete
  };
  preview: {
    thumbnail?: string;
    fieldCount: number;
    requiredFields: number;
    sections: string[];
  };
}

interface SchemaField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  order: number;
}

interface SchemaLibraryProps {
  tenantId?: number | null;
  onTemplateSelect?: (template: SchemaTemplate) => void;
  onTemplatePreview?: (template: SchemaTemplate) => void;
  subscriptionTier?: 'basic' | 'premium' | 'enterprise';
  userPermissions?: string[];
  mode?: 'select' | 'browse' | 'manage';
}

// Mock schema templates data
const MOCK_TEMPLATES: SchemaTemplate[] = [
  {
    id: 'tpl_human_child_basic',
    name: 'Child Model Profile',
    description: 'Essential profile form for child models with safety compliance and parental consent fields.',
    industry: 'human_models',
    category: 'child',
    subscriptionTier: 'basic',
    isPublic: true,
    isPremium: false,
    isFeatured: true,
    authorId: 1,
    authorName: 'itellico Mono',
    usageCount: 1247,
    rating: 4.8,
    ratingCount: 156,
    tags: ['child', 'modeling', 'safety', 'compliance', 'parental-consent'],
    fields: [
      { id: '1', name: 'child_name', label: 'Child Name', type: 'text', required: true, order: 0 },
      { id: '2', name: 'birthdate', label: 'Birth Date', type: 'date', required: true, order: 1 },
      { id: '3', name: 'guardian_name', label: 'Parent/Guardian Name', type: 'text', required: true, order: 2 },
      { id: '4', name: 'guardian_contact', label: 'Guardian Contact', type: 'phone', required: true, order: 3 },
      { id: '5', name: 'height', label: 'Height', type: 'number', required: false, order: 4 },
      { id: '6', name: 'weight', label: 'Weight', type: 'number', required: false, order: 5 },
      { id: '7', name: 'experience', label: 'Previous Experience', type: 'textarea', required: false, order: 6 }
    ],
    metadata: {
      version: '2.1.0',
      lastUpdated: '2024-01-20T10:30:00Z',
      complexity: 'simple',
      estimatedTime: 8
    },
    preview: {
      fieldCount: 7,
      requiredFields: 4,
      sections: ['Personal Info', 'Physical Stats', 'Experience']
    }
  },
  {
    id: 'tpl_human_fashion_premium',
    name: 'Fashion Model Portfolio',
    description: 'Comprehensive fashion model profile with measurements, portfolio galleries, and career preferences.',
    industry: 'human_models',
    category: 'fashion',
    subscriptionTier: 'premium',
    isPublic: true,
    isPremium: true,
    isFeatured: true,
    authorId: 1,
    authorName: 'itellico Mono',
    usageCount: 892,
    rating: 4.9,
    ratingCount: 124,
    tags: ['fashion', 'portfolio', 'measurements', 'runway', 'editorial'],
    fields: [
      { id: '1', name: 'model_name', label: 'Model Name', type: 'text', required: true, order: 0 },
      { id: '2', name: 'stage_name', label: 'Stage Name', type: 'text', required: false, order: 1 },
      { id: '3', name: 'height_cm', label: 'Height (cm)', type: 'number', required: true, order: 2 },
      { id: '4', name: 'bust', label: 'Bust', type: 'number', required: true, order: 3 },
      { id: '5', name: 'waist', label: 'Waist', type: 'number', required: true, order: 4 },
      { id: '6', name: 'hips', label: 'Hips', type: 'number', required: true, order: 5 },
      { id: '7', name: 'dress_size', label: 'Dress Size', type: 'select', required: true, order: 6 },
      { id: '8', name: 'shoe_size', label: 'Shoe Size', type: 'select', required: true, order: 7 },
      { id: '9', name: 'portfolio_images', label: 'Portfolio Images', type: 'image', required: false, order: 8 },
      { id: '10', name: 'specialties', label: 'Specialties', type: 'checkbox', required: false, order: 9 }
    ],
    metadata: {
      version: '3.0.1',
      lastUpdated: '2024-01-22T15:45:00Z',
      complexity: 'moderate',
      estimatedTime: 15
    },
    preview: {
      fieldCount: 10,
      requiredFields: 7,
      sections: ['Basic Info', 'Measurements', 'Portfolio', 'Preferences']
    }
  },
  {
    id: 'tpl_animal_dog_basic',
    name: 'Dog Talent Profile',
    description: 'Professional dog talent registration with training history, health records, and performance capabilities.',
    industry: 'animal_talent',
    category: 'dog',
    subscriptionTier: 'basic',
    isPublic: true,
    isPremium: false,
    isFeatured: false,
    authorId: 1,
    authorName: 'itellico Mono',
    usageCount: 634,
    rating: 4.7,
    ratingCount: 89,
    tags: ['dog', 'animal', 'training', 'health', 'performance'],
    fields: [
      { id: '1', name: 'dog_name', label: 'Dog Name', type: 'text', required: true, order: 0 },
      { id: '2', name: 'breed', label: 'Breed', type: 'select', required: true, order: 1 },
      { id: '3', name: 'age', label: 'Age', type: 'number', required: true, order: 2 },
      { id: '4', name: 'weight', label: 'Weight (kg)', type: 'number', required: true, order: 3 },
      { id: '5', name: 'color', label: 'Color/Markings', type: 'text', required: true, order: 4 },
      { id: '6', name: 'training_level', label: 'Training Level', type: 'select', required: true, order: 5 },
      { id: '7', name: 'special_skills', label: 'Special Skills', type: 'textarea', required: false, order: 6 }
    ],
    metadata: {
      version: '1.3.0',
      lastUpdated: '2024-01-18T09:15:00Z',
      complexity: 'simple',
      estimatedTime: 10
    },
    preview: {
      fieldCount: 7,
      requiredFields: 6,
      sections: ['Basic Info', 'Physical Description', 'Training & Skills']
    }
  },
  {
    id: 'tpl_agency_modeling_enterprise',
    name: 'Modeling Agency Profile',
    description: 'Complete modeling agency registration with business details, roster management, and industry certifications.',
    industry: 'agencies',
    category: 'modeling_agency',
    subscriptionTier: 'enterprise',
    isPublic: true,
    isPremium: true,
    isFeatured: true,
    authorId: 1,
    authorName: 'itellico Mono',
    usageCount: 234,
    rating: 4.9,
    ratingCount: 67,
    tags: ['agency', 'business', 'modeling', 'roster', 'certification'],
    fields: [
      { id: '1', name: 'agency_name', label: 'Agency Name', type: 'text', required: true, order: 0 },
      { id: '2', name: 'business_registration', label: 'Business Registration', type: 'text', required: true, order: 1 },
      { id: '3', name: 'founded_year', label: 'Founded Year', type: 'number', required: true, order: 2 },
      { id: '4', name: 'headquarters', label: 'Headquarters Address', type: 'address', required: true, order: 3 },
      { id: '5', name: 'specializations', label: 'Specializations', type: 'checkbox', required: true, order: 4 },
      { id: '6', name: 'roster_size', label: 'Current Roster Size', type: 'number', required: false, order: 5 },
      { id: '7', name: 'notable_clients', label: 'Notable Clients', type: 'textarea', required: false, order: 6 },
      { id: '8', name: 'certifications', label: 'Industry Certifications', type: 'file', required: false, order: 7 }
    ],
    metadata: {
      version: '2.4.0',
      lastUpdated: '2024-01-25T11:20:00Z',
      complexity: 'complex',
      estimatedTime: 25
    },
    preview: {
      fieldCount: 8,
      requiredFields: 5,
      sections: ['Business Info', 'Operations', 'Portfolio', 'Credentials']
    }
  },
  {
    id: 'tpl_photographer_basic',
    name: 'Photographer Profile',
    description: 'Professional photographer profile with portfolio showcase, specialties, and availability calendar.',
    industry: 'service_providers',
    category: 'photographer',
    subscriptionTier: 'basic',
    isPublic: true,
    isPremium: false,
    isFeatured: false,
    authorId: 1,
    authorName: 'itellico Mono',
    usageCount: 445,
    rating: 4.6,
    ratingCount: 78,
    tags: ['photographer', 'portfolio', 'services', 'specialties'],
    fields: [
      { id: '1', name: 'photographer_name', label: 'Photographer Name', type: 'text', required: true, order: 0 },
      { id: '2', name: 'business_name', label: 'Business Name', type: 'text', required: false, order: 1 },
      { id: '3', name: 'experience_years', label: 'Years of Experience', type: 'number', required: true, order: 2 },
      { id: '4', name: 'specialties', label: 'Photography Specialties', type: 'checkbox', required: true, order: 3 },
      { id: '5', name: 'equipment', label: 'Primary Equipment', type: 'textarea', required: false, order: 4 },
      { id: '6', name: 'portfolio_url', label: 'Portfolio Website', type: 'text', required: false, order: 5 }
    ],
    metadata: {
      version: '1.1.0',
      lastUpdated: '2024-01-15T14:30:00Z',
      complexity: 'simple',
      estimatedTime: 12
    },
    preview: {
      fieldCount: 6,
      requiredFields: 3,
      sections: ['Professional Info', 'Services', 'Portfolio']
    }
  }
];

// Industry icons mapping
const INDUSTRY_ICONS = {
  human_models: User,
  animal_talent: PawPrint,
  agencies: Building,
  service_providers: Camera
};

// Subscription tier icons
const TIER_ICONS = {
  basic: Zap,
  premium: Star,
  enterprise: Crown
};

/**
 * Template Card Component
 */
const TemplateCard: React.FC<{
  template: SchemaTemplate;
  onSelect?: (template: SchemaTemplate) => void;
  onPreview?: (template: SchemaTemplate) => void;
  userSubscriptionTier: string;
  canUse: boolean;
}> = ({ template, onSelect, onPreview, userSubscriptionTier, canUse }) => {
  const IndustryIcon = INDUSTRY_ICONS[template.industry as keyof typeof INDUSTRY_ICONS];
  const TierIcon = TIER_ICONS[template.subscriptionTier];

  return (
    <Card className={`h-full transition-all hover:shadow-lg ${!canUse ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {IndustryIcon && <IndustryIcon className="h-5 w-5 text-gray-500" />}
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {template.industry.replace('_', ' ')}
                </Badge>
                <Badge 
                  variant={template.subscriptionTier === 'basic' ? 'secondary' : 
                          template.subscriptionTier === 'premium' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  <TierIcon className="h-3 w-3 mr-1" />
                  {template.subscriptionTier}
                </Badge>
                {template.isFeatured && (
                  <Badge variant="default" className="text-xs bg-yellow-500">
                    Featured
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right text-sm">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-3 w-3 fill-current" />
              <span>{template.rating}</span>
              <span className="text-gray-400">({template.ratingCount})</span>
            </div>
            <div className="text-gray-500 mt-1">
              <Users className="h-3 w-3 inline mr-1" />
              {template.usageCount} uses
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="mb-4 line-clamp-2">
          {template.description}
        </CardDescription>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{template.tags.length - 3} more
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Fields:</span>
            <span className="ml-1 font-medium">{template.preview.fieldCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Required:</span>
            <span className="ml-1 font-medium">{template.preview.requiredFields}</span>
          </div>
          <div>
            <span className="text-gray-500">Time:</span>
            <span className="ml-1 font-medium">{template.metadata.estimatedTime}m</span>
          </div>
          <div>
            <span className="text-gray-500">Complexity:</span>
            <span className="ml-1 font-medium capitalize">{template.metadata.complexity}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview?.(template)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={() => onSelect?.(template)}
            disabled={!canUse}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-1" />
            {canUse ? 'Use Template' : `Requires ${template.subscriptionTier}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Schema Library Component
 */
export const SchemaLibrary: React.FC<SchemaLibraryProps> = ({
  tenantId,
  onTemplateSelect,
  onTemplatePreview,
  subscriptionTier = 'basic',
  userPermissions = [],
  mode = 'browse'
}) => {
  const [templates] = useState<SchemaTemplate[]>(MOCK_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent' | 'name'>('popular');
  const [previewTemplate, setPreviewTemplate] = useState<SchemaTemplate | null>(null);
  const { toast } = useToast();

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    const filtered = templates.filter(template => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!template.name.toLowerCase().includes(query) &&
            !template.description.toLowerCase().includes(query) &&
            !template.tags.some(tag => tag.toLowerCase().includes(query))) {
          return false;
        }
      }

      // Industry filter
      if (selectedIndustry !== 'all' && template.industry !== selectedIndustry) {
        return false;
      }

      // Subscription tier filter
      if (selectedTier !== 'all' && template.subscriptionTier !== selectedTier) {
        return false;
      }

      // Complexity filter
      if (selectedComplexity !== 'all' && template.metadata.complexity !== selectedComplexity) {
        return false;
      }

      return true;
    });

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usageCount - a.usageCount;
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return new Date(b.metadata.lastUpdated).getTime() - new Date(a.metadata.lastUpdated).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchQuery, selectedIndustry, selectedTier, selectedComplexity, sortBy]);

  // Check if user can use a template
  const canUseTemplate = useCallback((template: SchemaTemplate) => {
    const tierHierarchy = { basic: 1, premium: 2, enterprise: 3 };
    const userTierLevel = tierHierarchy[subscriptionTier];
    const templateTierLevel = tierHierarchy[template.subscriptionTier];
    
    return userTierLevel >= templateTierLevel;
  }, [subscriptionTier]);

  const handleTemplateSelect = useCallback((template: SchemaTemplate) => {
    if (!canUseTemplate(template)) {
      toast({
        title: 'Subscription upgrade required',
        description: `This template requires a ${template.subscriptionTier} subscription.`,
        variant: 'destructive',
      });
      return;
    }

    onTemplateSelect?.(template);
    
    browserLogger.userAction('Schema template selected', {
      templateId: template.id,
      templateName: template.name,
      industry: template.industry,
      subscriptionTier: template.subscriptionTier,
      tenantId
    });
  }, [canUseTemplate, onTemplateSelect, toast, tenantId]);

  const handleTemplatePreview = useCallback((template: SchemaTemplate) => {
    setPreviewTemplate(template);
    onTemplatePreview?.(template);
    
    browserLogger.userAction('Schema template previewed', {
      templateId: template.id,
      templateName: template.name,
      tenantId
    });
  }, [onTemplatePreview, tenantId]);

  // Get unique industries for filter
  const industries = useMemo(() => {
    const unique = Array.from(new Set(templates.map(t => t.industry)));
    return unique.map(industry => ({
      value: industry,
      label: industry.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  }, [templates]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Schema Library</h1>
            <p className="text-gray-600">
              Choose from pre-built templates or browse community contributions
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <TierIcon className="h-4 w-4 mr-1" />
              {subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Plan
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map(industry => (
                <SelectItem key={industry.value} value={industry.value}>
                  {industry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="complex">Complex</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            Showing {filteredTemplates.length} of {templates.length} templates
          </div>
          
          {filteredTemplates.length === 0 && (
            <Alert className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No templates match your current filters. Try adjusting your search criteria.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <ScrollArea className="h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleTemplateSelect}
                onPreview={handleTemplatePreview}
                userSubscriptionTier={subscriptionTier}
                canUse={canUseTemplate(template)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {INDUSTRY_ICONS[previewTemplate.industry as keyof typeof INDUSTRY_ICONS] && (
                    React.createElement(INDUSTRY_ICONS[previewTemplate.industry as keyof typeof INDUSTRY_ICONS], { className: 'h-5 w-5' })
                  )}
                  {previewTemplate.name}
                </DialogTitle>
                <DialogDescription>
                  {previewTemplate.description}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="fields">Fields</TabsTrigger>
                  <TabsTrigger value="preview">Form Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Template Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Industry:</span>
                          <span className="capitalize">{previewTemplate.industry.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Category:</span>
                          <span className="capitalize">{previewTemplate.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subscription Tier:</span>
                          <Badge variant="outline">{previewTemplate.subscriptionTier}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Complexity:</span>
                          <span className="capitalize">{previewTemplate.metadata.complexity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated Time:</span>
                          <span>{previewTemplate.metadata.estimatedTime} minutes</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Usage Statistics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Uses:</span>
                          <span>{previewTemplate.usageCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{previewTemplate.rating}/5</span>
                            <span className="text-gray-400">({previewTemplate.ratingCount})</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Author:</span>
                          <span>{previewTemplate.authorName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span>{new Date(previewTemplate.metadata.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {previewTemplate.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="fields">
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {previewTemplate.fields
                        .sort((a, b) => a.order - b.order)
                        .map((field, index) => (
                          <div key={field.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-500">#{index + 1}</span>
                              <div>
                                <span className="font-medium">{field.label}</span>
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                <div className="text-sm text-gray-500">{field.name}</div>
                              </div>
                            </div>
                            <Badge variant="outline">{field.type}</Badge>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="preview">
                  <ScrollArea className="h-64">
                    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                      <h3 className="font-medium">Form Preview</h3>
                      {previewTemplate.fields
                        .sort((a, b) => a.order - b.order)
                        .map((field) => (
                          <div key={field.id} className="space-y-1">
                            <Label className="flex items-center gap-1">
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            {field.description && (
                              <p className="text-sm text-gray-600">{field.description}</p>
                            )}
                            <div className="bg-white p-3 rounded border">
                              <span className="text-sm text-gray-500">
                                {field.type} field
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    handleTemplateSelect(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  disabled={!canUseTemplate(previewTemplate)}
                >
                  Use This Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 