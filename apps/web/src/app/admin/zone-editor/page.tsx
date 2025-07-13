/**
 * Zone Editor Admin Page
 * 
 * Simplified interface that matches Form Builder exactly.
 * Uses UnifiedEditor for consistent UI across all editors.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Download,
  Upload,
  Monitor,
  Tablet,
  Smartphone
} from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';

// Zone Editor Components
import { UnifiedEditor } from '@/components/shared/UnifiedEditor';

/**
 * Zone Editor Page Component - Simplified to match Form Builder
 */
export default function ZoneEditorPage() {
  const { toast } = useToast();
  const { trackClick, trackFormSubmission } = useAuditTracking();
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [unifiedZoneData, setUnifiedZoneData] = useState({
    title: 'Untitled Zone',
    description: 'Zone description',
    elements: [] as any[],
    settings: {}
  });

  // Track page access
  usePageTracking('/admin/zone-editor', { description: 'Zone Editor Access' });

  const handleZoneDataChange = (newZoneData: any) => {
    setUnifiedZoneData(newZoneData);
    trackFormSubmission('zone_structure_update', true, {
      elementsCount: newZoneData.elements?.length || 0
    });
    
    browserLogger.formSubmit('Zone structure updated', {
      elements: newZoneData.elements?.length || 0
    });
  };

  const handleSaveZone = async () => {
    try {
      trackFormSubmission('zone_save_attempt', true, {
        elementsCount: unifiedZoneData.elements?.length || 0,
        hasTitle: !!unifiedZoneData.title,
        hasDescription: !!unifiedZoneData.description
      });
      
      browserLogger.formSubmit('Zone save initiated', {
        zoneTitle: unifiedZoneData.title,
        elementsCount: unifiedZoneData.elements?.length || 0
      });

      // Save to zones API
      const response = await fetch('/api/v1/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: unifiedZoneData.title,
          description: unifiedZoneData.description,
          elements: unifiedZoneData.elements,
          settings: unifiedZoneData.settings || {}
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save zone');
      }

      const result = await response.json();
      
      toast({
        title: 'Zone Saved Successfully',
        description: `Zone "${unifiedZoneData.title}" has been saved to storage.`,
        variant: 'default'
      });

      browserLogger.formSubmit('Zone saved to storage', {
        zoneId: result.data?.id,
        zoneTitle: unifiedZoneData.title
      });
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'There was an error saving your zone. Please try again.',
        variant: 'destructive'
      });
      
      browserLogger.formSubmit('Zone save failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        zoneTitle: unifiedZoneData.title
      });
    }
  };

  const handleExportZone = () => {
    const dataStr = JSON.stringify(unifiedZoneData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zone_${unifiedZoneData.title?.replace(/\s+/g, '_').toLowerCase() || 'untitled'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    trackClick('zone_exported', { zoneTitle: unifiedZoneData.title });
    browserLogger.userAction('Zone exported', 'zone-editor', { zoneTitle: unifiedZoneData.title });
    
    toast({
      title: 'Zone Exported',
      description: 'Zone configuration downloaded as JSON file.',
      variant: 'default'
    });
  };

  const handleImportZone = () => {
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
            setUnifiedZoneData(imported);
            toast({
              title: 'Zone Imported',
              description: 'Zone configuration loaded successfully.',
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
      {/* Top Header Bar - Identical to Form Builder */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Zone Editor</h1>
            <div className="text-sm text-gray-500">
              {unifiedZoneData.elements?.length || 0} elements
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
            <Button variant="outline" size="sm" onClick={handleImportZone}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportZone}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={handleSaveZone}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Identical to Form Builder */}
      <UnifiedEditor
        mode="zone"
        data={unifiedZoneData}
        onChange={handleZoneDataChange}
        schemas={[]} // Zone editor doesn't use schemas
        optionSets={[]} // Zone editor doesn't use option sets  
        deviceView={deviceView}
        isLoading={false}
      />
    </div>
  );
} 