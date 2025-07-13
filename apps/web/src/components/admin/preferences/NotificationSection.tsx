'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useUserPreferences } from '@/hooks/useUserProfile';
import { useComponentLogger } from '@/lib/platform/logging';
import { useDebounce } from '@/hooks/useDebounce';
import { Save, Check, AlertCircle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  systemUpdates: boolean;
  commentNotifications: boolean;
  mentionNotifications: boolean;
  followNotifications: boolean;
}

export function NotificationSection() {
  const log = useComponentLogger('NotificationSection');
  const { preferences, updatePreferences, isLoading } = useUserPreferences();

  const [formData, setFormData] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    systemUpdates: true,
    commentNotifications: true,
    mentionNotifications: true,
    followNotifications: false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save debounced changes
  const debouncedFormData = useDebounce(formData, 2000);

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences?.notifications) {
      const notifications = preferences.notifications;
      setFormData({
        emailNotifications: notifications.emailNotifications ?? true,
        pushNotifications: notifications.pushNotifications ?? true,
        marketingEmails: notifications.marketingEmails ?? false,
        securityAlerts: notifications.securityAlerts ?? true,
        systemUpdates: notifications.systemUpdates ?? true,
        commentNotifications: notifications.commentNotifications ?? true,
        mentionNotifications: notifications.mentionNotifications ?? true,
        followNotifications: notifications.followNotifications ?? false,
      });
      setHasChanges(false);
      log.debug('Notification preferences loaded', { preferences: notifications });
    }
  }, [preferences, log]);

  // Auto-save when debounced data changes
  useEffect(() => {
    if (hasChanges && !isLoading) {
      const saveChanges = async () => {
        try {
          await updatePreferences({
            notifications: debouncedFormData,
          });
          setHasChanges(false);
          setLastSaved(new Date());
          log.debug('Notification preferences auto-saved successfully');
        } catch (error) {
          log.error('Notification preferences auto-save failed', { error });
        }
      };

      saveChanges();
    }
  }, [debouncedFormData, hasChanges, isLoading, updatePreferences, log]);

  const handleToggle = useCallback((field: keyof NotificationPreferences, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    log.debug('Notification preference changed', { field, value });
  }, [log]);

  const getSaveStatus = () => {
    if (isLoading) {
      return { icon: Save, text: 'Saving...', color: 'bg-blue-500' };
    }
    if (hasChanges) {
      return { icon: AlertCircle, text: 'Unsaved changes', color: 'bg-orange-500' };
    }
    if (lastSaved) {
      return { icon: Check, text: `Saved ${lastSaved.toLocaleTimeString()}`, color: 'bg-green-500' };
    }
    return { icon: Check, text: 'All saved', color: 'bg-green-500' };
  };

  const status = getSaveStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <Badge className={cn('text-white', status.color)}>
            <status.icon className="h-3 w-3 mr-1" />
            {status.text}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Control how and when you receive notifications. Changes are automatically saved.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Email Notifications</Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for important updates
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={formData.emailNotifications}
                onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="securityAlerts">Security Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important security notifications and alerts
                </p>
              </div>
              <Switch
                id="securityAlerts"
                checked={formData.securityAlerts}
                onCheckedChange={(checked) => handleToggle('securityAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="systemUpdates">System Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications about system maintenance and updates
                </p>
              </div>
              <Switch
                id="systemUpdates"
                checked={formData.systemUpdates}
                onCheckedChange={(checked) => handleToggle('systemUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketingEmails">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Promotional emails and product updates
                </p>
              </div>
              <Switch
                id="marketingEmails"
                checked={formData.marketingEmails}
                onCheckedChange={(checked) => handleToggle('marketingEmails', checked)}
              />
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Push Notifications</Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="pushNotifications">Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in your browser
                </p>
              </div>
              <Switch
                id="pushNotifications"
                checked={formData.pushNotifications}
                onCheckedChange={(checked) => handleToggle('pushNotifications', checked)}
              />
            </div>
          </div>
        </div>

        {/* Activity Notifications */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Activity Notifications</Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="commentNotifications">Comments</Label>
                <p className="text-sm text-muted-foreground">
                  When someone comments on your content
                </p>
              </div>
              <Switch
                id="commentNotifications"
                checked={formData.commentNotifications}
                onCheckedChange={(checked) => handleToggle('commentNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="mentionNotifications">Mentions</Label>
                <p className="text-sm text-muted-foreground">
                  When someone mentions you in a comment or post
                </p>
              </div>
              <Switch
                id="mentionNotifications"
                checked={formData.mentionNotifications}
                onCheckedChange={(checked) => handleToggle('mentionNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="followNotifications">New Followers</Label>
                <p className="text-sm text-muted-foreground">
                  When someone starts following you
                </p>
              </div>
              <Switch
                id="followNotifications"
                checked={formData.followNotifications}
                onCheckedChange={(checked) => handleToggle('followNotifications', checked)}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Notification Summary</h4>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span>Email notifications:</span>
              <span className={formData.emailNotifications ? 'text-green-600' : 'text-muted-foreground'}>
                {formData.emailNotifications ? 'Enabled' : 'Disabled'}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Push notifications:</span>
              <span className={formData.pushNotifications ? 'text-green-600' : 'text-muted-foreground'}>
                {formData.pushNotifications ? 'Enabled' : 'Disabled'}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Security alerts:</span>
              <span className={formData.securityAlerts ? 'text-green-600' : 'text-muted-foreground'}>
                {formData.securityAlerts ? 'Enabled' : 'Disabled'}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 