'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Mock hooks to avoid auth imports in component library
const useUserPreferences = () => ({
  preferences: {
    security: {
      sessionTimeout: '8h',
      twoFactorEnabled: false,
      loginNotifications: true,
      deviceManagement: true,
      ipWhitelist: false,
      sessionHistory: true,
      passwordExpiry: false,
      passwordComplexity: true,
    }
  },
  updatePreferences: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  isLoading: false,
});

const useChangePassword = () => ({
  mutateAsync: async () => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  },
  isPending: false,
});

// Mock logger to avoid any potential auth imports
const useComponentLogger = () => ({
  debug: () => {},
  info: () => {},
  error: () => {},
});
import { useDebounce } from '@/hooks/useDebounce';
import { Save, Check, AlertCircle, Shield, Key, Lock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Session timeout options
const SESSION_TIMEOUT_OPTIONS = [
  { value: '15m', label: '15 minutes' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '4h', label: '4 hours' },
  { value: '8h', label: '8 hours' },
  { value: '24h', label: '24 hours' },
];

interface SecurityPreferences {
  sessionTimeout: string;
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  deviceManagement: boolean;
  ipWhitelist: boolean;
  sessionHistory: boolean;
  passwordExpiry: boolean;
  passwordComplexity: boolean;
}

export function SecuritySection() {
  const log = useComponentLogger('SecuritySection');
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const changePassword = useChangePassword();

  const [formData, setFormData] = useState<SecurityPreferences>({
    sessionTimeout: '8h',
    twoFactorEnabled: false,
    loginNotifications: true,
    deviceManagement: true,
    ipWhitelist: false,
    sessionHistory: true,
    passwordExpiry: false,
    passwordComplexity: true,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Password change form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Auto-save debounced changes
  const debouncedFormData = useDebounce(formData, 2000);

  // Initialize form data when preferences load
  useEffect(() => {
    if (preferences?.security) {
      const security = preferences.security;
      setFormData({
        sessionTimeout: security.sessionTimeout || '8h',
        twoFactorEnabled: security.twoFactorEnabled ?? false,
        loginNotifications: security.loginNotifications ?? true,
        deviceManagement: security.deviceManagement ?? true,
        ipWhitelist: security.ipWhitelist ?? false,
        sessionHistory: security.sessionHistory ?? true,
        passwordExpiry: security.passwordExpiry ?? false,
        passwordComplexity: security.passwordComplexity ?? true,
      });
      setHasChanges(false);
      log.debug('Security preferences loaded', { preferences: security });
    }
  }, [preferences, log]);

  // Auto-save when debounced data changes
  useEffect(() => {
    if (hasChanges && !isLoading) {
      const saveChanges = async () => {
        try {
          await updatePreferences({
            security: debouncedFormData,
          });
          setHasChanges(false);
          setLastSaved(new Date());
          log.debug('Security preferences auto-saved successfully');
        } catch (error) {
          log.error('Security preferences auto-save failed', { error });
        }
      };

      saveChanges();
    }
  }, [debouncedFormData, hasChanges, isLoading, updatePreferences, log]);

  const handleSecurityChange = useCallback((field: keyof SecurityPreferences, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    log.debug('Security preference changed', { field, value });
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
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <Badge className={cn('text-white', status.color)}>
            <status.icon className="h-3 w-3 mr-1" />
            {status.text}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your account security and authentication preferences. Changes are automatically saved.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Management */}
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Session Management
          </Label>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout</Label>
              <Select
                value={formData.sessionTimeout}
                onValueChange={(value) => handleSecurityChange('sessionTimeout', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeout duration" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TIMEOUT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How long before your session expires due to inactivity
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sessionHistory">Session History</Label>
                <p className="text-sm text-muted-foreground">
                  Keep track of your login sessions and device activity
                </p>
              </div>
              <Switch
                id="sessionHistory"
                checked={formData.sessionHistory}
                onCheckedChange={(checked) => handleSecurityChange('sessionHistory', checked)}
              />
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center gap-2">
            <Key className="h-4 w-4" />
            Authentication
          </Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="twoFactorEnabled">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                id="twoFactorEnabled"
                checked={formData.twoFactorEnabled}
                onCheckedChange={(checked) => handleSecurityChange('twoFactorEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="loginNotifications">Login Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone logs into your account
                </p>
              </div>
              <Switch
                id="loginNotifications"
                checked={formData.loginNotifications}
                onCheckedChange={(checked) => handleSecurityChange('loginNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="deviceManagement">Device Management</Label>
                <p className="text-sm text-muted-foreground">
                  Manage and monitor devices that can access your account
                </p>
              </div>
              <Switch
                id="deviceManagement"
                checked={formData.deviceManagement}
                onCheckedChange={(checked) => handleSecurityChange('deviceManagement', checked)}
              />
            </div>
          </div>
        </div>

        {/* Password Policy */}
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password Policy
          </Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="passwordComplexity">Password Complexity</Label>
                <p className="text-sm text-muted-foreground">
                  Require strong passwords with mixed characters
                </p>
              </div>
              <Switch
                id="passwordComplexity"
                checked={formData.passwordComplexity}
                onCheckedChange={(checked) => handleSecurityChange('passwordComplexity', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="passwordExpiry">Password Expiry</Label>
                <p className="text-sm text-muted-foreground">
                  Require password changes every 90 days
                </p>
              </div>
              <Switch
                id="passwordExpiry"
                checked={formData.passwordExpiry}
                onCheckedChange={(checked) => handleSecurityChange('passwordExpiry', checked)}
              />
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Change Password</Label>
                  <p className="text-sm text-muted-foreground">
                    Update your password for enhanced security
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </Button>
              </div>
              
              {showPasswordForm && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter your new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your new password"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={async () => {
                        try {
                          await changePassword.mutateAsync(passwordData);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setShowPasswordForm(false);
                          log.info('Password changed successfully');
                        } catch (error) {
                          log.error('Password change failed', { error });
                        }
                      }}
                      disabled={
                        changePassword.isPending ||
                        !passwordData.currentPassword ||
                        !passwordData.newPassword ||
                        !passwordData.confirmPassword ||
                        passwordData.newPassword !== passwordData.confirmPassword
                      }
                      size="sm"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setShowPasswordForm(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Security */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Advanced Security</Label>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ipWhitelist">IP Address Whitelist</Label>
                <p className="text-sm text-muted-foreground">
                  Only allow logins from specific IP addresses
                </p>
              </div>
              <Switch
                id="ipWhitelist"
                checked={formData.ipWhitelist}
                onCheckedChange={(checked) => handleSecurityChange('ipWhitelist', checked)}
              />
            </div>
          </div>
        </div>

        {/* Security Summary */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Status:</strong> Your account is {formData.twoFactorEnabled ? 'highly secure' : 'moderately secure'}. 
            {!formData.twoFactorEnabled && ' Consider enabling two-factor authentication for better protection.'}
          </AlertDescription>
        </Alert>

        {/* Security Overview */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Security Summary</h4>
          <div className="space-y-1 text-sm">
            <p className="flex justify-between">
              <span>Two-Factor Authentication:</span>
              <span className={formData.twoFactorEnabled ? 'text-green-600' : 'text-orange-600'}>
                {formData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Session timeout:</span>
              <span className="text-muted-foreground">
                {SESSION_TIMEOUT_OPTIONS.find(o => o.value === formData.sessionTimeout)?.label}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Login notifications:</span>
              <span className={formData.loginNotifications ? 'text-green-600' : 'text-muted-foreground'}>
                {formData.loginNotifications ? 'Enabled' : 'Disabled'}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Password complexity:</span>
              <span className={formData.passwordComplexity ? 'text-green-600' : 'text-muted-foreground'}>
                {formData.passwordComplexity ? 'Required' : 'Optional'}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 