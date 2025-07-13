'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { 
  Settings, 
  Palette, 
  Layout, 
  Type, 
  Image, 
  Link,
  Save,
  RotateCcw,
  Copy,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CanvasComponent } from './Canvas';

/**
 * Properties Panel Component - Dynamic property configuration for zone components
 * 
 * Features:
 * - Dynamic property forms based on component type
 * - Real-time property updates
 * - Component-specific configurations
 * - Style and layout controls
 * - Audit tracking for all changes
 * 
 * @component
 * @example
 * ```tsx
 * <PropertiesPanel
 *   selectedComponent={selectedComponent}
 *   onComponentUpdate={handleComponentUpdate}
 *   onComponentDelete={handleComponentDelete}
 * />
 * ```
 */

export interface PropertiesPanelProps {
  /**
   * Currently selected component to configure
   */
  selectedComponent?: CanvasComponent | null;
  
  /**
   * Callback when component properties are updated
   */
  onComponentUpdate: (componentId: string, updates: Partial<CanvasComponent>) => void;
  
  /**
   * Callback when component is deleted
   */
  onComponentDelete?: (componentId: string) => void;
  
  /**
   * Callback when component is duplicated
   */
  onComponentDuplicate?: (componentId: string) => void;
  
  /**
   * Whether the panel is in read-only mode
   */
  readOnly?: boolean;
}

interface PropertyField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'color' | 'image';
  description?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedComponent,
  onComponentUpdate,
  onComponentDelete,
  onComponentDuplicate,
  readOnly = false
}) => {
  const { trackClick, trackFormSubmission } = useAuditTracking();
  const [activeTab, setActiveTab] = useState<string>('properties');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  /**
   * Get property configuration for the selected component type
   */
  const getComponentProperties = useCallback((componentType: string): PropertyField[] => {
    const commonProperties: PropertyField[] = [
      {
        key: 'name',
        label: 'Component Name',
        type: 'text',
        description: 'Display name for this component',
        validation: { required: true }
      },
      {
        key: 'isVisible',
        label: 'Visible',
        type: 'boolean',
        description: 'Whether this component is visible on the page',
        defaultValue: true
      }
    ];

    const typeSpecificProperties: Record<string, PropertyField[]> = {
      AdBanner: [
        {
          key: 'title',
          label: 'Banner Title',
          type: 'text',
          description: 'Main heading text for the banner',
          validation: { required: true }
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          description: 'Supporting text for the banner'
        },
        {
          key: 'buttonText',
          label: 'Button Text',
          type: 'text',
          description: 'Call-to-action button text'
        },
        {
          key: 'buttonUrl',
          label: 'Button URL',
          type: 'text',
          description: 'Link destination for the button'
        },
        {
          key: 'backgroundColor',
          label: 'Background Color',
          type: 'color',
          description: 'Banner background color',
          defaultValue: '#f3f4f6'
        },
        {
          key: 'textColor',
          label: 'Text Color',
          type: 'color',
          description: 'Text color for the banner',
          defaultValue: '#111827'
        }
      ],
      HeroSection: [
        {
          key: 'title',
          label: 'Hero Title',
          type: 'text',
          description: 'Main hero headline',
          validation: { required: true }
        },
        {
          key: 'subtitle',
          label: 'Subtitle',
          type: 'textarea',
          description: 'Supporting text under the main title'
        },
        {
          key: 'backgroundImage',
          label: 'Background Image',
          type: 'image',
          description: 'Hero background image URL'
        },
        {
          key: 'primaryButtonText',
          label: 'Primary Button',
          type: 'text',
          description: 'Primary call-to-action text'
        },
        {
          key: 'primaryButtonUrl',
          label: 'Primary Button URL',
          type: 'text',
          description: 'Primary button link destination'
        },
        {
          key: 'secondaryButtonText',
          label: 'Secondary Button',
          type: 'text',
          description: 'Secondary call-to-action text'
        },
        {
          key: 'secondaryButtonUrl',
          label: 'Secondary Button URL',
          type: 'text',
          description: 'Secondary button link destination'
        },
        {
          key: 'alignment',
          label: 'Content Alignment',
          type: 'select',
          description: 'How to align the hero content',
          options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' }
          ],
          defaultValue: 'center'
        },
        {
          key: 'height',
          label: 'Section Height',
          type: 'select',
          description: 'Height of the hero section',
          options: [
            { value: 'small', label: 'Small (400px)' },
            { value: 'medium', label: 'Medium (600px)' },
            { value: 'large', label: 'Large (800px)' },
            { value: 'fullscreen', label: 'Full Screen' }
          ],
          defaultValue: 'large'
        }
      ],
      CallToAction: [
        {
          key: 'title',
          label: 'CTA Title',
          type: 'text',
          description: 'Main call-to-action heading',
          validation: { required: true }
        },
        {
          key: 'description',
          label: 'Description',
          type: 'textarea',
          description: 'Supporting text for the CTA'
        },
        {
          key: 'buttonText',
          label: 'Button Text',
          type: 'text',
          description: 'Primary action button text',
          validation: { required: true }
        },
        {
          key: 'buttonUrl',
          label: 'Button URL',
          type: 'text',
          description: 'Button link destination',
          validation: { required: true }
        },
        {
          key: 'style',
          label: 'CTA Style',
          type: 'select',
          description: 'Visual style of the CTA component',
          options: [
            { value: 'card', label: 'Card Style' },
            { value: 'banner', label: 'Banner Style' },
            { value: 'minimal', label: 'Minimal Style' }
          ],
          defaultValue: 'card'
        },
        {
          key: 'urgency',
          label: 'Urgency Message',
          type: 'text',
          description: 'Optional urgency text (e.g., "Limited time offer")'
        },
        {
          key: 'showSecondaryButton',
          label: 'Show Secondary Button',
          type: 'boolean',
          description: 'Whether to show a secondary action button',
          defaultValue: false
        },
        {
          key: 'secondaryButtonText',
          label: 'Secondary Button Text',
          type: 'text',
          description: 'Secondary action button text'
        },
        {
          key: 'secondaryButtonUrl',
          label: 'Secondary Button URL',
          type: 'text',
          description: 'Secondary button link destination'
        }
      ]
    };

    return [...commonProperties, ...(typeSpecificProperties[componentType] || [])];
  }, []);

  /**
   * Handle property value changes
   */
  const handlePropertyChange = useCallback((key: string, value: any) => {
    if (!selectedComponent || readOnly) return;

    const updatedProps = {
      ...selectedComponent.props,
      [key]: value
    };

    // Special handling for component-level properties
    if (key === 'name' || key === 'isVisible') {
      onComponentUpdate(selectedComponent.id, { [key]: value });
    } else {
      onComponentUpdate(selectedComponent.id, { props: updatedProps });
    }

    setHasUnsavedChanges(true);

    trackClick('property_changed', {
      componentId: selectedComponent.id,
      componentType: selectedComponent.type,
      property: key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    });

    browserLogger.userAction('Component property changed', 'properties-panel', {
      componentId: selectedComponent.id,
      property: key,
      newValue: value
    });
  }, [selectedComponent, onComponentUpdate, readOnly, trackClick]);

  /**
   * Handle component actions
   */
  const handleComponentAction = useCallback((action: string) => {
    if (!selectedComponent) return;

    trackClick(`properties_panel_${action}`, {
      componentId: selectedComponent.id,
      componentType: selectedComponent.type
    });

    switch (action) {
      case 'delete':
        if (onComponentDelete) {
          onComponentDelete(selectedComponent.id);
          browserLogger.userAction('Component deleted from properties panel', 'properties-panel', {
            componentId: selectedComponent.id
          });
        }
        break;
      case 'duplicate':
        if (onComponentDuplicate) {
          onComponentDuplicate(selectedComponent.id);
          browserLogger.userAction('Component duplicated from properties panel', 'properties-panel', {
            componentId: selectedComponent.id
          });
        }
        break;
      case 'toggle_visibility':
        handlePropertyChange('isVisible', !selectedComponent.isVisible);
        break;
    }
  }, [selectedComponent, trackClick, onComponentDelete, onComponentDuplicate, handlePropertyChange]);

  /**
   * Render property field based on type
   */
  const renderPropertyField = useCallback((field: PropertyField, value: any) => {
    const fieldId = `property-${field.key}`;

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={fieldId}
            value={value || ''}
            onChange={(e) => handlePropertyChange(field.key, e.target.value)}
            placeholder={field.description}
            disabled={readOnly}
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            value={value || ''}
            onChange={(e) => handlePropertyChange(field.key, e.target.value)}
            placeholder={field.description}
            disabled={readOnly}
            rows={3}
          />
        );

      case 'number':
        return (
          <Input
            id={fieldId}
            type="number"
            value={value || ''}
            onChange={(e) => handlePropertyChange(field.key, Number(e.target.value))}
            placeholder={field.description}
            disabled={readOnly}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'boolean':
        return (
          <Switch
            id={fieldId}
            checked={value || false}
            onCheckedChange={(checked) => handlePropertyChange(field.key, checked)}
            disabled={readOnly}
          />
        );

      case 'select':
        return (
          <Select
            value={value || field.defaultValue}
            onValueChange={(newValue) => handlePropertyChange(field.key, newValue)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.description} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'color':
        return (
          <div className="flex gap-2">
            <Input
              id={fieldId}
              type="color"
              value={value || field.defaultValue || '#000000'}
              onChange={(e) => handlePropertyChange(field.key, e.target.value)}
              disabled={readOnly}
              className="w-16 h-10 p-1 border rounded"
            />
            <Input
              value={value || field.defaultValue || '#000000'}
              onChange={(e) => handlePropertyChange(field.key, e.target.value)}
              placeholder="#000000"
              disabled={readOnly}
              className="flex-1"
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <Input
              id={fieldId}
              value={value || ''}
              onChange={(e) => handlePropertyChange(field.key, e.target.value)}
              placeholder="Enter image URL or upload..."
              disabled={readOnly}
            />
            <Button variant="outline" size="sm" disabled={readOnly}>
              <Image className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
          </div>
        );

      default:
        return (
          <Input
            id={fieldId}
            value={value || ''}
            onChange={(e) => handlePropertyChange(field.key, e.target.value)}
            placeholder={field.description}
            disabled={readOnly}
          />
        );
    }
  }, [handlePropertyChange, readOnly]);

  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6">
        <div className="text-center space-y-4">
          <Settings className="w-12 h-12 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Component Selected
            </h3>
            <p className="text-sm text-gray-600">
              Select a component from the canvas to edit its properties.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const properties = getComponentProperties(selectedComponent.type);

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
            <p className="text-sm text-gray-600">
              Configure the selected component
            </p>
          </div>
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="px-2 py-1 text-xs">
              Modified
            </Badge>
          )}
        </div>

        {/* Component Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2 py-1">
              {selectedComponent.type}
            </Badge>
            <span className="text-sm font-medium text-gray-900">
              {selectedComponent.name}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            ID: {selectedComponent.id}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleComponentAction('toggle_visibility')}
            disabled={readOnly}
            className="h-8 px-2"
          >
            {selectedComponent.isVisible ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleComponentAction('duplicate')}
            disabled={readOnly}
            className="h-8 px-2"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleComponentAction('delete')}
            disabled={readOnly}
            className="h-8 px-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Properties Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 m-2">
            <TabsTrigger value="properties">
              <Settings className="w-4 h-4 mr-2" />
              Props
            </TabsTrigger>
            <TabsTrigger value="style">
              <Palette className="w-4 h-4 mr-2" />
              Style
            </TabsTrigger>
            <TabsTrigger value="layout">
              <Layout className="w-4 h-4 mr-2" />
              Layout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="p-4 space-y-4">
            {properties.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`property-${field.key}`} className="text-sm font-medium">
                  {field.label}
                  {field.validation?.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                {renderPropertyField(field, 
                  field.key === 'name' || field.key === 'isVisible' 
                    ? selectedComponent[field.key as keyof CanvasComponent]
                    : selectedComponent.props[field.key]
                )}
                {field.description && (
                  <p className="text-xs text-gray-600">{field.description}</p>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="style" className="p-4 space-y-4">
            <div className="text-center py-8">
              <Palette className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Style controls coming soon
              </p>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="p-4 space-y-4">
            <div className="text-center py-8">
              <Layout className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Layout controls coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PropertiesPanel; 