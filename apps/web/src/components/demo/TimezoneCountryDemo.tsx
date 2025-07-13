'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  getEnhancedTimezoneOptions, 
  getEnhancedLanguageOptions, 
  formatTimeInTimezone,
  getTimezoneInfo 
} from '@/lib/enhanced-timezone-utils';

export function TimezoneCountryDemo() {
  const [selectedTimezone, setSelectedTimezone] = useState('Europe/Vienna');
  const [selectedLanguage, setSelectedLanguage] = useState('de-DE');

  const timezoneOptions = getEnhancedTimezoneOptions();
  const languageOptions = getEnhancedLanguageOptions();
  const timezoneInfo = getTimezoneInfo(selectedTimezone);

  const now = new Date();

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>🌍 Enhanced Timezone & Country Demo</CardTitle>
          <CardDescription>
            Dynamic timezone and language options with flags, real-time offsets, and localization features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Current Selection Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Selected Timezone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {timezoneOptions.find(tz => tz.value === selectedTimezone)?.flag}
                  </span>
                  <span className="font-medium">{selectedTimezone}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Offset: <Badge variant="outline">{timezoneInfo.offset}</Badge></div>
                  <div>DST: <Badge variant={timezoneInfo.isDST ? "default" : "secondary"}>
                    {timezoneInfo.isDST ? "Yes" : "No"}
                  </Badge></div>
                  <div>Local Time: <span className="font-mono">{timezoneInfo.localTime}</span></div>
                  <div>Zone: <span className="text-xs">{timezoneInfo.offsetName}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Selected Language</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {languageOptions.find(lang => lang.value === selectedLanguage)?.flag}
                  </span>
                  <span className="font-medium">{selectedLanguage}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>{languageOptions.find(lang => lang.value === selectedLanguage)?.label}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Feature Showcase */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🚀 Enhanced Features</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-3">⏰ Real-time Timezone Data</h4>
                <div className="space-y-2 text-sm">
                  <div>Current time: <span className="font-mono">
                    {formatTimeInTimezone(now, selectedTimezone, 'yyyy-MM-dd HH:mm:ss')}
                  </span></div>
                  <div>12-hour format: <span className="font-mono">
                    {formatTimeInTimezone(now, selectedTimezone, 'h:mm a')}
                  </span></div>
                  <div>Date only: <span className="font-mono">
                    {formatTimeInTimezone(now, selectedTimezone, 'EEEE, MMMM d, yyyy')}
                  </span></div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-3">🏁 Visual Enhancements</h4>
                <div className="space-y-2 text-sm">
                  <div>✅ Country flags in dropdowns</div>
                  <div>✅ Real-time UTC offsets</div>
                  <div>✅ DST awareness</div>
                  <div>✅ Enhanced search terms</div>
                  <div>✅ Sorted alphabetically</div>
                </div>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Quick Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🎯 Quick Selection</h3>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Popular Timezones:</h4>
                <div className="flex flex-wrap gap-2">
                  {['Europe/Vienna', 'Europe/London', 'America/New_York', 'Asia/Tokyo'].map(tz => {
                    const option = timezoneOptions.find(opt => opt.value === tz);
                    return (
                      <Badge 
                        key={tz}
                        variant={selectedTimezone === tz ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedTimezone(tz)}
                      >
                        {option?.flag} {tz.split('/')[1]} ({option?.offset})
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Languages:</h4>
                <div className="flex flex-wrap gap-2">
                  {['en-US', 'de-DE', 'fr-FR', 'ja-JP'].map(lang => {
                    const option = languageOptions.find(opt => opt.value === lang);
                    return (
                      <Badge 
                        key={lang}
                        variant={selectedLanguage === lang ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedLanguage(lang)}
                      >
                        {option?.flag} {lang}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{timezoneOptions.length}</div>
                  <div className="text-xs text-muted-foreground">Timezones Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{languageOptions.length}</div>
                  <div className="text-xs text-muted-foreground">Languages Supported</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">Real-time</div>
                  <div className="text-xs text-muted-foreground">Dynamic Offsets</div>
                </div>
              </div>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
} 

 