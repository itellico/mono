'use client';

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { 
  Type, 
  Mail, 
  Phone, 
  Square, 
  Layout, 
  Columns,
  ChevronDown,
  Calendar,
  Clock,
  CheckSquare,
  Circle,
  List,
  Image,
  FileText,
  Star,
  Link,
  MapPin,
  Hash,
  DollarSign,
  Percent,
  BarChart,
  FileUp,
  Video,
  Music,
  Paperclip,
  AlignLeft,
  Heading1,
  MessageSquare,
  Eye,
  ToggleLeft,
  Sliders,
  Minus,
  Palette,
  Code,
  Database,
  MoreHorizontal,
  MousePointer,
  Monitor,
  Smartphone,
  Users,
  ShoppingCart,
  Search,
  PlayCircle,
  Navigation,
  Grid,
  Layers
} from 'lucide-react';

interface ZoneComponentType {
  id: string;
  type: string;
  name: string;
  displayName: string;
  label: string;
  description: string;
  icon: any;
  category: string;
  componentType: string;
  acceptsChildren?: boolean;
  defaultProperties: any;
  defaultConfig?: any;
  configSchema?: any;
  metadata?: any;
  pro?: boolean;
}

interface ZoneComponentsPaletteProps {
  availableForms?: any[];
}

const categoryIcons: {[key: string]: any} = {
  'Hero Sections': Monitor,
  'Navigation': Navigation,
  'Content Blocks': Layers,
  'Forms': MessageSquare,
  'Media Elements': Video,
  'Interactive': MousePointer,
  'Commerce': ShoppingCart,
  'Social': Users,
  'Layout': Layout
};

export function ZoneComponentsPalette({ availableForms = [] }: ZoneComponentsPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<{[key: string]: boolean}>({
    'Hero Sections': true,
    'Navigation': false,
    'Content Blocks': true,
    'Forms': false,
    'Media Elements': false,
    'Interactive': false,
    'Commerce': false,
    'Social': false,
    'Layout': true
  });

  const components: ZoneComponentType[] = [
    // Hero Sections
    {
      id: 'hero-banner',
      type: 'hero',
      name: 'HeroBanner',
      displayName: 'Hero Banner',
      label: 'Hero Banner',
      description: 'Large banner with image and text',
      icon: Monitor,
      category: 'Hero Sections',
      componentType: 'layout',
      defaultProperties: {
        title: 'Welcome to Our Platform',
        subtitle: 'Discover amazing opportunities',
        backgroundImage: '',
        showCTA: true,
        ctaText: 'Get Started',
        ctaLink: '#'
      },
      defaultConfig: {
        height: 'lg',
        alignment: 'center',
        overlay: true
      },
      configSchema: {
        type: 'object',
        properties: {
          height: { type: 'string', enum: ['sm', 'md', 'lg', 'xl'] },
          alignment: { type: 'string', enum: ['left', 'center', 'right'] },
          overlay: { type: 'boolean' }
        }
      }
    },
    {
      id: 'hero-simple',
      type: 'hero-simple',
      name: 'SimpleHero',
      displayName: 'Simple Hero',
      label: 'Simple Hero',
      description: 'Clean hero section with text',
      icon: Heading1,
      category: 'Hero Sections',
      componentType: 'layout',
      defaultProperties: {
        title: 'Main Heading',
        description: 'Supporting text description',
        showButton: true,
        buttonText: 'Learn More'
      }
    },

    // Navigation
    {
      id: 'navigation',
      type: 'navigation',
      name: 'NavigationBar',
      displayName: 'Navigation',
      label: 'Navigation Bar',
      description: 'Site navigation menu',
      icon: Navigation,
      category: 'Navigation',
      componentType: 'navigation',
      defaultProperties: {
        logo: '',
        menuItems: [
          { label: 'Home', link: '/' },
          { label: 'About', link: '/about' },
          { label: 'Contact', link: '/contact' }
        ],
        showSearch: false,
        showUserMenu: true
      }
    },
    {
      id: 'breadcrumb',
      type: 'breadcrumb',
      name: 'Breadcrumb',
      displayName: 'Breadcrumb',
      label: 'Breadcrumb Navigation',
      description: 'Hierarchical navigation trail',
      icon: ChevronDown,
      category: 'Navigation',
      componentType: 'navigation',
      defaultProperties: {
        items: [
          { label: 'Home', link: '/' },
          { label: 'Category', link: '/category' },
          { label: 'Current Page', link: null }
        ],
        separator: '/',
        showHome: true
      }
    },

    // Content Blocks
    {
      id: 'text-block',
      type: 'text-block',
      name: 'TextBlock',
      displayName: 'Text Block',
      label: 'Text Block',
      description: 'Rich text content area',
      icon: FileText,
      category: 'Content Blocks',
      componentType: 'content',
      defaultProperties: {
        content: '<p>Add your content here...</p>',
        alignment: 'left',
        fontSize: 'medium'
      }
    },
    {
      id: 'image-gallery',
      type: 'gallery',
      name: 'ImageGallery',
      displayName: 'Gallery',
      label: 'Image Gallery',
      description: 'Photo gallery with lightbox',
      icon: Image,
      category: 'Content Blocks',
      componentType: 'media',
      defaultProperties: {
        images: [],
        columns: 3,
        showThumbnails: true,
        enableLightbox: true
      }
    },
    {
      id: 'video-player',
      type: 'video',
      name: 'VideoPlayer',
      displayName: 'Video',
      label: 'Video Player',
      description: 'Embedded video player',
      icon: Video,
      category: 'Content Blocks',
      componentType: 'media',
      defaultProperties: {
        videoUrl: '',
        autoplay: false,
        controls: true,
        loop: false,
        muted: false
      }
    },

    // Forms (from Form Builder)
    {
      id: 'contact-form',
      type: 'form-embed',
      name: 'ContactForm',
      displayName: 'Contact Form',
      label: 'Contact Form',
      description: 'Embedded contact form',
      icon: MessageSquare,
      category: 'Forms',
      componentType: 'form',
      defaultProperties: {
        formId: null,
        title: 'Get in Touch',
        description: 'We&apos;d love to hear from you'
      }
    },
    {
      id: 'newsletter-signup',
      type: 'newsletter',
      name: 'NewsletterSignup',
      displayName: 'Newsletter',
      label: 'Newsletter Signup',
      description: 'Email subscription form',
      icon: Mail,
      category: 'Forms',
      componentType: 'form',
      defaultProperties: {
        title: 'Stay Updated',
        description: 'Subscribe to our newsletter',
        buttonText: 'Subscribe',
        showPrivacy: true
      }
    },

    // Interactive
    {
      id: 'call-to-action',
      type: 'cta',
      name: 'CallToAction',
      displayName: 'CTA Button',
      label: 'Call to Action',
      description: 'Prominent action button',
      icon: MousePointer,
      category: 'Interactive',
      componentType: 'interactive',
      defaultProperties: {
        title: 'Ready to Get Started?',
        description: 'Join thousands of satisfied users',
        buttonText: 'Sign Up Now',
        buttonLink: '#',
        style: 'primary'
      }
    },
    {
      id: 'search-bar',
      type: 'search',
      name: 'SearchBar',
      displayName: 'Search',
      label: 'Search Bar',
      description: 'Site-wide search functionality',
      icon: Search,
      category: 'Interactive',
      componentType: 'interactive',
      defaultProperties: {
        placeholder: 'Search...',
        showSuggestions: true,
        searchEndpoint: '/api/search'
      }
    },

    // Layout
    {
      id: 'container',
      type: 'container',
      name: 'Container',
      displayName: 'Container',
      label: 'Container',
      description: 'Content container with padding',
      icon: Square,
      category: 'Layout',
      componentType: 'layout',
      acceptsChildren: true,
      defaultProperties: {
        maxWidth: 'xl',
        padding: 'md',
        backgroundColor: 'transparent'
      }
    },
    {
      id: 'grid',
      type: 'grid',
      name: 'Grid',
      displayName: 'Grid Layout',
      label: 'Grid Layout',
      description: 'Multi-column grid layout',
      icon: Grid,
      category: 'Layout',
      componentType: 'layout',
      acceptsChildren: true,
      defaultProperties: {
        columns: 3,
        gap: 'md',
        responsive: true
      }
    },
    {
      id: 'section',
      type: 'section',
      name: 'Section',
      displayName: 'Section',
      label: 'Section',
      description: 'Full-width section container',
      icon: Layout,
      category: 'Layout',
      componentType: 'layout',
      acceptsChildren: true,
      defaultProperties: {
        backgroundColor: 'white',
        padding: 'lg',
        fullWidth: true
      }
    },

    // Media Elements
    {
      id: 'image-block',
      type: 'image',
      name: 'ImageBlock',
      displayName: 'Image',
      label: 'Image Block',
      description: 'Single image with caption',
      icon: Image,
      category: 'Media Elements',
      componentType: 'media',
      defaultProperties: {
        src: '',
        alt: '',
        caption: '',
        alignment: 'center',
        rounded: false
      }
    },
    {
      id: 'carousel',
      type: 'carousel',
      name: 'Carousel',
      displayName: 'Carousel',
      label: 'Image Carousel',
      description: 'Sliding image carousel',
      icon: Columns,
      category: 'Media Elements',
      componentType: 'media',
      defaultProperties: {
        images: [],
        autoplay: true,
        showDots: true,
        showArrows: true,
        interval: 5000
      }
    },

    // Commerce
    {
      id: 'product-card',
      type: 'product',
      name: 'ProductCard',
      displayName: 'Product Card',
      label: 'Product Card',
      description: 'Product display with price',
      icon: ShoppingCart,
      category: 'Commerce',
      componentType: 'commerce',
      defaultProperties: {
        title: 'Product Name',
        price: '$99.99',
        image: '',
        description: 'Product description',
        buttonText: 'Add to Cart'
      },
      pro: true
    },

    // Social
    {
      id: 'social-links',
      type: 'social',
      name: 'SocialLinks',
      displayName: 'Social Links',
      label: 'Social Media Links',
      description: 'Social media icon links',
      icon: Users,
      category: 'Social',
      componentType: 'social',
      defaultProperties: {
        platforms: [
          { name: 'facebook', url: '', icon: 'facebook' },
          { name: 'twitter', url: '', icon: 'twitter' },
          { name: 'instagram', url: '', icon: 'instagram' }
        ],
        size: 'md',
        style: 'icon'
      }
    }
  ];

  // Filter components by search term
  const filteredComponents = components.filter(component =>
    component.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group components by category
  const componentsByCategory = filteredComponents.reduce((acc, component) => {
    const category = component.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(component);
    return acc;
  }, {} as { [key: string]: ZoneComponentType[] });

  const handleCategoryToggle = (category: string, open: boolean) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: open
    }));
  };

  const handleDragStart = (e: React.DragEvent, component: ZoneComponentType) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...component,
      isFromPalette: true
    }));
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Input
            placeholder="Search zone components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>

        {/* Component Categories */}
        <div className="space-y-2">
          {Object.entries(componentsByCategory).map(([category, categoryComponents]) => {
            const CategoryIcon = categoryIcons[category] || Square;
            const isOpen = openCategories[category] ?? false;

            return (
              <Collapsible
                key={category}
                open={isOpen}
                onOpenChange={(open) => handleCategoryToggle(category, open)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <div className="flex items-center space-x-2">
                      <CategoryIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{category}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {categoryComponents.length}
                      </Badge>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-2 pt-2">
                  {categoryComponents.map((component) => (
                    <DraggableZoneComponent
                      key={component.id}
                      component={component}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {/* Available Forms */}
        {availableForms.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Forms</h4>
            <div className="space-y-2">
              {availableForms.map((form) => (
                <Card key={form.id} className="cursor-move hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{form.title}</div>
                        <div className="text-xs text-gray-500">Form Component</div>
                      </div>
                      <Badge variant="outline" className="text-xs">Form</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Square className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No components found</p>
            <p className="text-xs">Try adjusting your search</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function DraggableZoneComponent({ 
  component, 
  onDragStart 
}: { 
  component: ZoneComponentType; 
  onDragStart: (e: React.DragEvent, component: ZoneComponentType) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: component.id,
    data: {
      ...component,
      isFromPalette: true
    }
  });

  const Icon = component.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      draggable
      onDragStart={(e) => onDragStart(e, component)}
      className={`
        cursor-move transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-102'}
      `}
    >
      <Card className={`
        hover:shadow-sm border-gray-200 transition-all duration-200
        ${isDragging ? 'shadow-lg border-blue-300' : ''}
      `}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium truncate">{component.displayName}</div>
                {component.pro && (
                  <Badge variant="secondary" className="text-xs">Pro</Badge>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate">{component.description}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 