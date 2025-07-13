import { createLazyComponent } from '@/lib/utils/lazy-loading';

// Lazy load admin components
export const LazyUserManagement = createLazyComponent(
  () => import('@/components/admin/users/UserManagement')
);

export const LazyQueueMonitoring = createLazyComponent(
  () => import('@/components/admin/queue/QueueMonitoringPanel')
);

export const LazyDevMenu = createLazyComponent(
  () => import('@/components/admin/dev/DevMenu')
);

export const LazyTranslationEditor = createLazyComponent(
  () => import('@/components/admin/translations/TranslationEditor')
);
