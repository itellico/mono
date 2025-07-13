'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TagSelector, TagCloud, TagFilter, TagDisplay } from '@/components/tags';
import type { TagData } from '@/components/tags/types';

export default function TagsDemoPage() {
  const [selectedTags, setSelectedTags] = useState<TagData[]>([]);
  const [filterTags, setFilterTags] = useState<number[]>([]);
  const [matchMode, setMatchMode] = useState<'any' | 'all'>('any');

  // Demo entity IDs
  const demoEntityId = '550e8400-e29b-41d4-a716-446655440000';
  const demoJobId = '550e8400-e29b-41d4-a716-446655440001';

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tag Components Demo</h1>
        <p className="text-muted-foreground">
          Interactive demo of all tag-related UI components
        </p>
      </div>

      <Tabs defaultValue="selector" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="selector">Tag Selector</TabsTrigger>
          <TabsTrigger value="cloud">Tag Cloud</TabsTrigger>
          <TabsTrigger value="filter">Tag Filter</TabsTrigger>
          <TabsTrigger value="display">Tag Display</TabsTrigger>
        </TabsList>

        <TabsContent value="selector" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tag Selector Component</CardTitle>
              <CardDescription>
                Add and remove tags from entities with search and create functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Default Variant</h3>
                <TagSelector
                  entityType="demo"
                  entityId={demoEntityId}
                  placeholder="Add tags to this demo..."
                  onChange={(tags) => setSelectedTags(tags)}
                />
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <Label>Selected Tags:</Label>
                  <pre className="text-xs mt-2">
                    {JSON.stringify(selectedTags, null, 2)}
                  </pre>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Inline Variant</h3>
                <TagSelector
                  entityType="demo"
                  entityId={demoJobId}
                  variant="inline"
                  placeholder="Type to add tags..."
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Minimal Variant (Max 5 tags)</h3>
                <TagSelector
                  entityType="demo"
                  entityId={`demo-${Date.now()}`}
                  variant="minimal"
                  maxTags={5}
                  category="skills"
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Disabled State</h3>
                <TagSelector
                  entityType="demo"
                  entityId="disabled-demo"
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cloud" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tag Cloud Component</CardTitle>
              <CardDescription>
                Display popular tags in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Default Variant</h3>
                <TagCloud
                  onTagClick={(tag) => {
                    console.log('Clicked tag:', tag);
                    alert(`Clicked: ${tag.name}`);
                  }}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Compact Variant</h3>
                <TagCloud
                  variant="compact"
                  limit={15}
                  onTagClick={(tag) => console.log('Clicked:', tag)}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Inline Variant (No usage count)</h3>
                <TagCloud
                  variant="inline"
                  limit={10}
                  showUsageCount={false}
                  onTagClick={(tag) => console.log('Clicked:', tag)}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Category-specific Cloud</h3>
                <TagCloud
                  category="skills"
                  limit={20}
                  onTagClick={(tag) => console.log('Clicked:', tag)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tag Filter Component</CardTitle>
              <CardDescription>
                Filter content by selecting multiple tags with match mode options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Default Variant</h3>
                <TagFilter
                  selectedTags={filterTags}
                  onTagsChange={setFilterTags}
                  matchMode={matchMode}
                  onMatchModeChange={setMatchMode}
                  showMatchMode
                />
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <Label>Filter State:</Label>
                  <p className="text-sm mt-2">
                    Selected Tag IDs: {filterTags.join(', ') || 'None'}
                  </p>
                  <p className="text-sm">
                    Match Mode: {matchMode}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Inline Variant</h3>
                <TagFilter
                  selectedTags={[]}
                  onTagsChange={(tags) => console.log('Selected:', tags)}
                  variant="inline"
                  placeholder="Search and filter by tags..."
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Popover Variant</h3>
                <TagFilter
                  selectedTags={[]}
                  onTagsChange={(tags) => console.log('Selected:', tags)}
                  variant="popover"
                  showMatchMode
                  placeholder="Click to filter by tags"
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Category-specific Filter</h3>
                <TagFilter
                  selectedTags={[]}
                  onTagsChange={(tags) => console.log('Selected:', tags)}
                  category="location"
                  placeholder="Filter by location tags..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tag Display Component</CardTitle>
              <CardDescription>
                Display tags attached to entities in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Default Display</h3>
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Job Posting Tags:</h4>
                  <TagDisplay
                    entityType="job"
                    entityId={demoJobId}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Compact Display</h3>
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">User Profile Tags:</h4>
                  <TagDisplay
                    entityType="user"
                    entityId={demoEntityId}
                    variant="compact"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Minimal Display (Max 3, Linkable)</h3>
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Article Tags:</h4>
                  <TagDisplay
                    entityType="article"
                    entityId="demo-article-123"
                    variant="minimal"
                    maxTags={3}
                    linkable
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">With Categories</h3>
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Product Tags:</h4>
                  <TagDisplay
                    entityType="product"
                    entityId="demo-product-456"
                    showCategory
                    linkable
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}