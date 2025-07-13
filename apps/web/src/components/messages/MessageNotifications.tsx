'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bell,
  BellOff,
  Mail,
  MessageSquare,
  Clock,
  Calendar,
  Users,
  UserPlus,
  Star,
  AtSign,
  Hash,
  Shield,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Globe,
  Sun,
  Moon,
  Info,
  AlertTriangle,
  CheckCircle,
  Settings,
  Filter,
  Zap,
  TrendingUp,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MessageNotificationsProps {
  /**
   * User ID for notification settings
   */
  userId: string;
  /**
   * Whether to show global notification settings
   * @default true
   */
  showGlobalSettings?: boolean;
  /**
   * Whether to show conversation-specific settings
   * @default true
   */
  showConversationSettings?: boolean;
  /**
   * Whether to show email digest settings
   * @default true
   */
  showDigestSettings?: boolean;
  /**
   * Whether to show notification schedule
   * @default true
   */
  showSchedule?: boolean;
  /**
   * Whether to enable import/export
   * @default false
   */
  enableImportExport?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Initial notification settings
   */
  initialSettings?: NotificationSettings;
  /**
   * Available conversations for specific settings
   */
  conversations?: Conversation[];
  /**
   * Callback when settings are saved
   */
  onSave?: (settings: NotificationSettings) => Promise<void>;
  /**
   * Callback when settings are reset
   */
  onReset?: () => Promise<void>;
}

interface NotificationSettings {
  global: GlobalSettings;
  conversations: Record<string, ConversationSettings>;
  emailDigest: EmailDigestSettings;
  schedule: NotificationSchedule;
  devices: DeviceSettings;
}

interface GlobalSettings {
  enabled: boolean;
  newMessages: boolean;
  mentions: boolean;
  replies: boolean;
  reactions: boolean;
  memberJoins: boolean;
  sound: boolean;
  vibration: boolean;
  showPreview: boolean;
  groupByConversation: boolean;
}

interface ConversationSettings {
  conversationId: string;
  enabled: boolean;
  muteUntil?: Date;
  onlyMentions: boolean;
  priority: 'high' | 'normal' | 'low';
}

interface EmailDigestSettings {
  enabled: boolean;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  time?: string; // For daily digest
  dayOfWeek?: number; // For weekly digest
  includeRead: boolean;
  includeArchived: boolean;
  groupByConversation: boolean;
  maxMessages: number;
}

interface NotificationSchedule {
  enabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  workingHours: {
    enabled: boolean;
    days: number[]; // 0-6, Sunday-Saturday
    start: string;
    end: string;
  };
  vacation: {
    enabled: boolean;
    startDate?: Date;
    endDate?: Date;
    autoReply?: string;
  };
}

interface DeviceSettings {
  desktop: {
    enabled: boolean;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration: number; // seconds
  };
  mobile: {
    enabled: boolean;
    pushNotifications: boolean;
    inAppNotifications: boolean;
  };
  email: {
    enabled: boolean;
    address: string;
    verified: boolean;
  };
}

interface Conversation {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'support' | 'business';
  avatar?: string;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
}

// Default settings
const defaultSettings: NotificationSettings = {
  global: {
    enabled: true,
    newMessages: true,
    mentions: true,
    replies: true,
    reactions: false,
    memberJoins: false,
    sound: true,
    vibration: true,
    showPreview: true,
    groupByConversation: true
  },
  conversations: {},
  emailDigest: {
    enabled: false,
    frequency: 'daily',
    time: '09:00',
    dayOfWeek: 1, // Monday
    includeRead: false,
    includeArchived: false,
    groupByConversation: true,
    maxMessages: 50
  },
  schedule: {
    enabled: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'America/New_York'
    },
    workingHours: {
      enabled: false,
      days: [1, 2, 3, 4, 5], // Monday-Friday
      start: '09:00',
      end: '17:00'
    },
    vacation: {
      enabled: false
    }
  },
  devices: {
    desktop: {
      enabled: true,
      position: 'top-right',
      duration: 5
    },
    mobile: {
      enabled: true,
      pushNotifications: true,
      inAppNotifications: true
    },
    email: {
      enabled: true,
      address: 'user@example.com',
      verified: true
    }
  }
};

// Mock conversations
const mockConversations: Conversation[] = [
  { id: '1', name: 'Project Team', type: 'group', unreadCount: 5, isArchived: false, isMuted: false },
  { id: '2', name: 'John Doe', type: 'direct', unreadCount: 2, isArchived: false, isMuted: true },
  { id: '3', name: 'Support', type: 'support', unreadCount: 0, isArchived: false, isMuted: false },
  { id: '4', name: 'Sales Team', type: 'group', unreadCount: 12, isArchived: true, isMuted: false }
];

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export function MessageNotifications({
  userId,
  showGlobalSettings = true,
  showConversationSettings = true,
  showDigestSettings = true,
  showSchedule = true,
  enableImportExport = false,
  className,
  initialSettings = defaultSettings,
  conversations = mockConversations,
  onSave,
  onReset
}: MessageNotificationsProps) {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('global');

  const updateGlobalSetting = <K extends keyof GlobalSettings>(
    key: K,
    value: GlobalSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      global: { ...prev.global, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateConversationSetting = (
    conversationId: string,
    updates: Partial<ConversationSettings>
  ) => {
    setSettings(prev => ({
      ...prev,
      conversations: {
        ...prev.conversations,
        [conversationId]: {
          conversationId,
          enabled: true,
          onlyMentions: false,
          priority: 'normal',
          ...prev.conversations[conversationId],
          ...updates
        }
      }
    }));
    setHasChanges(true);
  };

  const updateEmailDigestSetting = <K extends keyof EmailDigestSettings>(
    key: K,
    value: EmailDigestSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      emailDigest: { ...prev.emailDigest, [key]: value }
    }));
    setHasChanges(true);
  };

  const updateScheduleSetting = (
    path: string[],
    value: any
  ) => {
    setSettings(prev => {
      const newSchedule = { ...prev.schedule };
      let current: any = newSchedule;
      
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      
      return { ...prev, schedule: newSchedule };
    });
    setHasChanges(true);
  };

  const updateDeviceSetting = (
    device: keyof DeviceSettings,
    key: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      devices: {
        ...prev.devices,
        [device]: {
          ...prev.devices[device],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.(settings);
      setHasChanges(false);
      toast.success('Notification settings saved successfully');
    } catch (error) {
      toast.error('Failed to save notification settings');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await onReset?.();
      setSettings(defaultSettings);
      setHasChanges(false);
      setShowResetDialog(false);
      toast.success('Notification settings reset to defaults');
    } catch (error) {
      toast.error('Failed to reset notification settings');
      console.error('Reset error:', error);
    }
  };

  const exportSettings = () => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-settings-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        setHasChanges(true);
        toast.success('Settings imported successfully');
      } catch (error) {
        toast.error('Failed to import settings. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const getNotificationCount = () => {
    let count = 0;
    if (settings.global.enabled) {
      if (settings.global.newMessages) count++;
      if (settings.global.mentions) count++;
      if (settings.global.replies) count++;
      if (settings.global.reactions) count++;
      if (settings.global.memberJoins) count++;
    }
    return count;
  };

  const getMutedConversationsCount = () => {
    return Object.values(settings.conversations).filter(c => !c.enabled || c.muteUntil).length;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how and when you receive message notifications
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enableImportExport && (
              <>
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                  id="import-settings"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('import-settings')?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportSettings}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetDialog(true)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {showGlobalSettings && (
              <TabsTrigger value="global">
                Global
                {getNotificationCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getNotificationCount()}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {showConversationSettings && (
              <TabsTrigger value="conversations">
                Conversations
                {getMutedConversationsCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getMutedConversationsCount()}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {showDigestSettings && (
              <TabsTrigger value="digest">
                Email Digest
              </TabsTrigger>
            )}
            {showSchedule && (
              <TabsTrigger value="schedule">
                Schedule
              </TabsTrigger>
            )}
            <TabsTrigger value="devices">
              Devices
            </TabsTrigger>
          </TabsList>

          {/* Global Settings */}
          {showGlobalSettings && (
            <TabsContent value="global" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="global-enabled" className="text-base">
                      Enable Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Master switch for all message notifications
                    </p>
                  </div>
                  <Switch
                    id="global-enabled"
                    checked={settings.global.enabled}
                    onCheckedChange={(checked) => updateGlobalSetting('enabled', checked)}
                  />
                </div>

                {settings.global.enabled && (
                  <>
                    <Separator />
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Notification Types</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="new-messages">New Messages</Label>
                          </div>
                          <Switch
                            id="new-messages"
                            checked={settings.global.newMessages}
                            onCheckedChange={(checked) => updateGlobalSetting('newMessages', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AtSign className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="mentions">Mentions</Label>
                          </div>
                          <Switch
                            id="mentions"
                            checked={settings.global.mentions}
                            onCheckedChange={(checked) => updateGlobalSetting('mentions', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="replies">Replies</Label>
                          </div>
                          <Switch
                            id="replies"
                            checked={settings.global.replies}
                            onCheckedChange={(checked) => updateGlobalSetting('replies', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="reactions">Reactions</Label>
                          </div>
                          <Switch
                            id="reactions"
                            checked={settings.global.reactions}
                            onCheckedChange={(checked) => updateGlobalSetting('reactions', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="member-joins">Member Joins</Label>
                          </div>
                          <Switch
                            id="member-joins"
                            checked={settings.global.memberJoins}
                            onCheckedChange={(checked) => updateGlobalSetting('memberJoins', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Notification Behavior</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="sound">Sound</Label>
                          </div>
                          <Switch
                            id="sound"
                            checked={settings.global.sound}
                            onCheckedChange={(checked) => updateGlobalSetting('sound', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="vibration">Vibration</Label>
                          </div>
                          <Switch
                            id="vibration"
                            checked={settings.global.vibration}
                            onCheckedChange={(checked) => updateGlobalSetting('vibration', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="show-preview">Show Preview</Label>
                          </div>
                          <Switch
                            id="show-preview"
                            checked={settings.global.showPreview}
                            onCheckedChange={(checked) => updateGlobalSetting('showPreview', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="group-by-conversation">Group by Conversation</Label>
                          </div>
                          <Switch
                            id="group-by-conversation"
                            checked={settings.global.groupByConversation}
                            onCheckedChange={(checked) => updateGlobalSetting('groupByConversation', checked)}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!settings.global.enabled && (
                <Alert>
                  <BellOff className="h-4 w-4" />
                  <AlertTitle>Notifications Disabled</AlertTitle>
                  <AlertDescription>
                    You won't receive any message notifications while this is turned off.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          )}

          {/* Conversation Settings */}
          {showConversationSettings && (
            <TabsContent value="conversations" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Conversation-Specific Settings</h4>
                  <p className="text-sm text-muted-foreground">
                    Override global settings for individual conversations
                  </p>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {conversations.map((conversation) => {
                      const convSettings = settings.conversations[conversation.id] || {
                        conversationId: conversation.id,
                        enabled: true,
                        onlyMentions: false,
                        priority: 'normal' as const
                      };

                      return (
                        <Card key={conversation.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img
                                    src={conversation.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${conversation.name}`}
                                    alt={conversation.name}
                                    className="h-10 w-10 rounded-full"
                                  />
                                  {conversation.isMuted && (
                                    <BellOff className="absolute -bottom-1 -right-1 h-4 w-4 text-muted-foreground bg-background rounded-full" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{conversation.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {conversation.type}
                                    </Badge>
                                    {conversation.unreadCount > 0 && (
                                      <span>{conversation.unreadCount} unread</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Switch
                                checked={convSettings.enabled}
                                onCheckedChange={(checked) => 
                                  updateConversationSetting(conversation.id, { enabled: checked })
                                }
                              />
                            </div>

                            {convSettings.enabled && (
                              <div className="ml-12 space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`only-mentions-${conversation.id}`} className="text-sm">
                                    Only mentions
                                  </Label>
                                  <Switch
                                    id={`only-mentions-${conversation.id}`}
                                    checked={convSettings.onlyMentions}
                                    onCheckedChange={(checked) => 
                                      updateConversationSetting(conversation.id, { onlyMentions: checked })
                                    }
                                  />
                                </div>

                                <div>
                                  <Label htmlFor={`priority-${conversation.id}`} className="text-sm">
                                    Priority
                                  </Label>
                                  <Select
                                    value={convSettings.priority}
                                    onValueChange={(value: any) => 
                                      updateConversationSetting(conversation.id, { priority: value })
                                    }
                                  >
                                    <SelectTrigger id={`priority-${conversation.id}`} className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="high">
                                        <div className="flex items-center gap-2">
                                          <Zap className="h-4 w-4" />
                                          High
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="normal">Normal</SelectItem>
                                      <SelectItem value="low">
                                        <div className="flex items-center gap-2">
                                          <VolumeX className="h-4 w-4" />
                                          Low
                                        </div>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          )}

          {/* Email Digest Settings */}
          {showDigestSettings && (
            <TabsContent value="digest" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="digest-enabled" className="text-base">
                      Enable Email Digest
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a summary of unread messages via email
                    </p>
                  </div>
                  <Switch
                    id="digest-enabled"
                    checked={settings.emailDigest.enabled}
                    onCheckedChange={(checked) => updateEmailDigestSetting('enabled', checked)}
                  />
                </div>

                {settings.emailDigest.enabled && (
                  <>
                    <Separator />
                    
                    <div>
                      <Label htmlFor="digest-frequency">Frequency</Label>
                      <RadioGroup
                        id="digest-frequency"
                        value={settings.emailDigest.frequency}
                        onValueChange={(value: any) => updateEmailDigestSetting('frequency', value)}
                        className="mt-2 space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="realtime" id="realtime" />
                          <Label htmlFor="realtime">Real-time (as messages arrive)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="hourly" id="hourly" />
                          <Label htmlFor="hourly">Hourly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="daily" id="daily" />
                          <Label htmlFor="daily">Daily</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="weekly" id="weekly" />
                          <Label htmlFor="weekly">Weekly</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {settings.emailDigest.frequency === 'daily' && (
                      <div>
                        <Label htmlFor="digest-time">Send at</Label>
                        <Select
                          value={settings.emailDigest.time}
                          onValueChange={(value) => updateEmailDigestSetting('time', value)}
                        >
                          <SelectTrigger id="digest-time" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {settings.emailDigest.frequency === 'weekly' && (
                      <div>
                        <Label htmlFor="digest-day">Send on</Label>
                        <Select
                          value={settings.emailDigest.dayOfWeek?.toString()}
                          onValueChange={(value) => updateEmailDigestSetting('dayOfWeek', parseInt(value))}
                        >
                          <SelectTrigger id="digest-day" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map((day) => (
                              <SelectItem key={day.value} value={day.value.toString()}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Digest Options</h4>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="include-read">Include read messages</Label>
                        <Switch
                          id="include-read"
                          checked={settings.emailDigest.includeRead}
                          onCheckedChange={(checked) => updateEmailDigestSetting('includeRead', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="include-archived">Include archived conversations</Label>
                        <Switch
                          id="include-archived"
                          checked={settings.emailDigest.includeArchived}
                          onCheckedChange={(checked) => updateEmailDigestSetting('includeArchived', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="group-digest">Group by conversation</Label>
                        <Switch
                          id="group-digest"
                          checked={settings.emailDigest.groupByConversation}
                          onCheckedChange={(checked) => updateEmailDigestSetting('groupByConversation', checked)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="max-messages">Maximum messages per digest</Label>
                        <Select
                          value={settings.emailDigest.maxMessages.toString()}
                          onValueChange={(value) => updateEmailDigestSetting('maxMessages', parseInt(value))}
                        >
                          <SelectTrigger id="max-messages" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25 messages</SelectItem>
                            <SelectItem value="50">50 messages</SelectItem>
                            <SelectItem value="100">100 messages</SelectItem>
                            <SelectItem value="200">200 messages</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          )}

          {/* Schedule Settings */}
          {showSchedule && (
            <TabsContent value="schedule" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="schedule-enabled" className="text-base">
                      Enable Notification Schedule
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Control when you receive notifications
                    </p>
                  </div>
                  <Switch
                    id="schedule-enabled"
                    checked={settings.schedule.enabled}
                    onCheckedChange={(checked) => updateScheduleSetting(['enabled'], checked)}
                  />
                </div>

                {settings.schedule.enabled && (
                  <>
                    <Separator />
                    
                    {/* Quiet Hours */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="quiet-hours">Quiet Hours</Label>
                        </div>
                        <Switch
                          id="quiet-hours"
                          checked={settings.schedule.quietHours.enabled}
                          onCheckedChange={(checked) => updateScheduleSetting(['quietHours', 'enabled'], checked)}
                        />
                      </div>

                      {settings.schedule.quietHours.enabled && (
                        <div className="ml-6 grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="quiet-start" className="text-xs">Start</Label>
                            <Input
                              id="quiet-start"
                              type="time"
                              value={settings.schedule.quietHours.start}
                              onChange={(e) => updateScheduleSetting(['quietHours', 'start'], e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quiet-end" className="text-xs">End</Label>
                            <Input
                              id="quiet-end"
                              type="time"
                              value={settings.schedule.quietHours.end}
                              onChange={(e) => updateScheduleSetting(['quietHours', 'end'], e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quiet-timezone" className="text-xs">Timezone</Label>
                            <Select
                              value={settings.schedule.quietHours.timezone}
                              onValueChange={(value) => updateScheduleSetting(['quietHours', 'timezone'], value)}
                            >
                              <SelectTrigger id="quiet-timezone" className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {timezones.map((tz) => (
                                  <SelectItem key={tz} value={tz}>
                                    {tz.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Working Hours */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="working-hours">Working Hours Only</Label>
                        </div>
                        <Switch
                          id="working-hours"
                          checked={settings.schedule.workingHours.enabled}
                          onCheckedChange={(checked) => updateScheduleSetting(['workingHours', 'enabled'], checked)}
                        />
                      </div>

                      {settings.schedule.workingHours.enabled && (
                        <div className="ml-6 space-y-3">
                          <div>
                            <Label className="text-xs">Working Days</Label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {daysOfWeek.map((day) => (
                                <label key={day.value} className="flex items-center gap-1 cursor-pointer">
                                  <Checkbox
                                    checked={settings.schedule.workingHours.days.includes(day.value)}
                                    onCheckedChange={(checked) => {
                                      const days = checked
                                        ? [...settings.schedule.workingHours.days, day.value]
                                        : settings.schedule.workingHours.days.filter(d => d !== day.value);
                                      updateScheduleSetting(['workingHours', 'days'], days);
                                    }}
                                  />
                                  <span className="text-sm">{day.label.slice(0, 3)}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="work-start" className="text-xs">Start Time</Label>
                              <Input
                                id="work-start"
                                type="time"
                                value={settings.schedule.workingHours.start}
                                onChange={(e) => updateScheduleSetting(['workingHours', 'start'], e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="work-end" className="text-xs">End Time</Label>
                              <Input
                                id="work-end"
                                type="time"
                                value={settings.schedule.workingHours.end}
                                onChange={(e) => updateScheduleSetting(['workingHours', 'end'], e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Vacation Mode */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Label htmlFor="vacation-mode">Vacation Mode</Label>
                        </div>
                        <Switch
                          id="vacation-mode"
                          checked={settings.schedule.vacation.enabled}
                          onCheckedChange={(checked) => updateScheduleSetting(['vacation', 'enabled'], checked)}
                        />
                      </div>

                      {settings.schedule.vacation.enabled && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Vacation Mode Active</AlertTitle>
                          <AlertDescription>
                            All notifications are paused while vacation mode is enabled.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          )}

          {/* Device Settings */}
          <TabsContent value="devices" className="space-y-6">
            <div className="space-y-6">
              {/* Desktop Notifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base">Desktop Notifications</Label>
                  </div>
                  <Switch
                    checked={settings.devices.desktop.enabled}
                    onCheckedChange={(checked) => updateDeviceSetting('desktop', 'enabled', checked)}
                  />
                </div>

                {settings.devices.desktop.enabled && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <Label htmlFor="desktop-position">Position</Label>
                      <Select
                        value={settings.devices.desktop.position}
                        onValueChange={(value) => updateDeviceSetting('desktop', 'position', value)}
                      >
                        <SelectTrigger id="desktop-position" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-right">Top Right</SelectItem>
                          <SelectItem value="top-left">Top Left</SelectItem>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="desktop-duration">Display Duration</Label>
                      <Select
                        value={settings.devices.desktop.duration.toString()}
                        onValueChange={(value) => updateDeviceSetting('desktop', 'duration', parseInt(value))}
                      >
                        <SelectTrigger id="desktop-duration" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 seconds</SelectItem>
                          <SelectItem value="5">5 seconds</SelectItem>
                          <SelectItem value="10">10 seconds</SelectItem>
                          <SelectItem value="15">15 seconds</SelectItem>
                          <SelectItem value="0">Until dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Mobile Notifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base">Mobile Notifications</Label>
                  </div>
                  <Switch
                    checked={settings.devices.mobile.enabled}
                    onCheckedChange={(checked) => updateDeviceSetting('mobile', 'enabled', checked)}
                  />
                </div>

                {settings.devices.mobile.enabled && (
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <Switch
                        id="push-notifications"
                        checked={settings.devices.mobile.pushNotifications}
                        onCheckedChange={(checked) => updateDeviceSetting('mobile', 'pushNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                      <Switch
                        id="in-app-notifications"
                        checked={settings.devices.mobile.inAppNotifications}
                        onCheckedChange={(checked) => updateDeviceSetting('mobile', 'inAppNotifications', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Email Notifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-base">Email Notifications</Label>
                  </div>
                  <Switch
                    checked={settings.devices.email.enabled}
                    onCheckedChange={(checked) => updateDeviceSetting('email', 'enabled', checked)}
                  />
                </div>

                {settings.devices.email.enabled && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <Label>Email Address</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={settings.devices.email.address}
                          disabled
                          className="flex-1"
                        />
                        {settings.devices.email.verified ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Unverified
                          </Badge>
                        )}
                      </div>
                      {!settings.devices.email.verified && (
                        <Button variant="link" size="sm" className="mt-1 p-0 h-auto">
                          Resend verification email
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Notification Settings</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all notification settings to their defaults? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Example usage component
export function MessageNotificationsExample() {
  const handleSave = async (settings: NotificationSettings) => {
    console.log('Saving notification settings:', settings);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleReset = async () => {
    console.log('Resetting notification settings');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Message Notification Settings</h2>
        <p className="text-muted-foreground">
          Comprehensive notification management with email digest and scheduling options.
        </p>
      </div>

      <MessageNotifications
        userId="user-123"
        onSave={handleSave}
        onReset={handleReset}
        enableImportExport={true}
      />
    </div>
  );
}

export default MessageNotifications;