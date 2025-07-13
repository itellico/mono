'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { 
  Plus, 
  Settings, 
  Move3D, 
  Trash2, 
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Canvas Component - Zone Editor Canvas for drag-and-drop component placement
 * 
 * Features:
 * - Drag-and-drop component placement
 * - Visual drop zones
 * - Component hierarchy visualization
 * - In-place component configuration
 * - Component actions (copy, delete, hide, lock)
 * 
 * @component
 * @example
 * ```tsx
 * <Canvas
 *   selectedComponent={selectedComponent}
 *   onComponentSelect={setSelectedComponent}
 *   onComponentUpdate={handleComponentUpdate}
 * />
 * ```
 */

export interface CanvasComponent {
  id: string;
  type: string;
  name: string;
  props: Record<string, any>;
  children?: CanvasComponent[];
  parentId?: string;
  isVisible: boolean;
  isLocked: boolean;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CanvasProps {
  selectedComponent?: CanvasComponent | null;
  onComponentSelect: (component: CanvasComponent | null) => void;
  onComponentUpdate: (componentId: string, updates: Partial<CanvasComponent>) => void;
  onComponentAdd: (component: Omit<CanvasComponent, 'id'>, dropZoneId?: string) => void;
  onComponentDelete: (componentId: string) => void;
  components: CanvasComponent[];
  isPreviewMode?: boolean;
}

interface DropZone {
  id: string;
  type: 'container' | 'section' | 'inline';
  accepts: string[];
  label: string;
  parentId?: string;
}

export const Canvas: React.FC<CanvasProps> = ({
  selectedComponent,
  onComponentSelect,
  onComponentUpdate,
  onComponentAdd,
  onComponentDelete,
  components,
  isPreviewMode = false
}) => {
  const { trackClick } = useAuditTracking();
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Drop zones configuration
  const dropZones: DropZone[] = [
    {
      id: 'header-zone',
      type: 'section',
      accepts: ['AdBanner', 'HeroSection', 'CallToAction'],
      label: 'Header Section'
    },
    {
      id: 'content-zone',
      type: 'container',
      accepts: ['AdBanner', 'HeroSection', 'CallToAction'],
      label: 'Main Content Area'
    },
    {
      id: 'sidebar-zone',
      type: 'section',
      accepts: ['AdBanner', 'CallToAction'],
      label: 'Sidebar'
    },
    {
      id: 'footer-zone',
      type: 'section',
      accepts: ['AdBanner', 'CallToAction'],
      label: 'Footer Section'
    }
  ];

  const handleComponentAction = useCallback((
    action: string, 
    component: CanvasComponent
  ) => {
    trackClick(`canvas_component_${action}`, {
      componentId: component.id,
      componentType: component.type,
      action
    });

    switch (action) {
      case 'select':
        onComponentSelect(component);
        break;
      case 'copy':
        browserLogger.userAction('Component copied', 'zone-editor', { componentId: component.id });
        break;
      case 'delete':
        browserLogger.userAction('Component deleted', 'zone-editor', { componentId: component.id });
        onComponentDelete(component.id);
        break;
      case 'toggle_visibility':
        onComponentUpdate(component.id, { isVisible: !component.isVisible });
        break;
      case 'toggle_lock':
        onComponentUpdate(component.id, { isLocked: !component.isLocked });
        break;
    }
  }, [trackClick, onComponentSelect, onComponentUpdate, onComponentDelete]);

  return (
    <div className="flex-1 h-full bg-gray-50 p-4 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Canvas</h2>
            <p className="text-sm text-gray-600">
              Drag components from the palette to build your zone layout
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              {components.length} {components.length === 1 ? 'Component' : 'Components'}
            </Badge>
            {isPreviewMode && (
              <Badge variant="secondary" className="px-3 py-1">
                Preview Mode
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {dropZones.map((dropZone) => (
            <DropZoneComponent
              key={dropZone.id}
              dropZone={dropZone}
              components={components.filter(c => 
                c.parentId === dropZone.id || (!c.parentId && dropZone.id === 'content-zone')
              )}
              selectedComponent={selectedComponent}
              onComponentAction={handleComponentAction}
              onComponentAdd={onComponentAdd}
              isPreviewMode={isPreviewMode}
            />
          ))}
        </div>

        {components.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="max-w-md mx-auto">
              <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start Building Your Zone
              </h3>
              <p className="text-gray-600 mb-4">
                Drag components from the palette on the left to begin creating your zone layout.
              </p>
              <Badge variant="outline" className="px-3 py-1">
                Try dragging an AdBanner or HeroSection
              </Badge>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

interface DropZoneComponentProps {
  dropZone: DropZone;
  components: CanvasComponent[];
  selectedComponent?: CanvasComponent | null;
  onComponentAction: (action: string, component: CanvasComponent) => void;
  onComponentAdd: (component: Omit<CanvasComponent, 'id'>, dropZoneId?: string) => void;
  isPreviewMode: boolean;
}

const DropZoneComponent: React.FC<DropZoneComponentProps> = ({
  dropZone,
  components,
  selectedComponent,
  onComponentAction,
  onComponentAdd,
  isPreviewMode
}) => {
  const isEmpty = components.length === 0;
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const componentData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      // Check if component is accepted in this zone
      if (dropZone.accepts.includes(componentData.name) || dropZone.accepts.includes('*')) {
        const newComponent = {
          type: componentData.name,
          name: componentData.displayName,
          props: componentData.defaultConfig || {},
          children: [],
          parentId: dropZone.id,
          isVisible: true,
          isLocked: false,
          position: { x: 0, y: 0, width: 100, height: 50 }
        };
        
        onComponentAdd(newComponent, dropZone.id);
      }
    } catch (error) {
      console.error('Failed to drop component:', error);
    }
  };

  return (
    <div 
      className={cn(
        'min-h-[120px] border-2 rounded-lg transition-all duration-200',
        {
          'border-dashed border-gray-300 bg-gray-50': isEmpty && !isDragOver,
          'border-solid border-gray-200 bg-white': !isEmpty && !isDragOver,
          'border-blue-500 bg-blue-50': isDragOver,
        }
      )}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{dropZone.label}</h3>
            <p className="text-sm text-gray-600">
              Accepts: {dropZone.accepts.join(', ')}
            </p>
          </div>
          <Badge variant="outline" className="px-2 py-1 text-xs">
            {components.length} {components.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isEmpty ? (
          <div className="text-center py-8">
            <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Drop components here
            </p>
          </div>
        ) : (
          components.map((component) => (
            <CanvasComponentItem
              key={component.id}
              component={component}
              isSelected={selectedComponent?.id === component.id}
              onAction={onComponentAction}
              isPreviewMode={isPreviewMode}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface CanvasComponentItemProps {
  component: CanvasComponent;
  isSelected: boolean;
  onAction: (action: string, component: CanvasComponent) => void;
  isPreviewMode: boolean;
}

const CanvasComponentItem: React.FC<CanvasComponentItemProps> = ({
  component,
  isSelected,
  onAction,
  isPreviewMode
}) => {
  return (
    <Card
      className={cn(
        'p-4 border transition-all duration-200 cursor-pointer hover:shadow-md',
        {
          'border-blue-500 shadow-md': isSelected,
          'border-gray-200': !isSelected,
          'opacity-50': !component.isVisible
        }
      )}
      onClick={() => onAction('select', component)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Move3D className="w-4 h-4 text-gray-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{component.name}</span>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {component.type}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              ID: {component.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        {!isPreviewMode && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAction('toggle_visibility', component);
              }}
              className="h-8 w-8 p-0"
            >
              {component.isVisible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAction('toggle_lock', component);
              }}
              className="h-8 w-8 p-0"
            >
              {component.isLocked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAction('copy', component);
              }}
              className="h-8 w-8 p-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAction('delete', component);
              }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {isSelected && !isPreviewMode && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              Selected - Configure in Properties Panel
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Canvas; 