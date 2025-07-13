'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaletteIcon, MonitorIcon, SunIcon } from 'lucide-react';

export function UISettingsPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PaletteIcon className="h-5 w-5" />
            UI & Theme Settings
          </CardTitle>
          <CardDescription>
            Configure user interface appearance and default theme settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Theme Configuration</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Default Theme:</span>
                  <Badge variant="outline">Light</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dark Mode:</span>
                  <Badge variant="default">Available</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">System Theme:</span>
                  <Badge variant="default">Supported</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">UI Preferences</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Items per Page:</span>
                  <Badge variant="outline">20 items</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Compact Mode:</span>
                  <Badge variant="outline">Available</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Animations:</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 