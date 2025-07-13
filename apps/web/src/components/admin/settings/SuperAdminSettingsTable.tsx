"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Crown, 
  Code, 
  Bug, 
  Wrench,
  Shield,
  Zap,
  Palette,
  Bell,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { browserLogger } from '@/lib/browser-logger';

interface AdminSetting {
  id: number;
  key: string;
  displayName: string | null;
  description: string | null;
  value: any;
  defaultValue: any;
  category: string;
  level: string;
  governance: string;
  isReadonly: boolean;
  requiresRestart: boolean;
  helpText: string | null;
  tenantId: number | null;
}

const categoryIcons = {
  security: Shield,
  development: Code,
  features: Zap,
  maintenance: Wrench,
  performance: Settings,
  ui: Palette,
  notifications: Bell
};

const categoryColors = {
  security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  features: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  maintenance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  performance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ui: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  notifications: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
};

const accessLevelColors = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  moderator: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
};

export function SuperAdminSettingsTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [userSpecificFilter, setUserSpecificFilter] = useState<string>('all');
  const [editingValue, setEditingValue] = useState<{ id: number; value: any } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin-settings', categoryFilter, userSpecificFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (userSpecificFilter !== 'all') params.append('level', userSpecificFilter);

      const response = await fetch(`/api/v1/admin/settings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      const result = await response.json();
      return result.data as AdminSetting[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, reason }: { key: string; value: any; reason?: string }) => {
      const response = await fetch(`/api/v1/admin/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, reason }),
      });
      if (!response.ok) throw new Error('Failed to update setting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['active-modes'] });
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
      setEditingValue(null);
    },
    onError: (error) => {
      browserLogger.error('Failed to update setting', { error });
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  // Delete setting mutation
  const deleteSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      const response = await fetch(`/api/v1/admin/settings/${key}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete setting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({
        title: "Success",
        description: "Setting deleted successfully",
      });
    },
    onError: (error) => {
      browserLogger.error('Failed to delete setting', { error });
      toast({
        title: "Error",
        description: "Failed to delete setting",
        variant: "destructive",
      });
    },
  });

  // Filter settings
  const filteredSettings = settings?.filter(setting => {
    const matchesSearch = setting.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         setting.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const handleUpdateValue = (setting: SuperAdminSetting, newValue: any) => {
    updateSettingMutation.mutate({
      key: setting.key,
      value: newValue,
      reason: 'Updated via admin settings table'
    });
  };

  const renderValueEditor = (setting: SuperAdminSetting) => {
    if (setting.isReadOnly) {
      return (
        <span className="text-muted-foreground italic">
          {setting.type === 'boolean' ? (setting.value ? 'TRUE' : 'FALSE') : String(setting.value)}
        </span>
      );
    }

    if (editingValue?.id === setting.id) {
      switch (setting.type) {
        case 'boolean':
          return (
            <div className="flex items-center space-x-2">
              <Switch
                checked={editingValue.value}
                onCheckedChange={(checked) => 
                  setEditingValue({ id: setting.id, value: checked })
                }
              />
              <Button 
                size="sm" 
                onClick={() => handleUpdateValue(setting, editingValue.value)}
                disabled={updateSettingMutation.isPending}
              >
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setEditingValue(null)}
              >
                Cancel
              </Button>
            </div>
          );
        case 'integer':
          return (
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={editingValue.value}
                onChange={(e) => 
                  setEditingValue({ id: setting.id, value: parseInt(e.target.value) || 0 })
                }
                className="w-32"
              />
              <Button 
                size="sm" 
                onClick={() => handleUpdateValue(setting, editingValue.value)}
                disabled={updateSettingMutation.isPending}
              >
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setEditingValue(null)}
              >
                Cancel
              </Button>
            </div>
          );
        case 'string':
          return (
            <div className="flex items-center space-x-2">
              <Input
                value={editingValue.value}
                onChange={(e) => 
                  setEditingValue({ id: setting.id, value: e.target.value })
                }
                className="w-48"
              />
              <Button 
                size="sm" 
                onClick={() => handleUpdateValue(setting, editingValue.value)}
                disabled={updateSettingMutation.isPending}
              >
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setEditingValue(null)}
              >
                Cancel
              </Button>
            </div>
          );
        default:
          return (
            <div className="flex items-center space-x-2">
              <Textarea
                value={JSON.stringify(editingValue.value, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setEditingValue({ id: setting.id, value: parsed });
                  } catch {
                    // Invalid JSON, keep as string for now
                  }
                }}
                className="w-64 h-20"
              />
              <Button 
                size="sm" 
                onClick={() => handleUpdateValue(setting, editingValue.value)}
                disabled={updateSettingMutation.isPending}
              >
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setEditingValue(null)}
              >
                Cancel
              </Button>
            </div>
          );
      }
    }

    // Display mode
    return (
      <div className="flex items-center space-x-2">
        <span className="font-mono text-sm">
          {setting.type === 'boolean' ? (
            <Badge variant={setting.value ? "default" : "secondary"}>
              {setting.value ? 'TRUE' : 'FALSE'}
            </Badge>
          ) : setting.type === 'json' ? (
            <code className="text-xs">{JSON.stringify(setting.value)}</code>
          ) : (
            String(setting.value)
          )}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setEditingValue({ id: setting.id, value: setting.value })}
          disabled={setting.isReadOnly}
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load admin settings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Super Admin Settings ({filteredSettings.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage platform-wide administrative settings and feature flags
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-settings'] })}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Setting
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Setting</DialogTitle>
                </DialogHeader>
                {/* TODO: Add create form */}
                <p className="text-sm text-muted-foreground">
                  Create setting form will be implemented here.
                </p>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search settings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="features">Features</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="ui">UI/UX</SelectItem>
              <SelectItem value="notifications">Notifications</SelectItem>
            </SelectContent>
          </Select>
          <Select value={userSpecificFilter} onValueChange={setUserSpecificFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Scopes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scopes</SelectItem>
              <SelectItem value="true">User-Specific</SelectItem>
              <SelectItem value="false">Global</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Settings Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Setting</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSettings.map((setting) => {
                const CategoryIcon = categoryIcons[setting.category];
                return (
                  <TableRow key={setting.id}>
                    <TableCell>
                      <Badge className={categoryColors[setting.category]}>
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {setting.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{setting.displayName}</div>
                        {setting.description && (
                          <div className="text-sm text-muted-foreground">
                            {setting.description}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          {setting.isUserSpecific && (
                            <Badge variant="outline" className="text-xs">User-Specific</Badge>
                          )}
                          {setting.requiresRestart && (
                            <Badge variant="destructive" className="text-xs">Requires Restart</Badge>
                          )}
                          {setting.isExperimental && (
                            <Badge variant="secondary" className="text-xs">Experimental</Badge>
                          )}
                          {setting.isReadOnly && (
                            <Badge variant="outline" className="text-xs">Read-Only</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {setting.key}
                      </code>
                    </TableCell>
                    <TableCell>
                      {renderValueEditor(setting)}
                    </TableCell>
                    <TableCell>
                      <Badge className={accessLevelColors[setting.accessLevel]}>
                        {setting.accessLevel.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {!setting.isReadOnly && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingValue({ id: setting.id, value: setting.value })}
                            disabled={editingValue?.id === setting.id}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {/* Only allow deletion of custom settings */}
                        {!['god_mode_enabled', 'developer_mode_enabled', 'debug_mode_enabled', 'maintenance_mode_enabled'].includes(setting.key) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this setting?')) {
                                deleteSettingMutation.mutate(setting.key);
                              }
                            }}
                            disabled={deleteSettingMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {filteredSettings.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            No settings found matching your criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
} 