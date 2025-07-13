// ============================
// 🏗️ SHARED TEMPLATE TYPES
// ============================

export type TemplateContext = 'form' | 'search' | 'card' | 'list' | 'dashboard';

export interface ParsedSchema {
  id: string;
  tenantId: string | null;
  type: string;
  subType: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  fields: ParsedSchemaField[];
  metadata: Record<string, any>;
  version: string;
}

export interface ParsedSchemaField {
  id: string;
  name: string;
  label: Record<string, string>;
  type: string;
  required?: boolean;
  order: number;
  tab?: string;
  group?: string;
  unit?: string;
  visibleToRoles?: string[];
  editableByRoles?: string[];
  requiredByRoles?: string[];
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  system?: boolean; // System fields (name, email, etc.)
}

export interface ParsedOption {
  value: string;
  label: string;
  metadata?: Record<string, any>;
} 