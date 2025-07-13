'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Edit3, GripVertical, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUpdateModelSchema } from '@/hooks/use-model-schemas';
import { useQuery } from '@tanstack/react-query';
import { generateFieldId } from '@/lib/utils/field-utils';
import type { ModelSchema, SchemaField, FieldType } from '@/lib/schemas/model-schemas';

// ============================
// 🏗️ MODEL SCHEMA FIELDS EDITOR
// ============================

interface OptionSet {
  id: number;
  slug: string;
  label: string;
  valueCount: number;
}

interface ModelSchemaFieldsEditorProps {
  schema: ModelSchema;
  onSchemaUpdate?: (updatedSchema: ModelSchema) => void;
}

// Fetch available option sets for schema building
const fetchOptionSetsForSchemas = async (): Promise<OptionSet[]> => {
  const response = await fetch('/api/v1/admin/option-sets/for-schemas');
  if (!response.ok) {
    throw new Error('Failed to fetch option sets');
  }
  const result = await response.json();
  return result.data || [];
};

export function ModelSchemaFieldsEditor({ schema, onSchemaUpdate }: ModelSchemaFieldsEditorProps) {
  const [fields, setFields] = useState<SchemaField[]>(schema.schema.fields);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  const updateModelSchema = useUpdateModelSchema();

  // Fetch option sets for enum/multiselect fields
  const { data: optionSets = [], isLoading: optionSetsLoading } = useQuery({
    queryKey: ['option-sets-for-schemas'],
    queryFn: fetchOptionSetsForSchemas });

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'string', label: 'Text (Short)' },
    { value: 'text', label: 'Text (Long)' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' },
    { value: 'phone', label: 'Phone' },
    { value: 'enum', label: 'Select (Single)' },
    { value: 'multiselect', label: 'Select (Multiple)' },
    { value: 'option_set', label: 'Option Set' },
    { value: 'file', label: 'File' },
    { value: 'image', label: 'Image' },
  ];

  const addNewField = () => {
    const newField: SchemaField = {
              id: generateFieldId(),
      name: `field_${fields.length + 1}`,
      label: { 'en-US': `Field ${fields.length + 1}` },
      type: 'string',
      required: false };

    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    setEditingField(newField.id);
    setExpandedFields(new Set([...expandedFields, newField.id]));
    setHasChanges(true);
  };

  const updateField = (fieldId: string, updates: Partial<SchemaField>) => {
    const updatedFields = fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    );
    setFields(updatedFields);
    setHasChanges(true);
  };

  const removeField = (fieldId: string) => {
    const updatedFields = fields.filter(field => field.id !== fieldId);
    setFields(updatedFields);
    setExpandedFields(new Set([...expandedFields].filter(id => id !== fieldId)));
    setHasChanges(true);
  };

  const toggleFieldExpansion = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  const saveChanges = async () => {
    try {
      const updatedSchema = await updateModelSchema.mutateAsync({
        id: schema.id,
        data: {
          schema: {
            ...schema.schema,
            fields,
            version: schema.schema.version, // Keep existing version for now
          } } });

      if (onSchemaUpdate) {
        onSchemaUpdate(updatedSchema);
      }

      setHasChanges(false);
      setEditingField(null);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  const getFieldTypeIcon = (type: FieldType) => {
    const icons: Record<FieldType, string> = {
      string: '📝',
      text: '📄',
      number: '🔢',
      boolean: '✅',
      date: '📅',
      email: '📧',
      url: '🔗',
      phone: '📞',
      enum: '📋',
      multiselect: '☑️',
      option_set: '📋',
      file: '📎',
      image: '🖼️' };
    return icons[type] || '📝';
  };

  return (
    <div className="space-y-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Schema Fields</h4>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Button
              size="sm"
              onClick={saveChanges}
              disabled={updateModelSchema.isPending}
              className="h-7 px-2 text-xs"
            >
              <Save className="h-3 w-3 mr-1" />
              {updateModelSchema.isPending ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={addNewField}
            className="h-7 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Field
          </Button>
        </div>
      </div>

      {/* Fields List */}
      <div className="space-y-2">
        {fields.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No fields defined yet. Click &quot;Add Field&quot; to get started.
          </div>
        ) : (
          fields.map((field, index) => (
            <Collapsible
              key={field.id}
              open={expandedFields.has(field.id)}
              onOpenChange={() => toggleFieldExpansion(field.id)}
            >
              <div className="border border-gray-200 rounded-md">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="text-lg">{getFieldTypeIcon(field.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {field.label['en-US'] || field.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {field.name} • {fieldTypes.find(t => t.value === field.type)?.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {field.required && (
                        <Badge variant="secondary" className="h-5 text-xs">Required</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-gray-200 p-3 space-y-3 bg-gray-50">
                    {/* Field Name */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Field Name</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          className="h-8 text-xs"
                          placeholder="field_name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Display Label</Label>
                        <Input
                          value={field.label['en-US'] || ''}
                          onChange={(e) => updateField(field.id, { 
                            label: { ...field.label, 'en-US': e.target.value }
                          })}
                          className="h-8 text-xs"
                          placeholder="Display Label"
                        />
                      </div>
                    </div>

                    {/* Field Type and Required */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={field.type}
                          onValueChange={(value: FieldType) => updateField(field.id, { type: value })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-4">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                        />
                        <Label className="text-xs">Required</Label>
                      </div>
                    </div>

                    {/* Validation Rules */}
                    {(field.type === 'string' || field.type === 'text') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Min Length</Label>
                          <Input
                            type="number"
                            value={field.validation?.minLength || ''}
                            onChange={(e) => updateField(field.id, {
                              validation: {
                                ...field.validation,
                                minLength: e.target.value ? parseInt(e.target.value) : undefined
                              }
                            })}
                            className="h-8 text-xs"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Length</Label>
                          <Input
                            type="number"
                            value={field.validation?.maxLength || ''}
                            onChange={(e) => updateField(field.id, {
                              validation: {
                                ...field.validation,
                                maxLength: e.target.value ? parseInt(e.target.value) : undefined
                              }
                            })}
                            className="h-8 text-xs"
                            placeholder="255"
                          />
                        </div>
                      </div>
                    )}

                    {field.type === 'number' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Min Value</Label>
                          <Input
                            type="number"
                            value={field.validation?.min || ''}
                            onChange={(e) => updateField(field.id, {
                              validation: {
                                ...field.validation,
                                min: e.target.value ? parseFloat(e.target.value) : undefined
                              }
                            })}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Value</Label>
                          <Input
                            type="number"
                            value={field.validation?.max || ''}
                            onChange={(e) => updateField(field.id, {
                              validation: {
                                ...field.validation,
                                max: e.target.value ? parseFloat(e.target.value) : undefined
                              }
                            })}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Option Set Selection for enum, multiselect, and option_set types */}
                    {(field.type === 'enum' || field.type === 'multiselect' || field.type === 'option_set') && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Option Set</Label>
                            <Select
                              value={field.optionSetId?.toString() || 'none'}
                              onValueChange={(value) => updateField(field.id, { 
                                optionSetId: value === 'none' ? undefined : parseInt(value) 
                              })}
                              disabled={optionSetsLoading}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder={optionSetsLoading ? "Loading..." : "Select option set"} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {optionSets.map((optionSet) => (
                                  <SelectItem key={optionSet.id} value={optionSet.id.toString()}>
                                    {optionSet.label} ({optionSet.valueCount} values)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {(field.type === 'multiselect' || field.type === 'option_set') && (
                            <div className="flex items-center space-x-2 pt-4">
                              <Switch
                                checked={field.allowMultiple || false}
                                onCheckedChange={(checked) => updateField(field.id, { allowMultiple: checked })}
                              />
                              <Label className="text-xs">Allow Multiple</Label>
                            </div>
                          )}
                        </div>

                        {field.optionSetId && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                            <strong>Selected:</strong> {optionSets.find(os => os.id === field.optionSetId)?.label || 'Unknown'} 
                            <span className="ml-2 text-blue-500">
                              ({optionSets.find(os => os.id === field.optionSetId)?.valueCount || 0} options available)
                            </span>
                          </div>
                        )}

                        {!field.optionSetId && (
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                            Please select an option set to define the available choices for this field.
                            <br />
                            <a href="/admin/option-sets" target="_blank" className="underline hover:no-underline">
                              Manage option sets →
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
        )}
      </div>

      {hasChanges && (
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
          You have unsaved changes. Click &quot;Save&quot; to apply them.
        </div>
      )}
    </div>
  );
} 