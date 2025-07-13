/**
 * Compatibility export for Prisma client
 * 
 * This file provides backward compatibility for code that imports
 * from '@/lib/prisma' instead of '@/lib/db'
 */

export { db as prisma } from './db';
export { db } from './db';