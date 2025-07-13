'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  Code, 
  Save, 
  Download, 
  Upload, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Copy,
  Sparkles,
  Plus,
  Trash2,
  Settings,
  FileText,
  Palette
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
      <div className="flex items-center space-x-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading editor...</span>
      </div>
    </div>
  ),
});

interface VisualJsonEditorProps {
  schema: any;
  uiSchema?: any;
  formData: any;
  onChange: (data: any) => void;
  onValidate?: (errors: any[]) => void;
  templates?: { [key: string]: any };
  readOnly?: boolean;
  title?: string;
  description?: string;
}

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'number' | 'email' | 'url';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  description?: string;
}

interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export default function VisualJsonEditor({
  schema,
  uiSchema,
  formData,
  onChange,
  onValidate,
  templates = {},
  readOnly = false,
  title = "Visual JSON Editor",
  description = "Configure your form using the visual editor or JSON code"
}: VisualJsonEditorProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'preview'>('visual');
  const [jsonCode, setJsonCode] = useState(JSON.stringify(formData, null, 2));
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [sections, setSections] = useState<FormSection[]>([]);

  // Initialize sections from formData
  useEffect(() => {
    if (formData && typeof formData === 'object') {
      const initialSections: FormSection[] = [];

      // Convert formData to sections format
      if (formData.sections && Array.isArray(formData.sections)) {
        formData.sections.forEach((section: any, index: number) => {
          const sectionFields: FormField[] = [];

          if (section.fields && Array.isArray(section.fields)) {
            section.fields.forEach((field: any, fieldIndex: number) => {
              sectionFields.push({
                id: field.id || `field_${index}_${fieldIndex}`,
                type: field.type || 'text',
                label: field.label || `Field ${fieldIndex + 1}`,
                placeholder: field.placeholder || '',
                required: field.required || false,
                options: field.options || [],
                description: field.description || ''
              });
            });
          }

          initialSections.push({
            id: section.id || `section_${index}`,
            title: section.title || `Section ${index + 1}`,
            description: section.description || '',
            fields: sectionFields
          });
        });
      } else {
        // Create a default section if no sections exist
        initialSections.push({
          id: 'section_1',
          title: 'General Information',
          description: 'Basic form fields',
          fields: [
            {
              id: 'field_1',
              type: 'text',
              label: 'Full Name',
              placeholder: 'Enter your full name',
              required: true
            }
          ]
        });
      }

      setSections(initialSections);
    }
  }, [formData]);

  // Update formData when sections change
  const updateFormData = useCallback((newSections: FormSection[]) => {
    const newFormData = {
      ...formData,
      sections: newSections.map(section => ({
        id: section.id,
        title: section.title,
        description: section.description,
        fields: section.fields.map(field => ({
          id: field.id,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          options: field.options,
          description: field.description
        }))
      }))
    };

    onChange(newFormData);
    setJsonCode(JSON.stringify(newFormData, null, 2));
  }, [formData, onChange]);

  // Add new section
  const addSection = () => {
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      description: '',
      fields: []
    };
    const newSections = [...sections, newSection];
    setSections(newSections);
    updateFormData(newSections);
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    const newSections = sections.filter(s => s.id !== sectionId);
    setSections(newSections);
    updateFormData(newSections);
  };

  // Update section
  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    const newSections = sections.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    );
    setSections(newSections);
    updateFormData(newSections);
  };

  // Add field to section
  const addField = (sectionId: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      placeholder: '',
      required: false
    };

    const newSections = sections.map(section => 
      section.id === sectionId 
        ? { ...section, fields: [...section.fields, newField] }
        : section
    );
    setSections(newSections);
    updateFormData(newSections);
  };

  // Remove field from section
  const removeField = (sectionId: string, fieldId: string) => {
    const newSections = sections.map(section => 
      section.id === sectionId 
        ? { ...section, fields: section.fields.filter(f => f.id !== fieldId) }
        : section
    );
    setSections(newSections);
    updateFormData(newSections);
  };

  // Update field
  const updateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    const newSections = sections.map(section => 
      section.id === sectionId 
        ? { 
            ...section, 
            fields: section.fields.map(field => 
              field.id === fieldId ? { ...field, ...updates } : field
            )
          }
        : section
    );
    setSections(newSections);
    updateFormData(newSections);
  };

  // Handle JSON code changes
  const handleJsonChange = (value: string | undefined) => {
    if (!value) return;

    setJsonCode(value);
    try {
      const parsed = JSON.parse(value);
      onChange(parsed);
      setValidationErrors([]);
      setIsValid(true);
    } catch (error) {
      setValidationErrors([{ message: 'Invalid JSON format' }]);
      setIsValid(false);
    }
  };

  // Export configuration
  const handleExport = () => {
    const blob = new Blob([jsonCode], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'form-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration exported",
      description: "Form configuration has been downloaded as JSON file.",
    });
  };

  // Field type options
  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Select Dropdown' },
    { value: 'boolean', label: 'Checkbox' },
    { value: 'number', label: 'Number Input' },
    { value: 'email', label: 'Email Input' },
    { value: 'url', label: 'URL Input' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isValid ? "default" : "destructive"} className="animate-pulse">
                {isValid ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Invalid
                  </>
                )}
              </Badge>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="hover:bg-blue-50 hover:border-blue-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="visual" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Visual Editor</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>JSON Code</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </TabsTrigger>
        </TabsList>

        {/* Visual Editor Tab */}
        <TabsContent value="visual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Builder */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Form Sections
                </h3>
                <Button onClick={addSection} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>

              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {sections.map((section, sectionIndex) => (
                    <Card key={section.id} className="border-2 hover:border-blue-200 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              className="font-semibold text-base"
                              placeholder="Section title"
                            />
                            <Input
                              value={section.description}
                              onChange={(e) => updateSection(section.id, { description: e.target.value })}
                              className="text-sm"
                              placeholder="Section description (optional)"
                            />
                          </div>
                          <Button
                            onClick={() => removeSection(section.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {section.fields.map((field, fieldIndex) => (
                          <Card key={field.id} className="bg-muted/30 border border-muted">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Field {fieldIndex + 1}</Label>
                                <Button
                                  onClick={() => removeField(section.id, field.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Field Type</Label>
                                  <Select
                                    value={field.type}
                                    onValueChange={(value) => updateField(section.id, field.id, { type: value as any })}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {fieldTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={field.required}
                                    onCheckedChange={(checked) => updateField(section.id, field.id, { required: checked })}
                                  />
                                  <Label className="text-xs text-muted-foreground">Required</Label>
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs text-muted-foreground">Field Label</Label>
                                <Input
                                  value={field.label}
                                  onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                                  className="h-8"
                                  placeholder="Enter field label"
                                />
                              </div>

                              <div>
                                <Label className="text-xs text-muted-foreground">Placeholder</Label>
                                <Input
                                  value={field.placeholder}
                                  onChange={(e) => updateField(section.id, field.id, { placeholder: e.target.value })}
                                  className="h-8"
                                  placeholder="Enter placeholder text"
                                />
                              </div>

                              {field.type === 'select' && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Options (one per line)</Label>
                                  <Textarea
                                    value={field.options?.join('\n') || ''}
                                    onChange={(e) => updateField(section.id, field.id, { 
                                      options: e.target.value.split('\n').filter(opt => opt.trim()) 
                                    })}
                                    className="h-20 text-xs"
                                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                                  />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}

                        <Button
                          onClick={() => addField(section.id)}
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Field
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Live Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Live Preview
              </h3>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">Form Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-6">
                      {sections.map((section) => (
                        <div key={section.id} className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-sm">{section.title}</h4>
                            {section.description && (
                              <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                            )}
                          </div>

                          <div className="space-y-3">
                            {section.fields.map((field) => (
                              <div key={field.id} className="space-y-1">
                                <Label className="text-xs font-medium">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>

                                {field.type === 'textarea' ? (
                                  <Textarea
                                    placeholder={field.placeholder}
                                    className="h-16 text-xs"
                                    disabled
                                  />
                                ) : field.type === 'select' ? (
                                  <Select disabled>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder={field.placeholder || 'Select option'} />
                                    </SelectTrigger>
                                  </Select>
                                ) : field.type === 'boolean' ? (
                                  <div className="flex items-center space-x-2">
                                    <Switch disabled />
                                    <Label className="text-xs">{field.placeholder || field.label}</Label>
                                  </div>
                                ) : (
                                  <Input
                                    type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                                    placeholder={field.placeholder}
                                    className="h-8 text-xs"
                                    disabled
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          {section !== sections[sections.length - 1] && (
                            <Separator className="my-4" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* JSON Code Tab */}
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                JSON Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <MonacoEditor
                  height="500px"
                  language="json"
                  value={jsonCode}
                  onChange={handleJsonChange}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    automaticLayout: true,
                    theme: 'vs-light',
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>

              {validationErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Validation Errors:</span>
                  </div>
                  <ul className="mt-2 text-sm text-red-600 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Form Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto space-y-8">
                {sections.map((section) => (
                  <div key={section.id} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold">{section.title}</h3>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {section.fields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label className="text-sm font-medium">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>

                          {field.type === 'textarea' ? (
                            <Textarea
                              placeholder={field.placeholder}
                              className="resize-none"
                            />
                          ) : field.type === 'select' ? (
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder={field.placeholder || 'Select option'} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option, index) => (
                                  <SelectItem key={index} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === 'boolean' ? (
                            <div className="flex items-center space-x-2">
                              <Switch />
                              <Label className="text-sm">{field.placeholder || field.label}</Label>
                            </div>
                          ) : (
                            <Input
                              type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                              placeholder={field.placeholder}
                            />
                          )}

                          {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {section !== sections[sections.length - 1] && (
                      <Separator className="my-8" />
                    )}
                  </div>
                ))}

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button variant="outline">Cancel</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">Save Configuration</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 