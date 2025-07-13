'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Globe,
  ArrowRightLeft,
  BarChart3,
  Settings,
  Ruler,
  Weight,
  Shirt,
  Target,
  Clock
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Option set categories that support conversions
const CONVERSION_CATEGORIES = [
  {
    id: 'height',
    name: 'Height Measurements',
    icon: Ruler,
    color: 'bg-blue-500',
    description: 'Convert between centimeters and feet/inches',
    pattern: /\d+\s*cm$/i,
    regions: ['Global', 'US', 'UK', 'Asia'],
    examples: ['170cm → 5ft7in', '175cm → 5ft9in']
  },
  {
    id: 'weight',
    name: 'Weight Measurements', 
    icon: Weight,
    color: 'bg-green-500',
    description: 'Convert between kilograms and pounds',
    pattern: /\d+(\.\d+)?\s*kg$/i,
    regions: ['Global', 'US', 'UK', 'Asia'],
    examples: ['65kg → 143lbs', '70kg → 154lbs']
  },
  {
    id: 'clothing-women',
    name: 'Women\'s Clothing',
    icon: Shirt,
    color: 'bg-purple-500',
    description: 'Convert between international clothing sizes',
    pattern: /^(XS|S|M|L|XL|XXL|\d+)$/i,
    regions: ['US', 'EU', 'UK', 'Asia'],
    examples: ['S → EU 34, UK 6', 'M → EU 36, UK 8']
  },
  {
    id: 'shoe-women',
    name: 'Women\'s Shoes',
    icon: Target,
    color: 'bg-orange-500',
    description: 'Convert between international shoe sizes',
    pattern: /\d+(\.\d+)?\s*(US|EU|UK)?$/i,
    regions: ['US', 'EU', 'UK', 'Asia'],
    examples: ['US 8 → EU 39, UK 6', 'EU 37 → US 6.5']
  }
];

// API functions
const generateMappings = async (optionSetId: number) => {
  const response = await fetch(`/api/v1/admin/option-sets/${optionSetId}/generate-mappings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate mappings');
  }

  return response.json();
};

const getOptionSets = async () => {
  const response = await fetch('/api/v1/admin/option-sets');
  if (!response.ok) throw new Error('Failed to fetch option sets');
  return response.json();
};

export function ConversionMappingsManager() {
  const [selectedOptionSet, setSelectedOptionSet] = useState<string>('');
  const [generationResults, setGenerationResults] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch option sets
  const { data: optionSets, isLoading: isLoadingOptionSets } = useQuery({
    queryKey: ['option-sets'],
    queryFn: getOptionSets
  });

  // Generate mappings mutation
  const generateMappingsMutation = useMutation({
    mutationFn: (optionSetId: number) => generateMappings(optionSetId),
    onSuccess: (data) => {
      setGenerationResults(data);
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      queryClient.invalidateQueries({ queryKey: ['option-sets-statistics'] });

      toast({
        title: 'Mappings Generated Successfully',
        description: `Generated ${data.data.mappingsGenerated} conversion mappings for ${data.data.optionSetSlug}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleGenerateMappings = () => {
    if (!selectedOptionSet) {
      toast({
        title: 'No Option Set Selected',
        description: 'Please select an option set to generate mappings for',
        variant: 'destructive'
      });
      return;
    }

    generateMappingsMutation.mutate(parseInt(selectedOptionSet));
  };

  const getCompatibleOptionSets = () => {
    if (!optionSets?.data) return [];

    return optionSets.data.filter((optionSet: any) => {
      const slug = optionSet.slug.toLowerCase();
      return CONVERSION_CATEGORIES.some(category => {
        switch (category.id) {
          case 'height':
            return slug.includes('height');
          case 'weight':
            return slug.includes('weight');
          case 'clothing-women':
            return slug.includes('clothing') && slug.includes('women');
          case 'shoe-women':
            return slug.includes('shoe') && slug.includes('women');
          default:
            return false;
        }
      });
    });
  };

  const getRecommendedCategory = (optionSetSlug: string) => {
    const slug = optionSetSlug.toLowerCase();
    return CONVERSION_CATEGORIES.find(category => {
      switch (category.id) {
        case 'height':
          return slug.includes('height');
        case 'weight':
          return slug.includes('weight');
        case 'clothing-women':
          return slug.includes('clothing') && slug.includes('women');
        case 'shoe-women':
          return slug.includes('shoe') && slug.includes('women');
        default:
          return false;
      }
    });
  };

  const compatibleOptionSets = getCompatibleOptionSets();
  const selectedOptionSetData = compatibleOptionSets.find(
    (set: any) => set.id.toString() === selectedOptionSet
  );
  const recommendedCategory = selectedOptionSetData 
    ? getRecommendedCategory(selectedOptionSetData.slug)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Conversion Mappings Manager</h2>
        <p className="text-muted-foreground">
          Generate intelligent conversions between different measurement systems and regional standards
        </p>
      </div>

      {/* Status Alert */}
      {generateMappingsMutation.isPending && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Generating Mappings</AlertTitle>
          <AlertDescription>
            Analyzing values and creating conversion mappings. This may take a few moments.
          </AlertDescription>
          <Progress value={undefined} className="mt-2" />
        </Alert>
      )}

      {generationResults && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Mappings Generated Successfully</AlertTitle>
          <AlertDescription>
            Generated {generationResults.data.mappingsGenerated} mappings for {generationResults.data.totalValues} values 
            in option set &quot;{generationResults.data.optionSetSlug}&quot;
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Control Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Generate Conversion Mappings
              </CardTitle>
              <CardDescription>
                Select an option set to automatically generate regional conversion mappings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Option Set</label>
                <Select value={selectedOptionSet} onValueChange={setSelectedOptionSet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an option set..." />
                  </SelectTrigger>
                  <SelectContent>
                    {compatibleOptionSets.map((optionSet: any) => {
                      const category = getRecommendedCategory(optionSet.slug);
                      return (
                        <SelectItem key={optionSet.id} value={optionSet.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{optionSet.label}</span>
                            {category && (
                              <Badge variant="secondary" className="text-xs">
                                {category.name}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {compatibleOptionSets.length === 0 && !isLoadingOptionSets && (
                  <p className="text-sm text-muted-foreground">
                    No compatible option sets found. Compatible sets include height, weight, clothing, and shoe sizes.
                  </p>
                )}
              </div>

              {recommendedCategory && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-md ${recommendedCategory.color} text-white`}>
                      <recommendedCategory.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{recommendedCategory.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {recommendedCategory.description}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Regional Mappings:</div>
                    <div className="flex flex-wrap gap-1">
                      {recommendedCategory.regions.map(region => (
                        <Badge key={region} variant="outline" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-sm font-medium">Examples:</div>
                    <div className="space-y-1">
                      {recommendedCategory.examples.map((example, index) => (
                        <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                          <ArrowRightLeft className="h-3 w-3" />
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <Button 
                onClick={handleGenerateMappings}
                disabled={!selectedOptionSet || generateMappingsMutation.isPending}
                className="w-full gap-2"
                size="lg"
              >
                {generateMappingsMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Generating Mappings...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Generate Mappings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Conversion Categories Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Supported Conversion Types
              </CardTitle>
              <CardDescription>
                Categories that support automatic mapping generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {CONVERSION_CATEGORIES.map(category => {
                  const Icon = category.icon;
                  return (
                    <div key={category.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`p-2 rounded-md ${category.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {category.description}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {category.regions.map(region => (
                            <Badge key={region} variant="outline" className="text-xs">
                              {region}
                            </Badge>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {category.examples.map((example, index) => (
                            <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                              <ArrowRightLeft className="h-3 w-3" />
                              {example}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">1. Pattern Detection</div>
                <div className="text-muted-foreground">
                  Analyzes option values to identify convertible patterns
                </div>
              </div>
              <div>
                <div className="font-medium">2. Smart Conversion</div>
                <div className="text-muted-foreground">
                  Applies industry-standard conversion formulas
                </div>
              </div>
              <div>
                <div className="font-medium">3. Regional Mapping</div>
                <div className="text-muted-foreground">
                  Creates mappings for US, EU, UK, and Asia standards
                </div>
              </div>
              <div>
                <div className="font-medium">4. Search Enhancement</div>
                <div className="text-muted-foreground">
                  Enables finding equivalent values across regions
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Universal Compatibility</div>
                <div className="text-muted-foreground">
                  Search &quot;170cm&quot; finds &quot;5ft7in&quot; models automatically
                </div>
              </div>
              <div>
                <div className="font-medium">International Market</div>
                <div className="text-muted-foreground">
                  Support clients from different regions seamlessly
                </div>
              </div>
              <div>
                <div className="font-medium">Fast Performance</div>
                <div className="text-muted-foreground">
                  5-20ms search times vs 50-500ms calculations
                </div>
              </div>
              <div>
                <div className="font-medium">Accurate Results</div>
                <div className="text-muted-foreground">
                  Industry-standard conversions with tolerance ranges
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Before Generation</div>
                <div className="text-muted-foreground">
                  Ensure your option values follow standard formats
                </div>
              </div>
              <div>
                <div className="font-medium">Test Results</div>
                <div className="text-muted-foreground">
                  Verify generated mappings are accurate for your use case
                </div>
              </div>
              <div>
                <div className="font-medium">Regular Updates</div>
                <div className="text-muted-foreground">
                  Re-generate when adding new values to option sets
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 