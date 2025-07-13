'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlobeIcon, ClockIcon, CurrencyIcon } from 'lucide-react';

export function LocalizationSettingsPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlobeIcon className="h-5 w-5" />
            Localization Settings
          </CardTitle>
          <CardDescription>
            Configure language, timezone, and regional settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Languages & Locales</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Default Locale:</span>
                  <Badge variant="default">en-US</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Admin Language:</span>
                  <Badge variant="outline">English only</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Supported Locales:</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">en-US</Badge>
                    <Badge variant="outline" className="text-xs">en-GB</Badge>
                    <Badge variant="outline" className="text-xs">de-DE</Badge>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Regional Settings</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Default Timezone:</span>
                  <Badge variant="outline">Europe/Vienna</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Date Format:</span>
                  <span className="text-sm">DD.MM.YYYY</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Currency:</span>
                  <Badge variant="outline">EUR</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 