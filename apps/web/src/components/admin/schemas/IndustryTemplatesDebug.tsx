'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Fetch industry templates from API
const fetchIndustryTemplates = async (filters: any = {}) => {
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.industryType) params.append('industryType', filters.industryType);
  if (filters.isPublished !== undefined) params.append('isPublished', filters.isPublished.toString());
  
  console.log('🔄 Fetching templates with URL:', `/api/v1/admin/industry-templates?${params.toString()}`);
  
  const response = await fetch(`/api/v1/admin/industry-templates?${params.toString()}`);
  
  console.log('📡 API Response status:', response.status);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch industry templates: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('📊 API Response data:', data);
  return data.data;
};

export const IndustryTemplatesDebug: React.FC = () => {
  const {
    data: templatesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['industry-templates-debug'],
    queryFn: () => fetchIndustryTemplates({ isPublished: true }),
    staleTime: 0, // Always fresh for debugging
    gcTime: 0, // No caching for debugging
  });

  const templates = templatesData?.templates || [];

  // Compute debug info directly without state/effect
  const debugInfo = {
    isLoading,
    error: error?.message,
    templatesCount: templates.length,
    templates: templates.map((t: any) => ({
      id: t.id,
      name: t.name,
      displayName: t.displayName,
      popularity: t.popularity,
      rating: t.rating,
      usageCount: t.usageCount,
      features: t.features
    })),
    timestamp: new Date().toISOString()
  };

  console.log('🐛 Debug Info:', debugInfo);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debug: Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Fetching templates from API...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Debug: Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error: {error.message}</p>
          <Button onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Debug: Success!</CardTitle>
          <CardDescription>Found {templates.length} templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
            <div><strong>Templates Count:</strong> {templates.length}</div>
            <div><strong>Last Updated:</strong> {debugInfo.timestamp}</div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-blue-600">Show Raw Data</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>

      {templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template: any) => (
            <Card key={template.id} className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg text-green-600">
                  {template.displayName?.en || template.name}
                </CardTitle>
                <CardDescription>
                  {template.description?.en || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Popularity:</strong> {template.popularity}%
                    </div>
                    <div>
                      <strong>Rating:</strong> {(template.rating / 100).toFixed(1)} ⭐
                    </div>
                    <div>
                      <strong>Uses:</strong> {template.usageCount?.toLocaleString() || 0}
                    </div>
                    <div>
                      <strong>Setup:</strong> {template.estimatedSetupTime || 0}min
                    </div>
                  </div>
                  
                  {template.features && Object.keys(template.features).length > 0 && (
                    <div>
                      <strong>Features:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(template.features)
                          .filter(([_, enabled]) => enabled)
                          .slice(0, 3)
                          .map(([feature, _]) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Button onClick={() => refetch()} className="w-full">
            🔄 Refresh Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}; 