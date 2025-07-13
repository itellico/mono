'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Save,
  Download,
  Upload,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { UnifiedEditor } from '@/components/shared/UnifiedEditor';
import { FormComponentsPalette } from '@/components/form-builder/FormComponentsPalette';
import { FormCanvas } from '@/components/form-builder/FormCanvas';
import { PropertiesPanel } from '@/components/form-builder/PropertiesPanel';
import { LivePreview } from '@/components/form-builder/LivePreview';

/**
 * Enhanced Form Builder Component - Elementor Style
 * 
 * Complete drag-and-drop form designer with left component palette,
 * central canvas, and right properties panel. No blue background.
 */

interface Schema {
  id: string;
  name: string;
  type: string;
  description?: string;
  schema?: any;
}

interface OptionSet {
  id: string;
  slug: string;
  label: string;
  values: Array<{ label: string; value: string; order: number }>;
}

export default function FormBuilderPage() {
  const { toast } = useToast();
  const { trackClick, trackFormSubmission } = useAuditTracking();
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [formData, setFormData] = useState({
    title: 'New Form',
    description: 'Create your form using the visual editor',
    elements: []
  });

  // Track page access
  usePageTracking('/admin/form-builder', { description: 'Elementor Form Builder Access' });

  // Fetch available schemas
  const { data: schemas, isLoading: schemasLoading } = useQuery({
    queryKey: ['available-schemas'],
    queryFn: async (): Promise<Schema[]> => {
      const response = await fetch('/api/v1/model-schemas');
      if (!response.ok) {
        throw new Error('Failed to fetch schemas');
      }
      const result = await response.json();
      return result.data || [];
    }
  });

  // Fetch available option sets
  const { data: optionSets, isLoading: optionSetsLoading } = useQuery({
    queryKey: ['option-sets'],
    queryFn: async (): Promise<OptionSet[]> => {
      const response = await fetch('/api/v1/option-sets');
      if (!response.ok) {
        throw new Error('Failed to fetch option sets');
      }
      const result = await response.json();
      return result.data || [];
    }
  });

  const handleFormDataChange = (newFormData: any) => {
    setFormData(newFormData);
    trackFormSubmission('form_structure_update', true, {
      elementsCount: newFormData.elements?.length || 0
    });
    
    browserLogger.formSubmit('Form structure updated', {
      elements: newFormData.elements?.length || 0
    });
  };

  const handleSaveForm = async () => {
    try {
      trackFormSubmission('form_save_attempt', true, {
        elementsCount: formData.elements?.length || 0,
        hasTitle: !!formData.title,
        hasDescription: !!formData.description
      });
      
      browserLogger.formSubmit('Form save initiated', {
        formTitle: formData.title,
        elementsCount: formData.elements?.length || 0
      });

      // Save to database via API
      const response = await fetch('/api/v1/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.title,
          description: formData.description,
          structure: formData.elements,
          status: 'draft',
          templateType: 'profile_builder'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save form');
      }

      const result = await response.json();
      
      toast({
        title: 'Form Saved Successfully',
        description: `Form "${formData.title}" has been saved to the database.`,
        variant: 'default'
      });

      browserLogger.formSubmit('Form saved to database', {
        formId: result.data?.id,
        formTitle: formData.title
      });
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'There was an error saving your form. Please try again.',
        variant: 'destructive'
      });
      
      browserLogger.formSubmit('Form save failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        formTitle: formData.title
      });
    }
  };

  const handleExportForm = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_${formData.title?.replace(/\s+/g, '_').toLowerCase() || 'untitled'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    trackClick('form_exported', { formTitle: formData.title });
    browserLogger.userAction('Form exported', 'form-builder', { formTitle: formData.title });
    
    toast({
      title: 'Form Exported',
      description: 'Form configuration downloaded as JSON file.',
      variant: 'default'
    });
  };

  const handleImportForm = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            setFormData(imported);
            toast({
              title: 'Form Imported',
              description: 'Form configuration loaded successfully.',
              variant: 'default'
            });
          } catch (error) {
            toast({
              title: 'Import Error',
              description: 'Invalid JSON file format.',
              variant: 'destructive'
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Form Builder</h1>
            <div className="text-sm text-gray-500">
              {formData.elements?.length || 0} elements
            </div>
          </div>

          {/* Center - Device toggles */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={deviceView === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDeviceView('desktop')}
              className="h-8 px-3"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceView === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDeviceView('tablet')}
              className="h-8 px-3"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceView === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDeviceView('mobile')}
              className="h-8 px-3"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleImportForm}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportForm}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={handleSaveForm}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <UnifiedEditor
        mode="form"
        data={formData}
        onChange={handleFormDataChange}
        schemas={schemas || []}
        optionSets={optionSets || []}
        deviceView={deviceView}
        isLoading={schemasLoading || optionSetsLoading}
      />
    </div>
  );
} 