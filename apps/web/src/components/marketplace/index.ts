export { MarketplaceClientPage } from './MarketplaceClientPage';
export { GigCard } from './GigCard';
export { GigFilters } from './GigFilters';
export { CategoryMono } from './CategoryMono';
export { FeaturedGigs } from './FeaturedGigs';

// Re-export marketplace types
export type { GigData, MarketplaceFilters } from './types';

// Marketplace-specific hooks
export { useGigs, useFeaturedGigs, useCategories } from './hooks';