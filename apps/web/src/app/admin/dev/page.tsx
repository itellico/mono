import React from 'react';
import { Metadata } from 'next';
import { DevMenu } from '@/components/admin/dev/DevMenu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Search, 
  FileText, 
  Shield, 
  Zap,
  Database,
  GitBranch,
  Terminal
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dev Tools | mono Admin',
  description: 'Development tools and utilities for Super Admins',
};

/**
 * Admin Dev Tools Page
 * 
 * Provides development tools for Super Admins including:
 * - React string scanner for translation validation
 * - Best practices checking
 * - Development utilities
 * 
 * @page
 */
export default function AdminDevPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-900">
            <Terminal className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Development Tools</h1>
            <p className="text-muted-foreground mt-1">
              Advanced development utilities for platform management and code quality
            </p>
          </div>
          <Badge variant="outline" className="ml-auto">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin Only
          </Badge>
        </div>
      </div>

      {/* Main Development Tools Dashboard */}
      <DevMenu />

      {/* Additional Development Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Architecture Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <h4 className="font-medium mb-2">Translation Best Practices:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Use <code>t(&apos;key&apos;)</code> for all user-facing text
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Add keys to JSON files first, then use in components
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  Escape apostrophes as <code>&amp;apos;</code> in JSX
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Never hardcode strings in React components
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Available Commands
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <h4 className="font-medium mb-2">NPM Scripts:</h4>
              <div className="space-y-2">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <code className="text-xs">npm run dev:scan-strings</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run string scanner from command line
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <code className="text-xs">scripts/validate-translations.js</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Validate translation JSON structure
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 