/**
 * @fileoverview Schema Generator Component - Drag-and-drop schema builder
 * @version 1.0.0
 * @author itellico Mono
 * 
 * @description
 * Advanced schema generator with drag-and-drop interface for creating
 * dynamic form schemas. Supports multiple industries and subscription-aware
 * field availability.
 * 
 * @component SchemaGenerator
 * @example
 * ```tsx
 * <SchemaGenerator
 *   tenantId={1}
 *   onSchemaCreate={(schema) => console.log('Schema created:', schema)}
 *   availableFields={fields}
 *   subscriptionLimits={limits}
 * />
 * ```
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Trash2, GripVertical, Settings, Eye, Code, Save, Download, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { browserLogger } from '@/lib/browser-logger';

// Types for schema building
interface SchemaField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  metadata?: {
    industry?: string[];
    subscriptionTier?: string;
    category?: string;
  };
  order: number;
}

interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  category: string;
  fields: SchemaField[];
  subscriptionTier: string;
  isPublic: boolean;
}

interface SubscriptionLimits {
  maxFields: number;
  maxSections: number;
  allowedFieldTypes: string[];
  allowCustomValidation: boolean;
  allowAdvancedFields: boolean;
}

interface SchemaGeneratorProps {
  tenantId?: number | null;
  onSchemaCreate?: (schema: any) => void;
  onSchemaSave?: (schema: any) => void;
  availableFields?: FieldType[];
  subscriptionLimits?: SubscriptionLimits;
  initialSchema?: SchemaField[];
  mode?: 'create' | 'edit';
}

interface FieldType {
  id: string;
  name: string;
  icon: string;
  category: string;
  subscriptionTier: string;
  description: string;
  defaultConfig: Partial<SchemaField>;
}

// Default field types
const DEFAULT_FIELD_TYPES: FieldType[] = [
  {
    id: 'text',
    name: 'Text Input',
    icon: '📝',
    category: 'Basic',
    subscriptionTier: 'basic',
    description: 'Single line text input',
    defaultConfig: {
      type: 'text',
      validation: { min: 0, max: 255 }
    }
  },
  {
    id: 'textarea',
    name: 'Long Text',
    icon: '📄',
    category: 'Basic',
    subscriptionTier: 'basic',
    description: 'Multi-line text area',
    defaultConfig: {
      type: 'textarea',
      validation: { min: 0, max: 2000 }
    }
  },
  {
    id: 'email',
    name: 'Email',
    icon: '📧',
    category: 'Basic',
    subscriptionTier: 'basic',
    description: 'Email address field',
    defaultConfig: {
      type: 'email',
      validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' }
    }
  },
  {
    id: 'phone',
    name: 'Phone Number',
    icon: '📞',
    category: 'Basic',
    subscriptionTier: 'basic',
    description: 'Phone number input',
    defaultConfig: {
      type: 'tel',
      validation: { pattern: '^[+]?[1-9]\\d{1,14}$' }
    }
  },
  {
    id: 'number',
    name: 'Number',
    icon: '🔢',
    category: 'Basic',
    subscriptionTier: 'basic',
    description: 'Numeric input field',
    defaultConfig: {
      type: 'number',
      validation: { min: 0 }
    }
  },
  {
    id: 'date',
    name: 'Date',
    icon: '📅',
    category: 'Basic',
    subscriptionTier: 'basic',
    description: 'Date picker field',
    defaultConfig: {
      type: 'date'
    }
  },
  {
    id: 'select',
    name: 'Dropdown',
    icon: '📋',
    category: 'Selection',
    subscriptionTier: 'basic',
    description: 'Single selection dropdown',
    defaultConfig: {
      type: 'select',
      validation: { options: ['Option 1', 'Option 2', 'Option 3'] }
    }
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    icon: '☑️',
    category: 'Selection',
    subscriptionTier: 'basic',
    description: 'Boolean checkbox field',
    defaultConfig: {
      type: 'checkbox',
      defaultValue: false
    }
  },
  {
    id: 'radio',
    name: 'Radio Group',
    icon: '🔘',
    category: 'Selection',
    subscriptionTier: 'premium',
    description: 'Single selection radio buttons',
    defaultConfig: {
      type: 'radio',
      validation: { options: ['Option 1', 'Option 2', 'Option 3'] }
    }
  },
  {
    id: 'file',
    name: 'File Upload',
    icon: '📎',
    category: 'Media',
    subscriptionTier: 'premium',
    description: 'File upload field',
    defaultConfig: {
      type: 'file',
      validation: { max: 5242880 } // 5MB
    }
  },
  {
    id: 'image',
    name: 'Image Upload',
    icon: '🖼️',
    category: 'Media',
    subscriptionTier: 'premium',
    description: 'Image upload with preview',
    defaultConfig: {
      type: 'image',
      validation: { max: 2097152 } // 2MB
    }
  },
  {
    id: 'address',
    name: 'Address',
    icon: '🏠',
    category: 'Advanced',
    subscriptionTier: 'enterprise',
    description: 'Address with geocoding',
    defaultConfig: {
      type: 'address',
      metadata: { category: 'location' }
    }
  }
];

/**
 * Draggable field type component
 */
const DraggableFieldType: React.FC<{
  fieldType: FieldType;
  isDisabled: boolean;
  subscriptionTier: string;
}> = ({ fieldType, isDisabled, subscriptionTier }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'fieldType',
    item: fieldType,
    canDrag: !isDisabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const canUse = !isDisabled && (
    subscriptionTier === 'enterprise' || 
    (subscriptionTier === 'premium' && fieldType.subscriptionTier !== 'enterprise') ||
    (subscriptionTier === 'basic' && fieldType.subscriptionTier === 'basic')
  );

  return (
    <div
      ref={drag}
      className={`
        p-3 border rounded-lg cursor-move transition-all
        ${isDragging ? 'opacity-50' : ''}
        ${canUse ? 'hover:bg-gray-50 border-gray-200' : 'opacity-50 cursor-not-allowed border-gray-100'}
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{fieldType.icon}</span>
        <span className="font-medium text-sm">{fieldType.name}</span>
        {!canUse && (
          <Badge variant="secondary" className="text-xs">
            {fieldType.subscriptionTier}
          </Badge>
        )}
      </div>
      <p className="text-xs text-gray-600">{fieldType.description}</p>
    </div>
  );
};

/**
 * Schema field editor component
 */
const SchemaFieldEditor: React.FC<{
  field: SchemaField;
  onUpdate: (field: SchemaField) => void;
  onDelete: () => void;
}> = ({ field, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleFieldUpdate = useCallback((updates: Partial<SchemaField>) => {
    onUpdate({ ...field, ...updates });
  }, [field, onUpdate]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'schemaField',
    item: { id: field.id, index: field.order },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <Card className={`mb-2 ${isDragging ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div ref={drag} className="cursor-move">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <span className="font-medium">{field.label || field.name}</span>
            <Badge variant="outline" className="text-xs">
              {field.type}
            </Badge>
            {field.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {field.description && (
          <p className="text-sm text-gray-600 mb-2">{field.description}</p>
        )}

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Field: {field.name}</DialogTitle>
              <DialogDescription>
                Configure the field properties and validation rules.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fieldName">Field Name</Label>
                  <Input
                    id="fieldName"
                    value={field.name}
                    onChange={(e) => handleFieldUpdate({ name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="fieldLabel">Label</Label>
                  <Input
                    id="fieldLabel"
                    value={field.label}
                    onChange={(e) => handleFieldUpdate({ label: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="fieldDescription">Description</Label>
                <Textarea
                  id="fieldDescription"
                  value={field.description || ''}
                  onChange={(e) => handleFieldUpdate({ description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="fieldPlaceholder">Placeholder</Label>
                <Input
                  id="fieldPlaceholder"
                  value={field.placeholder || ''}
                  onChange={(e) => handleFieldUpdate({ placeholder: e.target.value })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="fieldRequired"
                  checked={field.required}
                  onCheckedChange={(checked) => handleFieldUpdate({ required: checked })}
                />
                <Label htmlFor="fieldRequired">Required field</Label>
              </div>
              
              {field.type === 'select' || field.type === 'radio' ? (
                <div>
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={field.validation?.options?.join('\n') || ''}
                    onChange={(e) => handleFieldUpdate({
                      validation: {
                        ...field.validation,
                        options: e.target.value.split('\n').filter(opt => opt.trim())
                      }
                    })}
                  />
                </div>
              ) : null}
              
              {field.type === 'text' || field.type === 'textarea' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minLength">Min Length</Label>
                    <Input
                      id="minLength"
                      type="number"
                      value={field.validation?.min || ''}
                      onChange={(e) => handleFieldUpdate({
                        validation: {
                          ...field.validation,
                          min: parseInt(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLength">Max Length</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      value={field.validation?.max || ''}
                      onChange={(e) => handleFieldUpdate({
                        validation: {
                          ...field.validation,
                          max: parseInt(e.target.value) || 255
                        }
                      })}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsEditing(false)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

/**
 * Main Schema Generator Component
 */
export const SchemaGenerator: React.FC<SchemaGeneratorProps> = ({
  tenantId,
  onSchemaCreate,
  onSchemaSave,
  availableFields = DEFAULT_FIELD_TYPES,
  subscriptionLimits = {
    maxFields: 50,
    maxSections: 10,
    allowedFieldTypes: ['text', 'email', 'select'],
    allowCustomValidation: true,
    allowAdvancedFields: false
  },
  initialSchema = [],
  mode = 'create'
}) => {
  const [schema, setSchema] = useState<SchemaField[]>(initialSchema);
  const [schemaName, setSchemaName] = useState('');
  const [schemaDescription, setSchemaDescription] = useState('');
  const [schemaIndustry, setSchemaIndustry] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const { toast } = useToast();

  // Get subscription tier (mock for now)
  const subscriptionTier = 'premium'; // This would come from actual subscription data

  // Drop zone for schema fields
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'fieldType',
    drop: (item: FieldType) => {
      addField(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const addField = useCallback((fieldType: FieldType) => {
    if (schema.length >= subscriptionLimits.maxFields) {
      toast({
        title: 'Field limit reached',
        description: `Your subscription allows up to ${subscriptionLimits.maxFields} fields.`,
        variant: 'destructive',
      });
      return;
    }

    const newField: SchemaField = {
      id: `field_${Date.now()}`,
      name: `${fieldType.name.toLowerCase().replace(/\s+/g, '_')}_${schema.length + 1}`,
      label: fieldType.name,
      type: fieldType.id,
      required: false,
      order: schema.length,
      ...fieldType.defaultConfig,
    };

    setSchema(prev => [...prev, newField]);
    
    browserLogger.userAction('Schema field added', {
      fieldType: fieldType.id,
      schemaLength: schema.length + 1,
      tenantId
    });
  }, [schema.length, subscriptionLimits.maxFields, toast, tenantId]);

  const updateField = useCallback((fieldId: string, updates: SchemaField) => {
    setSchema(prev => prev.map(field => 
      field.id === fieldId ? updates : field
    ));
  }, []);

  const deleteField = useCallback((fieldId: string) => {
    setSchema(prev => prev.filter(field => field.id !== fieldId));
    
    browserLogger.userAction('Schema field deleted', {
      fieldId,
      tenantId
    });
  }, [tenantId]);

  const moveField = useCallback((dragIndex: number, hoverIndex: number) => {
    setSchema(prev => {
      const newSchema = [...prev];
      const draggedField = newSchema[dragIndex];
      newSchema.splice(dragIndex, 1);
      newSchema.splice(hoverIndex, 0, draggedField);
      
      // Update order indices
      return newSchema.map((field, index) => ({ ...field, order: index }));
    });
  }, []);

  const saveSchema = useCallback(async () => {
    if (!schemaName.trim()) {
      toast({
        title: 'Schema name required',
        description: 'Please provide a name for your schema.',
        variant: 'destructive',
      });
      return;
    }

    if (schema.length === 0) {
      toast({
        title: 'Empty schema',
        description: 'Please add at least one field to your schema.',
        variant: 'destructive',
      });
      return;
    }

    const schemaData = {
      name: schemaName,
      description: schemaDescription,
      industry: schemaIndustry,
      fields: schema,
      tenantId,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };

    try {
      if (onSchemaSave) {
        await onSchemaSave(schemaData);
      } else if (onSchemaCreate) {
        await onSchemaCreate(schemaData);
      }

      toast({
        title: 'Schema saved',
        description: 'Your schema has been saved successfully.',
      });

      browserLogger.userAction('Schema saved', {
        schemaName,
        fieldCount: schema.length,
        industry: schemaIndustry,
        tenantId
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save schema. Please try again.',
        variant: 'destructive',
      });
      
      browserLogger.error('Schema save failed', {
        error: error instanceof Error ? error.message : String(error),
        schemaName,
        tenantId
      });
    }
  }, [schemaName, schemaDescription, schemaIndustry, schema, tenantId, onSchemaSave, onSchemaCreate, toast]);

  const fieldCategories = useMemo(() => {
    const categories: Record<string, FieldType[]> = {};
    availableFields.forEach(field => {
      if (!categories[field.category]) {
        categories[field.category] = [];
      }
      categories[field.category].push(field);
    });
    return categories;
  }, [availableFields]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Field Types */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Field Types</h2>
            <p className="text-sm text-gray-600">
              Drag fields to the canvas to build your schema
            </p>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {Object.entries(fieldCategories).map(([category, fields]) => (
              <div key={category} className="mb-6">
                <h3 className="font-medium text-sm text-gray-900 mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {fields.map(field => (
                    <DraggableFieldType
                      key={field.id}
                      fieldType={field}
                      isDisabled={!subscriptionLimits.allowedFieldTypes.includes(field.id)}
                      subscriptionTier={subscriptionTier}
                    />
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Schema Name"
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                  className="w-64"
                />
                <Select value={schemaIndustry} onValueChange={setSchemaIndustry}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="human_models">Human Models</SelectItem>
                    <SelectItem value="animal_talent">Animal Talent</SelectItem>
                    <SelectItem value="agencies">Agencies</SelectItem>
                    <SelectItem value="service_providers">Service Providers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={saveSchema}>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'edit' ? 'Update' : 'Create'} Schema
                </Button>
              </div>
            </div>
            
            <div className="mt-2">
              <Textarea
                placeholder="Schema description (optional)"
                value={schemaDescription}
                onChange={(e) => setSchemaDescription(e.target.value)}
                className="w-full"
                rows={2}
              />
            </div>
          </div>

          {/* Schema Builder */}
          <div className="flex-1 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="mb-4">
                <TabsTrigger value="builder">Visual Builder</TabsTrigger>
                <TabsTrigger value="code">JSON Schema</TabsTrigger>
              </TabsList>
              
              <TabsContent value="builder" className="h-full">
                <div
                  ref={drop}
                  className={`
                    h-full border-2 border-dashed rounded-lg p-6
                    ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
                    ${schema.length === 0 ? 'flex items-center justify-center' : ''}
                  `}
                >
                  {schema.length === 0 ? (
                    <div className="text-center">
                      <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Start Building Your Schema
                      </h3>
                      <p className="text-gray-600">
                        Drag field types from the sidebar to begin creating your form schema.
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="space-y-2">
                        {schema.map((field) => (
                          <SchemaFieldEditor
                            key={field.id}
                            field={field}
                            onUpdate={(updatedField) => updateField(field.id, updatedField)}
                            onDelete={() => deleteField(field.id)}
                          />
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 bg-gray-100 rounded-lg text-center">
                        <p className="text-sm text-gray-600">
                          Drop more fields here to continue building your schema
                        </p>
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="code" className="h-full">
                <ScrollArea className="h-full">
                  <pre className="bg-gray-900 text-white p-4 rounded-lg text-sm overflow-auto">
                    {JSON.stringify({ 
                      name: schemaName,
                      description: schemaDescription,
                      industry: schemaIndustry,
                      fields: schema 
                    }, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="w-64 bg-white border-l border-gray-200 p-4">
          <h3 className="font-medium text-sm text-gray-900 mb-4">
            Schema Statistics
          </h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span>Fields</span>
                <span>{schema.length} / {subscriptionLimits.maxFields}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(schema.length / subscriptionLimits.maxFields) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium">Field Types Used</span>
              <div className="mt-2 space-y-1">
                {Object.entries(
                  schema.reduce((acc, field) => {
                    acc[field.type] = (acc[field.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="capitalize">{type}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <span className="text-sm font-medium">Subscription Limits</span>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <div>Max Fields: {subscriptionLimits.maxFields}</div>
                <div>Custom Validation: {subscriptionLimits.allowCustomValidation ? '✓' : '✗'}</div>
                <div>Advanced Fields: {subscriptionLimits.allowAdvancedFields ? '✓' : '✗'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Schema Preview: {schemaName}</DialogTitle>
            <DialogDescription>
              Preview how your schema will appear as a form to users.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] p-4 border rounded-lg">
            <div className="space-y-4">
              {schema.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.description && (
                    <p className="text-sm text-gray-600">{field.description}</p>
                  )}
                  <div className="bg-gray-100 p-3 rounded border">
                    <span className="text-sm text-gray-500">
                      {field.type} field preview
                      {field.placeholder && ` - Placeholder: "${field.placeholder}"`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}; 