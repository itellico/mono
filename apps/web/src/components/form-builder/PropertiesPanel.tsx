'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Palette, 
  Eye, 
  Code,
  AlertTriangle,
  Info,
  Trash2,
  Plus
} from 'lucide-react';
import { FormElement } from './ElementorFormBuilder';
import { ConditionalLogicPanel, ConditionalLogic } from '@/components/shared/ConditionalLogicPanel';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

interface PropertiesPanelProps {
  selectedElement: FormElement | null;
  onElementUpdate: (elementId: string, updates: Partial<FormElement>) => void;
  onElementDelete: (elementId: string) => void;
  schemas: any[];
  optionSets: any[];
  formElements: FormElement[];
  className?: string;
}

/**
 * PropertiesPanel - Enhanced properties panel with translations and real conditional logic
 * @component
 * @param {PropertiesPanelProps} props - Component props
 * @example
 * <PropertiesPanel
 *   selectedElement={selectedElement}
 *   onElementUpdate={handleElementUpdate}
 *   onElementDelete={handleElementDelete}
 *   schemas={schemas}
 *   optionSets={optionSets}
 *   formElements={formElements}
 * />
 */
export function PropertiesPanel({
  selectedElement,
  onElementUpdate,
  onElementDelete,
  schemas = [],
  optionSets = [],
  formElements = [],
  className = ''
}: PropertiesPanelProps) {
  const t = useTranslations();
  const { trackClick } = useAuditTracking();
  const [activeTab, setActiveTab] = useState<'general' | 'advanced' | 'styling' | 'validation' | 'conditional'>('general');

  // Handle property updates
  const handlePropertyUpdate = (property: string, value: any) => {
    if (!selectedElement) return;
    
    const updates: Partial<FormElement> = {
      properties: {
        ...selectedElement.properties,
        [property]: value
      }
    };

    // Update specific properties at the root level for backward compatibility
    if (property === 'label') updates.label = value;
    if (property === 'placeholder') updates.placeholder = value;
    if (property === 'required') updates.required = value;
    if (property === 'options') updates.options = value;

    onElementUpdate(selectedElement.id, updates);
    
    browserLogger.userAction('Element property updated', 'PropertiesPanel', {
      elementId: selectedElement.id,
      elementType: selectedElement.type,
      property,
      value: typeof value === 'object' ? JSON.stringify(value) : value
    });
  };

  // Handle conditional logic updates
  const handleConditionalLogicUpdate = (logic: ConditionalLogic) => {
    if (!selectedElement) return;
    
    handlePropertyUpdate('conditionalLogic', logic);
    
    trackClick('PropertiesPanel', {
      elementId: selectedElement.id,
      enabled: logic.enabled,
      rulesCount: logic.rules.length,
      action: 'conditional-logic-update'
    });
  };

  // Handle element deletion
  const handleDelete = () => {
    if (!selectedElement) return;
    
    onElementDelete(selectedElement.id);
    
    trackClick('PropertiesPanel', {
      elementId: selectedElement.id,
      elementType: selectedElement.type,
      action: 'element-delete'
    });
    browserLogger.userAction('Element deleted from properties panel', 'PropertiesPanel', {
      elementId: selectedElement.id,
      elementType: selectedElement.type
    });
  };

  // Get available fields for conditional logic (excluding current element)
  const getAvailableFields = () => {
    return formElements
      .filter(element => element.id !== selectedElement?.id)
      .map(element => ({
        id: element.id,
        label: element.label || element.type,
        type: element.type
      }));
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as typeof activeTab);
    browserLogger.userAction('Properties panel tab changed', 'PropertiesPanel', {
      tab,
      elementId: selectedElement?.id,
      elementType: selectedElement?.type
    });
  };

  if (!selectedElement) {
    return (
      <div className={`w-80 bg-white border-l border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm mb-2">{t('formBuilder.properties.noSelection', { default: 'No element selected' })}</p>
          <p className="text-xs text-gray-400">
            {t('formBuilder.properties.selectElement', { default: 'Click on an element to edit its properties' })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 bg-white border-l border-gray-200 flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">{t('formBuilder.properties.title', { default: 'Properties' })}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {selectedElement.type}
          </Badge>
          <span className="text-sm text-gray-600 truncate">
            {selectedElement.label || t('formBuilder.elements.untitled', { default: 'Untitled Element' })}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-5 m-4 mb-2">
          <TabsTrigger value="general" className="text-xs">
            {t('formBuilder.properties.general')}
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs">
            {t('formBuilder.properties.advanced')}
          </TabsTrigger>
          <TabsTrigger value="styling" className="text-xs">
            {t('formBuilder.properties.styling')}
          </TabsTrigger>
          <TabsTrigger value="validation" className="text-xs">
            {t('formBuilder.properties.validation')}
          </TabsTrigger>
          <TabsTrigger value="conditional" className="text-xs">
            {t('formBuilder.properties.conditional')}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4 pt-2">
            <TabsContent value="general" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('formBuilder.properties.general')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">{t('formBuilder.properties.label')}</Label>
                    <Input
                      value={selectedElement.label || ''}
                      onChange={(e) => handlePropertyUpdate('label', e.target.value)}
                      placeholder={t('formBuilder.properties.labelPlaceholder', { default: 'Enter label' })}
                      className="mt-1"
                    />
                  </div>

                  {selectedElement.type !== 'section' && selectedElement.type !== 'heading' && (
                    <div>
                      <Label className="text-xs font-medium">{t('formBuilder.properties.placeholder')}</Label>
                      <Input
                        value={selectedElement.placeholder || ''}
                        onChange={(e) => handlePropertyUpdate('placeholder', e.target.value)}
                        placeholder={t('formBuilder.properties.placeholderPlaceholder', { default: 'Enter placeholder' })}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-medium">{t('formBuilder.properties.description')}</Label>
                    <Textarea
                      value={selectedElement.properties?.description || ''}
                      onChange={(e) => handlePropertyUpdate('description', e.target.value)}
                      placeholder={t('formBuilder.properties.descriptionPlaceholder', { default: 'Enter description' })}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {selectedElement.type !== 'section' && selectedElement.type !== 'heading' && (
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">{t('formBuilder.properties.required')}</Label>
                      <Switch
                        checked={selectedElement.required || false}
                        onCheckedChange={(checked) => handlePropertyUpdate('required', checked)}
                      />
                    </div>
                  )}

                  {selectedElement.type !== 'section' && selectedElement.type !== 'heading' && (
                    <div>
                      <Label className="text-xs font-medium">{t('formBuilder.properties.defaultValue')}</Label>
                      <Input
                        value={selectedElement.properties?.defaultValue || ''}
                        onChange={(e) => handlePropertyUpdate('defaultValue', e.target.value)}
                        placeholder={t('formBuilder.properties.defaultValuePlaceholder', { default: 'Enter default value' })}
                        className="mt-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('formBuilder.properties.advanced')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium">{t('formBuilder.properties.elementId')}</Label>
                    <Input
                      value={selectedElement.properties?.id || selectedElement.id}
                      onChange={(e) => handlePropertyUpdate('id', e.target.value)}
                      placeholder={t('formBuilder.properties.elementIdPlaceholder', { default: 'Enter element ID' })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">{t('formBuilder.properties.cssClasses')}</Label>
                    <Input
                      value={selectedElement.properties?.cssClasses || ''}
                      onChange={(e) => handlePropertyUpdate('cssClasses', e.target.value)}
                      placeholder={t('formBuilder.properties.cssClassesPlaceholder', { default: 'custom-class another-class' })}
                      className="mt-1"
                    />
                  </div>

                  {schemas.length > 0 && (
                    <div>
                      <Label className="text-xs font-medium">{t('formBuilder.properties.schemaField')}</Label>
                      <Select
                        value={selectedElement.schemaField || ''}
                        onValueChange={(value) => handlePropertyUpdate('schemaField', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('formBuilder.properties.selectSchema', { default: 'Select schema field' })} />
                        </SelectTrigger>
                        <SelectContent>
                          {schemas.map((schema) => (
                            <SelectItem key={schema.id} value={schema.id}>
                              {schema.displayName || schema.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(selectedElement.type === 'select' || selectedElement.type === 'radio' || selectedElement.type === 'checkbox') && optionSets.length > 0 && (
                    <div>
                      <Label className="text-xs font-medium">{t('formBuilder.properties.optionSet')}</Label>
                      <Select
                        value={selectedElement.optionSetId?.toString() || ''}
                        onValueChange={(value) => handlePropertyUpdate('optionSetId', parseInt(value))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('formBuilder.properties.selectOptionSet', { default: 'Select option set' })} />
                        </SelectTrigger>
                        <SelectContent>
                          {optionSets.map((optionSet) => (
                            <SelectItem key={optionSet.id} value={optionSet.id.toString()}>
                              {optionSet.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-medium">{t('formBuilder.properties.customAttributes')}</Label>
                    <Textarea
                      value={selectedElement.properties?.customAttributes || ''}
                      onChange={(e) => handlePropertyUpdate('customAttributes', e.target.value)}
                      placeholder={`data-custom="value" aria-label="Custom label"`}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="styling" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('formBuilder.properties.styling')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <Palette className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">{t('formBuilder.properties.stylingComingSoon', { default: 'Styling options coming soon' })}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="validation" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t('formBuilder.properties.validation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedElement.type === 'text' || selectedElement.type === 'textarea' ? (
                    <>
                      <div>
                        <Label className="text-xs font-medium">{t('formBuilder.properties.minLength')}</Label>
                        <Input
                          type="number"
                          value={selectedElement.properties?.minLength || ''}
                          onChange={(e) => handlePropertyUpdate('minLength', parseInt(e.target.value) || null)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">{t('formBuilder.properties.maxLength')}</Label>
                        <Input
                          type="number"
                          value={selectedElement.properties?.maxLength || ''}
                          onChange={(e) => handlePropertyUpdate('maxLength', parseInt(e.target.value) || null)}
                          placeholder="100"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">{t('formBuilder.properties.pattern')}</Label>
                        <Input
                          value={selectedElement.properties?.pattern || ''}
                          onChange={(e) => handlePropertyUpdate('pattern', e.target.value)}
                          placeholder="^[a-zA-Z0-9]+$"
                          className="mt-1"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">{t('formBuilder.properties.noValidationOptions', { default: 'No validation options for this element type' })}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conditional" className="space-y-4 mt-0">
              <ConditionalLogicPanel
                elementId={selectedElement.id}
                conditionalLogic={selectedElement.properties?.conditionalLogic || {
                  enabled: false,
                  action: 'show',
                  rules: []
                }}
                availableFields={getAvailableFields()}
                onChange={handleConditionalLogicUpdate}
              />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
