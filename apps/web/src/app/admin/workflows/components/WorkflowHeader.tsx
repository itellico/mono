'use client';

import React from 'react';
import { 
  Save, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Download, 
  Upload,
  Workflow,
  Eye,
  Share2,
  MoreHorizontal,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkflowHeaderProps {
  workflowName: string;
  onWorkflowNameChange: (name: string) => void;
  onShowTemplates: () => void;
  onSaveWorkflow: () => Promise<void>;
  nodeCount: number;
  isSaving?: boolean;
  isLoading?: boolean;
  workflowType?: 'system' | 'user';
  workflowDescription?: string;
  currentWorkflowId?: string | null;
  onBack?: () => void;
  hasUnsavedChanges?: boolean;
}

export function WorkflowHeader({ 
  workflowName, 
  onWorkflowNameChange, 
  onShowTemplates,
  onSaveWorkflow,
  nodeCount,
  isSaving = false,
  isLoading = false,
  workflowType = 'user',
  workflowDescription = '',
  currentWorkflowId = null,
  onBack,
  hasUnsavedChanges = false
}: WorkflowHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Back Button - only show when editing existing workflow */}
          {currentWorkflowId && onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Workflows
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Workflow className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <Input
                value={workflowName}
                onChange={(e) => onWorkflowNameChange(e.target.value)}
                className="border-none shadow-none text-lg font-semibold p-0 h-auto focus-visible:ring-0 bg-transparent"
                placeholder="Untitled Workflow"
                disabled={isLoading}
              />
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {nodeCount} nodes
                </Badge>
                <Badge 
                  variant={workflowType === 'system' ? 'default' : 'secondary'} 
                  className="text-xs"
                >
                  {workflowType}
                </Badge>
                {currentWorkflowId ? (
                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                    Editing
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                    Draft
                  </Badge>
                )}
                {isLoading && (
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                    Loading...
                  </Badge>
                )}
                {hasUnsavedChanges && !isLoading && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Quick Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          
          <Button variant="outline" size="sm" onClick={onShowTemplates} className="gap-2">
            <Upload className="w-4 h-4" />
            Templates
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <Button 
            variant={hasUnsavedChanges ? "default" : "outline"}
            size="sm" 
            className={`gap-2 ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
            onClick={onSaveWorkflow}
            disabled={isSaving}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Save Draft'}
          </Button>
          
          <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Play className="w-4 h-4" />
            Deploy
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2">
                <Download className="w-4 h-4" />
                Export Workflow
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2">
                <Settings className="w-4 h-4" />
                Workflow Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Last saved: Never</span>
          <span>•</span>
          <span>Status: {currentWorkflowId ? 'Editing' : 'Draft'}</span>
          {currentWorkflowId && (
            <>
              <span>•</span>
              <span>ID: {currentWorkflowId}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Auto-save enabled</span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
} 