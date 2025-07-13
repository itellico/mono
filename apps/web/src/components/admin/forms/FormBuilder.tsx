'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Settings, Play } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { FormRenderer } from '@/components/forms/FormRenderer';

/**
 * Helper function to safely render text that might be a translation object
 */
function safeText(text: any): string {
  if (typeof text === 'string') return text;
  if (typeof text === 'object' && text !== null) {
    // Try common language codes first
    if (text['en-US']) return text['en-US'];
    if (text['en']) return text['en'];
    if (text['default']) return text['default'];
    
    // Get first available value if none of the above
    const values = Object.values(text);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0];
    }
  }
  
  // Fallback to empty string instead of showing [object Object]
  return '';
}

/**
 * FormBuilder Component
 * 
 * Allows administrators to select model schemas and configure form generation settings.
 * Provides a user-friendly interface for building dynamic forms.
 */

interface Schema {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export function FormBuilder() {
  const { toast } = useToast();
  const [selectedSchema, setSelectedSchema] = useState<string>('');
  const [formContext, setFormContext] = useState<'create' | 'edit' | 'search'>('create');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch available schemas
  const { data: schemas, isLoading, error } = useQuery({
    queryKey: ['available-schemas'],
    queryFn: async (): Promise<Schema[]> => {
      const response = await fetch('/api/v1/forms/schemas');
      if (!response.ok) {
        throw new Error('Failed to fetch schemas');
      }
      return response.json();
    }
  });

  const handleGenerateForm = () => {
    if (!selectedSchema) {
      toast({
        title: 'Schema Required',
        description: 'Please select a schema to generate a form.',
        variant: 'destructive'
      });
      return;
    }

    // Validate that the selected schema is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(selectedSchema)) {
      toast({
        title: 'Invalid Schema',
        description: `Selected schema ID "${selectedSchema}" is not valid. Please select a different schema.`,
        variant: 'destructive'
      });
      return;
    }

    setShowPreview(true);
    toast({
      title: 'Form Generated',
      description: 'Form has been generated from the selected schema.',
      variant: 'default'
    });
  };

  const selectedSchemaData = schemas?.find(s => s.id === selectedSchema);

  return (
    <div className="space-y-6">
      {/* Schema Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Schema Selection</span>
            </CardTitle>
            <CardDescription>
              Choose a model schema to generate a form from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schema-select">Model Schema</Label>
              <Select value={selectedSchema} onValueChange={setSelectedSchema}>
                <SelectTrigger id="schema-select">
                  <SelectValue placeholder={isLoading ? "Loading schemas..." : "Select a schema"} />
                </SelectTrigger>
                <SelectContent>
                  {schemas?.map((schema) => (
                    <SelectItem key={schema.id} value={schema.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{safeText(schema.name)}</span>
                        <Badge variant="outline" className="ml-2">
                          {schema.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context-select">Form Context</Label>
              <Select value={formContext} onValueChange={(value: any) => setFormContext(value)}>
                <SelectTrigger id="context-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Create Form</SelectItem>
                  <SelectItem value="edit">Edit Form</SelectItem>
                  <SelectItem value="search">Search Form</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerateForm}
              disabled={!selectedSchema || isLoading}
              className="w-full flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Generate Form</span>
            </Button>
          </CardContent>
        </Card>

        {/* Schema Details */}
        <Card>
          <CardHeader>
            <CardTitle>Schema Details</CardTitle>
            <CardDescription>
              Information about the selected schema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedSchemaData ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{safeText(selectedSchemaData.name)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-muted-foreground">{selectedSchemaData.type}</p>
                </div>
                {selectedSchemaData.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{safeText(selectedSchemaData.description)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Context</Label>
                  <Badge variant="secondary">{formContext}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a schema to view details
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Preview */}
      {showPreview && selectedSchema && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Form Preview</CardTitle>
            <CardDescription>
              Live preview of the form generated from {safeText(selectedSchemaData?.name)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormRenderer
              schemaId={selectedSchema}
              context={formContext}
              onSubmit={async (data) => {
                toast({
                  title: 'Form Submitted (Preview)',
                  description: 'This is a preview submission. Data: ' + JSON.stringify(data.data),
                  variant: 'default'
                });
              }}
              submitButtonText="Submit (Preview)"
            />
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p>Error loading schemas: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 