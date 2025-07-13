import { pgTable, uuid, varchar, text, jsonb, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Workflows table - stores workflow definitions
export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, active, inactive, archived
  version: integer('version').notNull().default(1),
  isTemplate: boolean('is_template').notNull().default(false),
  category: varchar('category', { length: 100 }),
  tags: jsonb('tags').$type<string[]>().default([]),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Workflow nodes table - stores individual nodes in workflows
export const workflowNodes = pgTable('workflow_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  nodeId: varchar('node_id', { length: 255 }).notNull(), // ReactFlow node ID
  type: varchar('type', { length: 100 }).notNull(), // start, approval, wait, decision, etc.
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description'),
  positionX: integer('position_x').notNull(),
  positionY: integer('position_y').notNull(),
  data: jsonb('data').$type<Record<string, any>>().notNull().default({}),
  config: jsonb('config').$type<Record<string, any>>().default({}),
  conditions: jsonb('conditions').$type<any[]>().default([]),
  actions: jsonb('actions').$type<any[]>().default([]),
  permissions: jsonb('permissions').$type<string[]>().default([]),
  subscriptionTierRequired: varchar('subscription_tier_required', { length: 50 }),
  status: varchar('status', { length: 50 }).default('pending'), // pending, running, completed, failed, paused
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Workflow edges table - stores connections between nodes
export const workflowEdges = pgTable('workflow_edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id, { onDelete: 'cascade' }),
  edgeId: varchar('edge_id', { length: 255 }).notNull(), // ReactFlow edge ID
  sourceNodeId: varchar('source_node_id', { length: 255 }).notNull(),
  targetNodeId: varchar('target_node_id', { length: 255 }).notNull(),
  sourceHandle: varchar('source_handle', { length: 100 }), // For decision nodes with multiple outputs
  targetHandle: varchar('target_handle', { length: 100 }),
  type: varchar('type', { length: 50 }).default('default'), // default, smoothstep, etc.
  animated: boolean('animated').default(false),
  label: varchar('label', { length: 255 }),
  style: jsonb('style').$type<Record<string, any>>().default({}),
  data: jsonb('data').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Workflow executions table - stores workflow execution instances
export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id),
  tenantId: uuid('tenant_id').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, running, completed, failed, cancelled
  triggerData: jsonb('trigger_data').$type<Record<string, any>>().default({}),
  currentNodeId: varchar('current_node_id', { length: 255 }),
  executionLog: jsonb('execution_log').$type<any[]>().default([]),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const workflowsRelations = relations(workflows, ({ many }) => ({
  nodes: many(workflowNodes),
  edges: many(workflowEdges),
  executions: many(workflowExecutions),
}));

export const workflowNodesRelations = relations(workflowNodes, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowNodes.workflowId],
    references: [workflows.id],
  }),
}));

export const workflowEdgesRelations = relations(workflowEdges, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowEdges.workflowId],
    references: [workflows.id],
  }),
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutions.workflowId],
    references: [workflows.id],
  }),
}));

// Types for TypeScript
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowNode = typeof workflowNodes.$inferSelect;
export type NewWorkflowNode = typeof workflowNodes.$inferInsert;
export type WorkflowEdge = typeof workflowEdges.$inferSelect;
export type NewWorkflowEdge = typeof workflowEdges.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert; 