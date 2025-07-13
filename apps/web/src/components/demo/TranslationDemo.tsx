'use client';

import { useState, useEffect } from 'react';
import { useUnifiedTranslations } from '@/hooks/useUnifiedTranslations';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Globe, Database, FileText, RefreshCw } from 'lucide-react';

export function TranslationDemo() {
  const { t, tAsync, preloadTranslations, clearCache, getCacheStats, isLoading, locale } = useUnifiedTranslations();
  const [dbTranslations, setDbTranslations] = useState<Record<string, string>>({});
  const [cacheStats, setCacheStats] = useState<any>(null);

  // Test keys for demonstration
  const fileBasedKeys = [
    'admin-common.navigation.dashboard',
    'admin-common.actions.save',
    'admin-common.actions.cancel',
    'common.loading'
  ];

  const databaseKeys = [
    'option.height_ranges.169_175cm',
    'option.weight_ranges.66_70kg',
    'option.job_types.fashion_runway',
    'email.welcome_model.subject',
    'email.casting_invite.subject'
  ];

  // Load database translations
  useEffect(() => {
    const loadDbTranslations = async () => {
      const results: Record<string, string> = {};

      for (const key of databaseKeys) {
        try {
          const translation = await tAsync(key);
          results[key] = translation;
        } catch (error) {
          results[key] = `Error: ${key}`;
        }
      }

      setDbTranslations(results);
    };

    loadDbTranslations();
  }, [tAsync, locale]);

  const handlePreloadTranslations = async () => {
    await preloadTranslations([...fileBasedKeys, ...databaseKeys]);
    setCacheStats(getCacheStats());
  };

  const handleClearCache = () => {
    clearCache();
    setCacheStats(getCacheStats());
    setDbTranslations({});
  };

  const handleRefreshStats = () => {
    setCacheStats(getCacheStats());
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Translation System Demo</h2>
          <p className="text-sm text-muted-foreground">
            Testing hybrid file-based and database translation system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Globe className="h-3 w-3" />
            <span>{locale}</span>
          </Badge>
          {isLoading && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading</span>
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* File-based Translations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>File-based Translations</span>
            </CardTitle>
            <CardDescription>
              Static UI translations loaded from JSON files with fallback support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {fileBasedKeys.map((key) => (
              <div key={key} className="flex justify-between items-center">
                <code className="text-xs text-muted-foreground">{key}</code>
                <Badge variant="secondary">{t(key)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Database Translations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Database Translations</span>
            </CardTitle>
            <CardDescription>
              Dynamic content translations with regional variants and caching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {databaseKeys.map((key) => (
              <div key={key} className="flex justify-between items-center">
                <code className="text-xs text-muted-foreground">{key}</code>
                <Badge variant={dbTranslations[key]?.startsWith('[') ? 'destructive' : 'default'}>
                  {dbTranslations[key] || 'Loading...'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Regional Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Variants Demo</CardTitle>
          <CardDescription>
            Demonstrating regional differences (US Imperial vs UK Metric vs German)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Height (US Imperial)</h4>
              <Badge variant="outline">{dbTranslations['option.height_ranges.169_175cm'] || 'Loading...'}</Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Weight (Regional)</h4>
              <Badge variant="outline">{dbTranslations['option.weight_ranges.66_70kg'] || 'Loading...'}</Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Job Type</h4>
              <Badge variant="outline">{dbTranslations['option.job_types.fashion_runway'] || 'Loading...'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>
            Browser-side translation cache with 5-minute TTL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={handlePreloadTranslations} variant="outline" size="sm">
              Preload Translations
            </Button>
            <Button onClick={handleClearCache} variant="outline" size="sm">
              Clear Cache
            </Button>
            <Button onClick={handleRefreshStats} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh Stats
            </Button>
          </div>

          {cacheStats && (
            <div className="bg-muted p-3 rounded-md">
              <h5 className="font-medium mb-2">Cache Statistics</h5>
              <div className="text-sm space-y-1">
                <div>Size: {cacheStats.size} entries</div>
                {cacheStats.entries.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Cached entries:</p>
                    {cacheStats.entries.slice(0, 5).map((entry: any) => (
                      <div key={entry.key} className="text-xs text-muted-foreground">
                        {entry.key} (age: {Math.round(entry.age / 1000)}s)
                      </div>
                    ))}
                    {cacheStats.entries.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {cacheStats.entries.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">File System</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fallback: {locale} → en-US → empty
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Database</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              84 translations across 3 languages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Regional Support</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              US, UK, German variants
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 