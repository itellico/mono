/**
 * ✅ ENTERPRISE TRANSLATION CACHE - SIMPLIFIED
 * 
 * mono PLATFORM BEST PRACTICES:
 * - NO middleware integration (performance killer)
 * - Component-level loading only
 * - Simple memory cache for webpack-bundled JSON
 * - No complex promise deduplication (causes memory leaks)
 * - Minimal API surface
 */

import { logger } from '@/lib/logger';

interface CacheEntry {
  data: any;
  timestamp: number;
}

export class SimplifiedTranslationCache {
  private static cache = new Map<string, CacheEntry>();
  private static readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes only
  
  /**
   * Simple cache get/set - no complex promise handling
   */
  static get(locale: string, namespace: string): any | null {
    const cacheKey = `${locale}:${namespace}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data;
    }
    
    return null;
  }
  
  static set(locale: string, namespace: string, data: any): void {
    const cacheKey = `${locale}:${namespace}`;
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    // Prevent memory leaks - limit cache size
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  /**
   * Clear all cache - for development only
   */
  static clear(): void {
    this.cache.clear();
    logger.debug('Translation cache cleared');
  }
  
  /**
   * Get cache stats for monitoring
   */
  static getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ✅ LEGACY COMPATIBILITY - Keep old class name for existing imports
export class ModularTranslationCache {
  static async getNamespace(locale: string, namespace: string): Promise<Record<string, any>> {
    // Simple fallback - let next-intl handle the heavy lifting
    logger.warn('ModularTranslationCache is deprecated - use next-intl getTranslations() directly');
    return {};
  }
  
  static async getNamespaces(locale: string, namespaces: string[]): Promise<Record<string, any>> {
    logger.warn('ModularTranslationCache is deprecated - use next-intl getTranslations() directly');
    return {};
  }
  
  static async invalidateNamespace(): Promise<void> {
    SimplifiedTranslationCache.clear();
  }
  
  static async clearAll(): Promise<void> {
    SimplifiedTranslationCache.clear();
  }
}

// ✅ LEGACY COMPATIBILITY - Keep old class name for existing imports
export class TranslationCacheService {
  static async getTranslations(): Promise<Record<string, any>> {
    logger.warn('TranslationCacheService is deprecated - use next-intl getTranslations() directly');
    return {};
  }
  
  static async invalidateCache(): Promise<void> {
    SimplifiedTranslationCache.clear();
  }
  
  static getCacheStats() {
    return SimplifiedTranslationCache.getStats();
  }
} 