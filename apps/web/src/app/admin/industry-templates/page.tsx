'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IndustryTemplates } from '@/components/admin/schemas/IndustryTemplates';
import { IndustryTemplatesDebug } from '@/components/admin/schemas/IndustryTemplatesDebug';
import { 
  ClipboardList, 
  Building,
  Star,
  Globe,
  Users,
  Zap
} from 'lucide-react';

/**
 * Industry Templates Admin Page
 * 
 * @component IndustryTemplatesPage
 * @description Admin interface for managing industry-specific schema templates
 */
export default function IndustryTemplatesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Industry Templates</h1>
          <Badge variant="secondary">Schema Library</Badge>
        </div>
      </div>

      {/* Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Industry Templates Overview
          </CardTitle>
          <CardDescription>
            Pre-built schema templates for different industry verticals and use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">10+</div>
              <div className="text-sm text-muted-foreground">Industry Templates</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">Multi</div>
              <div className="text-sm text-muted-foreground">Industry Support</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">Instant</div>
              <div className="text-sm text-muted-foreground">Schema Generation</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Management */}
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Template Library</TabsTrigger>
          <TabsTrigger value="industries">Industries</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Industry Template Manager</CardTitle>
              <CardDescription>
                Browse, create, and manage industry-specific schema templates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <IndustryTemplatesDebug />
              <hr className="my-6" />
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Original Component (for comparison):</h3>
                <IndustryTemplates />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supported Industries</CardTitle>
              <CardDescription>
                Industry verticals with specialized schema templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    industry: 'Fashion & Modeling',
                    description: 'Fashion models, talent agencies, casting profiles',
                    templates: ['Fashion Model Profile', 'Agency Representation', 'Casting Requirements'],
                    color: 'pink'
                  },
                  {
                    industry: 'Entertainment',
                    description: 'Actors, performers, entertainment industry professionals',
                    templates: ['Actor Profile', 'Performance Portfolio', 'Audition History'],
                    color: 'purple'
                  },
                  {
                    industry: 'Sports & Fitness',
                    description: 'Athletes, fitness professionals, sports management',
                    templates: ['Athlete Profile', 'Training Records', 'Competition History'],
                    color: 'blue'
                  },
                  {
                    industry: 'Pet & Animal',
                    description: 'Pet models, animal talent, veterinary profiles',
                    templates: ['Pet Profile', 'Training Certifications', 'Health Records'],
                    color: 'green'
                  },
                  {
                    industry: 'Corporate',
                    description: 'Business professionals, corporate headshots, team profiles',
                    templates: ['Executive Profile', 'Team Member', 'Company Representative'],
                    color: 'gray'
                  },
                  {
                    industry: 'Creative Arts',
                    description: 'Artists, photographers, creative professionals',
                    templates: ['Artist Portfolio', 'Creative Brief', 'Exhibition History'],
                    color: 'orange'
                  }
                ].map((industry, index) => (
                  <Card key={index} className="border-l-4" style={{ borderLeftColor: `var(--${industry.color}-500)` }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{industry.industry}</CardTitle>
                      <CardDescription className="text-sm">
                        {industry.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Available Templates:</div>
                        <div className="flex flex-wrap gap-1">
                          {industry.templates.map((template, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {template}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Industry Templates Documentation</CardTitle>
              <CardDescription>
                Understanding and using industry-specific schema templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Template Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Template Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium text-blue-600 mb-2">Pre-configured Fields</div>
                      <div className="text-sm text-muted-foreground">
                        Industry-specific fields with appropriate validation rules and formatting
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium text-green-600 mb-2">Smart Defaults</div>
                      <div className="text-sm text-muted-foreground">
                        Intelligent default values and placeholder text for better user experience
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium text-purple-600 mb-2">Role-based Access</div>
                      <div className="text-sm text-muted-foreground">
                        Permissions configured for industry-specific user roles and access levels
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium text-orange-600 mb-2">Customizable</div>
                      <div className="text-sm text-muted-foreground">
                        Templates can be customized and extended for specific tenant needs
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Instructions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">How to Use Templates</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <ol className="space-y-2 text-sm">
                      <li><strong>1. Browse Templates:</strong> Explore available templates by industry category</li>
                      <li><strong>2. Preview Structure:</strong> Review field definitions, validation rules, and layout</li>
                      <li><strong>3. Create Schema:</strong> Generate new model schema based on selected template</li>
                      <li><strong>4. Customize:</strong> Modify fields, add tenant-specific requirements, adjust permissions</li>
                      <li><strong>5. Deploy:</strong> Activate schema for use in forms and data collection</li>
                    </ol>
                  </div>
                </div>

                {/* Template Structure */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Template Structure</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm text-muted-foreground overflow-x-auto">
{`{
  "templateId": "fashion_model_profile",
  "name": "Fashion Model Profile",
  "industry": "fashion",
  "description": "Complete profile template for fashion models",
  "fields": {
    "personal": {
      "fullName": { "type": "string", "required": true },
      "dateOfBirth": { "type": "date", "required": true },
      "email": { "type": "email", "required": true }
    },
    "physical": {
      "height": { "type": "number", "unit": "cm" },
      "weight": { "type": "number", "unit": "kg" },
      "eyeColor": { "type": "option_set", "optionSetSlug": "eye_colors" }
    },
    "professional": {
      "experience": { "type": "option_set", "optionSetSlug": "experience_levels" },
      "agencies": { "type": "text", "optional": true }
    }
  },
  "tabs": ["personal", "physical", "professional"],
  "permissions": {
    "visibleToRoles": ["user", "admin", "agency"],
    "editableByRoles": ["user", "admin"]
  }
}`}
                    </pre>
                  </div>
                </div>

                {/* Integration Notes */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Integration & Benefits</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• <strong>Rapid Deployment:</strong> Get started quickly with industry-proven field combinations</div>
                    <div>• <strong>Best Practices:</strong> Templates include validation rules and UX patterns proven in the industry</div>
                    <div>• <strong>Compliance Ready:</strong> Templates consider industry-specific compliance and data requirements</div>
                    <div>• <strong>Multi-tenant Safe:</strong> Templates work across different tenant configurations</div>
                    <div>• <strong>Extensible:</strong> Start with templates and extend with custom fields as needed</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 