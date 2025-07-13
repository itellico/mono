'use client';

import React from 'react';
import { Plus, Trash2, Calendar, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { WorkflowCondition } from '../types/workflow';

// Mock database fields - in production, these would come from your schema
const DATABASE_FIELDS = [
  { value: 'user.email', label: 'User Email', type: 'string' },
  { value: 'user.first_name', label: 'User First Name', type: 'string' },
  { value: 'user.created_at', label: 'User Created Date', type: 'date' },
  { value: 'user.status', label: 'User Status', type: 'string' },
  { value: 'profile.age', label: 'Profile Age', type: 'number' },
  { value: 'profile.location', label: 'Profile Location', type: 'string' },
  { value: 'application.status', label: 'Application Status', type: 'string' },
  { value: 'application.applied_at', label: 'Application Date', type: 'date' },
  { value: 'job.title', label: 'Job Title', type: 'string' },
  { value: 'job.budget', label: 'Job Budget', type: 'number' },
];

const OPERATORS = {
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_equal', label: 'Greater Than or Equal' },
    { value: 'less_equal', label: 'Less Than or Equal' },
  ],
  date: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'After' },
    { value: 'less_than', label: 'Before' },
    { value: 'changed_in_last', label: 'Changed in Last' },
    { value: 'older_than', label: 'Older Than' },
  ],
};

const VALUE_TYPES = [
  { value: 'static', label: 'Static Value', icon: Database },
  { value: 'current_date', label: 'Current Date', icon: Calendar },
  { value: 'current_time', label: 'Current Time', icon: Clock },
  { value: 'field', label: 'Field Value', icon: Database },
];

interface ConditionBuilderProps {
  conditions: WorkflowCondition[];
  onChange: (conditions: WorkflowCondition[]) => void;
}

export function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const addCondition = () => {
    const newCondition: WorkflowCondition = {
      field: '',
      operator: 'equals',
      value: '',
      logicalOperator: conditions.length > 0 ? 'AND' : undefined,
    };
    onChange([...conditions, newCondition]);
  };

  const updateCondition = (index: number, updates: Partial<WorkflowCondition>) => {
    const updated = conditions.map((condition, i) => 
      i === index ? { ...condition, ...updates } : condition
    );
    onChange(updated);
  };

  const removeCondition = (index: number) => {
    const updated = conditions.filter((_, i) => i !== index);
    // Remove logical operator from first condition if it exists
    if (updated.length > 0 && updated[0].logicalOperator) {
      updated[0] = { ...updated[0], logicalOperator: undefined };
    }
    onChange(updated);
  };

  const getFieldType = (fieldValue: string): string => {
    const field = DATABASE_FIELDS.find(f => f.value === fieldValue);
    return field?.type || 'string';
  };

  const getAvailableOperators = (fieldValue: string) => {
    const fieldType = getFieldType(fieldValue);
    return OPERATORS[fieldType as keyof typeof OPERATORS] || OPERATORS.string;
  };

  const needsValueInput = (operator: string): boolean => {
    return !['is_empty', 'is_not_empty'].includes(operator);
  };

  return (
    <div className="space-y-4">
      {conditions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No conditions defined</p>
          <p className="text-xs text-gray-400 mt-1">Add conditions to control when this node executes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                {/* Logical Operator */}
                {index > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <Select
                      value={condition.logicalOperator || 'AND'}
                      onValueChange={(value) => updateCondition(index, { logicalOperator: value as 'AND' | 'OR' })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">
                          <Badge variant="secondary" className="text-xs">AND</Badge>
                        </SelectItem>
                        <SelectItem value="OR">
                          <Badge variant="outline" className="text-xs">OR</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-12 gap-3 items-end">
                  {/* Field Selection */}
                  <div className="col-span-4">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Field</label>
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, { field: value, operator: 'equals' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATABASE_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            <div className="flex items-center gap-2">
                              <Database className="w-3 h-3 text-gray-400" />
                              <span>{field.label}</span>
                              <Badge variant="outline" className="text-xs ml-auto">
                                {field.type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Operator Selection */}
                  <div className="col-span-3">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Operator</label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, { operator: value as any })}
                      disabled={!condition.field}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableOperators(condition.field).map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value Input */}
                  <div className="col-span-4">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Value</label>
                    {needsValueInput(condition.operator) ? (
                      <div className="space-y-2">
                        <Select
                          value={typeof condition.value === 'object' ? condition.value.type : 'static'}
                          onValueChange={(type) => {
                            if (type === 'static') {
                              updateCondition(index, { value: '' });
                            } else {
                              updateCondition(index, { value: { type, value: '' } });
                            }
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VALUE_TYPES.map((type) => {
                              const IconComponent = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="w-3 h-3" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>

                        {(typeof condition.value === 'string' || 
                          (typeof condition.value === 'object' && condition.value.type === 'static')) && (
                          <Input
                            placeholder="Enter value"
                            value={typeof condition.value === 'string' ? condition.value : condition.value.value}
                            onChange={(e) => updateCondition(index, { value: e.target.value })}
                            className="h-8"
                          />
                        )}

                        {typeof condition.value === 'object' && condition.value.type === 'field' && (
                          <Select
                            value={condition.value.value}
                            onValueChange={(value) => updateCondition(index, { 
                              value: { type: 'field', value } 
                            })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {DATABASE_FIELDS.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ) : (
                      <div className="h-8 flex items-center text-xs text-gray-500 italic">
                        No value needed
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={addCondition}
        className="w-full gap-2 border-dashed"
      >
        <Plus className="w-4 h-4" />
        Add Condition
      </Button>

      {conditions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-xs font-medium text-blue-800 mb-1">Preview</div>
          <div className="text-xs text-blue-600 font-mono">
            {conditions.map((condition, index) => (
              <span key={index}>
                {index > 0 && (
                  <span className="mx-2 font-bold">
                    {condition.logicalOperator || 'AND'}
                  </span>
                )}
                <span>
                  {condition.field} {condition.operator} {
                    typeof condition.value === 'object' 
                      ? `${condition.value.type}(${condition.value.value})`
                      : condition.value
                  }
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 