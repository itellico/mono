/**
 * Standard Zone Components Index
 * 
 * Exports all standard zone components and their metadata for registration
 * with the itellico Mono Zone Component Registry.
 */

// Component exports
export { AdBanner, AdBannerMeta } from './AdBanner';
export { HeroSection, HeroSectionMeta } from './HeroSection';  
export { CallToAction, CallToActionMeta } from './CallToAction';

// Component metadata collection
import { AdBannerMeta } from './AdBanner';
import { HeroSectionMeta } from './HeroSection';
import { CallToActionMeta } from './CallToAction';

// Standard component registry for bulk registration
export const STANDARD_COMPONENTS = [
  AdBannerMeta,
  HeroSectionMeta,
  CallToActionMeta
] as const;

// Component type definitions for TypeScript
export type StandardComponentId = 'ad-banner' | 'hero-section' | 'call-to-action';

export type StandardComponentCategory = 'marketing' | 'layout';

// Component metadata lookup
export const COMPONENT_METADATA = {
  'ad-banner': AdBannerMeta,
  'hero-section': HeroSectionMeta,
  'call-to-action': CallToActionMeta
} as const; 