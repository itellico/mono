'use client';
import React, { useState } from 'react';
import { Plus, Search, Settings, Trash2, Edit3, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useModelSchemasByType, useDeleteModelSchema } from '@/hooks/use-model-schemas';
import { CreateModelSchemaModal } from './CreateModelSchemaModal';
import { EditModelSchemaModal } from './EditModelSchemaModal';
import type { ModelSchema } from '@/lib/schemas/model-schemas';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from '@/components/ui/alert-dialog';
// ============================
// 🏗️ MODEL SCHEMAS SIDEBAR COMPONENT
// ============================
interface ModelSchemasSidebarProps {
  className?: string;
  selectedSchema?: ModelSchema | null;
  onSchemaSelect?: (schema: ModelSchema | null) => void;
}
export const ModelSchemasSidebar = function ModelSchemasSidebar({ className, selectedSchema, onSchemaSelect }: ModelSchemasSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['human_model']));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [schemaToDelete, setSchemaToDelete] = useState<ModelSchema | null>(null);
  const { data: groupedSchemas, isLoading, error } = useModelSchemasByType();
  const deleteModelSchema = useDeleteModelSchema();
  // Filter schemas based on search term
  const filteredGroupedSchemas = (() => {
    if (!searchTerm) return groupedSchemas;
    
    const filtered: Record<string, ModelSchema[]> = {};
    Object.entries(groupedSchemas).forEach(([type, schemas]) => {
      const filteredSchemas = schemas.filter(schema =>
        schema.subType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schema.displayName['en-US']?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredSchemas.length > 0) {
        filtered[type] = filteredSchemas;
      }
    });
    return filtered;
  })();
  const toggleTypeExpansion = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };
  const handleDeleteSchema = async () => {
    if (!schemaToDelete) return;
    try {
      await deleteModelSchema.mutateAsync(schemaToDelete.id);
      if (selectedSchema?.id === schemaToDelete.id) {
        onSchemaSelect?.(null);
      }
    } finally {
      setSchemaToDelete(null);
    }
  };
  const getTypeDisplayName = (type: string) => {
    const typeNames: Record<string, string> = {
      human_model: 'Human Models',
      freelancer: 'Freelancers',
      business: 'Businesses',
      project: 'Projects' };
    return typeNames[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  if (error) {
    return (
      <div className={`bg-white border-r border-gray-200 ${className}`}>
        <div className="p-4 text-center text-red-600">
          <p>Failed to load model schemas</p>
          <p className="text-sm text-gray-500 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Profile Models</h2>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>
      {/* Model Types List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <div className="ml-4 space-y-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {Object.entries(filteredGroupedSchemas).map(([type, schemas]) => (
                <Collapsible
                  key={type}
                  open={expandedTypes.has(type)}
                  onOpenChange={() => toggleTypeExpansion(type)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-9 px-2 font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <span className="flex items-center">
                        {expandedTypes.has(type) ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        {getTypeDisplayName(type)}
                      </span>
                      <Badge variant="secondary" className="h-5 text-xs">
                        {schemas.length}
                      </Badge>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-6 mt-1 space-y-1">
                    {schemas.map((schema) => (
                      <div
                        key={schema.id}
                        className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                          selectedSchema?.id === schema.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => onSchemaSelect?.(schema)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {schema.displayName['en-US'] || schema.subType}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {schema.schema.fields.length} fields
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSchemaSelect?.(schema);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSchemaToDelete(schema);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {Object.keys(filteredGroupedSchemas).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No models found' : 'No model schemas yet'}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      {/* Modals */}
      <CreateModelSchemaModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
      {selectedSchema && (
        <EditModelSchemaModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          schema={selectedSchema}
          onSchemaUpdate={(updatedSchema) => onSchemaSelect?.(updatedSchema)}
        />
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!schemaToDelete} onOpenChange={() => setSchemaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model Schema</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{schemaToDelete?.displayName['en-US'] || schemaToDelete?.subType}&quot;?
              This action cannot be undone and will affect all profiles using this schema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSchema}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteModelSchema.isPending}
            >
              {deleteModelSchema.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}