'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndustryTemplates } from '@/components/admin/schemas/IndustryTemplates';
import { Button } from '@/components/ui/button';
import { 
  Layers, 
  Building2, 
  Settings, 
  FileText,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

/**
 * Schema Management Admin Page
 * 
 * @component SchemasPage
 * @description Central hub for all schema-related management including model schemas and industry templates
 */
export default function SchemasPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Schema Management</h1>
        </div>
      </div>

      <div className="text-gray-600 mb-6">
        Manage model schemas, industry templates, and data structures across the platform
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/admin/model-schemas">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-blue-600" />
                Model Schemas
              </CardTitle>
              <CardDescription>
                Create and manage dynamic form schemas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                Manage Schemas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/admin/industry-templates">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-green-600" />
                Industry Templates
              </CardTitle>
              <CardDescription>
                Pre-built templates for different industries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                Browse Templates
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/admin/option-sets">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-purple-600" />
                Option Sets
              </CardTitle>
              <CardDescription>
                Manage dropdown and selection options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                Manage Options
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Featured: Industry Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Industry Templates
          </CardTitle>
          <CardDescription>
            Browse and select from our library of pre-built industry-specific templates
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <IndustryTemplates />
        </CardContent>
      </Card>

      {/* Documentation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Schema Documentation
          </CardTitle>
          <CardDescription>
            Learn about creating and managing schemas effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="font-medium text-blue-600 mb-2">Model Schemas</div>
              <div className="text-sm text-muted-foreground mb-3">
                Dynamic form schemas that adapt to user needs and business requirements
              </div>
              <Link href="/admin/model-schemas" className="text-blue-600 hover:underline text-sm">
                Learn more →
              </Link>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="font-medium text-green-600 mb-2">Industry Templates</div>
              <div className="text-sm text-muted-foreground mb-3">
                Pre-configured templates for specific industries and use cases
              </div>
              <Link href="/admin/industry-templates" className="text-green-600 hover:underline text-sm">
                Browse templates →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 