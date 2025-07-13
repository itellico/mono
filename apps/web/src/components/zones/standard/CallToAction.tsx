'use client';

/**
 * CallToAction Zone Component
 * 
 * Standard conversion component for driving user actions.
 * Integrates with itellico Mono audit tracking and permission system.
 */

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

// Component configuration schema
export interface CallToActionConfig {
  title: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  style?: 'card' | 'banner' | 'minimal';
  urgency?: boolean;
  urgencyText?: string;
}

export interface CallToActionProps {
  config: CallToActionConfig;
  tenantId: string;
  componentId?: string;
  className?: string;
  onInteraction?: (action: string, data?: any) => void;
}

/**
 * CallToAction Component
 */
export function CallToAction({
  config,
  tenantId,
  componentId = 'call-to-action',
  className,
  onInteraction
}: CallToActionProps) {
  const { trackClick, trackView } = useAuditTracking();

  // Track component view on mount
  useEffect(() => {
    trackView('zone_component', componentId, {
      componentType: 'CallToAction',
      tenantId,
      config
    });

    browserLogger.performance('CallToAction component mounted', {
      componentId,
      tenantId
    });
  }, [componentId, tenantId, trackView]);

  // Handle button click
  const handleButtonClick = (type: 'primary' | 'secondary') => {
    const buttonData = type === 'primary'
      ? { text: config.buttonText, link: config.buttonLink }
      : { text: config.secondaryButtonText, link: config.secondaryButtonLink };

    trackClick('zone_component_interaction', componentId, {
      action: `${type}_button_click`,
      componentType: 'CallToAction',
      tenantId,
      buttonText: buttonData.text,
      buttonLink: buttonData.link
    });

    onInteraction?.(`${type}_button_click`, buttonData);

    browserLogger.userAction(`CTA ${type} button clicked`, {
      componentId,
      tenantId,
      ...buttonData
    });
  };

  // Dynamic styles and classes
  const sizeClasses = {
    small: 'p-6',
    medium: 'p-8',
    large: 'p-12'
  };

  const componentStyles = {
    backgroundColor: config.backgroundColor,
    color: config.textColor,
  };

  // Render based on style
  const renderContent = () => (
    <div className="text-center">
      {config.urgency && config.urgencyText && (
        <div className="inline-block px-3 py-1 mb-4 text-sm font-semibold bg-red-100 text-red-800 rounded-full">
          {config.urgencyText}
        </div>
      )}
      
      <h2 className="text-2xl md:text-3xl font-bold mb-4">
        {config.title}
      </h2>
      
      {config.description && (
        <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
          {config.description}
        </p>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          variant={config.buttonStyle || 'default'}
          className="text-lg px-8 py-3"
          onClick={() => handleButtonClick('primary')}
        >
          {config.buttonText}
        </Button>
        
        {config.secondaryButtonText && config.secondaryButtonLink && (
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-3"
            onClick={() => handleButtonClick('secondary')}
          >
            {config.secondaryButtonText}
          </Button>
        )}
      </div>
    </div>
  );

  // Style variants
  if (config.style === 'card') {
    return (
      <Card className={`${className || ''}`} style={componentStyles}>
        <CardContent className={sizeClasses[config.size || 'medium']}>
          {renderContent()}
        </CardContent>
      </Card>
    );
  }

  if (config.style === 'minimal') {
    return (
      <div 
        className={`${sizeClasses[config.size || 'medium']} ${className || ''}`}
        style={componentStyles}
      >
        {renderContent()}
      </div>
    );
  }

  // Default banner style
  return (
    <section 
      className={`${sizeClasses[config.size || 'medium']} ${className || ''}`}
      style={componentStyles}
    >
      {renderContent()}
    </section>
  );
}

// Component metadata for registry
export const CallToActionMeta = {
  id: 'call-to-action',
  name: 'CallToAction',
  displayName: 'Call to Action',
  description: 'Conversion-focused component to drive user actions',
  category: 'marketing' as const,
  componentType: 'standard' as const,
  version: '1.0.0',
  defaultConfig: {
    title: 'Ready to Get Started?',
    description: 'Join thousands of users who are already transforming their workflow.',
    buttonText: 'Start Free Trial',
    buttonLink: '/signup',
    buttonStyle: 'primary',
    size: 'medium',
    style: 'banner',
    urgency: false
  }
};

export default CallToAction; 