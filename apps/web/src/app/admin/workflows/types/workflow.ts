export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty' | 'contains' | 'starts_with' | 'ends_with' | 'changed_in_last' | 'older_than';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'send_email' | 'update_field' | 'create_record' | 'webhook' | 'assign_task' | 'log_event';
  parameters: Record<string, any>;
  description?: string;
}

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  config?: Record<string, any>;
  permissions?: string[];
  subscriptionTierRequired?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: any[];
  edges: any[];
  tags: string[];
  icon?: string;
}

export interface SchemaTable {
  name: string;
  displayName: string;
  fields: SchemaField[];
}

export interface SchemaField {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'email' | 'phone' | 'url' | 'json';
  required?: boolean;
  description?: string;
}

export interface NodeTypeDefinition {
  type: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  configSchema?: Record<string, any>;
} 