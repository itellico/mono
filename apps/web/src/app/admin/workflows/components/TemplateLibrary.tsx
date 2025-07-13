'use client';

import React, { useState } from 'react';
import { X, Search, Download, Star, Clock, Users, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WorkflowTemplate } from '../types/workflow';

const mockTemplates: WorkflowTemplate[] = [
  {
    id: '1',
    name: 'Model Onboarding',
    description: 'Complete onboarding flow for new models including profile review and contract generation',
    category: 'onboarding',
    tags: ['popular', 'recommended'],
    icon: 'Users',
    nodes: [],
    edges: []
  },
  {
    id: '2',
    name: 'Contract Reminder',
    description: '2-day reminder system for unsigned contracts with escalation',
    category: 'reminders',
    tags: ['automation'],
    icon: 'Clock',
    nodes: [],
    edges: []
  },
  {
    id: '3',
    name: 'Email Campaign',
    description: 'Multi-step email marketing campaign with conditional branching',
    category: 'marketing',
    tags: ['email', 'campaign'],
    icon: 'Mail',
    nodes: [],
    edges: []
  }
];

interface TemplateLibraryProps {
  onClose: () => void;
  onSelectTemplate: (template: WorkflowTemplate) => void;
}

export function TemplateLibrary({ onClose, onSelectTemplate }: TemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Template Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        {getTemplateIcon(template.icon)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <CardDescription className="text-sm mb-4">
                    {template.description}
                  </CardDescription>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => onSelectTemplate(template)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function getTemplateIcon(iconName: string) {
  const icons: Record<string, React.ComponentType<any>> = {
    Users,
    Clock,
    Mail,
    Star
  };
  const IconComponent = icons[iconName] || Star;
  return <IconComponent className="w-4 h-4 text-indigo-600" />;
} 