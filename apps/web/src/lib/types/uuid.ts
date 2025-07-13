/**
 * Type-safe UUID implementation for the itellico platform
 * Ensures compile-time type safety for UUID strings
 */

// Branded type for UUID strings
export type UUID = string & { readonly __brand: unique symbol };

// Regular expression for UUID v4 format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Type guard to check if a string is a valid UUID
 */
export function isUUID(value: unknown): value is UUID {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Safely convert a string to UUID type with validation
 * @throws {Error} if the string is not a valid UUID
 */
export function toUUID(value: string): UUID {
  if (!isUUID(value)) {
    throw new Error(`Invalid UUID format: ${value}`);
  }
  return value;
}

/**
 * Parse a string to UUID, returns null if invalid
 */
export function parseUUID(value: string): UUID | null {
  return isUUID(value) ? value : null;
}

/**
 * Assert that a value is a UUID (for use in type narrowing)
 */
export function assertUUID(value: unknown): asserts value is UUID {
  if (!isUUID(value)) {
    throw new Error(`Expected UUID but got: ${typeof value}`);
  }
}

/**
 * Create a new UUID v4
 * Note: This requires crypto.randomUUID() support
 */
export function createUUID(): UUID {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID() as UUID;
  }
  // Fallback for Node.js environments
  const { randomUUID } = require('crypto');
  return randomUUID() as UUID;
}

/**
 * Zod schema for UUID validation
 */
import { z } from 'zod';

export const uuidSchema = z.string().refine(isUUID, {
  message: 'Invalid UUID format',
});

/**
 * Type utilities for working with entities that have UUIDs
 */
export interface HasUUID {
  uuid: UUID;
}

export interface HasOptionalUUID {
  uuid?: UUID;
}

/**
 * Utility type to replace string IDs with UUID type
 */
export type WithUUID<T> = Omit<T, 'id' | 'uuid'> & HasUUID;

/**
 * Utility to extract UUID from various ID formats
 */
export function extractUUID(idOrUuid: string | number | UUID): UUID | null {
  if (typeof idOrUuid === 'string') {
    return parseUUID(idOrUuid);
  }
  return null;
}