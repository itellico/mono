'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Tags, 
  FolderTree, 
  Settings, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Info,
  Download,
  Upload
} from 'lucide-react';
import {
  useAvailableIndustries,
  useIndustryConfig,
  useIndustryTags,
  useIndustryCategories,
  useSetupIndustryContent,
  useSeedIndustryCategories,
  useSeedIndustryTags
} from '@/hooks/admin/useIndustryContent';

interface IndustryContentManagerProps {
  tenantId: number;
  currentIndustry?: string;
  onIndustryChange?: (industry: string) => void;
}

export function IndustryContentManager({ 
  tenantId, 
  currentIndustry, 
  onIndustryChange 
}: IndustryContentManagerProps) {
  const [selectedIndustry, setSelectedIndustry] = useState(currentIndustry || '');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [includeGlobal, setIncludeGlobal] = useState(true);

  // Queries
  const { data: industries, isLoading: industriesLoading } = useAvailableIndustries();
  const { data: industryConfig, isLoading: configLoading } = useIndustryConfig(selectedIndustry);
  const { data: currentTags, isLoading: tagsLoading } = useIndustryTags(
    tenantId, 
    selectedIndustry,
    { includeGlobal }
  );
  const { data: currentCategories, isLoading: categoriesLoading } = useIndustryCategories(
    tenantId,
    selectedIndustry,
    { includeGlobal }
  );

  // Mutations
  const setupContentMutation = useSetupIndustryContent();
  const seedCategoriesMutation = useSeedIndustryCategories();
  const seedTagsMutation = useSeedIndustryTags();

  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
    onIndustryChange?.(industry);
  };

  const handleSetupContent = () => {
    if (!selectedIndustry || !tenantId) return;

    setupContentMutation.mutate({
      tenantId,
      industry: selectedIndustry,
      options: {
        replaceExisting,
        includeGlobalContent: includeGlobal
      }
    });
  };

  const handleSeedCategories = () => {
    if (!selectedIndustry || !tenantId) return;

    seedCategoriesMutation.mutate({
      tenantId,
      industry: selectedIndustry,
      options: {
        replaceExisting,
        includeGlobalCategories: includeGlobal
      }
    });
  };

  const handleSeedTags = () => {
    if (!selectedIndustry || !tenantId) return;

    seedTagsMutation.mutate({
      tenantId,
      industry: selectedIndustry,
      options: {
        replaceExisting,
        includeGlobalTags: includeGlobal
      }
    });
  };

  const isLoading = industriesLoading || configLoading;
  const isSeeding = setupContentMutation.isPending || 
                   seedCategoriesMutation.isPending || 
                   seedTagsMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Industry Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Industry Configuration
          </CardTitle>
          <CardDescription>
            Select your marketplace industry to automatically configure relevant categories and tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Industry</Label>
            <Select 
              value={selectedIndustry} 
              onValueChange={handleIndustrySelect}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose your marketplace industry..." />
              </SelectTrigger>
              <SelectContent>
                {industries?.map((industry) => (
                  <SelectItem key={industry.key} value={industry.key}>
                    <div>
                      <div className="font-medium">{industry.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {industry.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedIndustry && industryConfig && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{industryConfig.name}</strong>: {industryConfig.description}
                <br />
                This industry includes {industryConfig.defaultCategories.length} categories 
                and {industryConfig.defaultTags.length} tags.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Industry Content Preview */}
      {selectedIndustry && industryConfig && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Categories Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Default Categories
              </CardTitle>
              <CardDescription>
                Categories that will be created for this industry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {industryConfig.defaultCategories.map((category) => (
                  <div key={category.slug} className="border rounded-lg p-3">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {category.description}
                    </div>
                    {category.subcategories && category.subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {category.subcategories.map((sub) => (
                          <Badge key={sub.slug} variant="outline" className="text-xs">
                            {sub.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Default Tags
              </CardTitle>
              <CardDescription>
                Tags that will be created for this industry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                {/* Group tags by type */}
                {Object.entries(
                  industryConfig.defaultTags.reduce((acc, tag) => {
                    if (!acc[tag.type]) acc[tag.type] = [];
                    acc[tag.type].push(tag);
                    return acc;
                  }, {} as Record<string, typeof industryConfig.defaultTags>)
                ).map(([type, tags]) => (
                  <div key={type} className="mb-4">
                    <div className="font-medium capitalize text-sm mb-2">{type} Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge key={tag.slug} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Content Status */}
      {selectedIndustry && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="h-5 w-5" />
                Current Categories
                {categoriesLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                Categories currently in your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Loading categories...</div>
                </div>
              ) : currentCategories && currentCategories.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{category.name}</span>
                      {category.subcategories && (
                        <Badge variant="outline" className="text-xs">
                          {category.subcategories.length} subcategories
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No categories found for this industry
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Current Tags
                {tagsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>
                Tags currently in your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tagsLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Loading tags...</div>
                </div>
              ) : currentTags && currentTags.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {currentTags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tags found for this industry
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      {selectedIndustry && industryConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Content Management Actions
            </CardTitle>
            <CardDescription>
              Configure and seed industry-specific content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="replace-existing"
                  checked={replaceExisting}
                  onCheckedChange={setReplaceExisting}
                />
                <Label htmlFor="replace-existing" className="text-sm">
                  Replace existing content
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include-global"
                  checked={includeGlobal}
                  onCheckedChange={setIncludeGlobal}
                />
                <Label htmlFor="include-global" className="text-sm">
                  Include global content
                </Label>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={handleSetupContent}
                disabled={isSeeding}
                className="w-full"
              >
                {setupContentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Setup All Content
              </Button>

              <Button
                variant="outline"
                onClick={handleSeedCategories}
                disabled={isSeeding}
                className="w-full"
              >
                {seedCategoriesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FolderTree className="h-4 w-4 mr-2" />
                )}
                Seed Categories Only
              </Button>

              <Button
                variant="outline"
                onClick={handleSeedTags}
                disabled={isSeeding}
                className="w-full"
              >
                {seedTagsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Tags className="h-4 w-4 mr-2" />
                )}
                Seed Tags Only
              </Button>
            </div>

            {/* Help Text */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Setup All Content</strong>: Creates both categories and tags for the selected industry.
                <br />
                <strong>Seed Categories/Tags Only</strong>: Creates only the selected content type.
                <br />
                <strong>Replace existing</strong>: Will update existing items with the same names.
                <br />
                <strong>Include global</strong>: Also includes general categories/tags that work across industries.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default IndustryContentManager;