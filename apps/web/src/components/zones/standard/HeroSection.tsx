'use client';

/**
 * HeroSection Zone Component
 * 
 * Standard layout component for creating hero sections on landing pages.
 * Integrates with itellico Mono audit tracking and permission system.
 * 
 * @component HeroSection
 * @example
 * ```tsx
 * <HeroSection
 *   config={{
 *     title: "Welcome to Our Platform",
 *     subtitle: "Build amazing experiences",
 *     description: "Start creating today with our powerful tools",
 *     backgroundImage: "/hero-bg.jpg",
 *     ctaText: "Get Started",
 *     ctaLink: "/signup"
 *   }}
 *   tenantId="tenant-123"
 * />
 * ```
 */

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

// Component configuration schema
export interface HeroSectionConfig {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  alignment?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large' | 'fullscreen';
}

export interface HeroSectionProps {
  config: HeroSectionConfig;
  tenantId: string;
  componentId?: string;
  className?: string;
  onInteraction?: (action: string, data?: any) => void;
}

/**
 * HeroSection Component
 */
export function HeroSection({
  config,
  tenantId,
  componentId = 'hero-section',
  className,
  onInteraction
}: HeroSectionProps) {
  const { trackClick, trackView } = useAuditTracking();

  // Track component view on mount
  useEffect(() => {
    trackView('zone_component', componentId, {
      componentType: 'HeroSection',
      tenantId,
      config
    });

    browserLogger.performance('HeroSection component mounted', {
      componentId,
      tenantId
    });
  }, [componentId, tenantId, trackView]);

  // Handle CTA click
  const handleCtaClick = (type: 'primary' | 'secondary') => {
    const ctaData = type === 'primary' 
      ? { text: config.ctaText, link: config.ctaLink }
      : { text: config.secondaryCtaText, link: config.secondaryCtaLink };

    trackClick('zone_component_interaction', componentId, {
      action: `${type}_cta_click`,
      componentType: 'HeroSection',
      tenantId,
      ctaText: ctaData.text,
      ctaLink: ctaData.link
    });

    onInteraction?.(`${type}_cta_click`, ctaData);

    browserLogger.userAction(`Hero ${type} CTA clicked`, {
      componentId,
      tenantId,
      ...ctaData
    });
  };

  // Dynamic styles and classes
  const heightClasses = {
    small: 'min-h-[300px]',
    medium: 'min-h-[500px]',
    large: 'min-h-[700px]',
    fullscreen: 'min-h-screen'
  };

  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end'
  };

  return (
    <section 
      className={`relative flex items-center justify-center overflow-hidden ${heightClasses[config.height || 'medium']} ${className || ''}`}
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
      }}
    >
      {/* Background Image */}
      {config.backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={config.backgroundImage}
            alt={config.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-30" />
        </div>
      )}

      {/* Content */}
      <div className={`relative z-20 max-w-4xl mx-auto px-6 py-12 flex flex-col ${alignmentClasses[config.alignment || 'center']}`}>
        {config.subtitle && (
          <p className="text-lg font-medium mb-4 opacity-90">
            {config.subtitle}
          </p>
        )}

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          {config.title}
        </h1>

        {config.description && (
          <p className="text-xl md:text-2xl mb-8 opacity-80 max-w-2xl">
            {config.description}
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {config.ctaText && config.ctaLink && (
            <Link href={config.ctaLink}>
              <Button
                size="lg"
                className="text-lg px-8 py-3"
                onClick={() => handleCtaClick('primary')}
              >
                {config.ctaText}
              </Button>
            </Link>
          )}

          {config.secondaryCtaText && config.secondaryCtaLink && (
            <Link href={config.secondaryCtaLink}>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-3"
                onClick={() => handleCtaClick('secondary')}
              >
                {config.secondaryCtaText}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// Component metadata for registry
export const HeroSectionMeta = {
  id: 'hero-section',
  name: 'HeroSection',
  displayName: 'Hero Section',
  description: 'Full-width hero section with customizable background and content',
  category: 'layout' as const,
  componentType: 'standard' as const,
  version: '1.0.0',
  defaultConfig: {
    title: 'Welcome to Our Platform',
    subtitle: 'Building the future',
    description: 'Create amazing experiences with our powerful tools.',
    ctaText: 'Get Started',
    ctaLink: '/signup',
    alignment: 'center',
    height: 'medium'
  }
};

export default HeroSection; 