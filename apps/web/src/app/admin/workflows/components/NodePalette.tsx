'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Users, 
  Clock, 
  GitBranch, 
  Mail, 
  Database, 
  Webhook, 
  StopCircle,
  Search,
  Sparkles,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NodeTypeDefinition } from '../types/workflow';

const nodeTypes: NodeTypeDefinition[] = [
  {
    type: 'start',
    label: 'Start',
    description: 'Workflow trigger point',
    icon: 'Play',
    color: 'bg-green-500',
    category: 'triggers'
  },
  {
    type: 'approval',
    label: 'Approval',
    description: 'Manual review required',
    icon: 'Users',
    color: 'bg-blue-500',
    category: 'logic'
  },
  {
    type: 'wait',
    label: 'Wait/Delay',
    description: 'Pause workflow execution',
    icon: 'Clock',
    color: 'bg-cyan-500',
    category: 'logic'
  },
  {
    type: 'decision',
    label: 'Decision',
    description: 'Conditional branching',
    icon: 'GitBranch',
    color: 'bg-yellow-500',
    category: 'logic'
  },
  {
    type: 'email',
    label: 'Send Email',
    description: 'Send notification email',
    icon: 'Mail',
    color: 'bg-purple-500',
    category: 'actions'
  },
  {
    type: 'updateRecord',
    label: 'Update Record',
    description: 'Modify database record',
    icon: 'Database',
    color: 'bg-lime-500',
    category: 'actions'
  },
  {
    type: 'webhook',
    label: 'Webhook/API',
    description: 'Call external service',
    icon: 'Webhook',
    color: 'bg-red-500',
    category: 'actions'
  },
  {
    type: 'end',
    label: 'End',
    description: 'Workflow completion',
    icon: 'StopCircle',
    color: 'bg-gray-500',
    category: 'triggers'
  }
];

const categories = [
  { id: 'all', label: 'All Nodes', icon: Sparkles },
  { id: 'triggers', label: 'Triggers & Endings', icon: Play },
  { id: 'logic', label: 'Logic & Flow', icon: GitBranch },
  { id: 'actions', label: 'Actions', icon: Filter }
];

interface NodePaletteProps {
  onAddNode: (nodeType: string) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredNodes = nodeTypes.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      Play,
      Users,
      Clock,
      GitBranch,
      Mail,
      Database,
      Webhook,
      StopCircle
    };
    const IconComponent = icons[iconName] || Play;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <Card className="w-80 h-full rounded-none border-r shadow-lg bg-white">
      <CardHeader className="pb-4 border-b bg-gray-50">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Node Palette
        </CardTitle>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="h-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-gray-50 rounded-none">
            {categories.slice(0, 2).map((category) => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-1 text-xs data-[state=active]:bg-white"
                >
                  <IconComponent className="w-3 h-3" />
                  {category.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-gray-50 rounded-none border-t">
            {categories.slice(2, 4).map((category) => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-1 text-xs data-[state=active]:bg-white"
                >
                  <IconComponent className="w-3 h-3" />
                  {category.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <ScrollArea className="h-[calc(100vh-240px)]">
            <TabsContent value="all" className="mt-0 p-4 space-y-3">
              <NodeList nodes={filteredNodes} onAddNode={onAddNode} onDragStart={handleDragStart} getIcon={getIcon} />
            </TabsContent>
            <TabsContent value="triggers" className="mt-0 p-4 space-y-3">
              <NodeList nodes={filteredNodes} onAddNode={onAddNode} onDragStart={handleDragStart} getIcon={getIcon} />
            </TabsContent>
            <TabsContent value="logic" className="mt-0 p-4 space-y-3">
              <NodeList nodes={filteredNodes} onAddNode={onAddNode} onDragStart={handleDragStart} getIcon={getIcon} />
            </TabsContent>
            <TabsContent value="actions" className="mt-0 p-4 space-y-3">
              <NodeList nodes={filteredNodes} onAddNode={onAddNode} onDragStart={handleDragStart} getIcon={getIcon} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface NodeListProps {
  nodes: NodeTypeDefinition[];
  onAddNode: (nodeType: string) => void;
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
  getIcon: (iconName: string) => React.ReactNode;
}

function NodeList({ nodes, onAddNode, onDragStart, getIcon }: NodeListProps) {
  return (
    <>
      {nodes.map((node) => (
        <div
          key={node.type}
          className="group relative bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-indigo-300 transition-all duration-200"
          draggable
          onDragStart={(e) => onDragStart(e, node.type)}
          onClick={() => onAddNode(node.type)}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${node.color} text-white flex-shrink-0 group-hover:scale-110 transition-transform`}>
              {getIcon(node.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm group-hover:text-indigo-600">
                {node.label}
              </h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {node.description}
              </p>
              <Badge variant="secondary" className="mt-2 text-xs capitalize">
                {node.category}
              </Badge>
            </div>
          </div>

          <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-20 rounded-lg transition-opacity" />
        </div>
      ))}

      {nodes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No nodes found</p>
        </div>
      )}
    </>
  );
} 