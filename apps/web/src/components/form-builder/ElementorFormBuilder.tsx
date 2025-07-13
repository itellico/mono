'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  Settings, 
  Plus, 
  Move, 
  Trash2, 
  Copy,
  Columns,
  Grid3X3,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Minus,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  Upload,
  Save
} from 'lucide-react';
import { UnifiedSidebar } from '@/components/shared/UnifiedSidebar';
import { FormCanvas } from './FormCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { LivePreview } from './LivePreview';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

export interface FormElement {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: any;
  style?: any;
  schemaField?: string;
  optionSetId?: number;
  properties: any;
  children?: FormElement[];
  parentId?: string;
  position?: number;
}

interface ElementorFormBuilderProps {
  formData: {
    title: string;
    description: string;
    elements: FormElement[];
  };
  onChange: (formData: any) => void;
  schemas: any[];
  optionSets: any[];
  deviceView: 'desktop' | 'tablet' | 'mobile';
  isLoading: boolean;
}

/**
 * ElementorFormBuilder - Complete drag-and-drop form builder component with translations
 * Features a three-panel layout: Unified sidebar (left), Canvas (center), Properties (right)
 * @component
 * @param {ElementorFormBuilderProps} props - Component props
 * @example
 * <ElementorFormBuilder
 *   formData={formData}
 *   onChange={handleChange}
 *   schemas={schemas}
 *   optionSets={optionSets}
 *   deviceView="desktop"
 *   isLoading={false}
 * />
 */
export function ElementorFormBuilder({
  formData,
  onChange,
  schemas,
  optionSets,
  deviceView,
  isLoading
}: ElementorFormBuilderProps) {
  const t = useTranslations();
  const { trackClick, trackView } = useAuditTracking();
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null);
  const [draggedElement, setDraggedElement] = useState<any>(null);
  const [hoveredDropZone, setHoveredDropZone] = useState<string | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  
  // Add form metadata state
  const [formMetadata, setFormMetadata] = useState({
    name: formData.title || t('formBuilder.elements.untitled', { default: 'Untitled Form' }),
    description: formData.description || '',
    settings: {
      allowDrafts: true,
      showProgressBar: false,
      submitButtonText: t('actions.submit', { default: 'Submit Form' }),
      resetButtonText: t('actions.reset', { default: 'Reset' }),
      successMessage: t('formBuilder.messages.formSaved', { default: 'Form submitted successfully!' }),
      errorMessage: t('formBuilder.messages.formError', { default: 'Please fix the errors below and try again.' }),
    }
  });

  // Update formData when formMetadata changes
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  
  useEffect(() => {
    if (formMetadata.name !== formData.title || formMetadata.description !== formData.description) {
      onChangeRef.current({
        ...formData,
        title: formMetadata.name,
        description: formMetadata.description,
        settings: formMetadata.settings
      });
    }
  }, [formMetadata.name, formMetadata.description, formMetadata.settings, formData.title, formData.description]);

  // Handle form metadata updates
  const updateFormMetadata = (updates: Partial<typeof formMetadata>) => {
    setFormMetadata(prev => ({ ...prev, ...updates }));
    browserLogger.userAction('Form metadata updated', 'ElementorFormBuilder', {
      updates: Object.keys(updates)
    });
  };

  // Generate unique ID for new elements
  const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setDraggedElement(active.data.current);
    browserLogger.userAction('Drag started', 'ElementorFormBuilder', {
      elementType: active.data.current?.type
    });
  };

  // Handle element selection from unified sidebar
  const handleElementSelect = (element: any) => {
    // This will be handled by drag and drop or direct addition
    browserLogger.userAction('Element selected from sidebar', 'ElementorFormBuilder', {
      elementType: element.type
    });
  };

  // Handle library item load from unified sidebar
  const handleLibraryItemLoad = (item: any) => {
    // Load form from library
    trackClick('ElementorFormBuilder', {
      action: 'library-item-load',
      itemId: item.id,
      itemName: item.name
    });
    browserLogger.userAction('Library item loaded', 'ElementorFormBuilder', {
      itemId: item.id,
      itemName: item.name
    });
  };

  // Handle drag end - Fixed to work with drop zones
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setDraggedElement(null);
      setHoveredDropZone(null);
      return;
    }

    const overId = over.id;
    const activeData = active.data.current;

    // Handle new element from palette
    if (activeData?.isFromPalette) {
      const newElement: FormElement = {
        id: generateId(),
        type: activeData.type,
        label: activeData.label || activeData.defaultProperties?.label || t(`formBuilder.elements.${activeData.type}`, { default: activeData.type }),
        placeholder: activeData.defaultProperties?.placeholder,
        required: activeData.defaultProperties?.required || false,
        options: activeData.defaultProperties?.options || [],
        validation: activeData.defaultProperties?.validation,
        style: activeData.defaultProperties?.style,
        schemaField: activeData.defaultProperties?.schemaField,
        optionSetId: activeData.defaultProperties?.optionSetId,
        properties: {
          ...activeData.defaultProperties,
          id: generateId(),
        },
        children: activeData.acceptsChildren ? [] : undefined
      };

      let newElements = [...formData.elements];

      // Handle drop zone targets
      if (typeof overId === 'string') {
        if (overId === 'form-canvas' || overId === 'drop-zone-root') {
          // Drop at the end of the form
          newElements.push(newElement);
        } else if (overId.startsWith('drop-zone-')) {
          const dropZoneInfo = overId.replace('drop-zone-', '');
          
          // Check if it's a numbered drop zone (between elements)
          const elementIndex = parseInt(dropZoneInfo);
          if (!isNaN(elementIndex)) {
            // Insert at specific position
            newElements.splice(elementIndex, 0, newElement);
          } else {
            // It's a container drop zone (e.g., "elementId-col-0")
            const parts = dropZoneInfo.split('-col-');
            if (parts.length === 2) {
              const containerId = parts[0];
              const columnIndex = parseInt(parts[1]);
              newElements = addElementToContainer(newElements, containerId, newElement, columnIndex);
            } else {
              // Generic container drop zone
              newElements = addElementToContainer(newElements, dropZoneInfo, newElement);
            }
          }
        } else {
          // Direct drop on element or container
          newElements = addElementToContainer(newElements, overId.toString(), newElement);
        }
      } else {
        newElements.push(newElement);
      }

      onChange({ ...formData, elements: newElements });
      
      trackClick('ElementorFormBuilder', {
        action: 'element-added',
        elementType: newElement.type,
        elementId: newElement.id
      });
      browserLogger.userAction('Element added to form', 'ElementorFormBuilder', {
        elementType: newElement.type,
        elementId: newElement.id,
        totalElements: newElements.length
      });
      
    } else {
      // Handle existing element reordering
      const activeIndex = formData.elements.findIndex(element => element.id === active.id);
      const overIndex = formData.elements.findIndex(element => element.id === over.id);
      
      if (activeIndex !== -1 && overIndex !== -1) {
        const newElements = arrayMove(formData.elements, activeIndex, overIndex);
        onChange({ ...formData, elements: newElements });
        
        browserLogger.userAction('Element reordered', 'ElementorFormBuilder', {
          elementId: active.id,
          fromIndex: activeIndex,
          toIndex: overIndex
        });
      }
    }

    setDraggedElement(null);
    setHoveredDropZone(null);
  };

  // Add element to container (sections, columns, etc.)
  const addElementToContainer = (elements: FormElement[], containerId: string, newElement: FormElement, columnIndex?: number): FormElement[] => {
    return elements.map(element => {
      if (element.id === containerId) {
        if (element.children) {
          if (columnIndex !== undefined && element.children[columnIndex]) {
            // Add to specific column
            return {
              ...element,
              children: element.children.map((child, index) => 
                index === columnIndex && child.children
                  ? { ...child, children: [...child.children, newElement] }
                  : child
              )
            };
          } else {
            // Add to main children array
            return {
              ...element,
              children: [...element.children, newElement]
            };
          }
        }
      } else if (element.children) {
        // Recursively search in children
        return {
          ...element,
          children: addElementToContainer(element.children, containerId, newElement, columnIndex)
        };
      }
      return element;
    });
  };

  // Update element properties
  const updateElement = (elementId: string, updates: Partial<FormElement>) => {
    const updateElementInArray = (elements: FormElement[]): FormElement[] => {
      return elements.map(element => {
        if (element.id === elementId) {
          return { ...element, ...updates };
        } else if (element.children) {
          return {
            ...element,
            children: updateElementInArray(element.children)
          };
        }
        return element;
      });
    };

    const newElements = updateElementInArray(formData.elements);
    onChange({ ...formData, elements: newElements });
    
    browserLogger.userAction('Element updated', 'ElementorFormBuilder', {
      elementId,
      updates: Object.keys(updates)
    });
  };

  // Delete element
  const deleteElement = (elementId: string) => {
    const removeElementFromArray = (elements: FormElement[]): FormElement[] => {
      return elements.filter(element => {
        if (element.id === elementId) {
          return false;
        } else if (element.children) {
          element.children = removeElementFromArray(element.children);
        }
        return true;
      });
    };

    const newElements = removeElementFromArray(formData.elements);
    onChange({ ...formData, elements: newElements });
    
    // Clear selection if deleted element was selected
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
    
    trackClick('ElementorFormBuilder', {
      action: 'element-deleted',
      elementId
    });
    browserLogger.userAction('Element deleted', 'ElementorFormBuilder', {
      elementId,
      remainingElements: newElements.length
    });
  };

  // Duplicate element
  const duplicateElement = (elementId: string) => {
    const findAndDuplicateElement = (elements: FormElement[]): FormElement[] => {
      const result: FormElement[] = [];
      
      for (const element of elements) {
        result.push(element);
        
        if (element.id === elementId) {
          // Create duplicate with new ID
          const duplicate: FormElement = {
            ...element,
            id: generateId(),
            label: `${element.label} ${t('actions.copy', { default: 'Copy' })}`,
            properties: {
              ...element.properties,
              id: generateId()
            },
            children: element.children ? duplicateChildrenRecursively(element.children) : undefined
          };
          result.push(duplicate);
        } else if (element.children) {
          result[result.length - 1] = {
            ...element,
            children: findAndDuplicateElement(element.children)
          };
        }
      }
      
      return result;
    };

    const duplicateChildrenRecursively = (children: FormElement[]): FormElement[] => {
      return children.map(child => ({
        ...child,
        id: generateId(),
        properties: {
          ...child.properties,
          id: generateId()
        },
        children: child.children ? duplicateChildrenRecursively(child.children) : undefined
      }));
    };

    const newElements = findAndDuplicateElement(formData.elements);
    onChange({ ...formData, elements: newElements });
    
    trackClick('ElementorFormBuilder', {
      action: 'element-duplicated',
      elementId
    });
    browserLogger.userAction('Element duplicated', 'ElementorFormBuilder', {
      elementId,
      totalElements: newElements.length
    });
  };

  // Add section
  const addSection = () => {
    const newSection: FormElement = {
      id: generateId(),
      type: 'section',
      label: t('formBuilder.elements.section', { default: 'Section' }),
      properties: {
        id: generateId(),
        title: t('formBuilder.elements.section', { default: 'New Section' }),
        columns: 1
      },
      children: []
    };

    const newElements = [...formData.elements, newSection];
    onChange({ ...formData, elements: newElements });
    
    trackClick('ElementorFormBuilder', {
      action: 'section-added'
    });
    browserLogger.userAction('Section added', 'ElementorFormBuilder', {
      sectionId: newSection.id
    });
  };

  // Split into columns
  const splitIntoColumns = (elementId: string, columnCount: number) => {
    // Implementation for splitting elements into columns
    browserLogger.userAction('Element split into columns', 'ElementorFormBuilder', {
      elementId,
      columnCount
    });
  };

  // Count total elements
  const countElements = (elements: FormElement[]): number => {
    return elements.reduce((count, element) => {
      return count + 1 + (element.children ? countElements(element.children) : 0);
    }, 0);
  };

  const totalElements = countElements(formData.elements);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'builder' | 'preview');
    trackView('ElementorFormBuilder', {
      tab,
      elementCount: totalElements
    });
    browserLogger.userAction('Form builder tab changed', 'ElementorFormBuilder', {
      tab,
      elementCount: totalElements
    });
  };

  // Viewport controls
  const viewportControls = [
    { 
      id: 'desktop', 
      icon: Monitor, 
      label: t('formBuilder.viewport.desktop'),
      active: deviceView === 'desktop' 
    },
    { 
      id: 'tablet', 
      icon: Tablet, 
      label: t('formBuilder.viewport.tablet'),
      active: deviceView === 'tablet' 
    },
    { 
      id: 'mobile', 
      icon: Smartphone, 
      label: t('formBuilder.viewport.mobile'),
      active: deviceView === 'mobile' 
    }
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading form builder...</p>
          <p className="text-gray-500 text-sm">Preparing your workspace</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="h-[calc(100vh-12rem)] flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {t('formBuilder.title')}
              </h1>
              <span className="text-sm text-gray-500">
                {totalElements > 0 
                  ? t('formBuilder.elements', { count: totalElements })
                  : t('formBuilder.noElements')
                }
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Viewport Controls */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {viewportControls.map(({ id, icon: Icon, label, active }) => (
                  <Button
                    key={id}
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    title={label}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  {t('formBuilder.actions.import')}
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  {t('formBuilder.actions.export')}
                </Button>
                <Button size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {t('formBuilder.actions.save')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Unified Sidebar */}
          {showLeftPanel && (
            <UnifiedSidebar
              mode="form"
              onElementSelect={handleElementSelect}
              onLibraryItemLoad={handleLibraryItemLoad}
              schemas={schemas}
              optionSets={optionSets}
            />
          )}

          {/* Center Canvas */}
          <div className="flex-1 flex flex-col">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 mb-2">
                <TabsTrigger value="builder">
                  {t('formBuilder.tabs.builder')}
                </TabsTrigger>
                <TabsTrigger value="preview">
                  {t('formBuilder.tabs.preview')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="flex-1 m-0">
                <FormCanvas
                  elements={formData.elements}
                  selectedElement={selectedElement}
                  onElementSelect={setSelectedElement}
                  onElementUpdate={updateElement}
                  onElementDelete={deleteElement}
                  onElementDuplicate={duplicateElement}
                  deviceView={deviceView}
                  hoveredDropZone={hoveredDropZone}
                  onDropZoneHover={setHoveredDropZone}
                />
              </TabsContent>

                             <TabsContent value="preview" className="flex-1 m-0">
                 <LivePreview
                   elements={formData.elements}
                   deviceSize={deviceView}
                 />
               </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Properties Panel */}
          {showPropertiesPanel && (
            <PropertiesPanel
              selectedElement={selectedElement}
              onElementUpdate={updateElement}
              onElementDelete={deleteElement}
              schemas={schemas}
              optionSets={optionSets}
              formElements={formData.elements}
            />
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedElement && (
          <Card className="w-64 opacity-75 rotate-3 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm font-medium">
                  {draggedElement.label || t(`formBuilder.elements.${draggedElement.type}`, { default: draggedElement.type })}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
} 