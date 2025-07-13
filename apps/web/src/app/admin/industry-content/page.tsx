'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Star,
  Zap,
  Settings,
  Database,
  Tags,
  Layers
} from 'lucide-react';

/**
 * Industry Content Management Page
 * 
 * @component IndustryContentPage
 * @description Admin interface for managing industry-specific tags, categories, and content
 */
export default function IndustryContentPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Industry Content</h1>
          <Badge variant="secondary">Management</Badge>
        </div>
      </div>

      {/* Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Industry-Specific Content Management
          </CardTitle>
          <CardDescription>
            Manage industry-specific tags, categories, and content configurations for different marketplace verticals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">4+</div>
              <div className="text-sm text-muted-foreground">Industry Types</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Tags className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">100+</div>
              <div className="text-sm text-muted-foreground">Industry Tags</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">Instant</div>
              <div className="text-sm text-muted-foreground">Content Setup</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Management */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="industries">Industries</TabsTrigger>
          <TabsTrigger value="seeding">Content Seeding</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Industry Content System</CardTitle>
              <CardDescription>
                Manage industry-specific content that gets automatically assigned to tenants based on their selected industry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* System Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">System Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Automated Seeding
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Automatically populate tenant databases with industry-relevant tags and categories
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium text-green-600 mb-2 flex items-center gap-2">
                        <Tags className="h-4 w-4" />
                        Smart Classification
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Industry-specific tag types and categories with relevance filtering
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium text-purple-600 mb-2 flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Multi-tenant Safe
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Isolated content per tenant with shared industry templates
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="font-medium text-orange-600 mb-2 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configurable
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Flexible configuration through platform.config.js and API
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">
                        <strong>Industry Content Management:</strong> This system allows you to define industry-specific 
                        tags, categories, and content that automatically gets assigned to tenants based on their selected industry type.
                      </p>
                      <p className="mb-2">
                        <strong>Currently Supported Industries:</strong> Freelancing, Modeling, AI/Tech, Fitness & Wellness
                      </p>
                      <p>
                        <strong>Integration Point:</strong> Content is managed through platform.config.js and can be 
                        seeded via the IndustryContentService API.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supported Industries</CardTitle>
              <CardDescription>
                Industry verticals with specialized content and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    industry: 'Freelancing',
                    description: 'Freelancers, agencies, project-based work',
                    tags: ['React', 'Design', 'Writing', 'Marketing', 'Development'],
                    categories: ['Skills', 'Services', 'Projects', 'Specializations'],
                    color: 'blue'
                  },
                  {
                    industry: 'Modeling',
                    description: 'Fashion models, talent agencies, casting',
                    tags: ['Fashion', 'Commercial', 'Editorial', 'Runway', 'Beauty'],
                    categories: ['Model Types', 'Specialties', 'Experience Levels', 'Agencies'],
                    color: 'pink'
                  },
                  {
                    industry: 'AI & Technology',
                    description: 'AI professionals, tech services, innovation',
                    tags: ['Machine Learning', 'AI Development', 'Data Science', 'Cloud', 'Automation'],
                    categories: ['Technologies', 'Services', 'Expertise', 'Industries'],
                    color: 'purple'
                  },
                  {
                    industry: 'Fitness & Wellness',
                    description: 'Fitness professionals, wellness services',
                    tags: ['Personal Training', 'Yoga', 'Nutrition', 'Wellness', 'Fitness'],
                    categories: ['Services', 'Specialties', 'Certifications', 'Equipment'],
                    color: 'green'
                  }
                ].map((industry, index) => (
                  <Card key={index} className="border-l-4" style={{ borderLeftColor: `rgb(var(--${industry.color}-500))` }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{industry.industry}</CardTitle>
                      <CardDescription className="text-sm">
                        {industry.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-1">Sample Tags:</div>
                        <div className="flex flex-wrap gap-1">
                          {industry.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Categories:</div>
                        <div className="flex flex-wrap gap-1">
                          {industry.categories.map((category, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {category}
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

        <TabsContent value="seeding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Seeding</CardTitle>
              <CardDescription>
                Seed tenant databases with industry-specific content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-3">
                    <strong>Automatic Seeding:</strong> When a tenant selects an industry during onboarding or configuration, 
                    the system automatically seeds their database with relevant tags and categories.
                  </p>
                  <p className="mb-3">
                    <strong>API Endpoint:</strong> <code className="bg-background px-2 py-1 rounded text-xs">/api/v1/admin/industry-content</code>
                  </p>
                  <p className="mb-3">
                    <strong>Service:</strong> IndustryContentService handles the seeding logic and content management
                  </p>
                  <p>
                    <strong>Configuration:</strong> Industry definitions and content are managed in platform.config.js
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Configure industry content system behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium mb-2">Configuration Location:</p>
                    <code className="bg-background px-2 py-1 rounded text-xs">
                      /platform.config.js → industries section
                    </code>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium mb-2">Key Components:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Industry definitions with metadata</li>
                      <li>Default categories per industry</li>
                      <li>Industry-specific tag collections</li>
                      <li>Tag type classifications</li>
                      <li>Relevance filtering rules</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="text-sm">
                    <p className="font-medium mb-2">Related Systems:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>IndustryContentService (backend service)</li>
                      <li>Platform configuration system</li>
                      <li>Tenant onboarding workflow</li>
                      <li>Tag and category management</li>
                    </ul>
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