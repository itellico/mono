'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

/**
 * FormPreview Component
 * 
 * Placeholder for live form preview functionality.
 * Will be enhanced in future iterations.
 */

export function FormPreview() {
  return (
    <div className="space-y-4">
      <div className="text-center p-8">
        <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Live Form Preview</h3>
        <p className="text-muted-foreground mb-4">
          This feature will show real-time previews of generated forms
        </p>
        <Badge variant="outline">Coming Soon</Badge>
      </div>
    </div>
  );
} 