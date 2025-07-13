'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Shield,
  Clock,
  MessageSquare,
  Users,
  FileText,
  Bell,
  Zap,
  Database,
  Server,
  AlertTriangle,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { toast } from 'sonner';

interface MessagingSettings {
  // General Settings
  maxMessageLength: number;
  maxConversationParticipants: number;
  allowGroupConversations: boolean;
  allowBusinessConversations: boolean;
  allowSupportConversations: boolean;
  
  // File Attachments
  allowFileAttachments: boolean;
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
  maxAttachmentsPerMessage: number;
  
  // Rate Limiting
  enableRateLimit: boolean;
  messagesPerMinute: number;
  messagesPerHour: number;
  newConversationsPerDay: number;
  
  // Moderation
  enableAutoModeration: boolean;
  aiModerationThreshold: number;
  enableSpamDetection: boolean;
  enableProfanityFilter: boolean;
  moderationKeywords: string[];
  autoDeleteViolations: boolean;
  
  // Notifications
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  enableInAppNotifications: boolean;
  notificationCooldown: number; // minutes
  
  // Retention
  messageRetentionDays: number;
  archiveOldConversations: boolean;
  archiveAfterDays: number;
  
  // Performance
  enableMessageCache: boolean;
  cacheExpirationMinutes: number;
  enableReadReceipts: boolean;
  enableTypingIndicators: boolean;
  enableOnlineStatus: boolean;
  
  // Security
  enableEncryption: boolean;
  requireVerifiedUsers: boolean;
  allowCrossTenatMessaging: boolean;
  logMessagingActivity: boolean;
  
  // Advanced
  enableWebsockets: boolean;
  heartbeatInterval: number;
  connectionTimeout: number;
  maxConcurrentConnections: number;
}

// Mock current settings
const mockSettings: MessagingSettings = {
  maxMessageLength: 2000,
  maxConversationParticipants: 20,
  allowGroupConversations: true,
  allowBusinessConversations: true,
  allowSupportConversations: true,
  
  allowFileAttachments: true,
  maxFileSize: 10,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
  maxAttachmentsPerMessage: 5,
  
  enableRateLimit: true,
  messagesPerMinute: 30,
  messagesPerHour: 500,
  newConversationsPerDay: 50,
  
  enableAutoModeration: true,
  aiModerationThreshold: 75,
  enableSpamDetection: true,
  enableProfanityFilter: true,
  moderationKeywords: ['spam', 'scam', 'inappropriate'],
  autoDeleteViolations: false,
  
  enableEmailNotifications: true,
  enablePushNotifications: true,
  enableInAppNotifications: true,
  notificationCooldown: 5,
  
  messageRetentionDays: 365,
  archiveOldConversations: true,
  archiveAfterDays: 90,
  
  enableMessageCache: true,
  cacheExpirationMinutes: 60,
  enableReadReceipts: true,
  enableTypingIndicators: true,
  enableOnlineStatus: true,
  
  enableEncryption: false,
  requireVerifiedUsers: false,
  allowCrossTenatMessaging: false,
  logMessagingActivity: true,
  
  enableWebsockets: true,
  heartbeatInterval: 30,
  connectionTimeout: 60,
  maxConcurrentConnections: 1000
};

interface KeywordManagerProps {
  keywords: string[];
  onUpdate: (keywords: string[]) => void;
}

function KeywordManager({ keywords, onUpdate }: KeywordManagerProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      onUpdate([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    onUpdate(keywords.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(keywords[index]);
  };

  const saveEdit = () => {
    if (editValue.trim() && editingIndex !== null) {
      const updated = [...keywords];
      updated[editingIndex] = editValue.trim();
      onUpdate(updated);
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add moderation keyword..."
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
        />
        <Button onClick={addKeyword} disabled={!newKeyword.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <div key={index} className="flex items-center gap-1">
            {editingIndex === index ? (
              <div className="flex items-center gap-1">
                <Input
                  size="sm"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="w-24"
                />
                <Button size="sm" variant="ghost" onClick={saveEdit}>
                  <Save className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Badge variant="secondary" className="cursor-pointer group">
                <span onClick={() => startEdit(index)}>{keyword}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-auto p-0 ml-2 opacity-0 group-hover:opacity-100"
                  onClick={() => removeKeyword(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminMessagingSettings() {
  const t = useTranslations('admin-common');
  const { trackUserAction } = useAuditTracking();
  
  const [settings, setSettings] = useState<MessagingSettings>(mockSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Track changes
  useEffect(() => {
    const hasChanged = JSON.stringify(settings) !== JSON.stringify(mockSettings);
    setHasChanges(hasChanged);
  }, [settings]);

  const updateSetting = <K extends keyof MessagingSettings>(
    key: K, 
    value: MessagingSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      trackUserAction('messaging_settings_updated', 'Admin updated messaging settings', {
        changedSettings: Object.keys(settings).filter(key => 
          settings[key as keyof MessagingSettings] !== mockSettings[key as keyof MessagingSettings]
        )
      });
      
      toast.success('Messaging settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(mockSettings);
    setHasChanges(false);
    setResetDialogOpen(false);
    toast.success('Settings reset to defaults');
  };

  return (
    <AdminOnly fallback={
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied. Admin permissions required.</p>
      </div>
    }>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8 text-blue-600" />
              Messaging Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure platform messaging behavior, limits, and security
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setResetDialogOpen(true)}
              disabled={!hasChanges}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message Settings
                </CardTitle>
                <CardDescription>
                  Configure basic message and conversation limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxMessageLength">Maximum Message Length</Label>
                    <Input
                      id="maxMessageLength"
                      type="number"
                      value={settings.maxMessageLength}
                      onChange={(e) => updateSetting('maxMessageLength', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">Maximum characters per message</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Max Conversation Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={settings.maxConversationParticipants}
                      onChange={(e) => updateSetting('maxConversationParticipants', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">Maximum users per conversation</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Conversation Types</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowGroup"
                        checked={settings.allowGroupConversations}
                        onCheckedChange={(checked) => updateSetting('allowGroupConversations', checked)}
                      />
                      <Label htmlFor="allowGroup">Group Conversations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowBusiness"
                        checked={settings.allowBusinessConversations}
                        onCheckedChange={(checked) => updateSetting('allowBusinessConversations', checked)}
                      />
                      <Label htmlFor="allowBusiness">Business Conversations</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allowSupport"
                        checked={settings.allowSupportConversations}
                        onCheckedChange={(checked) => updateSetting('allowSupportConversations', checked)}
                      />
                      <Label htmlFor="allowSupport">Support Conversations</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  File Attachments
                </CardTitle>
                <CardDescription>
                  Configure file attachment settings and restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowAttachments"
                    checked={settings.allowFileAttachments}
                    onCheckedChange={(checked) => updateSetting('allowFileAttachments', checked)}
                  />
                  <Label htmlFor="allowAttachments">Allow File Attachments</Label>
                </div>

                {settings.allowFileAttachments && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                      <Input
                        id="maxFileSize"
                        type="number"
                        value={settings.maxFileSize}
                        onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxAttachments">Max Attachments per Message</Label>
                      <Input
                        id="maxAttachments"
                        type="number"
                        value={settings.maxAttachmentsPerMessage}
                        onChange={(e) => updateSetting('maxAttachmentsPerMessage', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Allowed File Types</Label>
                      <div className="flex flex-wrap gap-2">
                        {settings.allowedFileTypes.map((type, index) => (
                          <Badge key={index} variant="outline">
                            {type}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-auto p-0 ml-2"
                              onClick={() => {
                                const newTypes = settings.allowedFileTypes.filter((_, i) => i !== index);
                                updateSetting('allowedFileTypes', newTypes);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rate Limiting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Rate Limiting
                </CardTitle>
                <CardDescription>
                  Prevent spam and abuse with message rate limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableRateLimit"
                    checked={settings.enableRateLimit}
                    onCheckedChange={(checked) => updateSetting('enableRateLimit', checked)}
                  />
                  <Label htmlFor="enableRateLimit">Enable Rate Limiting</Label>
                </div>

                {settings.enableRateLimit && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="messagesPerMinute">Messages per Minute</Label>
                      <Input
                        id="messagesPerMinute"
                        type="number"
                        value={settings.messagesPerMinute}
                        onChange={(e) => updateSetting('messagesPerMinute', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="messagesPerHour">Messages per Hour</Label>
                      <Input
                        id="messagesPerHour"
                        type="number"
                        value={settings.messagesPerHour}
                        onChange={(e) => updateSetting('messagesPerHour', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="conversationsPerDay">New Conversations per Day</Label>
                      <Input
                        id="conversationsPerDay"
                        type="number"
                        value={settings.newConversationsPerDay}
                        onChange={(e) => updateSetting('newConversationsPerDay', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            {/* Auto Moderation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Automatic Moderation
                </CardTitle>
                <CardDescription>
                  AI-powered content moderation and filtering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAutoModeration"
                    checked={settings.enableAutoModeration}
                    onCheckedChange={(checked) => updateSetting('enableAutoModeration', checked)}
                  />
                  <Label htmlFor="enableAutoModeration">Enable AI Moderation</Label>
                </div>

                {settings.enableAutoModeration && (
                  <div className="space-y-6 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="aiThreshold">AI Confidence Threshold (%)</Label>
                      <Input
                        id="aiThreshold"
                        type="number"
                        min="0"
                        max="100"
                        value={settings.aiModerationThreshold}
                        onChange={(e) => updateSetting('aiModerationThreshold', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Messages with AI confidence above this threshold will be flagged
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="enableSpamDetection"
                          checked={settings.enableSpamDetection}
                          onCheckedChange={(checked) => updateSetting('enableSpamDetection', checked)}
                        />
                        <Label htmlFor="enableSpamDetection">Spam Detection</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="enableProfanityFilter"
                          checked={settings.enableProfanityFilter}
                          onCheckedChange={(checked) => updateSetting('enableProfanityFilter', checked)}
                        />
                        <Label htmlFor="enableProfanityFilter">Profanity Filter</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="autoDeleteViolations"
                          checked={settings.autoDeleteViolations}
                          onCheckedChange={(checked) => updateSetting('autoDeleteViolations', checked)}
                        />
                        <Label htmlFor="autoDeleteViolations">Auto-delete Violations</Label>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom Keywords */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Moderation Keywords</CardTitle>
                <CardDescription>
                  Add custom keywords to flag for moderation review
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KeywordManager
                  keywords={settings.moderationKeywords}
                  onUpdate={(keywords) => updateSetting('moderationKeywords', keywords)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Channels
                </CardTitle>
                <CardDescription>
                  Configure which notification channels are enabled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableEmail"
                    checked={settings.enableEmailNotifications}
                    onCheckedChange={(checked) => updateSetting('enableEmailNotifications', checked)}
                  />
                  <Label htmlFor="enableEmail">Email Notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enablePush"
                    checked={settings.enablePushNotifications}
                    onCheckedChange={(checked) => updateSetting('enablePushNotifications', checked)}
                  />
                  <Label htmlFor="enablePush">Push Notifications</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableInApp"
                    checked={settings.enableInAppNotifications}
                    onCheckedChange={(checked) => updateSetting('enableInAppNotifications', checked)}
                  />
                  <Label htmlFor="enableInApp">In-App Notifications</Label>
                </div>

                <div className="space-y-2 mt-6">
                  <Label htmlFor="notificationCooldown">Notification Cooldown (minutes)</Label>
                  <Input
                    id="notificationCooldown"
                    type="number"
                    value={settings.notificationCooldown}
                    onChange={(e) => updateSetting('notificationCooldown', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum time between notifications from the same conversation
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Retention
                </CardTitle>
                <CardDescription>
                  Configure how long messages and conversations are kept
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="messageRetention">Message Retention (days)</Label>
                  <Input
                    id="messageRetention"
                    type="number"
                    value={settings.messageRetentionDays}
                    onChange={(e) => updateSetting('messageRetentionDays', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Messages older than this will be permanently deleted
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="archiveOld"
                    checked={settings.archiveOldConversations}
                    onCheckedChange={(checked) => updateSetting('archiveOldConversations', checked)}
                  />
                  <Label htmlFor="archiveOld">Auto-archive Old Conversations</Label>
                </div>

                {settings.archiveOldConversations && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="archiveAfter">Archive After (days)</Label>
                    <Input
                      id="archiveAfter"
                      type="number"
                      value={settings.archiveAfterDays}
                      onChange={(e) => updateSetting('archiveAfterDays', parseInt(e.target.value))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Caching */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Performance & Caching
                </CardTitle>
                <CardDescription>
                  Optimize messaging performance with caching and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableCache"
                    checked={settings.enableMessageCache}
                    onCheckedChange={(checked) => updateSetting('enableMessageCache', checked)}
                  />
                  <Label htmlFor="enableCache">Enable Message Caching</Label>
                </div>

                {settings.enableMessageCache && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="cacheExpiration">Cache Expiration (minutes)</Label>
                    <Input
                      id="cacheExpiration"
                      type="number"
                      value={settings.cacheExpirationMinutes}
                      onChange={(e) => updateSetting('cacheExpirationMinutes', parseInt(e.target.value))}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Real-time Features</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableReadReceipts"
                        checked={settings.enableReadReceipts}
                        onCheckedChange={(checked) => updateSetting('enableReadReceipts', checked)}
                      />
                      <Label htmlFor="enableReadReceipts">Read Receipts</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableTyping"
                        checked={settings.enableTypingIndicators}
                        onCheckedChange={(checked) => updateSetting('enableTypingIndicators', checked)}
                      />
                      <Label htmlFor="enableTyping">Typing Indicators</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enableOnline"
                        checked={settings.enableOnlineStatus}
                        onCheckedChange={(checked) => updateSetting('enableOnlineStatus', checked)}
                      />
                      <Label htmlFor="enableOnline">Online Status</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Privacy
                </CardTitle>
                <CardDescription>
                  Configure security and privacy settings for messaging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableEncryption"
                      checked={settings.enableEncryption}
                      onCheckedChange={(checked) => updateSetting('enableEncryption', checked)}
                    />
                    <Label htmlFor="enableEncryption">End-to-End Encryption</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requireVerified"
                      checked={settings.requireVerifiedUsers}
                      onCheckedChange={(checked) => updateSetting('requireVerifiedUsers', checked)}
                    />
                    <Label htmlFor="requireVerified">Require Verified Users</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowCrossTenant"
                      checked={settings.allowCrossTenatMessaging}
                      onCheckedChange={(checked) => updateSetting('allowCrossTenatMessaging', checked)}
                    />
                    <Label htmlFor="allowCrossTenant">Allow Cross-Tenant Messaging</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="logActivity"
                      checked={settings.logMessagingActivity}
                      onCheckedChange={(checked) => updateSetting('logMessagingActivity', checked)}
                    />
                    <Label htmlFor="logActivity">Log Messaging Activity</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            {/* WebSocket Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  WebSocket Configuration
                </CardTitle>
                <CardDescription>
                  Advanced real-time connection settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableWebsockets"
                    checked={settings.enableWebsockets}
                    onCheckedChange={(checked) => updateSetting('enableWebsockets', checked)}
                  />
                  <Label htmlFor="enableWebsockets">Enable WebSocket Connections</Label>
                </div>

                {settings.enableWebsockets && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="heartbeat">Heartbeat Interval (seconds)</Label>
                      <Input
                        id="heartbeat"
                        type="number"
                        value={settings.heartbeatInterval}
                        onChange={(e) => updateSetting('heartbeatInterval', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={settings.connectionTimeout}
                        onChange={(e) => updateSetting('connectionTimeout', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxConnections">Max Concurrent Connections</Label>
                      <Input
                        id="maxConnections"
                        type="number"
                        value={settings.maxConcurrentConnections}
                        onChange={(e) => updateSetting('maxConcurrentConnections', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current messaging system status and health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">99.9%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">256</div>
                    <div className="text-sm text-muted-foreground">Active Connections</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">142ms</div>
                    <div className="text-sm text-muted-foreground">Avg Latency</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">12</div>
                    <div className="text-sm text-muted-foreground">Queue Size</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Confirmation Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Reset Settings
              </DialogTitle>
              <DialogDescription>
                This will reset all messaging settings to their default values. 
                Any unsaved changes will be lost. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReset}>
                Reset to Defaults
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminOnly>
  );
}

export default AdminMessagingSettings;