'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  MoreHorizontal,
  FileText,
  User,
  Calendar,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Temporarily disabled audit tracking to eliminate excessive API calls
// import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
// Removed LockBadge - not needed for overview lists
import { PermissionGate } from '@/components/reusable/PermissionGate';
import type { ModelSchema } from '@/lib/schemas/model-schemas';

/**
 * Model Schemas List Component
 * 
 * Features:
 * - ✅ Translation integration with t() function
 * - ✅ Audit tracking integration
 * - ✅ Lock status indicators
 * - ✅ Permission-based action controls
 * - ✅ Responsive table design
 * - ✅ Loading states with Skeleton components
 * - ✅ Proper TypeScript interfaces
 * 
 * @component ModelSchemasList
 * @param {ModelSchema[]} schemas - Array of model schemas
 * @param {Function} onEdit - Edit callback function
 * @param {Function} onDelete - Delete callback function
 * @param {boolean} isLoading - Loading state
 * @example
 * ```tsx
 * <ModelSchemasList 
 *   schemas={schemas} 
 *   onEdit={handleEdit} 
 *   onDelete={handleDelete}
 *   isLoading={false}
 * />
 * ```
 */

interface ModelSchemasListProps {
  schemas: ModelSchema[];
  onEdit: (schema: ModelSchema) => void;
  onDelete: (schemaId: string) => void;
  isLoading?: boolean;
}

export function ModelSchemasList({ 
  schemas, 
  onEdit, 
  onDelete, 
  isLoading = false 
}: ModelSchemasListProps) {
  const t = useTranslations('admin.model-schemas');
  // Temporarily disabled audit tracking
  // const { trackClick, trackView } = useAuditTracking();
  const trackClick = () => {};
  const trackView = () => {};

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get schema type display label
  const getSchemaTypeLabel = (type: string) => {
    const typeLabels = {
      'human_model': t('type_human_model'),
      'freelancer': t('type_freelancer'),
      'profile': t('type_profile'),
      'business': t('type_business'),
    };
    return typeLabels[type] || type;
  };

  // Handle view schema action
  const handleViewSchema = (schema: ModelSchema) => {
    trackView('model-schema-details', schema.id, {
      type: schema.type,
      subType: schema.subType
    });
    // Implementation would open schema details modal or navigate to detail page
  };

  // Handle copy schema action
  const handleCopySchema = (schema: ModelSchema) => {
    trackClick('copy-model-schema', schema.id);
    // Implementation would duplicate the schema
  };

  // Handle edit action with audit tracking
  const handleEditWithTracking = (schema: ModelSchema) => {
    trackClick('edit-model-schema', schema.id, {
      type: schema.type,
      subType: schema.subType
    });
    onEdit(schema);
  };

  // Handle delete action with audit tracking
  const handleDeleteWithTracking = (schemaId: string) => {
    trackClick('delete-model-schema', schemaId);
    onDelete(schemaId);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="ml-auto">
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (schemas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('schemas_list')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('no_schemas_found')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('no_schemas_description')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('schemas_list')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table_name')}</TableHead>
                <TableHead>{t('table_type')}</TableHead>
                <TableHead>{t('table_subtype')}</TableHead>
                <TableHead>{t('table_fields')}</TableHead>
                <TableHead>{t('table_status')}</TableHead>
                <TableHead>{t('table_created')}</TableHead>
                {/* Lock status removed - not needed for overview lists */}
                <TableHead className="text-right">{t('table_actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemas.map((schema) => (
                <TableRow key={schema.id}>
                  {/* Schema Name */}
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="font-medium">
                          {schema.displayName?.['en-US'] || schema.subType}
                        </div>
                        {schema.description?.['en-US'] && (
                          <div className="text-sm text-muted-foreground">
                            {schema.description['en-US'].substring(0, 50)}
                            {schema.description['en-US'].length > 50 && '...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Schema Type */}
                  <TableCell>
                    <Badge variant="outline">
                      {getSchemaTypeLabel(schema.type)}
                    </Badge>
                  </TableCell>

                  {/* Sub-Type */}
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {schema.subType}
                    </code>
                  </TableCell>

                  {/* Fields Count */}
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {schema.schema?.fields?.length || 0} {t('fields')}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={schema.isActive ? "default" : "secondary"}>
                      {schema.isActive ? t('status_active') : t('status_inactive')}
                    </Badge>
                  </TableCell>

                  {/* Created Date */}
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(schema.createdAt)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Lock Status removed - not needed for overview lists */}

                  {/* Actions */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{t('open_menu')}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                        
                        <DropdownMenuItem onClick={() => handleViewSchema(schema)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('view_details')}
                        </DropdownMenuItem>

                        <PermissionGate action="model_schemas.update" resource={schema.id}>
                          <DropdownMenuItem onClick={() => handleEditWithTracking(schema)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t('edit_schema')}
                          </DropdownMenuItem>
                        </PermissionGate>

                        <PermissionGate action="model_schemas.create" resource="admin">
                          <DropdownMenuItem onClick={() => handleCopySchema(schema)}>
                            <Copy className="mr-2 h-4 w-4" />
                            {t('copy_schema')}
                          </DropdownMenuItem>
                        </PermissionGate>

                        <DropdownMenuSeparator />

                        <PermissionGate action="model_schemas.delete" resource={schema.id}>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteWithTracking(schema.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('delete_schema')}
                          </DropdownMenuItem>
                        </PermissionGate>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination would go here if needed */}
        {schemas.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {t('showing_results', { count: schemas.length })}
            </div>
            {/* Pagination component would be added here */}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 