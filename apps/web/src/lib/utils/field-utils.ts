import { v4 as uuidv4 } from 'uuid';

// ============================
// 🔧 FIELD UTILITIES
// ============================

/**
 * Generate a unique field ID
 */
export function generateFieldId(): string {
  return uuidv4();
}

/**
 * Validate field name (client-side validation)
 */
export function isValidFieldName(name: string): boolean {
  // Field names should be alphanumeric with underscores, no spaces
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Convert display name to field name
 */
export function displayNameToFieldName(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
} 