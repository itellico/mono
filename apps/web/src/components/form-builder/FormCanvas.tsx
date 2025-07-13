'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Grip,
  Copy,
  Trash2,
  Type,
  Hash,
  Mail,
  Calendar,
  FileText,
  Image,
  Video,
  Upload,
  MapPin,
  Phone,
  Link,
  Star,
  CheckSquare,
  Radio,
  ChevronDown,
  Sliders,
  ToggleLeft,
  Grid3X3,
  Rows,
  Layout,
  Square,
  Minus,
  Heading,
  AlignLeft,
  Plus,
  // New icons for marketing/zone components
  Zap,
  Target,
  Quote,
  Award,
  DollarSign,
  Users,
  Container,
  ArrowRight,
  Search,
  Share2,
  Send,
  MessageSquare,
  Menu,
  Navigation,
  Globe,
  Heart,
  ThumbsUp,
  PlayCircle,
  MousePointer
} from 'lucide-react';
import { FormElement } from './ElementorFormBuilder';

interface FormCanvasProps {
  elements: FormElement[];
  selectedElement: FormElement | null;
  onElementSelect: (element: FormElement | null) => void;
  onElementUpdate: (elementId: string, updates: Partial<FormElement>) => void;
  onElementDelete: (elementId: string) => void;
  onElementDuplicate: (elementId: string) => void;
  deviceView: 'desktop' | 'tablet' | 'mobile';
  hoveredDropZone?: string | null;
  onDropZoneHover?: (zoneId: string | null) => void;
}

// Icon mapping for different element types
const elementIcons: Record<string, any> = {
  // Form fields
  text: Type,
  number: Hash,
  email: Mail,
  date: Calendar,
  textarea: FileText,
  image: Image,
  video: Video,
  file: Upload,
  address: MapPin,
  phone: Phone,
  url: Link,
  rating: Star,
  checkbox: CheckSquare,
  radio: Radio,
  select: ChevronDown,
  range: Sliders,
  toggle: ToggleLeft,
  section: Grid3X3,
  columns: Rows,
  container: Layout,
  card: Square,
  divider: Minus,
  heading: Heading,
  paragraph: AlignLeft,
  
  // Marketing components
  'hero-section': Zap,
  'cta-button': Target,
  'testimonial': Quote,
  'feature-highlight': Award,
  'pricing-card': DollarSign,
  'social-proof': Users,
  
  // Layout blocks
  'grid': Grid3X3,
  'flex-row': ArrowRight,
  'spacer': Minus,
  
  // Interactive components
  'search-bar': Search,
  'social-links': Share2,
  'newsletter-signup': Send,
  'contact-form': MessageSquare,
  
  // Navigation components
  'navbar': Menu,
  'breadcrumbs': Navigation,
  'footer': Square,
  
  // Forms category
  'saved-form': Square
};

// DropZone component for better drag and drop UX
function DropZone({ 
  id, 
  isVisible = true,
  className = "",
  children 
}: { 
  id: string; 
  isVisible?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: 'dropzone'
    }
  });

  if (!isVisible) return children || null;

  return (
    <div
      ref={setNodeRef}
      className={`
        relative transition-all duration-150
        ${isOver 
          ? 'bg-blue-50 border-2 border-dashed border-blue-400' 
          : 'border-2 border-dashed border-transparent hover:border-gray-300'
        }
        ${className}
      `}
    >
      {isOver && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
          <div className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium">
            Drop element here
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// Sortable Element Wrapper
function SortableElement({ 
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete, 
  onDuplicate,
  children 
}: {
  element: FormElement;
  isSelected: boolean;
  onSelect: (element: FormElement) => void;
  onUpdate: (elementId: string, updates: Partial<FormElement>) => void;
  onDelete: (elementId: string) => void;
  onDuplicate: (elementId: string) => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: element.id,
    data: {
      type: 'element',
      element,
      isExistingElement: true
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group cursor-pointer transition-all duration-150
        ${isSelected 
          ? 'ring-2 ring-blue-500 ring-offset-2' 
          : 'hover:ring-1 hover:ring-gray-300 hover:ring-offset-1'
        }
        ${isDragging ? 'z-50' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element);
      }}
    >
      {/* Element Toolbar */}
      {isSelected && (
        <div className="absolute -top-8 left-0 z-20 flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded-t text-xs">
          <span className="font-medium">{element.type}</span>
          <div className="flex items-center space-x-1 ml-2">
          <Button
            size="sm"
            variant="ghost"
              className="h-5 w-5 p-0 text-white hover:bg-blue-700"
            {...attributes}
            {...listeners}
          >
              <Grip className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 text-white hover:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(element.id);
              }}
            >
              <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
              className="h-5 w-5 p-0 text-white hover:bg-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

// Element Renderer component
function ElementRenderer({ 
  element, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  deviceView 
}: {
  element: FormElement;
  isSelected: boolean;
  onSelect: (element: FormElement) => void;
  onUpdate: (elementId: string, updates: Partial<FormElement>) => void;
  onDelete: (elementId: string) => void;
  onDuplicate: (elementId: string) => void;
  deviceView: 'desktop' | 'tablet' | 'mobile';
}) {
  const IconComponent = elementIcons[element.type] || Type;
  const props = element.properties || {};

  // Handle containers with children
  if (element.children !== undefined) {
    const columns = props.columns || 1;
    
    return (
      <SortableElement
        element={element}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
      >
        <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[100px]">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <IconComponent className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {props.title || element.type}
              </span>
              {columns > 1 && (
                <Badge variant="secondary" className="text-xs">
                  {columns} columns
                </Badge>
              )}
            </div>
          </div>

          {/* Section Content */}
          <div className={`grid gap-4 ${
            columns === 2 ? 'grid-cols-2' : 
            columns === 3 ? 'grid-cols-3' : 
            'grid-cols-1'
          }`}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <DropZone
                key={`${element.id}-col-${colIndex}`}
                id={`drop-zone-${element.id}-col-${colIndex}`}
                className="min-h-[80px] rounded border-2 border-dashed border-gray-200 p-2"
              >
                <div className="text-center text-gray-400 text-sm py-8">
                  <Plus className="h-4 w-4 mx-auto mb-2" />
                  Drop elements here
                </div>
                {/* Render children for this column */}
                {element.children
                  ?.filter((_, index) => index % columns === colIndex)
                  .map((child) => (
                    <div key={child.id} className="mb-2">
                      <ElementRenderer
                        element={child}
                        isSelected={isSelected}
                        onSelect={onSelect}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                        deviceView={deviceView}
                      />
                    </div>
                  ))}
              </DropZone>
            ))}
          </div>
        </div>
      </SortableElement>
    );
  }

  // Regular form field elements
  return (
    <SortableElement
      element={element}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="flex items-center space-x-3 mb-3">
            <IconComponent className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium text-sm">
                {props.label || element.type}
              </div>
              {props.placeholder && (
                <div className="text-xs text-gray-500">
                  {props.placeholder}
                </div>
              )}
            </div>
            {props.required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>

          {/* Element Preview based on type */}
          <div className="space-y-2">
            {element.type === 'text' && (
              <input 
                type="text" 
                placeholder={props.placeholder || 'Text input'} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                disabled
              />
            )}
            
            {element.type === 'textarea' && (
              <textarea 
                placeholder={props.placeholder || 'Enter text...'} 
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                rows={3}
                disabled
              />
            )}
            
            {element.type === 'select' && (
              <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled>
                <option>{props.placeholder || 'Select an option'}</option>
                {props.options?.slice(0, 3).map((option: any, index: number) => (
                  <option key={index}>{option.label}</option>
                ))}
              </select>
            )}
            
            {element.type === 'checkbox' && (
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" disabled />
                <span>{props.label || 'Checkbox option'}</span>
              </label>
            )}
            
            {element.type === 'radio' && (
              <div className="space-y-2">
                {(props.options || [{ label: 'Option 1' }, { label: 'Option 2' }]).slice(0, 3).map((option: any, index: number) => (
                  <label key={index} className="flex items-center space-x-2 text-sm">
                    <input type="radio" name={element.id} disabled />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
            
            {element.type === 'heading' && (
              <div className={`font-bold ${
                props.size === 'h1' ? 'text-3xl' :
                props.size === 'h2' ? 'text-2xl' :
                props.size === 'h3' ? 'text-xl' :
                props.size === 'h4' ? 'text-lg' :
                'text-base'
              }`}>
                {props.text || 'Heading Text'}
              </div>
            )}
            
            {element.type === 'paragraph' && (
              <p className="text-gray-700 text-sm">
                {props.text || 'This is a paragraph of text. Edit the content in the properties panel.'}
              </p>
            )}
            
            {element.type === 'divider' && (
              <hr className="border-gray-300" />
            )}
            
            {element.type === 'image' && (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Image placeholder</p>
              </div>
            )}
            
            {element.type === 'file' && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload or drag files here</p>
              </div>
            )}

            {/* ===== MARKETING COMPONENTS ===== */}
            {element.type === 'hero-section' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {props.headline || 'Welcome to Our Platform'}
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  {props.subheadline || 'Create amazing experiences with our tools'}
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium">
                  {props.buttonText || 'Get Started'}
                </button>
              </div>
            )}

            {element.type === 'cta-button' && (
              <div className="text-center">
                <button 
                  className={`px-6 py-3 rounded-lg font-medium ${
                    props.style === 'secondary' 
                      ? 'bg-gray-200 text-gray-800' 
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {props.text || 'Get Started Today'}
                </button>
              </div>
            )}

            {element.type === 'testimonial' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <Quote className="h-8 w-8 text-blue-600 mb-4" />
                <p className="text-gray-700 mb-4 italic">
                  &ldquo;{props.quote || 'This product changed my life! Highly recommended.'}&rdquo;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-sm">{props.author || 'Jane Smith'}</p>
                    <p className="text-xs text-gray-500">{props.title || 'CEO, Company'}</p>
                  </div>
                </div>
              </div>
            )}

            {element.type === 'feature-highlight' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <Award className="h-8 w-8 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {props.title || 'Amazing Feature'}
                    </h3>
                    <p className="text-gray-600">
                      {props.description || 'This feature will help you achieve your goals faster.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {element.type === 'pricing-card' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">{props.title || 'Pro Plan'}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{props.price || '$29'}</span>
                  <span className="text-gray-500">/{props.period || 'month'}</span>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  {(props.features || ['Feature 1', 'Feature 2', 'Feature 3']).map((feature: string, index: number) => (
                    <li key={index} className="flex items-center justify-center">
                      <span>✓ {feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
                  {props.buttonText || 'Choose Plan'}
                </button>
              </div>
            )}

            {element.type === 'social-proof' && (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-6">
                  {props.title || 'Trusted by 10,000+ customers'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {(props.stats || [
                    { number: '10,000+', label: 'Happy Customers' },
                    { number: '99.9%', label: 'Uptime' }
                  ]).map((stat: any, index: number) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stat.number}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== LAYOUT BLOCKS ===== */}
            {element.type === 'container' && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Container className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Container Block</p>
                <p className="text-xs text-gray-400">Max-width: {props.maxWidth || '1200px'}</p>
              </div>
            )}

            {element.type === 'grid' && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Grid3X3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Grid Layout</p>
                <p className="text-xs text-gray-400">{props.columns || 3} columns</p>
              </div>
            )}

            {element.type === 'flex-row' && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ArrowRight className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Flex Row</p>
                <p className="text-xs text-gray-400">Horizontal layout</p>
              </div>
            )}

            {element.type === 'spacer' && (
              <div className="text-center py-4">
                <Minus className="h-8 w-8 mx-auto text-gray-400" />
                <p className="text-xs text-gray-400">Spacer ({props.height || 40}px)</p>
              </div>
            )}

            {/* ===== INTERACTIVE COMPONENTS ===== */}
            {element.type === 'search-bar' && (
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder={props.placeholder || 'Search...'} 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  disabled
                />
                {props.showButton && (
                  <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
                    {props.buttonText || 'Search'}
                  </button>
                )}
              </div>
            )}

            {element.type === 'social-links' && (
              <div className="flex justify-center space-x-4">
                {(props.platforms || ['facebook', 'twitter', 'instagram']).slice(0, 4).map((platform: string, index: number) => (
                  <div key={index} className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center">
                    <Share2 className="h-4 w-4" />
                  </div>
                ))}
              </div>
            )}

            {element.type === 'newsletter-signup' && (
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <h3 className="font-semibold mb-2">
                  {props.title || 'Subscribe to our newsletter'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {props.description || 'Get the latest updates and offers.'}
                </p>
                <div className="flex space-x-2">
                  <input 
                    type="email" 
                    placeholder={props.placeholder || 'Enter your email...'} 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    disabled
                  />
                  <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
                    {props.buttonText || 'Subscribe'}
                  </button>
                </div>
              </div>
            )}

            {element.type === 'contact-form' && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">
                  {props.title || 'Contact Us'}
                </h3>
                <div className="space-y-3">
                  <input type="text" placeholder="Name" className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled />
                  <input type="email" placeholder="Email" className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled />
                  <textarea placeholder="Message" className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none" rows={3} disabled />
                  <button className="w-full bg-blue-600 text-white py-2 rounded text-sm">
                    {props.buttonText || 'Send Message'}
                  </button>
                </div>
              </div>
            )}

            {/* ===== NAVIGATION COMPONENTS ===== */}
            {element.type === 'navbar' && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{props.brand || 'Your Brand'}</div>
                  <div className="flex space-x-4">
                    {(props.links || [
                      { label: 'Home', url: '#' },
                      { label: 'About', url: '#' },
                      { label: 'Contact', url: '#' }
                    ]).map((link: any, index: number) => (
                      <a key={index} href="#" className="text-sm text-gray-600 hover:text-gray-900">
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {element.type === 'breadcrumbs' && (
              <div className="flex items-center space-x-2 text-sm">
                {(props.items || [
                  { label: 'Home', url: '#' },
                  { label: 'Products', url: '#' },
                  { label: 'Current Page', url: '#' }
                ]).map((item: any, index: number) => (
                  <React.Fragment key={index}>
                    <a href="#" className="text-blue-600 hover:underline">{item.label}</a>
                    {index < (props.items?.length || 3) - 1 && (
                      <span className="text-gray-400">{props.separator || '/'}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {element.type === 'footer' && (
              <div className="bg-gray-800 text-white rounded-lg p-6 text-center">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-sm">Column 1</div>
                  <div className="text-sm">Column 2</div>
                  <div className="text-sm">Column 3</div>
                </div>
                <hr className="border-gray-600 mb-4" />
                <p className="text-xs text-gray-400">
                  {props.copyright || '© 2024 Your Company. All rights reserved.'}
                </p>
              </div>
            )}

            {/* ===== FORMS CATEGORY ===== */}
            {element.type === 'saved-form' && (
              <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
                <Square className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-blue-700 font-medium">Saved Form</p>
                <p className="text-xs text-blue-600">
                  {props.formName || 'Select a form...'}
                </p>
              </div>
            )}

            {/* Default fallback for unknown types */}
            {!['text', 'textarea', 'select', 'checkbox', 'radio', 'heading', 'paragraph', 'divider', 'image', 'file', 
                'hero-section', 'cta-button', 'testimonial', 'feature-highlight', 'pricing-card', 'social-proof',
                'container', 'grid', 'flex-row', 'spacer', 'search-bar', 'social-links', 'newsletter-signup', 
                'contact-form', 'navbar', 'breadcrumbs', 'footer', 'saved-form'].includes(element.type) && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center text-sm text-gray-600">
                {element.type} field
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SortableElement>
  );
}

/**
 * FormCanvas - The main canvas for building forms with drag and drop
 * @component
 * @param {FormCanvasProps} props - Component props
 * @example
 * <FormCanvas
 *   elements={elements}
 *   selectedElement={selectedElement}
 *   onElementSelect={handleElementSelect}
 *   onElementUpdate={handleElementUpdate}
 *   onElementDelete={handleElementDelete}
 *   onElementDuplicate={handleElementDuplicate}
 *   deviceView="desktop"
 * />
 */
export function FormCanvas({
  elements,
  selectedElement,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
  onElementDuplicate,
  deviceView,
  hoveredDropZone,
  onDropZoneHover
}: FormCanvasProps) {
  // Canvas dimensions based on device view
  const canvasStyles = {
    desktop: 'max-w-full',
    tablet: 'max-w-2xl mx-auto',
    mobile: 'max-w-sm mx-auto'
  };

  return (
    <div className="h-full p-6 bg-gray-50">
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 min-h-full ${canvasStyles[deviceView]}`}>
        {/* Canvas Header - Removed device icons */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Form Canvas</h2>
              <p className="text-sm text-gray-500">
                {elements.length === 0 ? 'Start building your form by dragging elements from the left panel' : `${elements.length} elements`}
              </p>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div 
          className="p-6 min-h-[600px]"
          onClick={() => onElementSelect(null)}
        >
          {elements.length === 0 ? (
            // Empty state
            <DropZone id="drop-zone-root" className="h-96 rounded-lg">
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Plus className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Start Building Your Form</h3>
                <p className="text-sm text-center max-w-md">
                  Drag elements from the left panel to begin creating your form. 
                  You can add sections, input fields, and other components.
                </p>
              </div>
            </DropZone>
          ) : (
            // Form elements
            <div className="space-y-4">
              {elements.map((element, index) => (
                <div key={element.id}>
                  {/* Drop zone before each element */}
                  <DropZone 
                    id={`drop-zone-${index}`}
                    className="h-2 my-2"
                    isVisible={true}
                  />
                  
                  {/* The actual element */}
                  <ElementRenderer
                    element={element}
                    isSelected={selectedElement?.id === element.id}
                    onSelect={onElementSelect}
                    onUpdate={onElementUpdate}
                    onDelete={onElementDelete}
                    onDuplicate={onElementDuplicate}
                    deviceView={deviceView}
                  />
                </div>
              ))}
              
              {/* Drop zone after all elements */}
              <DropZone 
                id={`drop-zone-${elements.length}`}
                className="h-12 mt-4 rounded-lg"
                isVisible={true}
              >
                <div className="h-full flex items-center justify-center text-gray-400">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="text-sm">Add element</span>
                </div>
              </DropZone>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
