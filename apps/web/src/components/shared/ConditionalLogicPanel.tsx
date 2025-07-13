'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

export interface ConditionalRule {
  id: string;
  sourceFieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

export interface ConditionalLogic {
  enabled: boolean;
  action: 'show' | 'hide' | 'require' | 'disable';
  rules: ConditionalRule[];
}

interface ConditionalLogicPanelProps {
  elementId: string;
  conditionalLogic: ConditionalLogic;
  availableFields: Array<{ id: string; label: string; type: string }>;
  onChange: (logic: ConditionalLogic) => void;
  className?: string;
}

/**
 * ConditionalLogicPanel - Real conditional logic implementation
 * Allows users to create complex conditional rules for form elements
 * @component
 * @param {ConditionalLogicPanelProps} props - Component props
 * @example
 * <ConditionalLogicPanel
 *   elementId="field_123"
 *   conditionalLogic={conditionalLogic}
 *   availableFields={formFields}
 *   onChange={handleLogicChange}
 * />
 */
export function ConditionalLogicPanel({
  elementId,
  conditionalLogic,
  availableFields,
  onChange,
  className = ''
}: ConditionalLogicPanelProps) {
  const t = useTranslations();
  const { trackClick } = useAuditTracking();
  const [isExpanded, setIsExpanded] = useState(conditionalLogic.enabled);

  // Generate unique ID for new rules
  const generateRuleId = () => `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle enabling/disabling conditional logic
  const handleToggleEnabled = (enabled: boolean) => {
    const newLogic = { ...conditionalLogic, enabled };
    if (enabled && conditionalLogic.rules.length === 0) {
      // Add a default rule when enabling
      newLogic.rules = [createDefaultRule()];
    }
    onChange(newLogic);
    setIsExpanded(enabled);
    
    trackClick('conditional-logic-toggle', 'ConditionalLogicPanel', { 
      elementId, 
      enabled 
    });
    browserLogger.userAction('Conditional logic toggled', 'ConditionalLogicPanel', {
      elementId,
      enabled,
      rulesCount: newLogic.rules.length
    });
  };

  // Create default rule
  const createDefaultRule = (): ConditionalRule => ({
    id: generateRuleId(),
    sourceFieldId: '',
    operator: 'equals',
    value: '',
    logicalOperator: 'AND'
  });

  // Handle action change
  const handleActionChange = (action: ConditionalLogic['action']) => {
    onChange({ ...conditionalLogic, action });
    browserLogger.userAction('Conditional logic action changed', 'ConditionalLogicPanel', {
      elementId,
      action,
      rulesCount: conditionalLogic.rules.length
    });
  };

  // Handle rule changes
  const handleRuleChange = (ruleId: string, updates: Partial<ConditionalRule>) => {
    const newRules = conditionalLogic.rules.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    onChange({ ...conditionalLogic, rules: newRules });
    
    browserLogger.userAction('Conditional rule updated', 'ConditionalLogicPanel', {
      elementId,
      ruleId,
      updates: Object.keys(updates)
    });
  };

  // Add new rule
  const handleAddRule = () => {
    const newRule = createDefaultRule();
    const newRules = [...conditionalLogic.rules, newRule];
    onChange({ ...conditionalLogic, rules: newRules });
    
    trackClick('add-conditional-rule', 'ConditionalLogicPanel', { 
      elementId,
      rulesCount: newRules.length 
    });
    browserLogger.userAction('Conditional rule added', 'ConditionalLogicPanel', {
      elementId,
      ruleId: newRule.id,
      totalRules: newRules.length
    });
  };

  // Remove rule
  const handleRemoveRule = (ruleId: string) => {
    const newRules = conditionalLogic.rules.filter(rule => rule.id !== ruleId);
    onChange({ ...conditionalLogic, rules: newRules });
    
    trackClick('remove-conditional-rule', 'ConditionalLogicPanel', { 
      elementId,
      ruleId,
      rulesCount: newRules.length 
    });
    browserLogger.userAction('Conditional rule removed', 'ConditionalLogicPanel', {
      elementId,
      ruleId,
      remainingRules: newRules.length
    });
  };

  // Get operator options based on field type
  const getOperatorOptions = (fieldType: string) => {
    const baseOperators = [
      { value: 'equals', label: t('formBuilder.properties.conditional.operators.equals', { default: 'Equals' }) },
      { value: 'not_equals', label: t('formBuilder.properties.conditional.operators.notEquals', { default: 'Not Equals' }) },
      { value: 'is_empty', label: t('formBuilder.properties.conditional.operators.isEmpty', { default: 'Is Empty' }) },
      { value: 'is_not_empty', label: t('formBuilder.properties.conditional.operators.isNotEmpty', { default: 'Is Not Empty' }) }
    ];

    if (fieldType === 'text' || fieldType === 'textarea') {
      baseOperators.push(
        { value: 'contains', label: t('formBuilder.properties.conditional.operators.contains', { default: 'Contains' }) },
        { value: 'not_contains', label: t('formBuilder.properties.conditional.operators.notContains', { default: 'Does Not Contain' }) }
      );
    }

    if (fieldType === 'number' || fieldType === 'date') {
      baseOperators.push(
        { value: 'greater_than', label: t('formBuilder.properties.conditional.operators.greaterThan', { default: 'Greater Than' }) },
        { value: 'less_than', label: t('formBuilder.properties.conditional.operators.lessThan', { default: 'Less Than' }) }
      );
    }

    return baseOperators;
  };

  // Get field type for operator options
  const getFieldType = (fieldId: string) => {
    const field = availableFields.find(f => f.id === fieldId);
    return field?.type || 'text';
  };

  // Validate rules
  const validateRules = () => {
    const errors: string[] = [];
    
    conditionalLogic.rules.forEach((rule, index) => {
      if (!rule.sourceFieldId) {
        errors.push(`Rule ${index + 1}: Please select a field`);
      }
      if (!rule.operator) {
        errors.push(`Rule ${index + 1}: Please select an operator`);
      }
      if (!rule.value && !['is_empty', 'is_not_empty'].includes(rule.operator)) {
        errors.push(`Rule ${index + 1}: Please enter a value`);
      }
    });

    return errors;
  };

  const validationErrors = validateRules();
  const isValid = validationErrors.length === 0;

  // Render rule preview
  const renderRulePreview = () => {
    if (!conditionalLogic.enabled || conditionalLogic.rules.length === 0) {
      return null;
    }

    const getFieldName = (fieldId: string) => {
      const field = availableFields.find(f => f.id === fieldId);
      return field?.label || 'Unknown Field';
    };

    const getOperatorText = (operator: string) => {
      const operatorMap: Record<string, string> = {
        equals: 'equals',
        not_equals: 'does not equal',
        contains: 'contains',
        not_contains: 'does not contain',
        greater_than: 'is greater than',
        less_than: 'is less than',
        is_empty: 'is empty',
        is_not_empty: 'is not empty'
      };
      return operatorMap[operator] || operator;
    };

    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            This element will be <strong>{conditionalLogic.action}</strong> when:
          </span>
        </div>
        <div className="text-sm text-blue-700">
          {conditionalLogic.rules.map((rule, index) => (
            <div key={rule.id} className="flex items-center gap-1">
              {index > 0 && (
                <Badge variant="outline" className="text-xs mr-1">
                  {rule.logicalOperator}
                </Badge>
              )}
              <span>
                <strong>{getFieldName(rule.sourceFieldId)}</strong>{' '}
                {getOperatorText(rule.operator)}
                {!['is_empty', 'is_not_empty'].includes(rule.operator) && (
                  <> "<strong>{rule.value}</strong>"</>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
            {t('formBuilder.properties.conditional')}
            {conditionalLogic.enabled && (
              <Badge variant="secondary" className="ml-2">
                {conditionalLogic.rules.length} {conditionalLogic.rules.length === 1 ? 'rule' : 'rules'}
              </Badge>
            )}
          </CardTitle>
          <Switch
            checked={conditionalLogic.enabled}
            onCheckedChange={handleToggleEnabled}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {conditionalLogic.enabled ? (
            <div className="space-y-4">
              {/* Action Selection */}
              <div>
                <Label className="text-sm font-medium">
                  {t('formBuilder.properties.conditional.action', { default: 'Action' })}
                </Label>
                <Select value={conditionalLogic.action} onValueChange={handleActionChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="show">
                      {t('formBuilder.properties.conditional.actions.show', { default: 'Show Element' })}
                    </SelectItem>
                    <SelectItem value="hide">
                      {t('formBuilder.properties.conditional.actions.hide', { default: 'Hide Element' })}
                    </SelectItem>
                    <SelectItem value="require">
                      {t('formBuilder.properties.conditional.actions.require', { default: 'Make Required' })}
                    </SelectItem>
                    <SelectItem value="disable">
                      {t('formBuilder.properties.conditional.actions.disable', { default: 'Disable Element' })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Rules */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">
                    {t('formBuilder.properties.conditional.rules', { default: 'Rules' })}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRule}
                    className="h-8"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {t('formBuilder.properties.conditional.addRule', { default: 'Add Rule' })}
                  </Button>
                </div>

                <div className="space-y-3">
                  {conditionalLogic.rules.map((rule, index) => (
                    <Card key={rule.id} className="p-3 bg-gray-50">
                      <div className="space-y-3">
                        {/* Logical Operator (for rules after the first) */}
                        {index > 0 && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Logic:</Label>
                            <Select
                              value={rule.logicalOperator}
                              onValueChange={(value: 'AND' | 'OR') =>
                                handleRuleChange(rule.id, { logicalOperator: value })
                              }
                            >
                              <SelectTrigger className="w-20 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">AND</SelectItem>
                                <SelectItem value="OR">OR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="grid grid-cols-12 gap-2 items-end">
                          {/* Source Field */}
                          <div className="col-span-4">
                            <Label className="text-xs">Field</Label>
                            <Select
                              value={rule.sourceFieldId}
                              onValueChange={(value) =>
                                handleRuleChange(rule.id, { sourceFieldId: value })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFields
                                  .filter(field => field.id !== elementId) // Don't allow self-reference
                                  .map((field) => (
                                    <SelectItem key={field.id} value={field.id}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Operator */}
                          <div className="col-span-3">
                            <Label className="text-xs">Operator</Label>
                            <Select
                              value={rule.operator}
                              onValueChange={(value: ConditionalRule['operator']) =>
                                handleRuleChange(rule.id, { operator: value })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getOperatorOptions(getFieldType(rule.sourceFieldId)).map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Value */}
                          <div className="col-span-4">
                            <Label className="text-xs">Value</Label>
                            <Input
                              value={rule.value}
                              onChange={(e) =>
                                handleRuleChange(rule.id, { value: e.target.value })
                              }
                              placeholder="Enter value"
                              className="h-8"
                              disabled={['is_empty', 'is_not_empty'].includes(rule.operator)}
                            />
                          </div>

                          {/* Remove Button */}
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRule(rule.id)}
                              className="h-8 w-8 p-0"
                              disabled={conditionalLogic.rules.length === 1}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Validation Errors */}
              {!isValid && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      Please fix the following issues:
                    </span>
                  </div>
                  <ul className="text-sm text-red-700 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rule Preview */}
              {isValid && renderRulePreview()}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <EyeOff className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                {t('formBuilder.properties.conditional.disabled', { 
                  default: 'Conditional logic is disabled for this element' 
                })}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
} 