'use client';

/**
 * AdBanner Zone Component
 * 
 * Standard marketing component for displaying banner advertisements.
 * Integrates with itellico Mono audit tracking and permission system.
 * 
 * @component AdBanner
 * @example
 * ```tsx
 * <AdBanner
 *   config={{
 *     title: "Summer Sale",
 *     description: "Up to 50% off all items",
 *     buttonText: "Shop Now",
 *     link: "/sale",
 *     imageUrl: "/banner.jpg"
 *   }}
 *   tenantId="tenant-123"
 * />
 * ```
 */

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { cn } from '@/lib/utils';

// Component configuration schema
export interface AdBannerConfig {
  title: string;
  description?: string;
  buttonText?: string;
  link?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  alignment?: 'left' | 'center' | 'right';
  size?: 'small' | 'medium' | 'large';
  showButton?: boolean;
  newTab?: boolean;
}

export interface AdBannerProps {
  config: AdBannerConfig;
  tenantId: string;
  componentId?: string;
  className?: string;
  onInteraction?: (action: string, data?: any) => void;
}

/**
 * AdBanner Component
 * 
 * Displays a customizable banner advertisement with tracking capabilities
 */
export function AdBanner({
  config,
  tenantId,
  componentId = 'ad-banner',
  className,
  onInteraction
}: AdBannerProps) {
  const { trackClick, trackView } = useAuditTracking();

  // Track component view on mount
  useEffect(() => {
    trackView('zone_component', componentId, {
      componentType: 'AdBanner',
      tenantId,
      config
    });

    browserLogger.performance('AdBanner component mounted', {
      componentId,
      tenantId,
      configKeys: Object.keys(config)
    });
  }, [componentId, tenantId, trackView]);

  // Handle banner click
  const handleBannerClick = () => {
    trackClick('zone_component_interaction', componentId, {
      action: 'banner_click',
      componentType: 'AdBanner',
      tenantId,
      link: config.link
    });

    onInteraction?.('click', { link: config.link });

    browserLogger.userAction('Banner clicked', {
      componentId,
      tenantId,
      link: config.link
    });
  };

  // Handle button click
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent banner click if button is clicked
    
    trackClick('zone_component_interaction', componentId, {
      action: 'button_click',
      componentType: 'AdBanner',
      tenantId,
      buttonText: config.buttonText,
      link: config.link
    });

    onInteraction?.('button_click', { 
      buttonText: config.buttonText,
      link: config.link 
    });

    browserLogger.userAction('Banner button clicked', {
      componentId,
      tenantId,
      buttonText: config.buttonText,
      link: config.link
    });
  };

  // Dynamic styles based on configuration
  const bannerStyles = {
    backgroundColor: config.backgroundColor,
    color: config.textColor,
  };

  const sizeClasses = {
    small: 'p-4 min-h-[120px]',
    medium: 'p-6 min-h-[200px]',
    large: 'p-8 min-h-[300px]'
  };

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const buttonVariants = {
    primary: 'default',
    secondary: 'secondary',
    outline: 'outline'
  } as const;

  // Render banner content
  const renderContent = () => (
    <div className={cn(
      'flex flex-col justify-center h-full w-full',
      alignmentClasses[config.alignment || 'center']
    )}>
      {config.imageUrl && (
        <div className="mb-4 relative w-full h-32">
          <Image
            src={config.imageUrl}
            alt={config.title}
            fill
            className="object-cover rounded-lg"
            onError={() => {
              browserLogger.apiRequest('Image load failed', 'GET', config.imageUrl);
            }}
          />
        </div>
      )}
      
      <h2 className="text-2xl font-bold mb-2">
        {config.title}
      </h2>
      
      {config.description && (
        <p className="text-lg mb-4 opacity-90">
          {config.description}
        </p>
      )}
      
      {config.showButton !== false && config.buttonText && config.link && (
        <Button
          variant={buttonVariants[config.buttonStyle || 'primary']}
          onClick={handleButtonClick}
          className="w-fit mx-auto"
        >
          {config.buttonText}
        </Button>
      )}
    </div>
  );

  // If there's a link and no button, make the whole banner clickable
  if (config.link && (config.showButton === false || !config.buttonText)) {
    return (
      <Card 
        className={cn(
          'cursor-pointer hover:shadow-lg transition-shadow duration-200',
          sizeClasses[config.size || 'medium'],
          className
        )}
        style={bannerStyles}
        onClick={handleBannerClick}
      >
        <CardContent className="h-full">
          {config.newTab ? (
            <a
              href={config.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full"
            >
              {renderContent()}
            </a>
          ) : (
            <Link href={config.link} className="block h-full">
              {renderContent()}
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  // Static banner (no link or has button)
  return (
    <Card 
      className={cn(
        sizeClasses[config.size || 'medium'],
        className
      )}
      style={bannerStyles}
    >
      <CardContent className="h-full">
        {config.link && config.buttonText ? (
          renderContent()
        ) : (
          renderContent()
        )}
      </CardContent>
    </Card>
  );
}

// Component metadata for registry
export const AdBannerMeta = {
  id: 'ad-banner',
  name: 'AdBanner',
  displayName: 'Advertisement Banner',
  description: 'Customizable banner for promotions and advertisements',
  category: 'marketing' as const,
  componentType: 'standard' as const,
  version: '1.0.0',
  configSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        title: 'Banner Title',
        description: 'Main title text for the banner'
      },
      description: {
        type: 'string',
        title: 'Description',
        description: 'Optional description text'
      },
      buttonText: {
        type: 'string',
        title: 'Button Text',
        description: 'Text for the call-to-action button'
      },
      link: {
        type: 'string',
        title: 'Link URL',
        description: 'URL to navigate to when clicked'
      },
      imageUrl: {
        type: 'string',
        title: 'Image URL',
        description: 'Optional background or featured image'
      },
      backgroundColor: {
        type: 'string',
        title: 'Background Color',
        description: 'CSS color value for background'
      },
      textColor: {
        type: 'string', 
        title: 'Text Color',
        description: 'CSS color value for text'
      },
      buttonStyle: {
        type: 'string',
        enum: ['primary', 'secondary', 'outline'],
        title: 'Button Style',
        description: 'Visual style of the button'
      },
      alignment: {
        type: 'string',
        enum: ['left', 'center', 'right'],
        title: 'Text Alignment',
        description: 'Alignment of text content'
      },
      size: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        title: 'Banner Size',
        description: 'Overall size of the banner'
      },
      showButton: {
        type: 'boolean',
        title: 'Show Button',
        description: 'Whether to display the action button'
      },
      newTab: {
        type: 'boolean',
        title: 'Open in New Tab',
        description: 'Whether links should open in a new tab'
      }
    },
    required: ['title']
  },
  defaultConfig: {
    title: 'Your Banner Title',
    description: 'Add your banner description here',
    buttonText: 'Learn More',
    buttonStyle: 'primary',
    alignment: 'center',
    size: 'medium',
    showButton: true,
    newTab: false
  },
  permissions: {
    view: ['zone_components.view.tenant'],
    edit: ['zone_components.edit.tenant'],
    delete: ['zone_components.delete.tenant']
  }
};

export default AdBanner; 