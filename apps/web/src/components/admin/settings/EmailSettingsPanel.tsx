'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MailIcon, SendIcon, SettingsIcon, TestTubeIcon, CheckCircleIcon, XCircleIcon, ActivityIcon } from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';

interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;
  smtp_username: string;
  smtp_password: string;
  smtp_provider: string;
  email_from_address: string;
  email_from_name: string;
  email_verification_required: string;
  welcome_emails_enabled: string;
  notification_emails_enabled: string;
  admin_notification_emails_enabled: string;
  email_queue_concurrency: string;
  email_queue_retry_limit: string;
  email_queue_retry_delay: string;
  email_queue_batch_size: string;
  email_rate_limit_per_hour: string;
  email_rate_limit_per_day: string;
}

interface EmailSettingsFormData {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_username: string;
  smtp_password: string;
  smtp_provider: string;
  email_from_address: string;
  email_from_name: string;
  email_verification_required: boolean;
  welcome_emails_enabled: boolean;
  notification_emails_enabled: boolean;
  admin_notification_emails_enabled: boolean;
  email_queue_concurrency: number;
  email_queue_retry_limit: number;
  email_queue_retry_delay: number;
  email_queue_batch_size: number;
  email_rate_limit_per_hour: number;
  email_rate_limit_per_day: number;
}

// Fetch email settings
async function fetchEmailSettings(): Promise<EmailSettings> {
  const response = await fetch('/api/v1/admin/settings/email');
  if (!response.ok) {
    throw new Error('Failed to fetch email settings');
  }
  return response.json();
}

// Update email settings
async function updateEmailSettings(settings: Partial<EmailSettingsFormData>): Promise<void> {
  const response = await fetch('/api/v1/admin/settings/email', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!response.ok) {
    throw new Error('Failed to update email settings');
  }
}

// Test SMTP connection
async function testSmtpConnection(): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/v1/admin/settings/email/test', {
    method: 'POST'
  });
  const result = await response.json();
  return result;
}

// Transform database strings to form data
function transformToFormData(settings: EmailSettings): EmailSettingsFormData {
  return {
    smtp_host: settings.smtp_host,
    smtp_port: parseInt(settings.smtp_port) || 1025,
    smtp_secure: settings.smtp_secure === 'true',
    smtp_username: settings.smtp_username,
    smtp_password: settings.smtp_password,
    smtp_provider: settings.smtp_provider,
    email_from_address: settings.email_from_address,
    email_from_name: settings.email_from_name,
    email_verification_required: settings.email_verification_required === 'true',
    welcome_emails_enabled: settings.welcome_emails_enabled === 'true',
    notification_emails_enabled: settings.notification_emails_enabled === 'true',
    admin_notification_emails_enabled: settings.admin_notification_emails_enabled === 'true',
    email_queue_concurrency: parseInt(settings.email_queue_concurrency) || 5,
    email_queue_retry_limit: parseInt(settings.email_queue_retry_limit) || 3,
    email_queue_retry_delay: parseInt(settings.email_queue_retry_delay) || 60000,
    email_queue_batch_size: parseInt(settings.email_queue_batch_size) || 10,
    email_rate_limit_per_hour: parseInt(settings.email_rate_limit_per_hour) || 100,
    email_rate_limit_per_day: parseInt(settings.email_rate_limit_per_day) || 500
  };
}

export function EmailSettingsPanel() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EmailSettingsFormData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin', 'settings', 'email'],
    queryFn: fetchEmailSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: updateEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'email'] });
      setIsEditing(false);
      toast({
        title: "Settings saved",
        description: "Email settings have been updated successfully.",
      });
      browserLogger.info('Email settings updated successfully');
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: "There was an error updating email settings. Please try again.",
        variant: "destructive",
      });
      browserLogger.error('Failed to update email settings', { error: error.message });
    },
  });

  // Test SMTP connection mutation
  const testMutation = useMutation({
    mutationFn: testSmtpConnection,
    onSuccess: (result) => {
      toast({
        title: result.success ? "Connection successful" : "Connection failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Test failed",
        description: "Could not test SMTP connection. Please try again.",
        variant: "destructive",
      });
      browserLogger.error('SMTP test failed', { error: error.message });
    },
  });

  // Initialize form data when settings load
  if (settings && !formData) {
    setFormData(transformToFormData(settings));
  }

  // Handle form submission
  const handleSave = async () => {
    if (!formData) return;

    try {
      // Transform form data back to string format for API
      const apiData = {
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        smtp_secure: formData.smtp_secure,
        smtp_username: formData.smtp_username,
        smtp_password: formData.smtp_password,
        smtp_provider: formData.smtp_provider,
        email_from_address: formData.email_from_address,
        email_from_name: formData.email_from_name,
        email_verification_required: formData.email_verification_required,
        welcome_emails_enabled: formData.welcome_emails_enabled,
        notification_emails_enabled: formData.notification_emails_enabled,
        admin_notification_emails_enabled: formData.admin_notification_emails_enabled,
        email_queue_concurrency: formData.email_queue_concurrency,
        email_queue_retry_limit: formData.email_queue_retry_limit,
        email_queue_retry_delay: formData.email_queue_retry_delay,
        email_queue_batch_size: formData.email_queue_batch_size,
        email_rate_limit_per_hour: formData.email_rate_limit_per_hour,
        email_rate_limit_per_day: formData.email_rate_limit_per_day
      };

      await updateMutation.mutateAsync(apiData);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleCancel = () => {
    if (settings) {
      setFormData(transformToFormData(settings));
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return <EmailSettingsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircleIcon className="h-5 w-5 text-destructive" />
            Error Loading Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load email settings. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!settings || !formData) {
    return <EmailSettingsSkeleton />;
  }

  return (
    <div className="space-y-6">

      {/* ================================================ */}
      {/* SMTP CONFIGURATION CARD */}
      {/* ================================================ */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <SendIcon className="h-6 w-6" />
                SMTP Configuration
              </CardTitle>
              <CardDescription>
                Configure email server settings and authentication
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testMutation.mutate()}
                    disabled={testMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <TestTubeIcon className="h-4 w-4" />
                    {testMutation.isPending ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    Edit Settings
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">From Address</label>
                  <p className="text-base font-mono">{formData.email_from_address}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">From Name</label>
                  <p className="text-base">{formData.email_from_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Provider</label>
                  <Badge variant="outline" className="capitalize">
                    {formData.smtp_provider}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SMTP Host</label>
                  <p className="text-base font-mono">{formData.smtp_host}:{formData.smtp_port}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Encryption</label>
                  <Badge variant={formData.smtp_secure ? "default" : "secondary"}>
                    {formData.smtp_secure ? "TLS/SSL Enabled" : "None"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant="default" className="flex items-center gap-1 w-fit">
                    <CheckCircleIcon className="h-3 w-3" />
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SMTP Host & Port */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={formData.smtp_host}
                    onChange={(e) => setFormData({...formData, smtp_host: e.target.value})}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={formData.smtp_port}
                    onChange={(e) => setFormData({...formData, smtp_port: parseInt(e.target.value) || 587})}
                    placeholder="587"
                  />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp_username">Username</Label>
                  <Input
                    id="smtp_username"
                    value={formData.smtp_username}
                    onChange={(e) => setFormData({...formData, smtp_username: e.target.value})}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={formData.smtp_password}
                    onChange={(e) => setFormData({...formData, smtp_password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* From Address & Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email_from_address">From Address</Label>
                  <Input
                    id="email_from_address"
                    type="email"
                    value={formData.email_from_address}
                    onChange={(e) => setFormData({...formData, email_from_address: e.target.value})}
                    placeholder="noreply@itellico.com"
                  />
                </div>
                <div>
                  <Label htmlFor="email_from_name">From Name</Label>
                  <Input
                    id="email_from_name"
                    value={formData.email_from_name}
                    onChange={(e) => setFormData({...formData, email_from_name: e.target.value})}
                    placeholder="itellico Mono"
                  />
                </div>
              </div>

              {/* TLS/SSL Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtp_secure"
                  checked={formData.smtp_secure}
                  onCheckedChange={(checked) => setFormData({...formData, smtp_secure: checked})}
                />
                <Label htmlFor="smtp_secure">Use TLS/SSL encryption</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================ */}
      {/* EMAIL FEATURES CARD */}
      {/* ================================================ */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <MailIcon className="h-6 w-6" />
            Email Features
          </CardTitle>
          <CardDescription>
            Configure email functionality and notification settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Email Verification Required:</span>
                {!isEditing ? (
                  <Badge variant={formData.email_verification_required ? "default" : "secondary"}>
                    {formData.email_verification_required ? "Enabled" : "Disabled"}
                  </Badge>
                ) : (
                  <Switch
                    checked={formData.email_verification_required}
                    onCheckedChange={(checked) => setFormData({...formData, email_verification_required: checked})}
                  />
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Welcome Emails:</span>
                {!isEditing ? (
                  <Badge variant={formData.welcome_emails_enabled ? "default" : "secondary"}>
                    {formData.welcome_emails_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                ) : (
                  <Switch
                    checked={formData.welcome_emails_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, welcome_emails_enabled: checked})}
                  />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Notification Emails:</span>
                {!isEditing ? (
                  <Badge variant={formData.notification_emails_enabled ? "default" : "secondary"}>
                    {formData.notification_emails_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                ) : (
                  <Switch
                    checked={formData.notification_emails_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, notification_emails_enabled: checked})}
                  />
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Admin Notifications:</span>
                {!isEditing ? (
                  <Badge variant={formData.admin_notification_emails_enabled ? "default" : "secondary"}>
                    {formData.admin_notification_emails_enabled ? "Enabled" : "Disabled"}
                  </Badge>
                ) : (
                  <Switch
                    checked={formData.admin_notification_emails_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, admin_notification_emails_enabled: checked})}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ================================================ */}
      {/* QUEUE CONFIGURATION CARD - Only shown when editing */}
      {/* ================================================ */}
      {isEditing && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <ActivityIcon className="h-6 w-6" />
              Queue Configuration
            </CardTitle>
            <CardDescription>
              Configure email queue processing and rate limiting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="email_queue_concurrency">Concurrency</Label>
                <Input
                  id="email_queue_concurrency"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.email_queue_concurrency}
                  onChange={(e) => setFormData({...formData, email_queue_concurrency: parseInt(e.target.value) || 5})}
                />
                <p className="text-xs text-muted-foreground mt-1">Parallel workers</p>
              </div>
              <div>
                <Label htmlFor="email_queue_retry_limit">Retry Limit</Label>
                <Input
                  id="email_queue_retry_limit"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.email_queue_retry_limit}
                  onChange={(e) => setFormData({...formData, email_queue_retry_limit: parseInt(e.target.value) || 3})}
                />
                <p className="text-xs text-muted-foreground mt-1">Failed attempts</p>
              </div>
              <div>
                <Label htmlFor="email_rate_limit_per_hour">Hourly Limit</Label>
                <Input
                  id="email_rate_limit_per_hour"
                  type="number"
                  min="1"
                  value={formData.email_rate_limit_per_hour}
                  onChange={(e) => setFormData({...formData, email_rate_limit_per_hour: parseInt(e.target.value) || 100})}
                />
                <p className="text-xs text-muted-foreground mt-1">Emails per hour</p>
              </div>
              <div>
                <Label htmlFor="email_rate_limit_per_day">Daily Limit</Label>
                <Input
                  id="email_rate_limit_per_day"
                  type="number"
                  min="1"
                  value={formData.email_rate_limit_per_day}
                  onChange={(e) => setFormData({...formData, email_rate_limit_per_day: parseInt(e.target.value) || 500})}
                />
                <p className="text-xs text-muted-foreground mt-1">Emails per day</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmailSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 