'use client';

import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Database, 
  Filter, 
  Zap, 
  Clock, 
  Trash2, 
  Copy, 
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Node } from '@xyflow/react';
import { WorkflowNodeData, WorkflowCondition, WorkflowAction } from '../types/workflow';
import { ConditionBuilder } from './ConditionBuilder';

interface NodeEditorProps {
  node: Node;
  onUpdateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onClose: () => void;
}

export function NodeEditor({ node, onUpdateNode, onDeleteNode, onDuplicateNode, onClose }: NodeEditorProps) {
  const [nodeData, setNodeData] = useState<WorkflowNodeData>({
    label: '',
    description: '',
    conditions: [],
    actions: [],
    config: {},
    ...node.data
  } as WorkflowNodeData);

  const handleUpdate = (updates: Partial<WorkflowNodeData>) => {
    const newData = { ...nodeData, ...updates };
    setNodeData(newData);
    onUpdateNode(node.id, updates);
  };

  return (
    <Card className="w-96 h-full rounded-none border-l shadow-lg bg-white">
      <CardHeader className="pb-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5 text-indigo-600" />
            Node Editor
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="capitalize">{node.type}</Badge>
          <Badge variant="outline" className="text-xs">ID: {node.id.split('-')[0]}</Badge>
        </div>

        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => onDuplicateNode(node.id)} className="gap-1">
            <Copy className="w-3 h-3" />
            Duplicate
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDeleteNode(node.id)} className="gap-1">
            <Trash2 className="w-3 h-3" />
            Delete
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        <Tabs defaultValue="basic" className="h-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-gray-50 rounded-none">
            <TabsTrigger value="basic" className="text-xs">Basic</TabsTrigger>
            <TabsTrigger value="conditions" className="text-xs">Conditions</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <TabsContent value="basic" className="mt-0 p-6 space-y-4">
              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={nodeData.label}
                  onChange={(e) => handleUpdate({ label: e.target.value })}
                  placeholder="Enter node label"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={nodeData.description || ''}
                  onChange={(e) => handleUpdate({ description: e.target.value })}
                  placeholder="Describe what this node does"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={nodeData.status || 'pending'} onValueChange={(value) => handleUpdate({ status: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="mt-0 p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Conditions</h3>
              </div>

              <ConditionBuilder
                conditions={nodeData.conditions || []}
                onChange={(conditions) => handleUpdate({ conditions })}
              />
            </TabsContent>

            <TabsContent value="actions" className="mt-0 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Actions</h3>
                <Button size="sm" className="gap-1">
                  <Plus className="w-3 h-3" />
                  Add
                </Button>
              </div>

              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-sm">No actions defined</p>
                <p className="text-xs mt-1">Add actions to be executed when this node runs</p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

 