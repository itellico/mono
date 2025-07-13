'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuditTracking, usePageTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';
import { 
  Eye,
  Edit,
  Download,
  Trash2,
  Plus,
  FileText,
  Calendar,
  Layers
} from 'lucide-react';
import Link from 'next/link';

interface Zone {
  id: string;
  title: string;
  description: string;
  elements: any[];
  settings: any;
  createdAt: string;
  updatedAt: string;
  savedAt: string;
}

/**
 * Zones Listing Page Component
 */
export default function ZonesPage() {
  const { toast } = useToast();
  const { trackClick } = useAuditTracking();

  // Track page access
  usePageTracking('/admin/zones', { description: 'Zones Listing Access' });

  // Fetch zones from API
  const { data: zones, isLoading, error, refetch } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const response = await fetch('/api/v1/zones');
      if (!response.ok) {
        throw new Error('Failed to fetch zones');
      }
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleExportZone = (zone: Zone) => {
    const dataStr = JSON.stringify(zone, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zone_${zone.title?.replace(/\s+/g, '_').toLowerCase() || 'untitled'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    trackClick('zone_exported_from_list', { zoneId: zone.id, zoneTitle: zone.title });
    browserLogger.userAction('Zone exported from list', 'zones', { zoneId: zone.id, zoneTitle: zone.title });
    
    toast({
      title: 'Zone Exported',
      description: 'Zone configuration downloaded as JSON file.',
      variant: 'default'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Saved Zones</h1>
          <p className="text-muted-foreground">Manage your zone configurations</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Zones</h1>
          <p className="text-muted-foreground mb-4">There was an error loading your zones.</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Saved Zones</h1>
          <p className="text-muted-foreground">Manage your zone configurations</p>
        </div>
        <Link href="/admin/zone-editor">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Zone
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Layers className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Zones</p>
                <p className="text-2xl font-bold">{zones?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Elements</p>
                <p className="text-2xl font-bold">
                  {zones?.reduce((total: number, zone: Zone) => total + (zone.elements?.length || 0), 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Last Created</p>
                <p className="text-sm font-bold">
                  {zones?.length > 0 ? formatDate(zones[0].createdAt) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zones Grid */}
      {zones?.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No zones yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first zone to get started with building layouts.
              </p>
              <Link href="/admin/zone-editor">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Zone
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones?.map((zone: Zone) => (
            <Card key={zone.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{zone.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {zone.description || 'No description provided'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Zone Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Elements:</span>
                    <Badge variant="secondary">{zone.elements?.length || 0}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="text-xs">{formatDate(zone.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="text-xs">{formatDate(zone.updatedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExportZone(zone)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 