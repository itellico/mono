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
import type { EditorMode, UnifiedElement } from './UnifiedEditor';

interface ComponentType {
  id: string;
  type: string;
  label: string;
  description: string;
  icon: any;
  category: string;
  acceptsChildren?: boolean;
  defaultProperties: any;
  pro?: boolean;
  // Zone-specific
  name?: string;
  displayName?: string;
  componentType?: string;
  configSchema?: any;
  defaultConfig?: any;
  metadata?: any;
}

interface UnifiedComponentsPaletteProps {
  schemas?: any[];
  optionSets?: any[];
  mode: EditorMode;
  additionalComponents?: UnifiedElement[];
}

const categoryIcons: {[key: string]: any} = {
  // Form categories
  'Basic Fields': Type,
  'Date & Time': Calendar,
  'Selection': CheckSquare,
  'Media': Image,
  'Layout': Layout,
  'Content': FileText,
  'Advanced': Code,
  'Pro Features': Star,
  // Zone categories
  'Hero Sections': Monitor,
  'Navigation': Navigation,
  'Content Blocks': Layers,
  'Forms': Square,
  'Media Elements': Video,
  'Interactive': MousePointer,
  'Commerce': ShoppingCart,
  'Social': Users
};

export function UnifiedComponentsPalette({ 
  schemas = [], 
  optionSets = [], 
  mode, 
  additionalComponents = [] 
}: UnifiedComponentsPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<{[key: string]: boolean}>(() => {
    if (mode === 'form') {
      return {
        'Basic Fields': true,
        'Date & Time': false,
        'Selection': false,
        'Media': false,
        'Layout': true,
        'Content': false,
        'Advanced': false,
        'Pro Features': false
      };
    } else if (mode === 'zone') {
      return {
        'Hero Sections': true,
        'Navigation': false,
        'Content Blocks': true,
        'Forms': false,
        'Media Elements': false,
        'Interactive': false,
        'Commerce': false,
        'Social': false
      };
    }
    return {};
  });

  // Get components based on mode
  const getComponents = (): ComponentType[] => {
    if (mode === 'form') {
      return getFormComponents();
    } else if (mode === 'zone') {
      return getZoneComponents();
    } else if (mode === 'email') {
      return getEmailComponents();
    }
    return [];
  };

  // Form components
  const getFormComponents = (): ComponentType[] => {
    return [
      // Basic Fields
      {
        id: 'text',
        type: 'text',
        label: 'Text Input',
        description: 'Single line text field',
        icon: Type,
        category: 'Basic Fields',
        defaultProperties: {
          label: 'Text Field',
          placeholder: 'Enter text...',
          required: false,
          maxLength: null
        }
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email',
        description: 'Email address input',
        icon: Mail,
        category: 'Basic Fields',
        defaultProperties: {
          label: 'Email Address',
          placeholder: 'Enter email...',
          required: false
        }
      },
      {
        id: 'phone',
        type: 'phone',
        label: 'Phone',
        description: 'Phone number input',
        icon: Phone,
        category: 'Basic Fields',
        defaultProperties: {
          label: 'Phone Number',
          placeholder: 'Enter phone...',
          required: false
        }
      },
      {
        id: 'textarea',
        type: 'textarea',
        label: 'Textarea',
        description: 'Multi-line text input',
        icon: AlignLeft,
        category: 'Basic Fields',
        defaultProperties: {
          label: 'Message',
          placeholder: 'Enter your message...',
          required: false,
          rows: 4
        }
      },
      // Selection Fields
      {
        id: 'select',
        type: 'select',
        label: 'Dropdown',
        description: 'Single selection dropdown',
        icon: List,
        category: 'Selection',
        defaultProperties: {
          label: 'Select Option',
          required: false,
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' }
          ]
        }
      },
      {
        id: 'radio',
        type: 'radio',
        label: 'Radio Group',
        description: 'Single selection radio buttons',
        icon: Circle,
        category: 'Selection',
        defaultProperties: {
          label: 'Choose One',
          required: false,
          options: [
            { label: 'Option 1', value: 'option1' },
            { label: 'Option 2', value: 'option2' }
          ]
        }
      },
      {
        id: 'checkbox',
        type: 'checkbox',
        label: 'Checkbox',
        description: 'Single checkbox',
        icon: CheckSquare,
        category: 'Selection',
        defaultProperties: {
          label: 'I agree to terms',
          required: false
        }
      },
      // Layout
      {
        id: 'section',
        type: 'section',
        label: 'Section',
        description: 'Group fields in a section',
        icon: Layout,
        category: 'Layout',
        acceptsChildren: true,
        defaultProperties: {
          label: 'Section Title',
          description: 'Section description',
          collapsible: false
        }
      },
      {
        id: 'columns',
        type: 'columns',
        label: 'Columns',
        description: 'Multi-column layout',
        icon: Columns,
        category: 'Layout',
        acceptsChildren: true,
        defaultProperties: {
          columns: 2,
          label: 'Column Layout'
        }
      }
    ];
  };

  // Zone components  
  const getZoneComponents = (): ComponentType[] => {
    return [
      // Hero Sections
      {
        id: 'hero-banner',
        type: 'hero',
        label: 'Hero Banner',
        description: 'Large banner with image and text',
        icon: Monitor,
        category: 'Hero Sections',
        name: 'HeroBanner',
        displayName: 'Hero Banner',
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
        }
      },
      {
        id: 'hero-simple',
        type: 'hero-simple',
        label: 'Simple Hero',
        description: 'Clean hero section with text',
        icon: Heading1,
        category: 'Hero Sections',
        name: 'SimpleHero',
        displayName: 'Simple Hero',
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
        label: 'Navigation Bar',
        description: 'Site navigation menu',
        icon: Navigation,
        category: 'Navigation',
        name: 'NavigationBar',
        displayName: 'Navigation',
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
      // Content Blocks
      {
        id: 'text-block',
        type: 'text-block',
        label: 'Text Block',
        description: 'Rich text content area',
        icon: FileText,
        category: 'Content Blocks',
        name: 'TextBlock',
        displayName: 'Text Block',
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
        label: 'Image Gallery',
        description: 'Photo gallery with lightbox',
        icon: Image,
        category: 'Content Blocks',
        name: 'ImageGallery',
        displayName: 'Gallery',
        componentType: 'media',
        defaultProperties: {
          images: [],
          columns: 3,
          showThumbnails: true,
          enableLightbox: true
        }
      },
      // Forms (from Form Builder)
      {
        id: 'contact-form',
        type: 'form-embed',
        label: 'Contact Form',
        description: 'Embedded contact form',
        icon: MessageSquare,
        category: 'Forms',
        name: 'ContactForm',
        displayName: 'Contact Form',
        componentType: 'form',
        defaultProperties: {
          formId: null,
          title: 'Get in Touch',
          description: 'We&apos;d love to hear from you'
        }
      },
      // Interactive
      {
        id: 'call-to-action',
        type: 'cta',
        label: 'Call to Action',
        description: 'Prominent action button',
        icon: MousePointer,
        category: 'Interactive',
        name: 'CallToAction',
        displayName: 'CTA Button',
        componentType: 'interactive',
        defaultProperties: {
          title: 'Ready to Get Started?',
          description: 'Join thousands of satisfied users',
          buttonText: 'Sign Up Now',
          buttonLink: '#',
          style: 'primary'
        }
      }
    ];
  };

  // Email components
  const getEmailComponents = (): ComponentType[] => {
    return [
      {
        id: 'email-header',
        type: 'header',
        label: 'Email Header',
        description: 'Header with logo and branding',
        icon: Heading1,
        category: 'Structure',
        defaultProperties: {
          logo: '',
          companyName: 'Your Company',
          backgroundColor: '#ffffff'
        }
      },
      {
        id: 'email-text',
        type: 'text',
        label: 'Text Block',
        description: 'Formatted text content',
        icon: Type,
        category: 'Content',
        defaultProperties: {
          content: 'Add your text here...',
          fontSize: 16,
          textAlign: 'left'
        }
      },
      {
        id: 'email-button',
        type: 'button',
        label: 'Button',
        description: 'Call-to-action button',
        icon: MousePointer,
        category: 'Interactive',
        defaultProperties: {
          text: 'Click Here',
          url: '#',
          backgroundColor: '#007bff',
          textColor: '#ffffff'
        }
      }
    ];
  };

  const components = getComponents();

  // Filter components by search term
  const filteredComponents = components.filter(component =>
    component.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  }, {} as { [key: string]: ComponentType[] });

  const handleCategoryToggle = (category: string, open: boolean) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: open
    }));
  };

  const handleDragStart = (e: React.DragEvent, component: ComponentType) => {
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
            placeholder={`Search ${mode} components...`}
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
                    <DraggableComponent
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

        {/* Additional Components (for zone editor to include forms) */}
        {additionalComponents.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Forms</h4>
            <div className="space-y-2">
              {additionalComponents.map((component) => (
                <Card key={component.id} className="cursor-move hover:shadow-sm transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{component.label}</div>
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

function DraggableComponent({ 
  component, 
  onDragStart 
}: { 
  component: ComponentType; 
  onDragStart: (e: React.DragEvent, component: ComponentType) => void;
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
                <div className="text-sm font-medium truncate">{component.label}</div>
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