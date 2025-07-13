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
  Zap,
  Target,
  Users,
  Quote,
  PlayCircle,
  Grid3X3,
  Container,
  Search,
  Share2,
  ShoppingCart,
  MousePointer,
  Megaphone,
  Award,
  Bookmark,
  Navigation,
  Menu,
  Home,
  ArrowRight,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Heart,
  ThumbsUp,
  Send,
  Bell,
  Settings,
  Filter,
  Layers,
  Box,
  Frame
} from 'lucide-react';

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
}

interface FormComponentsPaletteProps {
  schemas: any[];
  optionSets: any[];
}

const categoryIcons: {[key: string]: any} = {
  'Basic Fields': Type,
  'Date & Time': Calendar,
  'Selection': CheckSquare,
  'Media': Image,
  'Layout': Layout,
  'Content': FileText,
  'Advanced': Code,
  'Pro Features': Star,
  'Marketing': Megaphone,
  'Layout Blocks': Grid3X3,
  'Interactive': MousePointer,
  'Navigation': Navigation,
  'Forms': Square
};

export function FormComponentsPalette({ schemas, optionSets }: FormComponentsPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategories, setOpenCategories] = useState<{[key: string]: boolean}>({
    'Basic Fields': true,
    'Date & Time': false,
    'Selection': false,
    'Media': false,
    'Layout': true,
    'Content': false,
    'Advanced': false,
    'Pro Features': false,
    'Marketing': true,
    'Layout Blocks': false,
    'Interactive': false,
    'Navigation': false,
    'Forms': false
  });

  const components: ComponentType[] = [
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
    {
      id: 'number',
      type: 'number',
      label: 'Number',
      description: 'Numeric input field',
      icon: Hash,
      category: 'Basic Fields',
      defaultProperties: {
        label: 'Number',
        placeholder: 'Enter number...',
        required: false,
        min: null,
        max: null
      }
    },
    {
      id: 'password',
      type: 'password',
      label: 'Password',
      description: 'Password input field',
      icon: Eye,
      category: 'Basic Fields',
      defaultProperties: {
        label: 'Password',
        placeholder: 'Enter password...',
        required: false
      }
    },

    // Date & Time
    {
      id: 'date',
      type: 'date',
      label: 'Date',
      description: 'Date picker',
      icon: Calendar,
      category: 'Date & Time',
      defaultProperties: {
        label: 'Date',
        required: false
      }
    },
    {
      id: 'time',
      type: 'time',
      label: 'Time',
      description: 'Time picker',
      icon: Clock,
      category: 'Date & Time',
      defaultProperties: {
        label: 'Time',
        required: false
      }
    },
    {
      id: 'datetime',
      type: 'datetime',
      label: 'Date & Time',
      description: 'Date and time picker',
      icon: Calendar,
      category: 'Date & Time',
      defaultProperties: {
        label: 'Date & Time',
        required: false
      }
    },

    // Selection
    {
      id: 'select',
      type: 'select',
      label: 'Dropdown',
      description: 'Select from options',
      icon: List,
      category: 'Selection',
      defaultProperties: {
        label: 'Select Option',
        placeholder: 'Choose an option...',
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
      label: 'Radio Buttons',
      description: 'Single choice selection',
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
      label: 'Checkboxes',
      description: 'Multiple choice selection',
      icon: CheckSquare,
      category: 'Selection',
      defaultProperties: {
        label: 'Select All That Apply',
        required: false,
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' }
        ]
      }
    },
    {
      id: 'switch',
      type: 'switch',
      label: 'Toggle Switch',
      description: 'On/off toggle',
      icon: ToggleLeft,
      category: 'Selection',
      defaultProperties: {
        label: 'Enable Feature',
        required: false,
        defaultValue: false
      }
    },

    // Media
    {
      id: 'file',
      type: 'file',
      label: 'File Upload',
      description: 'File upload field',
      icon: FileUp,
      category: 'Media',
      defaultProperties: {
        label: 'Upload File',
        accept: '*/*',
        required: false,
        multiple: false
      }
    },
    {
      id: 'image',
      type: 'image',
      label: 'Image Upload',
      description: 'Image upload field',
      icon: Image,
      category: 'Media',
      defaultProperties: {
        label: 'Upload Image',
        accept: 'image/*',
        required: false,
        multiple: false
      }
    },
    {
      id: 'video',
      type: 'video',
      label: 'Video Upload',
      description: 'Video upload field',
      icon: Video,
      category: 'Media',
      pro: true,
      defaultProperties: {
        label: 'Upload Video',
        accept: 'video/*',
        required: false
      }
    },

    // Layout
    {
      id: 'section',
      type: 'section',
      label: 'Section',
      description: 'Container section',
      icon: Square,
      category: 'Layout',
      acceptsChildren: true,
      defaultProperties: {
        title: 'Section Title',
        columns: 1,
        background: '#ffffff',
        padding: 16
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
        gap: 16
      }
    },
    {
      id: 'card',
      type: 'card',
      label: 'Card',
      description: 'Card container',
      icon: Square,
      category: 'Layout',
      acceptsChildren: true,
      defaultProperties: {
        title: 'Card Title',
        padding: 16,
        shadow: true
      }
    },

    // Content
    {
      id: 'heading',
      type: 'heading',
      label: 'Heading',
      description: 'Heading text',
      icon: Heading1,
      category: 'Content',
      defaultProperties: {
        text: 'Heading Text',
        size: 'h2',
        align: 'left',
        color: '#000000'
      }
    },
    {
      id: 'paragraph',
      type: 'paragraph',
      label: 'Paragraph',
      description: 'Paragraph text',
      icon: FileText,
      category: 'Content',
      defaultProperties: {
        text: 'This is a paragraph of text.',
        align: 'left',
        color: '#000000'
      }
    },
    {
      id: 'divider',
      type: 'divider',
      label: 'Divider',
      description: 'Horizontal line',
      icon: Minus,
      category: 'Content',
      defaultProperties: {
        style: 'solid',
        color: '#e5e7eb',
        thickness: 1,
        margin: 16
      }
    },

    // Advanced
    {
      id: 'range',
      type: 'range',
      label: 'Range Slider',
      description: 'Range slider input',
      icon: Sliders,
      category: 'Advanced',
      defaultProperties: {
        label: 'Select Range',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50
      }
    },
    {
      id: 'rating',
      type: 'rating',
      label: 'Star Rating',
      description: 'Star rating input',
      icon: Star,
      category: 'Advanced',
      pro: true,
      defaultProperties: {
        label: 'Rate this',
        maxRating: 5,
        required: false
      }
    },
    {
      id: 'signature',
      type: 'signature',
      label: 'Signature',
      description: 'Digital signature pad',
      icon: Paperclip,
      category: 'Advanced',
      pro: true,
      defaultProperties: {
        label: 'Digital Signature',
        required: false
      }
    },

    // ===== NEW MARKETING COMPONENTS =====
    {
      id: 'hero-section',
      type: 'hero-section',
      label: 'Hero Section',
      description: 'Large banner with headline and CTA',
      icon: Zap,
      category: 'Marketing',
      acceptsChildren: true,
      defaultProperties: {
        headline: 'Welcome to Our Platform',
        subheadline: 'Create amazing experiences with our tools',
        buttonText: 'Get Started',
        buttonLink: '#',
        backgroundImage: '',
        backgroundColor: '#f8fafc',
        textColor: '#1f2937',
        alignment: 'center'
      }
    },
    {
      id: 'cta-button',
      type: 'cta-button',
      label: 'Call-to-Action',
      description: 'Prominent action button',
      icon: Target,
      category: 'Marketing',
      defaultProperties: {
        text: 'Get Started Today',
        link: '#',
        style: 'primary',
        size: 'large',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        borderRadius: 8
      }
    },
    {
      id: 'testimonial',
      type: 'testimonial',
      label: 'Testimonial',
      description: 'Customer testimonial card',
      icon: Quote,
      category: 'Marketing',
      defaultProperties: {
        quote: 'This product changed my life! Highly recommended.',
        author: 'Jane Smith',
        title: 'CEO, Company',
        avatar: '',
        rating: 5
      }
    },
    {
      id: 'feature-highlight',
      type: 'feature-highlight',
      label: 'Feature Highlight',
      description: 'Showcase product features',
      icon: Award,
      category: 'Marketing',
      acceptsChildren: true,
      defaultProperties: {
        title: 'Amazing Feature',
        description: 'This feature will help you achieve your goals faster.',
        icon: 'star',
        layout: 'horizontal'
      }
    },
    {
      id: 'pricing-card',
      type: 'pricing-card',
      label: 'Pricing Card',
      description: 'Product pricing display',
      icon: DollarSign,
      category: 'Marketing',
      pro: true,
      defaultProperties: {
        title: 'Pro Plan',
        price: '$29',
        period: 'month',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        buttonText: 'Choose Plan',
        highlighted: false
      }
    },
    {
      id: 'social-proof',
      type: 'social-proof',
      label: 'Social Proof',
      description: 'Customer logos and stats',
      icon: Users,
      category: 'Marketing',
      defaultProperties: {
        title: 'Trusted by 10,000+ customers',
        logos: [],
        stats: [
          { number: '10,000+', label: 'Happy Customers' },
          { number: '99.9%', label: 'Uptime' }
        ]
      }
    },

    // ===== NEW LAYOUT BLOCKS =====
    {
      id: 'container',
      type: 'container',
      label: 'Container',
      description: 'Content container with max-width',
      icon: Container,
      category: 'Layout Blocks',
      acceptsChildren: true,
      defaultProperties: {
        maxWidth: '1200px',
        padding: 24,
        backgroundColor: 'transparent',
        centerContent: true
      }
    },
    {
      id: 'grid',
      type: 'grid',
      label: 'Grid Layout',
      description: 'Responsive grid system',
      icon: Grid3X3,
      category: 'Layout Blocks',
      acceptsChildren: true,
      defaultProperties: {
        columns: 3,
        gap: 16,
        responsive: true
      }
    },
    {
      id: 'flex-row',
      type: 'flex-row',
      label: 'Flex Row',
      description: 'Horizontal flex container',
      icon: ArrowRight,
      category: 'Layout Blocks',
      acceptsChildren: true,
      defaultProperties: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 16,
        wrap: false
      }
    },
    {
      id: 'spacer',
      type: 'spacer',
      label: 'Spacer',
      description: 'Empty space divider',
      icon: Minus,
      category: 'Layout Blocks',
      defaultProperties: {
        height: 40,
        width: '100%'
      }
    },

    // ===== NEW INTERACTIVE COMPONENTS =====
    {
      id: 'search-bar',
      type: 'search-bar',
      label: 'Search Bar',
      description: 'Search input with button',
      icon: Search,
      category: 'Interactive',
      defaultProperties: {
        placeholder: 'Search...',
        buttonText: 'Search',
        showButton: true,
        fullWidth: true
      }
    },
    {
      id: 'social-links',
      type: 'social-links',
      label: 'Social Links',
      description: 'Social media icons',
      icon: Share2,
      category: 'Interactive',
      defaultProperties: {
        platforms: ['facebook', 'twitter', 'instagram', 'linkedin'],
        style: 'icons',
        size: 'medium',
        alignment: 'center'
      }
    },
    {
      id: 'newsletter-signup',
      type: 'newsletter-signup',
      label: 'Newsletter Signup',
      description: 'Email subscription form',
      icon: Send,
      category: 'Interactive',
      defaultProperties: {
        title: 'Subscribe to our newsletter',
        description: 'Get the latest updates and offers.',
        placeholder: 'Enter your email...',
        buttonText: 'Subscribe',
        layout: 'horizontal'
      }
    },
    {
      id: 'contact-form',
      type: 'contact-form',
      label: 'Contact Form',
      description: 'Pre-built contact form',
      icon: MessageSquare,
      category: 'Interactive',
      defaultProperties: {
        title: 'Contact Us',
        fields: ['name', 'email', 'message'],
        buttonText: 'Send Message'
      }
    },

    // ===== NEW NAVIGATION COMPONENTS =====
    {
      id: 'navbar',
      type: 'navbar',
      label: 'Navigation Bar',
      description: 'Website navigation menu',
      icon: Menu,
      category: 'Navigation',
      defaultProperties: {
        brand: 'Your Brand',
        links: [
          { label: 'Home', url: '#' },
          { label: 'About', url: '#' },
          { label: 'Contact', url: '#' }
        ],
        style: 'horizontal',
        sticky: false
      }
    },
    {
      id: 'breadcrumbs',
      type: 'breadcrumbs',
      label: 'Breadcrumbs',
      description: 'Navigation breadcrumb trail',
      icon: ArrowRight,
      category: 'Navigation',
      defaultProperties: {
        items: [
          { label: 'Home', url: '#' },
          { label: 'Products', url: '#' },
          { label: 'Current Page', url: '#' }
        ],
        separator: '/'
      }
    },
    {
      id: 'footer',
      type: 'footer',
      label: 'Footer',
      description: 'Website footer section',
      icon: Minus,
      category: 'Navigation',
      acceptsChildren: true,
      defaultProperties: {
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        copyright: '© 2024 Your Company. All rights reserved.',
        columns: 3
      }
    },

    // ===== FORMS CATEGORY (for saved forms) =====
    {
      id: 'saved-form',
      type: 'saved-form',
      label: 'Saved Form',
      description: 'Insert existing form',
      icon: Square,
      category: 'Forms',
      defaultProperties: {
        formId: null,
        formName: 'Select a form...'
      }
    }
  ];

  const handleCategoryToggle = (category: string, open: boolean) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: open
    }));
  };

  const handleDragStart = (e: React.DragEvent, component: ComponentType) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      isFromPalette: true,
      type: component.type,
      label: component.label,
      icon: component.icon,
      defaultProperties: component.defaultProperties,
      acceptsChildren: component.acceptsChildren
    }));
  };

  const filteredComponents = components.filter(component =>
    component.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedComponents = filteredComponents.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as {[key: string]: ComponentType[]});

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-3 border-b border-gray-200 bg-white">
        <h3 className="font-medium text-gray-900 mb-2 text-sm">Components</h3>
        <Input
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-xs h-7"
        />
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {Object.entries(groupedComponents).map(([category, components]) => {
            const Icon = categoryIcons[category] || MoreHorizontal;
            return (
              <Collapsible key={category} open={openCategories[category]} onOpenChange={(open) => handleCategoryToggle(category, open)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-2 py-1 h-auto text-xs font-medium hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-3 w-3" />
                      <span>{category} ({components.length})</span>
                    </div>
                    <ChevronDown className={`h-3 w-3 transition-transform ${openCategories[category] ? 'transform rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1">
                  <div className="grid grid-cols-1 gap-1 pl-1">
                    {components.map((component) => (
                      <DraggableComponent key={component.id} component={component} />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
      

    </div>
  );
}

function DraggableComponent({ component }: { component: ComponentType }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: component.id,
    data: {
      isFromPalette: true,
      type: component.type,
      label: component.label,
      icon: component.icon,
      defaultProperties: component.defaultProperties,
      acceptsChildren: component.acceptsChildren
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      <div className="group relative bg-white border border-gray-200 rounded-md p-1.5 hover:shadow-sm hover:border-blue-300 transition-all duration-150">
        <div className="flex items-center space-x-2">
          <component.icon className="h-3 w-3 text-gray-500 group-hover:text-blue-600 transition-colors flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-900 truncate">
                {component.label}
              </span>
              {component.pro && (
                <Badge variant="secondary" className="text-xs px-1 py-0 h-3">
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {component.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
