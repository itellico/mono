'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  Minus
} from 'lucide-react';

// Import form components
import { FormComponentsPalette } from '@/components/form-builder/FormComponentsPalette';
import { FormCanvas } from '@/components/form-builder/FormCanvas';
import { PropertiesPanel } from '@/components/form-builder/PropertiesPanel';
import { LivePreview } from '@/components/form-builder/LivePreview';

// Import zone components
import { ZoneComponentsPalette } from '@/components/admin/zone-editor/ZoneComponentsPalette';
import { Canvas } from '@/components/admin/zone-editor/Canvas';
import { PropertiesPanel as ZonePropertiesPanel } from '@/components/admin/zone-editor/PropertiesPanel';

export interface UnifiedElement {
  id: string;
  type: string;
  label?: string;
  name?: string;
  displayName?: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: any;
  style?: any;
  schemaField?: string;
  optionSetId?: number;
  properties: any;
  children?: UnifiedElement[];
  parentId?: string;
  position?: number;
  // Zone-specific properties
  category?: string;
  componentType?: string;
}

interface UnifiedEditorProps {
  mode: 'form' | 'zone' | 'email';
  data: {
    title: string;
    description: string;
    elements: UnifiedElement[];
    settings?: any;
  };
  onChange: (data: any) => void;
  schemas?: any[];
  optionSets?: any[];
  availableForms?: any[];
  deviceView: 'desktop' | 'tablet' | 'mobile';
  isLoading: boolean;
}

/**
 * UnifiedEditor - Complete drag-and-drop editor component for forms, zones, and emails
 * Features a three-panel layout: Components palette (left), Canvas (center), Properties (right)
 * @component
 * @param {UnifiedEditorProps} props - Component props
 * @example
 * <UnifiedEditor
 *   mode="form"
 *   data={data}
 *   onChange={handleChange}
 *   schemas={schemas}
 *   optionSets={optionSets}
 *   deviceView="desktop"
 *   isLoading={false}
 * />
 */
export function UnifiedEditor({
  mode,
  data,
  onChange,
  schemas = [],
  optionSets = [],
  availableForms = [],
  deviceView,
  isLoading
}: UnifiedEditorProps) {
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [selectedElement, setSelectedElement] = useState<UnifiedElement | null>(null);
  const [draggedElement, setDraggedElement] = useState<any>(null);
  const [hoveredDropZone, setHoveredDropZone] = useState<string | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  
  // Add metadata state
  const [metadata, setMetadata] = useState({
    name: data.title || `Untitled ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
    description: data.description || '',
    settings: mode === 'form' ? {
      allowDrafts: true,
      showProgressBar: false,
      submitButtonText: 'Submit Form',
      resetButtonText: 'Reset',
      successMessage: 'Form submitted successfully!',
      errorMessage: 'Please fix the errors below and try again.',
    } : mode === 'zone' ? {
      responsive: true,
      backgroundColor: 'white',
      padding: 'medium',
      fullWidth: true
    } : {
      template: 'default',
      subject: '',
      previewText: ''
    }
  });

  // Update data when metadata changes
  const updateDataRef = React.useRef(onChange);
  updateDataRef.current = onChange;
  
  useEffect(() => {
    if (metadata.name !== data.title || metadata.description !== data.description) {
      updateDataRef.current({
        ...data,
        title: metadata.name,
        description: metadata.description,
        settings: metadata.settings
      });
    }
  }, [metadata.name, metadata.description, metadata.settings, data.title, data.description]);

  // Handle metadata updates
  const updateMetadata = (updates: Partial<typeof metadata>) => {
    setMetadata(prev => ({ ...prev, ...updates }));
  };

  // Generate unique ID for new elements
  const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setDraggedElement(active.data.current);
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
      const newElement: UnifiedElement = {
        id: generateId(),
        type: activeData.type,
        label: activeData.label || activeData.displayName || activeData.name || activeData.defaultProperties?.label || `${activeData.label || activeData.type}`,
        name: activeData.name || activeData.label,
        displayName: activeData.displayName || activeData.label || activeData.name,
        placeholder: activeData.defaultProperties?.placeholder,
        required: activeData.defaultProperties?.required || false,
        options: activeData.defaultProperties?.options || [],
        validation: activeData.defaultProperties?.validation,
        style: activeData.defaultProperties?.style,
        schemaField: activeData.defaultProperties?.schemaField,
        optionSetId: activeData.defaultProperties?.optionSetId,
        category: activeData.category,
        componentType: activeData.componentType,
        properties: {
          ...activeData.defaultProperties,
          id: generateId(),
        },
        children: activeData.acceptsChildren ? [] : undefined
      };

      let newElements = [...data.elements];

      // Handle drop zone targets
      if (typeof overId === 'string') {
        if (overId === 'form-canvas' || overId === 'zone-canvas' || overId === 'drop-zone-root') {
          // Drop at the end
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

      onChange({
        ...data,
        elements: newElements
      });
      
      setSelectedElement(newElement);
    } else {
      // Handle reordering existing elements
      const activeIndex = data.elements.findIndex(element => element.id === active.id);
      const overIndex = data.elements.findIndex(element => element.id === over?.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        const newElements = arrayMove(data.elements, activeIndex, overIndex);
        onChange({
          ...data,
          elements: newElements
        });
      }
    }

    setDraggedElement(null);
    setHoveredDropZone(null);
  };

  // Add element to container
  const addElementToContainer = (elements: UnifiedElement[], containerId: string, newElement: UnifiedElement, columnIndex?: number): UnifiedElement[] => {
    const updateElementInArray = (elements: UnifiedElement[]): UnifiedElement[] => {
      return elements.map(element => {
        if (element.id === containerId) {
          // If element has children and supports columns
          if (element.children) {
            if (columnIndex !== undefined && element.properties?.columns) {
              // Add to specific column
              const updatedChildren = [...element.children];
              
              // Find the column container
              const columnContainer = updatedChildren.find(child => 
                child.type === 'column' && child.properties?.columnIndex === columnIndex
              );
              
              if (columnContainer && columnContainer.children) {
                columnContainer.children.push(newElement);
              } else {
                // Create column if it doesn't exist
                const newColumn = {
                  id: generateId(),
                  type: 'column',
                  label: `Column ${columnIndex + 1}`,
                  properties: { columnIndex },
                  children: [newElement]
                };
                updatedChildren.push(newColumn);
              }
              
              return { ...element, children: updatedChildren };
            } else {
              // Add to general children
              return { ...element, children: [...element.children, newElement] };
            }
          }
        }
        
        // Recursively check children
        if (element.children) {
          return { ...element, children: updateElementInArray(element.children) };
        }
        
        return element;
      });
    };

    return updateElementInArray(elements);
  };

  // Update element
  const updateElement = useCallback((elementId: string, updates: Partial<UnifiedElement>) => {
    const updateElementInArray = (elements: UnifiedElement[]): UnifiedElement[] => {
      return elements.map(element => {
        if (element.id === elementId) {
          const updatedElement = { ...element, ...updates };
          
          // Update selected element if it's the one being updated
          if (selectedElement?.id === elementId) {
            setSelectedElement(updatedElement);
          }
          
          return updatedElement;
        }
        
        if (element.children) {
          return { ...element, children: updateElementInArray(element.children) };
        }
        
        return element;
      });
    };

    const newElements = updateElementInArray(data.elements);
    onChange({
      ...data,
      elements: newElements
    });
  }, [data, onChange, selectedElement]);

  // Delete element
  const deleteElement = useCallback((elementId: string) => {
    const removeElementFromArray = (elements: UnifiedElement[]): UnifiedElement[] => {
      return elements.filter(element => {
        if (element.id === elementId) {
          // If this is the selected element, clear selection
          if (selectedElement?.id === elementId) {
            setSelectedElement(null);
          }
          return false;
        }
        
        if (element.children) {
          element.children = removeElementFromArray(element.children);
        }
        
        return true;
      });
    };

    const newElements = removeElementFromArray(data.elements);
    onChange({
      ...data,
      elements: newElements
    });
  }, [data, onChange, selectedElement]);

  // Duplicate element
  const duplicateElement = useCallback((elementId: string) => {
    const findAndDuplicateElement = (elements: UnifiedElement[]): UnifiedElement[] => {
      const result: UnifiedElement[] = [];
      
      for (const element of elements) {
        result.push(element);
        
        if (element.id === elementId) {
          const duplicateWithNewIds = (element: UnifiedElement): UnifiedElement => {
            const newId = generateId();
            return {
              ...element,
              id: newId,
              label: element.label ? `${element.label} (Copy)` : undefined,
              name: element.name ? `${element.name} (Copy)` : undefined,
              displayName: element.displayName ? `${element.displayName} (Copy)` : undefined,
              properties: {
                ...element.properties,
                id: newId
              },
              children: element.children ? element.children.map(duplicateWithNewIds) : undefined
            };
          };
          
          const duplicatedElement = duplicateWithNewIds(element);
          result.push(duplicatedElement);
        } else if (element.children) {
          element.children = findAndDuplicateElement(element.children);
        }
      }
      
      return result;
    };

    const newElements = findAndDuplicateElement(data.elements);
    onChange({
      ...data,
      elements: newElements
    });
  }, [data, onChange]);

  // Add section (form mode only)
  const addSection = () => {
    if (mode !== 'form') return;
    
    const newSection: UnifiedElement = {
      id: generateId(),
      type: 'section',
      label: `Section ${data.elements.filter(el => el.type === 'section').length + 1}`,
      properties: {
        title: `Section ${data.elements.filter(el => el.type === 'section').length + 1}`,
        description: 'Section description',
        columns: 1,
        backgroundColor: 'transparent',
        padding: 'medium'
      },
      children: []
    };

    onChange({
      ...data,
      elements: [...data.elements, newSection]
    });
    
    setSelectedElement(newSection);
  };

  // Split into columns (form mode only)
  const splitIntoColumns = (elementId: string, columnCount: number) => {
    if (mode !== 'form') return;
    
    updateElement(elementId, {
      properties: {
        ...selectedElement?.properties,
        columns: columnCount
      }
    });
  };

  // Calculate stats
  const stats = useMemo(() => {
    const countElements = (elements: UnifiedElement[]): number => {
      return elements.reduce((count, element) => {
        return count + 1 + (element.children ? countElements(element.children) : 0);
      }, 0);
    };

    const totalElements = countElements(data.elements);
    
    if (mode === 'form') {
      const sections = data.elements.filter(el => el.type === 'section').length;
      const fields = data.elements.filter(el => el.type !== 'section').length;
      return { totalElements, sections, fields };
    } else if (mode === 'zone') {
      const components = data.elements.length;
      const sections = data.elements.filter(el => el.type === 'section' || el.componentType === 'layout').length;
      return { totalElements, components, sections };
    } else {
      const blocks = data.elements.length;
      const sections = data.elements.filter(el => el.type === 'section').length;
      return { totalElements, blocks, sections };
    }
  }, [data.elements, mode]);

  // Render components palette based on mode
  const renderComponentsPalette = () => {
    // ALWAYS use FormComponentsPalette for consistent UI
    return (
      <FormComponentsPalette 
        schemas={schemas} 
        optionSets={optionSets} 
      />
    );
  };

  // Render canvas based on mode
  const renderCanvas = () => {
    // ALWAYS use FormCanvas for consistent UI across all modes
    return (
      <FormCanvas
        elements={data.elements as any}
        selectedElement={selectedElement as any}
        onElementSelect={setSelectedElement}
        onElementUpdate={updateElement}
        onElementDelete={deleteElement}
        onElementDuplicate={duplicateElement}
        deviceView={deviceView}
        hoveredDropZone={hoveredDropZone}
        onDropZoneHover={setHoveredDropZone}
      />
    );
  };

  // Render preview based on mode
  const renderPreview = () => {
    // ALWAYS use LivePreview for consistent UI across all modes
    return (
      <LivePreview
        elements={data.elements as any}
        deviceSize={deviceView}
      />
    );
  };

  // Render properties panel based on mode
  const renderPropertiesPanel = () => {
    // ALWAYS use PropertiesPanel for consistent UI across all modes
    return (
      <PropertiesPanel
        selectedElement={selectedElement as any}
        onUpdateElement={updateElement}
        schemas={schemas}
        optionSets={optionSets}
        formMetadata={metadata}
        onUpdateFormMetadata={updateMetadata}
      />
    );
  };

  // Get mode-specific labels
  const getModeLabels = () => {
    switch (mode) {
      case 'form':
        return {
          title: 'Elements',
          addSection: 'Add Section',
          statsLabels: [`${stats.sections || 0} sections`, `${stats.fields || 0} fields`]
        };
      case 'zone':
        return {
          title: 'Components',
          addSection: 'Add Container',
          statsLabels: [`${stats.components || 0} components`, `${stats.sections || 0} containers`]
        };
      case 'email':
        return {
          title: 'Blocks',
          addSection: 'Add Section',
          statsLabels: [`${stats.blocks || 0} blocks`, `${stats.sections || 0} sections`]
        };
      default:
        return {
          title: 'Elements',
          addSection: 'Add Section',
          statsLabels: []
        };
    }
  };

  const modeLabels = getModeLabels();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading {mode} builder...</p>
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
      <div className="flex-1 flex overflow-hidden bg-gray-50 h-full">
        {/* Left Sidebar - Components Palette */}
        {showLeftPanel && (
          <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex flex-col">
            {/* Palette Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{modeLabels.title}</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {stats.totalElements}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLeftPanel(false)}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Drag {modeLabels.title.toLowerCase()} to the canvas
              </p>
            </div>

            {/* Quick Actions */}
            {mode === 'form' && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="space-y-2">
                  <Button
                    onClick={addSection}
                    size="sm"
                    variant="outline"
                    className="w-full justify-start text-xs"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    {modeLabels.addSection}
                  </Button>
                  
                  {selectedElement?.type === 'section' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1">
                        <Button
                          onClick={() => splitIntoColumns(selectedElement.id, 1)}
                          size="sm"
                          variant={selectedElement.properties.columns === 1 ? 'default' : 'ghost'}
                          className="p-1"
                          title="1 Column"
                        >
                          <Grid3X3 className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => splitIntoColumns(selectedElement.id, 2)}
                          size="sm"
                          variant={selectedElement.properties.columns === 2 ? 'default' : 'ghost'}
                          className="p-1"
                          title="2 Columns"
                        >
                          <Columns className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => splitIntoColumns(selectedElement.id, 3)}
                          size="sm"
                          variant={selectedElement.properties.columns === 3 ? 'default' : 'ghost'}
                          className="p-1"
                          title="3 Columns"
                        >
                          <LayoutGrid className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Column Controls */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Columns: {selectedElement.properties.columns || 1}</span>
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => {
                              const currentColumns = selectedElement.properties.columns || 1;
                              if (currentColumns > 1) {
                                splitIntoColumns(selectedElement.id, currentColumns - 1);
                              }
                            }}
                            size="sm"
                            variant="outline"
                            disabled={(selectedElement.properties.columns || 1) <= 1}
                            className="h-5 w-5 p-0"
                            title="Decrease Columns"
                          >
                            <Minus className="h-2 w-2" />
                          </Button>
                          <Button
                            onClick={() => {
                              const currentColumns = selectedElement.properties.columns || 1;
                              if (currentColumns < 3) {
                                splitIntoColumns(selectedElement.id, currentColumns + 1);
                              }
                            }}
                            size="sm"
                            variant="outline"
                            disabled={(selectedElement.properties.columns || 1) >= 3}
                            className="h-5 w-5 p-0"
                            title="Increase Columns"
                          >
                            <Plus className="h-2 w-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Components Palette */}
            <div className="flex-1 overflow-hidden">
              {renderComponentsPalette()}
            </div>
          </div>
        )}

        {/* Show Left Panel Button */}
        {!showLeftPanel && (
          <div className="w-8 bg-white border-r border-gray-200 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeftPanel(true)}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main Content Area - Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger value="builder" className="px-6">
                    Builder
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="px-6">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center space-x-4">
                {/* Stats */}
                <div className="text-sm text-gray-500 space-x-4">
                  {modeLabels.statsLabels.map((label, index) => (
                    <span key={index}>{label}</span>
                  ))}
                </div>

                {/* Properties Panel Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
                  className={showPropertiesPanel ? 'bg-blue-50 border-blue-200' : ''}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Properties
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Canvas */}
            <div className="flex-1 overflow-auto">
              <Tabs value={activeTab} className="h-full">
                <TabsContent value="builder" className="h-full m-0">
                  {renderCanvas()}
                </TabsContent>
                
                <TabsContent value="preview" className="h-full m-0">
                  {renderPreview()}
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Sidebar - Properties Panel (Inline) */}
            {showPropertiesPanel && (
              <div className="w-80 bg-white border-l border-gray-200 shadow-sm flex flex-col">
                {/* Properties Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Properties</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPropertiesPanel(false)}
                      className="h-6 w-6 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedElement ? (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedElement.type} {mode === 'zone' ? 'component' : 'element'}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Select an {mode === 'zone' ? 'component' : 'element'} to edit properties
                    </p>
                  )}
                </div>

                {/* Properties Content - Fixed height and scrolling */}
                <div className="flex-1 overflow-hidden">
                  {renderPropertiesPanel()}
                </div>

                {/* Properties Footer */}
                {selectedElement && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => duplicateElement(selectedElement.id)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Duplicate
                      </Button>
                      <Button
                        onClick={() => deleteElement(selectedElement.id)}
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show Properties Panel Button */}
            {!showPropertiesPanel && (
              <div className="w-8 bg-white border-l border-gray-200 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPropertiesPanel(true)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedElement ? (
            <Card className="w-64 opacity-90 shadow-lg border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  {draggedElement.icon && <draggedElement.icon className="h-5 w-5 text-blue-600" />}
                  <div>
                    <p className="text-sm font-medium">{draggedElement.label || draggedElement.displayName || draggedElement.name}</p>
                    <p className="text-xs text-gray-500">Drop to add to {mode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
} 