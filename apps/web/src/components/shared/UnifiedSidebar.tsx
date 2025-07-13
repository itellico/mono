'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Plus, 
  Calendar,
  FileText,
  Download,
  Eye,
  Clock
} from 'lucide-react';
import { FormComponentsPalette } from '@/components/form-builder/FormComponentsPalette';
import { ZoneComponentsPalette } from '@/components/admin/zone-editor/ZoneComponentsPalette';
import { useQuery } from '@tanstack/react-query';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

export type UnifiedSidebarMode = 'form' | 'zone' | 'email' | 'page';

interface LibraryItem {
  id: string;
  name: string;
  description?: string;
  elementCount: number;
  lastModified: string;
  createdAt: string;
  thumbnail?: string;
  tags?: string[];
}

interface UnifiedSidebarProps {
  mode: UnifiedSidebarMode;
  onElementSelect?: (element: any) => void;
  onLibraryItemLoad?: (item: LibraryItem) => void;
  schemas?: any[];
  optionSets?: any[];
  className?: string;
}

/**
 * UnifiedSidebar - Unified sidebar component for forms, zones, and email templates
 * Features Elements and Library tabs with mode-specific content
 * @component
 * @param {UnifiedSidebarProps} props - Component props
 * @example
 * <UnifiedSidebar
 *   mode="form"
 *   onElementSelect={handleElementSelect}
 *   onLibraryItemLoad={handleLibraryLoad}
 *   schemas={schemas}
 *   optionSets={optionSets}
 * />
 */
export function UnifiedSidebar({
  mode,
  onElementSelect,
  onLibraryItemLoad,
  schemas = [],
  optionSets = [],
  className = ''
}: UnifiedSidebarProps) {
  const t = useTranslations();
  const { trackClick } = useAuditTracking();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'elements' | 'library'>('elements');

  // Get mode-specific translations
  const getModeTranslations = () => {
    switch (mode) {
      case 'form':
        return {
          elements: t('formBuilder.tabs.elements'),
          library: t('formBuilder.tabs.library'),
          searchPlaceholder: t('formBuilder.library.searchForms'),
          noItemsFound: t('formBuilder.library.noForms'),
          createFirst: t('formBuilder.library.createFirst'),
          loadItem: t('formBuilder.library.loadForm'),
          itemName: t('formBuilder.library.formName'),
          lastModified: t('formBuilder.library.lastModified'),
          elementsCount: t('formBuilder.library.elements')
        };
      case 'zone':
        return {
          elements: t('zoneEditor.tabs.elements'),
          library: t('zoneEditor.tabs.library'),
          searchPlaceholder: t('zoneEditor.library.searchZones'),
          noItemsFound: t('zoneEditor.library.noZones'),
          createFirst: t('zoneEditor.library.createFirst'),
          loadItem: t('zoneEditor.library.loadZone'),
          itemName: t('zoneEditor.library.zoneName'),
          lastModified: t('zoneEditor.library.lastModified'),
          elementsCount: t('zoneEditor.library.elements')
        };
      case 'email':
        return {
          elements: t('emailTemplateEditor.tabs.elements'),
          library: t('emailTemplateEditor.tabs.library'),
          searchPlaceholder: t('emailTemplateEditor.library.searchTemplates'),
          noItemsFound: t('emailTemplateEditor.library.noTemplates'),
          createFirst: t('emailTemplateEditor.library.createFirst'),
          loadItem: t('emailTemplateEditor.library.loadTemplate'),
          itemName: t('emailTemplateEditor.library.templateName'),
          lastModified: t('emailTemplateEditor.library.lastModified'),
          elementsCount: t('emailTemplateEditor.library.elements')
        };
      case 'page':
        return {
          elements: t('pageEditor.tabs.elements'),
          library: t('pageEditor.tabs.library'),
          searchPlaceholder: t('pageEditor.library.searchPages'),
          noItemsFound: t('pageEditor.library.noPages'),
          createFirst: t('pageEditor.library.createFirst'),
          loadItem: t('pageEditor.library.loadPage'),
          itemName: t('pageEditor.library.pageName'),
          lastModified: t('pageEditor.library.lastModified'),
          elementsCount: t('pageEditor.library.elements')
        };
      default:
        return {
          elements: 'Elements',
          library: 'Library',
          searchPlaceholder: 'Search...',
          noItemsFound: 'No items found',
          createFirst: 'Create your first item',
          loadItem: 'Load Item',
          itemName: 'Item Name',
          lastModified: 'Last Modified',
          elementsCount: 'Elements'
        };
    }
  };

  const translations = getModeTranslations();

  // Fetch library items based on mode
  const { data: libraryItems = [], isLoading: isLoadingLibrary } = useQuery({
    queryKey: ['library-items', mode, searchQuery],
    queryFn: async () => {
      let endpoint = '';
      switch (mode) {
        case 'form':
          endpoint = '/api/v1/forms';
          break;
        case 'zone':
          endpoint = '/api/v1/zones';
          break;
        case 'email':
          endpoint = '/api/v1/email-templates';
          break;
        default:
          return [];
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${mode} items`);
      }
      
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'elements' | 'library');
    trackClick('UnifiedSidebar', { tab, mode, action: 'tab-change' });
    browserLogger.userAction('Tab changed in unified sidebar', 'UnifiedSidebar', {
      tab,
      mode,
      searchQuery
    });
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    browserLogger.userAction('Search in unified sidebar', 'UnifiedSidebar', {
      query,
      mode,
      tab: activeTab
    });
  };

  // Handle library item load
  const handleLibraryItemLoad = (item: LibraryItem) => {
    onLibraryItemLoad?.(item);
    trackClick('UnifiedSidebar', { itemId: item.id, mode, action: 'library-item-load' });
    browserLogger.userAction('Library item loaded', 'UnifiedSidebar', {
      itemId: item.id,
      itemName: item.name,
      mode
    });
  };

  // Render elements palette based on mode
  const renderElementsPalette = () => {
    switch (mode) {
      case 'form':
        return (
          <FormComponentsPalette
            schemas={schemas}
            optionSets={optionSets}
          />
        );
      case 'zone':
        return (
          <ZoneComponentsPalette />
        );
      case 'email':
        return (
          <EmailComponentsPalette />
        );
      case 'page':
        return (
          <PageComponentsPalette />
        );
      default:
        return <div>No elements available</div>;
    }
  };

  // Render library items
  const renderLibraryItems = () => {
    if (isLoadingLibrary) {
      return (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (libraryItems.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm mb-2">{translations.noItemsFound}</p>
          <p className="text-xs text-gray-400">{translations.createFirst}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {libraryItems.map((item: LibraryItem) => (
          <Card key={item.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-0">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm truncate flex-1">{item.name}</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleLibraryItemLoad(item)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  {translations.loadItem}
                </Button>
              </div>
              
              {item.description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>{item.elementCount} {translations.elementsCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(item.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
              
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      +{item.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className={`w-80 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 m-4 mb-2">
          <TabsTrigger value="elements" className="text-sm">
            {translations.elements}
          </TabsTrigger>
          <TabsTrigger value="library" className="text-sm">
            {translations.library}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="elements" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 pt-2">
              {renderElementsPalette()}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="library" className="flex-1 m-0">
          <div className="p-4 pt-2 h-full flex flex-col">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={translations.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {renderLibraryItems()}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Email Components Palette
function EmailComponentsPalette() {
  const t = useTranslations();
  
  const emailComponents = [
    {
      type: 'header',
      label: t('emailTemplateEditor.elements.header'),
      icon: '📧',
      category: 'Structure'
    },
    {
      type: 'footer',
      label: t('emailTemplateEditor.elements.footer'),
      icon: '📝',
      category: 'Structure'
    },
    {
      type: 'textBlock',
      label: t('emailTemplateEditor.elements.textBlock'),
      icon: '📄',
      category: 'Content'
    },
    {
      type: 'imageBlock',
      label: t('emailTemplateEditor.elements.imageBlock'),
      icon: '🖼️',
      category: 'Content'
    },
    {
      type: 'buttonBlock',
      label: t('emailTemplateEditor.elements.buttonBlock'),
      icon: '🔘',
      category: 'Interactive'
    },
    {
      type: 'spacer',
      label: t('emailTemplateEditor.elements.spacer'),
      icon: '⬜',
      category: 'Layout'
    },
    {
      type: 'divider',
      label: t('emailTemplateEditor.elements.divider'),
      icon: '➖',
      category: 'Layout'
    },
    {
      type: 'socialLinks',
      label: t('emailTemplateEditor.elements.socialLinks'),
      icon: '🔗',
      category: 'Social'
    },
    {
      type: 'unsubscribeLink',
      label: t('emailTemplateEditor.elements.unsubscribeLink'),
      icon: '🚫',
      category: 'Legal'
    },
    {
      type: 'personalizedGreeting',
      label: t('emailTemplateEditor.elements.personalizedGreeting'),
      icon: '👋',
      category: 'Personalization'
    }
  ];

  const categories = [...new Set(emailComponents.map(comp => comp.category))];

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">{category}</h3>
          <div className="grid grid-cols-1 gap-2">
            {emailComponents
              .filter(comp => comp.category === category)
              .map((component) => (
                <Card
                  key={component.type}
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{component.icon}</span>
                    <span className="text-sm font-medium">{component.label}</span>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Page Components Palette
function PageComponentsPalette() {
  const t = useTranslations();
  
  const pageComponents = [
    {
      type: 'heroSection',
      label: t('pageEditor.elements.heroSection'),
      icon: '🎯',
      category: 'Hero'
    },
    {
      type: 'navigationBar',
      label: t('pageEditor.elements.navigationBar'),
      icon: '🧭',
      category: 'Navigation'
    },
    {
      type: 'contentSection',
      label: t('pageEditor.elements.contentSection'),
      icon: '📄',
      category: 'Content'
    },
    {
      type: 'imageGallery',
      label: t('pageEditor.elements.imageGallery'),
      icon: '🖼️',
      category: 'Media'
    },
    {
      type: 'testimonials',
      label: t('pageEditor.elements.testimonials'),
      icon: '💬',
      category: 'Social Proof'
    },
    {
      type: 'callToAction',
      label: t('pageEditor.elements.callToAction'),
      icon: '📢',
      category: 'Marketing'
    },
    {
      type: 'contactForm',
      label: t('pageEditor.elements.contactForm'),
      icon: '📝',
      category: 'Forms'
    },
    {
      type: 'featuresGrid',
      label: t('pageEditor.elements.featuresGrid'),
      icon: '⚡',
      category: 'Content'
    },
    {
      type: 'pricingTable',
      label: t('pageEditor.elements.pricingTable'),
      icon: '💰',
      category: 'Commerce'
    },
    {
      type: 'blogPosts',
      label: t('pageEditor.elements.blogPosts'),
      icon: '📰',
      category: 'Content'
    },
    {
      type: 'socialProof',
      label: t('pageEditor.elements.socialProof'),
      icon: '🏆',
      category: 'Social Proof'
    },
    {
      type: 'newsletter',
      label: t('pageEditor.elements.newsletter'),
      icon: '📧',
      category: 'Marketing'
    },
    {
      type: 'footer',
      label: t('pageEditor.elements.footer'),
      icon: '🦶',
      category: 'Structure'
    },
    {
      type: 'breadcrumbs',
      label: t('pageEditor.elements.breadcrumbs'),
      icon: '🍞',
      category: 'Navigation'
    },
    {
      type: 'sidebar',
      label: t('pageEditor.elements.sidebar'),
      icon: '📋',
      category: 'Layout'
    },
    {
      type: 'carousel',
      label: t('pageEditor.elements.carousel'),
      icon: '🎠',
      category: 'Media'
    },
    {
      type: 'videoPlayer',
      label: t('pageEditor.elements.videoPlayer'),
      icon: '🎥',
      category: 'Media'
    },
    {
      type: 'mapEmbed',
      label: t('pageEditor.elements.mapEmbed'),
      icon: '🗺️',
      category: 'Interactive'
    },
    {
      type: 'chatWidget',
      label: t('pageEditor.elements.chatWidget'),
      icon: '💬',
      category: 'Interactive'
    },
    {
      type: 'searchBar',
      label: t('pageEditor.elements.searchBar'),
      icon: '🔍',
      category: 'Interactive'
    }
  ];

  const categories = [...new Set(pageComponents.map(comp => comp.category))];

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-gray-700 mb-2">{category}</h3>
          <div className="grid grid-cols-1 gap-2">
            {pageComponents
              .filter(comp => comp.category === category)
              .map((component) => (
                <Card
                  key={component.type}
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{component.icon}</span>
                    <span className="text-sm font-medium">{component.label}</span>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
} 