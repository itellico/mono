'use client';

/**
 * 🎯 Tenant Data Management Admin Interface
 * 
 * Allows tenants to browse and import industry-specific data templates.
 * This interface provides a visual way to manage tenant-specific data models.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Package, 
  Download, 
  Eye, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter,
  Layers,
  Database,
  FormInput
} from 'lucide-react';

// Mock data - in real implementation, this would come from API
const mockTemplates = [
  {
    templateId: 'modeling-industry-human',
    name: 'Human Modeling Industry',
    description: 'Complete data set for human modeling platforms including physical attributes, fashion categories, and modeling-specific workflows',
    industry: 'modeling',
    subIndustry: 'human',
    version: '1.0.0',
    tags: ['modeling', 'fashion', 'human', 'physical-attributes'],
    targetAudience: 'Fashion agencies, modeling platforms, talent management',
    includes: {
      categories: 18,
      optionSets: 15,
      attributeDefinitions: 22
    },
    preview: {
      sampleCategories: ['Physical Attributes', 'Experience Level', 'Fashion Categories', 'Portfolio Types'],
      sampleAttributes: ['height', 'weight', 'eye_color', 'hair_type', 'clothing_size', 'experience_level'],
      sampleOptionSets: ['eye-colors', 'hair-types', 'clothing-sizes-us', 'experience-levels', 'modeling-categories']
    },
    compatibility: {
      conflictsWith: [],
      recommendedWith: ['base-platform'],
      prerequisites: []
    },
    status: 'available' // available, imported, updating
  },
  {
    templateId: 'pet-modeling-industry',
    name: 'Pet & Animal Modeling',
    description: 'Specialized data set for pet modeling, animal talent agencies, and animal-focused content platforms',
    industry: 'modeling',
    subIndustry: 'animals',
    version: '1.0.0',
    tags: ['pets', 'animals', 'modeling', 'veterinary'],
    targetAudience: 'Pet agencies, animal talent platforms, veterinary services',
    includes: {
      categories: 16,
      optionSets: 12,
      attributeDefinitions: 18
    },
    preview: {
      sampleCategories: ['Animal Types', 'Breed Categories', 'Training Level', 'Health Status'],
      sampleAttributes: ['species', 'breed', 'age', 'weight', 'training_level', 'health_status'],
      sampleOptionSets: ['animal-species', 'dog-breeds', 'cat-breeds', 'training-levels', 'health-statuses']
    },
    compatibility: {
      conflictsWith: ['modeling-industry-human'],
      recommendedWith: ['base-platform'],
      prerequisites: []
    },
    status: 'available'
  },
  {
    templateId: 'voice-talent-industry',
    name: 'Voice Talent & Audio',
    description: 'Comprehensive data set for voice talent agencies, audio production, and voice-over platforms',
    industry: 'audio',
    subIndustry: 'voice-talent',
    version: '1.0.0',
    tags: ['voice', 'audio', 'talent', 'production'],
    targetAudience: 'Voice agencies, audio production, podcast platforms',
    includes: {
      categories: 14,
      optionSets: 10,
      attributeDefinitions: 16
    },
    preview: {
      sampleCategories: ['Voice Types', 'Audio Equipment', 'Language Skills', 'Audio Formats'],
      sampleAttributes: ['voice_type', 'vocal_range', 'languages_spoken', 'audio_equipment', 'recording_quality'],
      sampleOptionSets: ['voice-types', 'vocal-ranges', 'languages', 'audio-equipment', 'recording-formats']
    },
    compatibility: {
      conflictsWith: [],
      recommendedWith: ['base-platform'],
      prerequisites: []
    },
    status: 'available'
  }
];

const mockTenants = [
  { id: 1, name: 'itellico Mono', slug: 'mono-platform', status: 'active' },
  { id: 2, name: 'Fashion Models Inc', slug: 'fashion-models', status: 'active' },
  { id: 3, name: 'Pet Talent Agency', slug: 'pet-talent', status: 'active' }
];

export default function TenantDataManagementPage() {
  const [selectedTenant, setSelectedTenant] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [importOptions, setImportOptions] = useState({
    includeCategories: true,
    includeOptionSets: true,
    includeAttributeDefinitions: true,
    conflictResolution: 'update'
  });

  // Filter templates based on search and industry
  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesIndustry = selectedIndustry === 'all' || template.industry === selectedIndustry;
    
    return matchesSearch && matchesIndustry;
  });

  // Get unique industries for filter
  const industries = Array.from(new Set(mockTemplates.map(t => t.industry)));

  const handleImport = async () => {
    console.log('Importing template:', selectedTemplate.templateId, 'for tenant:', selectedTenant, 'with options:', importOptions);
    // TODO: Implement actual import logic
    setImportDialogOpen(false);
  };

  const TemplateCard = ({ template }: { template: any }) => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="mt-1">{template.description}</CardDescription>
          </div>
          <Badge variant={template.status === 'imported' ? 'default' : 'secondary'}>
            {template.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            <strong>Industry:</strong> {template.industry} / {template.subIndustry}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Target:</strong> {template.targetAudience}
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-blue-50 p-2 rounded">
              <Layers className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <div className="text-xs font-medium">{template.includes.categories}</div>
              <div className="text-xs text-gray-600">Categories</div>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <Database className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <div className="text-xs font-medium">{template.includes.optionSets}</div>
              <div className="text-xs text-gray-600">Option Sets</div>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <FormInput className="h-4 w-4 mx-auto mb-1 text-purple-600" />
              <div className="text-xs font-medium">{template.includes.attributeDefinitions}</div>
              <div className="text-xs text-gray-600">Attributes</div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                setSelectedTemplate(template);
                setPreviewDialogOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => {
                setSelectedTemplate(template);
                setImportDialogOpen(true);
              }}
              disabled={template.status === 'imported'}
            >
              <Download className="h-4 w-4 mr-1" />
              {template.status === 'imported' ? 'Imported' : 'Import'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tenant Data Management</h1>
          <p className="text-gray-600 mt-1">
            Import industry-specific data templates for your tenant
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Browse Templates</TabsTrigger>
          <TabsTrigger value="current">Current Data</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Tenant Selection & Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Tenant & Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="tenant-select">Target Tenant</Label>
                  <Select value={selectedTenant.toString()} onValueChange={(value) => setSelectedTenant(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTenants.map(tenant => (
                        <SelectItem key={tenant.id} value={tenant.id.toString()}>
                          {tenant.name} ({tenant.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="search">Search Templates</Label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, description, tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="industry-filter">Industry Filter</Label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="All industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>
                          {industry.charAt(0).toUpperCase() + industry.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    Advanced Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <TemplateCard key={template.templateId} template={template} />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or browse all available templates.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="current">
          <Card>
            <CardContent className="text-center py-12">
              <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Current Data Management</h3>
              <p className="text-gray-600">
                View and manage your tenant&apos;s current categories, option sets, and attribute definitions.
              </p>
              <Button className="mt-4">View Current Data</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Import History</h3>
              <p className="text-gray-600">
                Track your template import history and manage data versioning.
              </p>
              <Button className="mt-4">View Import History</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name} - Preview</DialogTitle>
            <DialogDescription>
              Detailed preview of what will be imported with this template
            </DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Categories ({selectedTemplate.includes.categories})
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    {selectedTemplate.preview.sampleCategories.map((cat: string) => (
                      <li key={cat}>• {cat}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Option Sets ({selectedTemplate.includes.optionSets})
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    {selectedTemplate.preview.sampleOptionSets.map((opt: string) => (
                      <li key={opt}>• {opt}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FormInput className="h-4 w-4" />
                    Attributes ({selectedTemplate.includes.attributeDefinitions})
                  </h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    {selectedTemplate.preview.sampleAttributes.map((attr: string) => (
                      <li key={attr}>• {attr}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  Compatibility Information
                </h4>
                <div className="text-sm space-y-1 text-blue-800">
                  {selectedTemplate.compatibility.recommendedWith.length > 0 && (
                    <p>• Recommended with: {selectedTemplate.compatibility.recommendedWith.join(', ')}</p>
                  )}
                  {selectedTemplate.compatibility.conflictsWith.length > 0 && (
                    <p>• Conflicts with: {selectedTemplate.compatibility.conflictsWith.join(', ')}</p>
                  )}
                  {selectedTemplate.compatibility.prerequisites.length > 0 && (
                    <p>• Prerequisites: {selectedTemplate.compatibility.prerequisites.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Configure the import settings for this template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">What to Import</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="categories"
                    checked={importOptions.includeCategories}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, includeCategories: checked as boolean }))
                    }
                  />
                  <Label htmlFor="categories">Categories ({selectedTemplate?.includes.categories})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="optionSets"
                    checked={importOptions.includeOptionSets}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, includeOptionSets: checked as boolean }))
                    }
                  />
                  <Label htmlFor="optionSets">Option Sets ({selectedTemplate?.includes.optionSets})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="attributes"
                    checked={importOptions.includeAttributeDefinitions}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, includeAttributeDefinitions: checked as boolean }))
                    }
                  />
                  <Label htmlFor="attributes">Attribute Definitions ({selectedTemplate?.includes.attributeDefinitions})</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="conflict-resolution">Conflict Resolution</Label>
              <Select 
                value={importOptions.conflictResolution} 
                onValueChange={(value) => 
                  setImportOptions(prev => ({ ...prev, conflictResolution: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">Update existing data (recommended)</SelectItem>
                  <SelectItem value="skip">Skip existing data</SelectItem>
                  <SelectItem value="error">Error on conflicts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will import data specifically for tenant {selectedTenant}. 
                The data will be isolated from other tenants.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleImport} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Import Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 