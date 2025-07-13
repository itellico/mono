/**
 * Shared types for all MCP servers
 */

export interface ProjectStatus {
  feature: string;
  status: 'completed' | 'in_progress' | 'pending' | 'blocked';
  completion: number;
  priority: 'P0' | 'P1' | 'P2';
  effort?: string;
  notes?: string;
}

export interface APIEndpoint {
  path: string;
  tier: 'public' | 'user' | 'account' | 'tenant' | 'platform';
  resource: string;
  methods: string[];
  implemented: boolean;
  quality?: number;
  notes?: string;
}

export interface AuditResult {
  date: string;
  auditor: string;
  findings: string[];
  recommendations: string[];
  overallScore: number;
  report?: string;
}

export interface FeatureCategory {
  name: string;
  features: ProjectStatus[];
  overallCompletion: number;
}

export const API_TIERS = ['public', 'user', 'account', 'tenant', 'platform'] as const;
export type APITier = typeof API_TIERS[number];

export const PRIORITY_LEVELS = ['P0', 'P1', 'P2'] as const;
export type Priority = typeof PRIORITY_LEVELS[number];

export const STATUS_TYPES = ['completed', 'in_progress', 'pending', 'blocked'] as const;
export type Status = typeof STATUS_TYPES[number];