/**
 * @fileoverview Industry Schema Templates Component
 * @version 2.0.0
 * @author itellico Mono
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, Download, Eye, Camera, Music, Trophy, Briefcase, Heart, Dumbbell, Building2, Stethoscope, GraduationCap, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';
import { useQuery } from '@tanstack/react-query';

interface IndustryTemplate {
  id: string;
  name: string;
  displayName: Record<string, string>;
  description: Record<string, string>;
  industryType: string;
  version: string;
  isActive: boolean;
  isPublished: boolean;
  configuration: any;
  metadata: any;
  buildConfig: any;
  features: any;
  subscriptionTiers: string[];
  estimatedSetupTime: number;
  popularity: number;
  usageCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface IndustryTemplatesProps {
  onTemplateSelect?: (template: IndustryTemplate) => void;
  selectedIndustry?: string;
  tenantId?: number | null;
}

const INDUSTRIES = [
  { value: 'modeling', label: 'Modeling', icon: <Camera className="h-4 w-4" /> },
  { value: 'photography', label: 'Photography', icon: <Camera className="h-4 w-4" /> },
  { value: 'fitness', label: 'Fitness', icon: <Dumbbell className="h-4 w-4" /> },
  { value: 'entertainment', label: 'Entertainment', icon: <Star className="h-4 w-4" /> },
  { value: 'music', label: 'Music', icon: <Music className="h-4 w-4" /> },
  { value: 'sports', label: 'Sports', icon: <Trophy className="h-4 w-4" /> },
  { value: 'corporate', label: 'Corporate', icon: <Briefcase className="h-4 w-4" /> },
  { value: 'healthcare', label: 'Healthcare', icon: <Stethoscope className="h-4 w-4" /> },
  { value: 'education', label: 'Education', icon: <GraduationCap className="h-4 w-4" /> },
  { value: 'real_estate', label: 'Real Estate', icon: <Home className="h-4 w-4" /> }
];

// Fetch industry templates from API
const fetchIndustryTemplates = async (filters: any = {}) => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.industryType) params.append('industryType', filters.industryType);
  if (filters.isPublished !== undefined) params.append('isPublished', filters.isPublished.toString());
  
  const response = await fetch(`/api/v1/admin/industry-templates?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch industry templates');
  }
  
  const data = await response.json();
  return data.data;
};

export const IndustryTemplates: React.FC<IndustryTemplatesProps> = ({
  onTemplateSelect,
  selectedIndustry = 'all',
  tenantId
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState<string>(selectedIndustry);

  // Use TanStack Query for data fetching with caching
  const {
    data: templatesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['industry-templates', { search: searchTerm, industry: selectedIndustryFilter }],
    queryFn: () => fetchIndustryTemplates({
      search: searchTerm || undefined,
      industryType: selectedIndustryFilter !== 'all' ? selectedIndustryFilter : undefined,
      isPublished: true
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const templates = templatesData?.templates || [];

  useEffect(() => {
    if (templates.length > 0) {
      browserLogger.userAction('industry_templates_loaded', 'IndustryTemplates', {
        count: templates.length,
        tenantId
      });
    }
  }, [templates, tenantId]);

  const handleTemplateSelect = (template: IndustryTemplate) => {
    browserLogger.userAction('template_selected', 'IndustryTemplates', {
      templateId: template.id,
      industry: template.industryType,
      tenantId
    });

    onTemplateSelect?.(template);
    
    toast({
      title: "Template Selected",
      description: `"${template.displayName?.en || template.name}" template is ready to use`
    });
  };

  const getIndustryIcon = (industryType: string) => {
    const industry = INDUSTRIES.find(i => i.value === industryType);
    return industry?.icon || <Building2 className="h-4 w-4" />;
  };

  const getRatingStars = (rating: number) => {
    const stars = Math.round(rating / 100); // Convert from 0-500 to 0-5
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getSubscriptionTierColor = (tiers: string[]) => {
    if (tiers.includes('enterprise')) return 'bg-purple-100 text-purple-800';
    if (tiers.includes('professional')) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading industry templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <Building2 className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-gray-900 font-medium">Failed to load templates</p>
          <p className="text-gray-600 text-sm mb-4">There was an error loading the industry templates</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Industry Schema Templates</h2>
        <p className="text-gray-600 mt-1">Pre-built schema templates for different industries</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedIndustryFilter} onValueChange={setSelectedIndustryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    <div className="flex items-center">
                      {industry.icon}
                      <span className="ml-2">{industry.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template: IndustryTemplate) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getIndustryIcon(template.industryType)}
                  <div>
                    <CardTitle className="text-lg">
                      {template.displayName?.en || template.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {template.description?.en || 'Professional template'}
                    </CardDescription>
                  </div>
                </div>
                <Badge 
                  className={getSubscriptionTierColor(template.subscriptionTiers)}
                  variant="secondary"
                >
                  {template.subscriptionTiers[0] || 'basic'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Popularity</div>
                  <div className="font-medium">{template.popularity}%</div>
                </div>
                <div>
                  <div className="text-gray-500">Setup Time</div>
                  <div className="font-medium">{template.estimatedSetupTime}min</div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {getRatingStars(template.rating)}
                  <span className="text-sm text-gray-600 ml-1">
                    ({(template.rating / 100).toFixed(1)})
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {template.usageCount.toLocaleString()} uses
                </div>
              </div>

              {/* Features Preview */}
              {template.features && Object.keys(template.features).length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Features</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(template.features)
                      .filter(([_, enabled]) => enabled)
                      .slice(0, 3)
                      .map(([feature, _]) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => handleTemplateSelect(template)}
                  className="flex-1"
                  size="sm"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Use Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedIndustryFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'No industry templates are available yet'
            }
          </p>
          {(searchTerm || selectedIndustryFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedIndustryFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Template Stats Summary */}
      {templates.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
                <div className="text-sm text-gray-600">Available Templates</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(templates.reduce((acc: number, t: IndustryTemplate) => acc + t.popularity, 0) / templates.length)}%
                </div>
                <div className="text-sm text-gray-600">Avg Popularity</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(templates.reduce((acc: number, t: IndustryTemplate) => acc + t.estimatedSetupTime, 0) / templates.length)}min
                </div>
                <div className="text-sm text-gray-600">Avg Setup Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {templates.reduce((acc: number, t: IndustryTemplate) => acc + t.usageCount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Uses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 