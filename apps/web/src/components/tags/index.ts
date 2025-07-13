// Core tag components
export { TagSelector } from './TagSelector';
export { TagCloud } from './TagCloud';
export { TagFilter } from './TagFilter';
export { TagDisplay, fetchEntityTags } from './TagDisplay';

// Advanced tag management components (90% completion)
export { TagManager } from './TagManager';
export { EnhancedTagSelector } from './EnhancedTagSelector';
export { TagHierarchyManager } from './TagHierarchyManager';
export { TagAnalytics } from './TagAnalytics';
export { BulkTagOperations } from './BulkTagOperations';

// Re-export types
export type { TagData } from './types';

// Common tag-related utilities
export { useEntityTags, usePopularTags, useSearchTags } from './hooks';