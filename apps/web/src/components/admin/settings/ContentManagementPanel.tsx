'use client';

import React from 'react';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Edit, Save } from 'lucide-react';

interface ContentManagementPanelProps {
  isLoading?: boolean;
}

interface CategoryItem {
  key: string;
  label: string;
  description?: string;
  isActive: boolean;
}

interface CategorySection {
  id: string;
  title: string;
  description: string;
  items: CategoryItem[];
}

export const ContentManagementPanel = function ContentManagementPanel({ isLoading = false }: ContentManagementPanelProps) {
  // const t = useTranslations('admin-common.settings.contentManagement');

  // Mock data - will be replaced with API calls
  const [categories, setCategories] = useState<CategorySection[]>([
    {
      id: 'job_types',
      title: 'Job Types',
      description: 'Types of modeling jobs available on the platform',
      items: [
        { key: 'photoshoot', label: 'Photoshoot', isActive: true },
        { key: 'runway', label: 'Runway Show', isActive: true },
        { key: 'commercial', label: 'Commercial', isActive: true },
        { key: 'editorial', label: 'Editorial', isActive: true },
        { key: 'fitness', label: 'Fitness', isActive: true },
        { key: 'lifestyle', label: 'Lifestyle', isActive: false },
      ]
    },
    {
      id: 'model_specializations',
      title: 'Model Specializations',
      description: 'Specialization categories for different model types',
      items: [
        { key: 'fashion', label: 'Fashion', isActive: true },
        { key: 'commercial', label: 'Commercial', isActive: true },
        { key: 'fitness', label: 'Fitness', isActive: true },
        { key: 'beauty', label: 'Beauty', isActive: true },
        { key: 'editorial', label: 'Editorial', isActive: true },
      ]
    },
    {
      id: 'payment_types',
      title: 'Payment Types',
      description: 'Available payment structures for jobs',
      items: [
        { key: 'hourly', label: 'Hourly Rate', isActive: true },
        { key: 'daily', label: 'Daily Rate', isActive: true },
        { key: 'project', label: 'Project Fee', isActive: true },
        { key: 'performance', label: 'Performance Based', isActive: false },
        { key: 'usage_rights', label: 'Usage Rights', isActive: true },
      ]
    }
  ]);

  // const [editingItem, setEditingItem] = useState<{ sectionId: string; itemKey: string } | null>(null);
  const [newItem, setNewItem] = useState<{ sectionId: string; key: string; label: string; description: string }>({
    sectionId: '',
    key: '',
    label: '',
    description: ''
  });

  const handleToggleItem = (sectionId: string, itemKey: string) => {
    setCategories(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            items: section.items.map(item =>
              item.key === itemKey ? { ...item, isActive: !item.isActive } : item
            )
          }
        : section
    ));
  };

  const handleAddItem = (sectionId: string) => {
    if (newItem.key && newItem.label) {
      setCategories(prev => prev.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              items: [...section.items, {
                key: newItem.key,
                label: newItem.label,
                description: newItem.description,
                isActive: true
              }]
            }
          : section
      ));
      setNewItem({ sectionId: '', key: '', label: '', description: '' });
    }
  };

  const handleRemoveItem = (sectionId: string, itemKey: string) => {
    setCategories(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            items: section.items.filter(item => item.key !== itemKey)
          }
        : section
    ));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>Manage business categories and content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Management</CardTitle>
        <CardDescription>Manage business categories and content types</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="job_types" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="job_types">Job Types</TabsTrigger>
            <TabsTrigger value="model_specializations">Specializations</TabsTrigger>
            <TabsTrigger value="payment_types">Payment Types</TabsTrigger>
          </TabsList>

          {categories.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>

              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={() => handleToggleItem(section.id, item.key)}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.key}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: setEditingItem({ sectionId: section.id, itemKey: item.key }) */}}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(section.id, item.key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add new item form */}
              <div className="border-t pt-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`key-${section.id}`}>Key</Label>
                      <Input
                        id={`key-${section.id}`}
                        placeholder="e.g., new_category"
                        value={newItem.sectionId === section.id ? newItem.key : ''}
                        onChange={(e) => setNewItem(prev => ({
                          ...prev,
                          sectionId: section.id,
                          key: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`label-${section.id}`}>Label</Label>
                      <Input
                        id={`label-${section.id}`}
                        placeholder="e.g., New Category"
                        value={newItem.sectionId === section.id ? newItem.label : ''}
                        onChange={(e) => setNewItem(prev => ({
                          ...prev,
                          sectionId: section.id,
                          label: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`description-${section.id}`}>Description (Optional)</Label>
                    <Textarea
                      id={`description-${section.id}`}
                      placeholder="Brief description of this category"
                      value={newItem.sectionId === section.id ? newItem.description : ''}
                      onChange={(e) => setNewItem(prev => ({
                        ...prev,
                        sectionId: section.id,
                        description: e.target.value
                      }))}
                    />
                  </div>
                  <Button
                    onClick={() => handleAddItem(section.id)}
                    disabled={!newItem.key || !newItem.label || newItem.sectionId !== section.id}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {section.title.slice(0, -1)}
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Save changes button */}
        <div className="flex justify-end pt-4 border-t">
          <Button size="lg" className="min-w-32">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};