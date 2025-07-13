import React from "react";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface IconRendererProps {
  iconName?: string;
  className?: string;
  size?: number;
  fallback?: LucideIcon;
}

export function IconRenderer({ 
  iconName, 
  className = "h-4 w-4", 
  size = 16,
  fallback = LucideIcons.Circle
}: IconRendererProps) {
  if (!iconName) {
    const FallbackIcon = fallback;
    return <FallbackIcon className={className} size={size} />;
  }

  const IconComponent = (LucideIcons as any)[iconName] as LucideIcon;
  
  if (!IconComponent) {
    const FallbackIcon = fallback;
    return <FallbackIcon className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
}
