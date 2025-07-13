import { Type, Static } from '@sinclair/typebox';

export type UUID = string;

export const uuidSchema = Type.String({
  format: 'uuid',
  description: 'UUID v4 string'
});

export function toUUID(value: string): UUID {
  return value as UUID;
}

export function isValidUUID(value: string): value is UUID {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}