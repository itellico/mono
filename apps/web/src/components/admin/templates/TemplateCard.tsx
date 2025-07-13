'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Tag, 
  Settings, 
  Download, 
  Eye, 
  Calendar,
  TrendingUp,
  Package,
  Layers,
  Database
} from 'lucide-react';

interface TemplateCardProps {
  template: {
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
    };
  };
  onPreview: (templateId: string) => void;
  onImport: (templateId: string) => void;
  className?: string;
}

/**
 * Template card component for displaying industry template information
 * 
 * @component
 * @param {TemplateCardProps} props - The component props
 * @param {Object} props.template - Template data to display
 * @param {Function} props.onPreview - Callback when preview button is clicked
 * @param {Function} props.onImport - Callback when import button is clicked
 * @param {string} [props.className] - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <TemplateCard
 *   template={templateData}
 *   onPreview={(id) => setPreviewTemplate(id)}
 *   onImport={(id) => handleImport(id)}
 * />
 * ```
 */
export function TemplateCard({ template, onPreview, onImport, className }: TemplateCardProps) {
  const getIndustryIcon = (industry: string) => {
    switch (industry.toLowerCase()) {
      case 'modeling':
        return <Users className="h-5 w-5" />;
      case 'creative':
        return <Layers className="h-5 w-5" />;
      case 'voice':
        return <Package className="h-5 w-5" />;
      case 'fitness':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const getIndustryColor = (industry: string) => {
    switch (industry.toLowerCase()) {
      case 'modeling':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'creative':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'voice':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fitness':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const popularityPercentage = template.stats ? Math.min((template.stats.popularityScore / 10) * 100, 100) : 0;
  const totalComponents = template.includes.categories + template.includes.optionSets + template.includes.attributeDefinitions;

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getIndustryColor(template.industry)}`}>
              {getIndustryIcon(template.industry)}
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {template.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {template.industry} • v{template.version}
              </CardDescription>
            </div>
          </div>
          {template.compatibility && (
            <Badge 
              variant="outline" 
              className={getRiskColor(template.compatibility.riskLevel)}
            >
              {template.compatibility.isCompatible ? 'Compatible' : 'Conflicts'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>

        {/* Content Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground mb-1">
              <Tag className="h-3 w-3" />
              <span>Categories</span>
            </div>
            <div className="font-semibold text-sm">{template.includes.categories}</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground mb-1">
              <Settings className="h-3 w-3" />
              <span>Options</span>
            </div>
            <div className="font-semibold text-sm">{template.includes.optionSets}</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground mb-1">
              <Database className="h-3 w-3" />
              <span>Attributes</span>
            </div>
            <div className="font-semibold text-sm">{template.includes.attributeDefinitions}</div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3} more
            </Badge>
          )}
        </div>

        {/* Target Audience */}
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Target Audience</div>
          <div className="text-xs text-foreground">
            {template.targetAudience.slice(0, 2).join(', ')}
            {template.targetAudience.length > 2 && ` +${template.targetAudience.length - 2} more`}
          </div>
        </div>

        {/* Stats */}
        {template.stats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Popularity</span>
              <span className="font-medium">{template.stats.popularityScore}/10</span>
            </div>
            <Progress value={popularityPercentage} className="h-1" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{template.stats.totalImports} imports</span>
              {template.stats.lastImported && (
                <span>
                  Last: {new Date(template.stats.lastImported).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPreview(template.templateId)}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
        <Button
          size="sm"
          onClick={() => onImport(template.templateId)}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-1" />
          Import
        </Button>
      </CardFooter>
    </Card>
  );
} 