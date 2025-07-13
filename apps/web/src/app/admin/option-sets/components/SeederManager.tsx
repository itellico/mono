'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  PlayCircle, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Database,
  Sparkles,
  Clock,
  Users,
  ShirtIcon as Shirt,
  Ruler,
  Target
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Available seeder categories
const SEEDER_CATEGORIES = [
  {
    id: 'personal',
    name: 'Personal Characteristics',
    description: 'Gender, hair colors, eye colors, skin tones',
    icon: Users,
    color: 'bg-blue-500',
    items: ['Gender', 'Hair Colors', 'Eye Colors', 'Skin Tones', 'Hair Types', 'Hair Lengths']
  },
  {
    id: 'measurements',
    name: 'Measurements & Units',
    description: 'Height, weight, and measurement units',
    icon: Ruler,
    color: 'bg-green-500',
    items: ['Height Units', 'Weight Units']
  },
  {
    id: 'clothing',
    name: 'Clothing & Sizes',
    description: 'All clothing and shoe sizes with regional mappings',
    icon: Shirt,
    color: 'bg-purple-500',
    items: ['Women&apos;s Clothing', 'Men&apos;s Clothing', 'Women&apos;s Dress Sizes', 'Children&apos;s Clothing', 'Women&apos;s Shoes', 'Men&apos;s Shoes']
  },
  {
    id: 'modeling',
    name: 'Modeling Specific',
    description: 'Industry-specific categories and professional attributes',
    icon: Target,
    color: 'bg-orange-500',
    items: ['Body Types', 'Modeling Categories', 'Experience Levels', 'Age Ranges', 'Special Skills', 'Languages', 'Availability', 'Travel Willingness']
  }
];

const runSeeder = async (options: { clear?: boolean; categories?: string[] }) => {
  const response = await fetch('/api/v1/admin/option-sets/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to run seeder');
  }

  return response.json();
};

export function SeederManager() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [clearExisting, setClearExisting] = useState(true);
  const [lastResult, setLastResult] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const seederMutation = useMutation({
    mutationFn: runSeeder,
    onSuccess: (data) => {
      setLastResult(data);
      queryClient.invalidateQueries({ queryKey: ['option-sets'] });
      queryClient.invalidateQueries({ queryKey: ['option-sets-statistics'] });

      toast({
        title: 'Seeder Completed Successfully',
        description: `Option sets seeded successfully${data.data.cleared ? ' (existing data cleared)' : ''}`,
      });
    },
    onError: (error: Error) => {
      let title = 'Seeder Failed';
      let description = error.message;

      // Handle specific error cases
      if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
        title = 'Duplicate Data Detected';
        description = 'Option sets already exist. Enable "Clear existing option sets" to refresh the data.';
      } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        title = 'Permission Error';
        description = 'You do not have permission to run the seeder. Please check your admin privileges.';
      }

      toast({
        title,
        description,
        variant: 'destructive'
      });
    }
  });

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleRunSeeder = () => {
    seederMutation.mutate({
      clear: clearExisting,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined
    });
  };

  const handleSelectAll = () => {
    setSelectedCategories(SEEDER_CATEGORIES.map(cat => cat.id));
  };

  const handleSelectNone = () => {
    setSelectedCategories([]);
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Option Sets Seeder</h2>
          <p className="text-muted-foreground">
            Populate your platform with comprehensive modeling industry option sets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSelectAll} size="sm">
            Select All
          </Button>
          <Button variant="outline" onClick={handleSelectNone} size="sm">
            Select None
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {seederMutation.isPending && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Seeder Running</AlertTitle>
          <AlertDescription>
            Please wait while the seeder creates option sets and values. This may take a few moments.
          </AlertDescription>
          <Progress value={undefined} className="mt-2" />
        </Alert>
      )}

      {lastResult && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Last Seeder Run Successful</AlertTitle>
          <AlertDescription>
            Categories: {lastResult.data.categories === 'all' ? 'All categories' : lastResult.data.categories.join(', ')}
            {lastResult.data.cleared && ' (with clearing)'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Category Selection
              </CardTitle>
              <CardDescription>
                Choose which categories to seed. Leave none selected to seed all categories.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {SEEDER_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategories.includes(category.id);

                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={category.id}
                        checked={isSelected}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-md ${category.color} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <label htmlFor={category.id} className="font-medium cursor-pointer">
                            {category.name}
                          </label>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {category.items.length} sets
                        </Badge>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="ml-9 pl-3 border-l-2 border-muted">
                        <div className="flex flex-wrap gap-1">
                          {category.items.map((item, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Seeder Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clear-existing"
                  checked={clearExisting}
                  onCheckedChange={(checked) => setClearExisting(!!checked)}
                />
                <label htmlFor="clear-existing" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <RotateCcw className="h-4 w-4 text-yellow-600" />
                  Clear existing option sets before seeding
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                This will remove all existing option sets before seeding new ones.
              </p>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Selected Categories:</div>
                {selectedCategories.length === 0 ? (
                  <Badge variant="outline" className="gap-1">
                    <Database className="h-3 w-3" />
                    All Categories
                  </Badge>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map(catId => {
                      const category = SEEDER_CATEGORIES.find(c => c.id === catId);
                      return (
                        <Badge key={catId} variant="secondary" className="text-xs">
                          {category?.name}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              <Button 
                onClick={handleRunSeeder} 
                disabled={seederMutation.isPending}
                className="w-full gap-2"
                size="lg"
              >
                {seederMutation.isPending ? (
                  <>
                    <RotateCcw className="h-4 w-4 animate-spin" />
                    Running Seeder...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    Run Seeder
                  </>
                )}
              </Button>

              {clearExisting && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Warning: Data Will Be Cleared</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    This will delete ALL existing option sets and their values before creating new ones. 
                    Make sure you have backups if needed.
                  </AlertDescription>
                </Alert>
              )}

              {!clearExisting && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Note: Duplicate Prevention</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    If option sets already exist, the seeder may fail due to duplicate constraints. 
                    Enable "Clear existing" option if you want to refresh all data.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                What Gets Seeded
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Complete Option Sets</div>
                <div className="text-muted-foreground">
                  22 comprehensive option sets with 201+ values
                </div>
              </div>
              <div>
                <div className="font-medium">Regional Mappings</div>
                <div className="text-muted-foreground">
                  International size conversions (US, EU, UK, Asia)
                </div>
              </div>
              <div>
                <div className="font-medium">Industry Standards</div>
                <div className="text-muted-foreground">
                  Professional modeling industry categories
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 