// ============================
// TRANSLATION TYPES
// ============================
// 
// This file exports Prisma types for translation models
// Multi-tenant translation system with auto-translation support
// Supports dynamic entity translation with context and review workflows

import type { 
  Translation as PrismaTranslation,
  TranslationTask as PrismaTranslationTask,
  TranslationHistory as PrismaTranslationHistory,
  TranslationReview as PrismaTranslationReview
} from '@prisma/client';

// Re-export Prisma types with our naming convention
export type Translation = PrismaTranslation;
export type TranslationTask = PrismaTranslationTask;
export type TranslationHistory = PrismaTranslationHistory;
export type TranslationReview = PrismaTranslationReview;

// Create types for inserts (without auto-generated fields)
export type NewTranslation = Omit<Translation, 'id' | 'createdAt' | 'updatedAt'>;
export type NewTranslationTask = Omit<TranslationTask, 'id' | 'createdAt' | 'updatedAt'>;
export type NewTranslationHistory = Omit<TranslationHistory, 'id' | 'createdAt'>;
export type NewTranslationReview = Omit<TranslationReview, 'id' | 'createdAt' | 'updatedAt'>;

// Export the centralized Prisma client
export { db as prisma } from '@/lib/db';

// Legacy exports for backward compatibility
// These will be removed in a future version
export const translations = 'DEPRECATED: Use prisma.translation instead';
export const translationTasks = 'DEPRECATED: Use prisma.translationTask instead';
export const translationHistory = 'DEPRECATED: Use prisma.translationHistory instead';
export const translationReviews = 'DEPRECATED: Use prisma.translationReview instead';