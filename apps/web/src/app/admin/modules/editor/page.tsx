'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Code,
  Palette,
  Monitor,
  Save,
  Users,
  Briefcase,
  Building,
  User,
  Plus,
  Image,
  FileText,
  CheckSquare,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Hash,
  Type,
  ToggleLeft,
  List,
  Grid3X3,
  Baby,
  Shield,
  Camera,
  Maximize2,
  Minimize2,
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2
} from 'lucide-react';
import dynamic from 'next/dynamic';
// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
// Component Library for the sidebar
const COMPONENT_LIBRARY = {
  'Basic Fields': [
    { id: 'text', name: 'Text Field', icon: Type, description: 'Single line text input' },
    { id: 'textarea', name: 'Text Area', icon: FileText, description: 'Multi-line text input' },
    { id: 'email', name: 'Email Field', icon: Mail, description: 'Email address input' },
    { id: 'phone', name: 'Phone Field', icon: Phone, description: 'Phone number input' },
    { id: 'number', name: 'Number Field', icon: Hash, description: 'Numeric input' },
    { id: 'date', name: 'Date Field', icon: Calendar, description: 'Date picker' },
    { id: 'select', name: 'Dropdown', icon: List, description: 'Select from options' },
    { id: 'checkbox', name: 'Checkbox', icon: CheckSquare, description: 'Yes/No checkbox' },
    { id: 'toggle', name: 'Toggle Switch', icon: ToggleLeft, description: 'On/off toggle' }
  ],
  'Media & Files': [
    { id: 'image', name: 'Single Image', icon: Image, description: 'Single photo upload' },
    { id: 'image-grid', name: 'Image Grid', icon: Grid3X3, description: 'Multiple photos in grid' },
    { id: 'profile-photo', name: 'Profile Photo', icon: Camera, description: 'Main profile picture' }
  ],
  'Layout': [
    { id: 'tab-group', name: 'Tab Group', icon: Layers, description: 'Group fields in tabs' }
  ],
  'GoModels Specific': [
    { id: 'measurements', name: 'Measurements', icon: User, description: 'Body measurements form' },
    { id: 'parental-consent', name: 'Parental Consent', icon: Baby, description: 'Parent/guardian consent' },
    { id: 'terms-acceptance', name: 'Terms & Conditions', icon: Shield, description: 'Accept terms checkbox' },
    { id: 'location', name: 'Location Field', icon: MapPin, description: 'Address/location input' }
  ]
};
// Available schema references for data integration
const AVAILABLE_SCHEMAS = {
  users: {
    name: "Users",
    fields: [
      { name: "id", type: "uuid", description: "User ID" },
      { name: "email", type: "string", description: "Email address" },
      { name: "name", type: "string", description: "Full name" },
      { name: "age", type: "number", description: "Age" },
      { name: "location", type: "string", description: "Location" },
      { name: "phone", type: "string", description: "Phone number" }
    ]
  },
  profiles: {
    name: "Profiles",
    fields: [
      { name: "id", type: "uuid", description: "Profile ID" },
      { name: "measurements", type: "object", description: "Body measurements" },
      { name: "photos", type: "array", description: "Portfolio photos" },
      { name: "experience", type: "text", description: "Experience description" },
      { name: "skills", type: "array", description: "Skills and specialties" },
      { name: "availability", type: "object", description: "Availability calendar" }
    ]
  },
  jobs: {
    name: "Jobs",
    fields: [
      { name: "id", type: "uuid", description: "Job ID" },
      { name: "title", type: "string", description: "Job title" },
      { name: "requirements", type: "object", description: "Job requirements" },
      { name: "pay", type: "number", description: "Payment amount" },
      { name: "location", type: "string", description: "Job location" },
      { name: "dates", type: "object", description: "Job dates" }
    ]
  },
  agencies: {
    name: "Agencies",
    fields: [
      { name: "id", type: "uuid", description: "Agency ID" },
      { name: "name", type: "string", description: "Agency name" },
      { name: "contact", type: "object", description: "Contact information" },
      { name: "commission", type: "number", description: "Commission rate" },
      { name: "specialties", type: "array", description: "Specialties" }
    ]
  }
};
// Flatten schema fields for dropdown
const getAllSchemaFields = () => {
  const fields: Array<{value: string, label: string, description: string}> = [];
  Object.entries(AVAILABLE_SCHEMAS).forEach(([schemaKey, schema]) => {
    schema.fields.forEach(field => {
      fields.push({
        value: `${schemaKey}.${field.name}`,
        label: `${schema.name}: ${field.name}`,
        description: field.description
      });
    });
  });
  return fields;
};
// Default module schema template
const DEFAULT_MODULE_SCHEMA = {
  name: "New Module",
  description: "Module description",
  metadata: {
    form: {
      layout: "form",
      autoSave: true,
      showProgress: false
    },
    business: {
      requiresParentalConsent: false,
      minimumAge: 18,
      subscriptionTier: "free"
    }
  },
  tabGroups: [
    {
      id: "main_tab",
      name: "Main Information",
      columns: 2,
      order: 1
    }
  ],
  elements: [
    {
      id: "sample_text",
      type: "text",
      label: "Sample Text Field",
      required: false,
      order: 1,
      tabGroup: "main_tab",
      column: 1,
      position: 1,
      schemaField: null,
      config: {
        placeholder: "Enter text here...",
        maxLength: 100
      }
    }
  ]
};
// Schema Field Selector Component
function SchemaFieldSelector({ value, onChange }: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const schemaFields = getAllSchemaFields();
  return (
    <Select value={value || 'none'} onValueChange={(val) => onChange(val === 'none' ? null : val)}>
      <SelectTrigger className="h-8 text-sm">
        <SelectValue placeholder="Select schema field..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No schema field</SelectItem>
        {schemaFields.map((field) => (
          <SelectItem key={field.value} value={field.value}>
            <div>
              <div className="font-medium">{field.label}</div>
              <div className="text-xs text-muted-foreground">{field.description}</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
// Simplified Visual Editor Component
function VisualModuleEditor({ schema, onChange }: {
  schema: any;
  onChange: (schema: any) => void;
}) {
  if (!schema) return <div className="text-center text-muted-foreground">Invalid JSON schema</div>;
  const addElement = (componentType: string) => {
    const newElement = {
      id: `${componentType}_${Date.now()}`,
      type: componentType,
      label: `New ${componentType.charAt(0).toUpperCase() + componentType.slice(1)}`,
      required: false,
      order: (schema.elements?.length || 0) + 1,
      tabGroup: schema.tabGroups?.[0]?.id || "main_tab",
      column: 1,
      position: (schema.elements?.length || 0) + 1,
      schemaField: null,
      config: {}
    };
    const updatedSchema = {
      ...schema,
      elements: [...(schema.elements || []), newElement]
    };
    onChange(updatedSchema);
  };
  const addTabGroup = () => {
    const newTabGroup = {
      id: `tab_${Date.now()}`,
      name: `Tab ${(schema.tabGroups?.length || 0) + 1}`,
      columns: 2,
      order: (schema.tabGroups?.length || 0) + 1
    };
    const updatedSchema = {
      ...schema,
      tabGroups: [...(schema.tabGroups || []), newTabGroup]
    };
    onChange(updatedSchema);
  };
  const removeElement = (elementId: string) => {
    const updatedSchema = {
      ...schema,
      elements: schema.elements?.filter((el: any) => el.id !== elementId) || []
    };
    onChange(updatedSchema);
  };
  const removeTabGroup = (tabGroupId: string) => {
    const updatedSchema = {
      ...schema,
      tabGroups: schema.tabGroups?.filter((tg: any) => tg.id !== tabGroupId) || [],
      elements: schema.elements?.map((el: any) => 
        el.tabGroup === tabGroupId ? { ...el, tabGroup: schema.tabGroups?.[0]?.id || "main_tab" } : el
      ) || []
    };
    onChange(updatedSchema);
  };
  const updateElement = (elementId: string, updates: any) => {
    const updatedSchema = {
      ...schema,
      elements: schema.elements?.map((el: any) => 
        el.id === elementId ? { ...el, ...updates } : el
      ) || []
    };
    onChange(updatedSchema);
  };
  const updateTabGroup = (tabGroupId: string, updates: any) => {
    const updatedSchema = {
      ...schema,
      tabGroups: schema.tabGroups?.map((tg: any) => 
        tg.id === tabGroupId ? { ...tg, ...updates } : tg
      ) || []
    };
    onChange(updatedSchema);
  };
  const moveElement = (elementId: string, direction: 'up' | 'down') => {
    const elements = [...(schema.elements || [])];
    const index = elements.findIndex(el => el.id === elementId);
    if (index === -1) return;
    if (direction === 'up' && index > 0) {
      [elements[index], elements[index - 1]] = [elements[index - 1], elements[index]];
    } else if (direction === 'down' && index < elements.length - 1) {
      [elements[index], elements[index + 1]] = [elements[index + 1], elements[index]];
    }
    // Update order values
    elements.forEach((el, idx) => {
      el.order = idx + 1;
    });
    const updatedSchema = { ...schema, elements };
    onChange(updatedSchema);
  };
  return (
    <div className="space-y-6">
      {/* Module Metadata */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Module Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Module Name</Label>
            <Input 
              value={schema.name || ''} 
              onChange={(e) => onChange({...schema, name: e.target.value})}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input 
              value={schema.description || ''} 
              onChange={(e) => onChange({...schema, description: e.target.value})}
            />
          </div>
        </div>
      </div>
      {/* Form Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Form Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Layout Type</Label>
            <Select 
              value={schema.metadata?.form?.layout || 'form'}
              onValueChange={(value) => onChange({
                ...schema, 
                metadata: {
                  ...schema.metadata,
                  form: {...schema.metadata?.form, layout: value}
                }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="form">Standard Form</SelectItem>
                <SelectItem value="grid">Grid Layout</SelectItem>
                <SelectItem value="wizard">Step Wizard</SelectItem>
                <SelectItem value="tabs">Tabbed Interface</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              checked={schema.metadata?.form?.autoSave || false}
              onCheckedChange={(checked) => onChange({
                ...schema,
                metadata: {
                  ...schema.metadata,
                  form: {...schema.metadata?.form, autoSave: checked}
                }
              })}
            />
            <Label>Auto-save enabled</Label>
          </div>
        </div>
      </div>
      {/* Business Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Business Rules</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={schema.metadata?.business?.requiresParentalConsent || false}
              onCheckedChange={(checked) => onChange({
                ...schema,
                metadata: {
                  ...schema.metadata,
                  business: {...schema.metadata?.business, requiresParentalConsent: checked}
                }
              })}
            />
            <Label>Requires Parental Consent</Label>
          </div>
          <div>
            <Label>Minimum Age</Label>
            <Input 
              type="number"
              value={schema.metadata?.business?.minimumAge || 18} 
              onChange={(e) => onChange({
                ...schema,
                metadata: {
                  ...schema.metadata,
                  business: {...schema.metadata?.business, minimumAge: parseInt(e.target.value)}
                }
              })}
            />
          </div>
        </div>
      </div>
      {/* Tab Groups Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tab Groups</h3>
          <Button onClick={addTabGroup} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Tab Group
          </Button>
        </div>
        <div className="space-y-3">
          {schema.tabGroups?.map((tabGroup: any) => (
            <Card key={tabGroup.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                                 <div className="flex items-center gap-3">
                   <Layers className="h-4 w-4" />
                   <Badge variant="outline">#{tabGroup.order}</Badge>
                  <div className="font-medium">{tabGroup.name}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeTabGroup(tabGroup.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Tab Name</Label>
                  <Input 
                    className="h-8 text-sm"
                    value={tabGroup.name || ''}
                    onChange={(e) => updateTabGroup(tabGroup.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Columns</Label>
                  <Select 
                    value={tabGroup.columns?.toString() || '2'}
                    onValueChange={(value) => updateTabGroup(tabGroup.id, { columns: parseInt(value) })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Column</SelectItem>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
          {(!schema.tabGroups || schema.tabGroups.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tab groups created yet.</p>
              <p className="text-sm">Add a tab group to organize your form fields.</p>
            </div>
          )}
        </div>
      </div>
      {/* Elements Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Form Elements</h3>
        <div className="space-y-3">
          {schema.elements?.map((element: any, index: number) => (
            <Card key={element.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{element.order}</Badge>
                  <div>
                    <div className="font-medium">{element.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {element.type} • Tab: {schema.tabGroups?.find((tg: any) => tg.id === element.tabGroup)?.name || 'Unknown'} • Col: {element.column}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => moveElement(element.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => moveElement(element.id, 'down')}
                    disabled={index === schema.elements.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Switch 
                    checked={element.required || false}
                    onCheckedChange={(checked) => updateElement(element.id, { required: checked })}
                  />
                  <Label className="text-sm">Required</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeElement(element.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Element Configuration */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input 
                      className="h-8 text-sm"
                      value={element.label || ''}
                      onChange={(e) => updateElement(element.id, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Placeholder</Label>
                    <Input 
                      className="h-8 text-sm"
                      value={element.config?.placeholder || ''}
                      onChange={(e) => updateElement(element.id, { 
                        config: { ...element.config, placeholder: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Tab Group</Label>
                    <Select 
                      value={element.tabGroup || ''}
                      onValueChange={(value) => updateElement(element.id, { tabGroup: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {schema.tabGroups?.map((tg: any) => (
                          <SelectItem key={tg.id} value={tg.id}>{tg.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Column</Label>
                    <Select 
                      value={element.column?.toString() || '1'}
                      onValueChange={(value) => updateElement(element.id, { column: parseInt(value) })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: schema.tabGroups?.find((tg: any) => tg.id === element.tabGroup)?.columns || 2 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>Column {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Position</Label>
                    <Input 
                      type="number"
                      className="h-8 text-sm"
                      value={element.position || 1}
                      onChange={(e) => updateElement(element.id, { position: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Schema Field Assignment</Label>
                  <SchemaFieldSelector
                    value={element.schemaField}
                    onChange={(value) => updateElement(element.id, { schemaField: value })}
                  />
                </div>
              </div>
            </Card>
          ))}
          {(!schema.elements || schema.elements.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No elements added yet.</p>
              <p className="text-sm">Add components from the sidebar to build your form.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// Component Sidebar
function ComponentSidebar({ onAddComponent }: { onAddComponent: (type: string) => void }) {
  return (
    <div className="space-y-4">
      {Object.entries(COMPONENT_LIBRARY).map(([category, components]) => (
        <div key={category}>
          <h4 className="font-semibold text-sm mb-2">{category}</h4>
          <div className="space-y-2">
            {components.map((component) => {
              const IconComponent = component.icon;
              return (
                <Button
                  key={component.id}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3 text-left"
                  onClick={() => onAddComponent(component.id)}
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{component.name}</div>
                      <div className="text-xs text-muted-foreground">{component.description}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
// Module Preview Component
function ModulePreview({ schema }: { schema: any }) {
  if (!schema) return <div className="text-center text-muted-foreground">Invalid schema</div>;
  // Group elements by tab group and column
  const groupedElements = schema.elements?.reduce((acc: any, element: any) => {
    const tabGroupId = element.tabGroup || 'main_tab';
    const column = element.column || 1;
    if (!acc[tabGroupId]) acc[tabGroupId] = {};
    if (!acc[tabGroupId][column]) acc[tabGroupId][column] = [];
    acc[tabGroupId][column].push(element);
    return acc;
  }, {}) || {};
  // Sort elements by position within each column
  Object.keys(groupedElements).forEach(tabGroupId => {
    Object.keys(groupedElements[tabGroupId]).forEach(column => {
      groupedElements[tabGroupId][column].sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
    });
  });
  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">{schema.name}</h2>
        <p className="text-muted-foreground mb-4">{schema.description}</p>
        {/* Metadata Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded">
            <h4 className="font-semibold text-sm">Form Settings</h4>
            <p className="text-xs">Layout: {schema.metadata?.form?.layout || 'form'}</p>
            <p className="text-xs">Auto-save: {schema.metadata?.form?.autoSave ? 'Yes' : 'No'}</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <h4 className="font-semibold text-sm">Business Rules</h4>
            <p className="text-xs">Min Age: {schema.metadata?.business?.minimumAge || 18}</p>
            <p className="text-xs">Parental Consent: {schema.metadata?.business?.requiresParentalConsent ? 'Required' : 'Not Required'}</p>
          </div>
        </div>
        {/* Tab Groups Preview */}
        {schema.tabGroups && schema.tabGroups.length > 0 && (
          <Tabs defaultValue={schema.tabGroups[0]?.id} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${schema.tabGroups.length}, 1fr)` }}>
              {schema.tabGroups.map((tabGroup: any) => (
                <TabsTrigger key={tabGroup.id} value={tabGroup.id}>
                  {tabGroup.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {schema.tabGroups.map((tabGroup: any) => (
              <TabsContent key={tabGroup.id} value={tabGroup.id} className="mt-4">
                <div 
                  className="grid gap-4" 
                  style={{ gridTemplateColumns: `repeat(${tabGroup.columns || 2}, 1fr)` }}
                >
                  {Array.from({ length: tabGroup.columns || 2 }, (_, colIndex) => (
                    <div key={colIndex + 1} className="space-y-3">
                      <h5 className="font-medium text-sm text-muted-foreground">Column {colIndex + 1}</h5>
                      {groupedElements[tabGroup.id]?.[colIndex + 1]?.map((element: any) => (
                        <div key={element.id} className="border rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">#{element.position}</Badge>
                              {element.label}
                              {element.required && <span className="text-red-500">*</span>}
                            </Label>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">{element.type}</Badge>
                              {element.schemaField && (
                                <Badge variant="outline" className="text-xs bg-blue-50">
                                  {element.schemaField}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="h-8 bg-gray-100 border rounded px-3 flex items-center text-sm text-muted-foreground">
                            {element.config?.placeholder || `${element.type} field`}
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded">
                          <p className="text-xs">No elements in this column</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
        {(!schema.tabGroups || schema.tabGroups.length === 0) && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded">
            <p>No tab groups configured</p>
          </div>
        )}
      </div>
    </div>
  );
}
export default function ModuleEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('id');
  const [activeTab, setActiveTab] = useState('visual');
  const [jsonSchema, setJsonSchema] = useState('');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [showComponents, setShowComponents] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const { toast } = useToast();
  // Initialize schema when component mounts
  useEffect(() => {
    // TODO: If moduleId exists, fetch the module data
    // For now, use default schema
    const schemaToUse = DEFAULT_MODULE_SCHEMA;
    setJsonSchema(JSON.stringify(schemaToUse, null, 2));
    setModuleName(moduleId ? `Edit Module ${moduleId}` : 'Create New Module');
    setSchemaError(null);
  }, [moduleId]);
  // Memoize parsed schema to prevent infinite re-renders
  const parsedSchema = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonSchema);
      setSchemaError(null);
      return parsed;
    } catch (error) {
      setSchemaError(error instanceof Error ? error.message : 'Invalid JSON');
      return null;
    }
  }, [jsonSchema]);
  const handleSave = () => {
    const parsed = parsedSchema;
    if (parsed) {
      toast({
        title: "Module Saved",
        description: `${parsed.name || 'Module'} has been saved successfully`,
      });
      // TODO: Implement actual save logic
      router.push('/admin/modules');
    }
  };
  const handleBack = () => {
    router.push('/admin/modules');
  };
  const handleAddComponent = (componentType: string) => {
    if (!parsedSchema) return;
    if (componentType === 'tab-group') {
      const newTabGroup = {
        id: `tab_${Date.now()}`,
        name: `Tab ${(parsedSchema.tabGroups?.length || 0) + 1}`,
        columns: 2,
        order: (parsedSchema.tabGroups?.length || 0) + 1
      };
      const updatedSchema = {
        ...parsedSchema,
        tabGroups: [...(parsedSchema.tabGroups || []), newTabGroup]
      };
      setJsonSchema(JSON.stringify(updatedSchema, null, 2));
      toast({
        title: "Tab Group Added",
        description: "New tab group has been added to the form",
      });
    } else {
      const newElement = {
        id: `${componentType}_${Date.now()}`,
        type: componentType,
        label: `New ${componentType.charAt(0).toUpperCase() + componentType.slice(1)}`,
        required: false,
        order: (parsedSchema.elements?.length || 0) + 1,
        tabGroup: parsedSchema.tabGroups?.[0]?.id || "main_tab",
        column: 1,
        position: (parsedSchema.elements?.length || 0) + 1,
        schemaField: null,
        config: {}
      };
      const updatedSchema = {
        ...parsedSchema,
        elements: [...(parsedSchema.elements || []), newElement]
      };
      setJsonSchema(JSON.stringify(updatedSchema, null, 2));
      toast({
        title: "Component Added",
        description: `${componentType} component has been added to the form`,
      });
    }
  };
  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-gray-50`}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Modules
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{moduleName}</h1>
              <p className="text-muted-foreground">
                Design and configure your platform module with tab groups and schema integration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-2"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Module
            </Button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className={`flex ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[calc(100vh-80px)]'}`}>
        {/* Component Sidebar */}
        <div className={`transition-all duration-200 ${showComponents ? 'w-80' : 'w-0'} overflow-hidden bg-white border-r`}>
          <Card className="h-full rounded-none border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Components
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComponents(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-140px)]">
                <div className="p-3">
                  <ComponentSidebar onAddComponent={handleAddComponent} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        {/* Main Editor Area */}
        <div className="flex-1 bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b px-6 py-3">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="visual" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Visual Editor
                  </TabsTrigger>
                  <TabsTrigger value="json" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    JSON Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
                {!showComponents && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowComponents(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Show Components
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 p-6 overflow-hidden">
              <TabsContent value="visual" className="h-full m-0">
                <ScrollArea className="h-full">
                  <VisualModuleEditor 
                    schema={parsedSchema} 
                    onChange={(newSchema) => setJsonSchema(JSON.stringify(newSchema, null, 2))}
                  />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="json" className="h-full m-0">
                <div className="h-full flex flex-col">
                  {schemaError && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-4">
                      <p className="text-red-600 text-sm">JSON Error: {schemaError}</p>
                    </div>
                  )}
                  <div className="flex-1 border rounded overflow-hidden">
                    <MonacoEditor
                      height="100%"
                      language="json"
                      theme="vs-dark"
                      value={jsonSchema}
                      onChange={(value) => setJsonSchema(value || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        formatOnPaste: true,
                        formatOnType: true,
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        folding: true,
                        lineNumbers: 'on',
                        renderWhitespace: 'selection',
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible'
                        }
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="preview" className="h-full m-0">
                <ScrollArea className="h-full">
                  <ModulePreview schema={parsedSchema} />
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 