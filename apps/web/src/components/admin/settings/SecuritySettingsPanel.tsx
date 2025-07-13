'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldIcon, LockIcon, UserCheckIcon } from 'lucide-react';

export function SecuritySettingsPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure authentication, authorization, and security policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Authentication</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Session Timeout:</span>
                  <Badge variant="outline">24 hours</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Login Attempts:</span>
                  <Badge variant="outline">5 attempts</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Email Verification:</span>
                  <Badge variant="default">Required</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Admin Security</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Role-based Access:</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Audit Logging:</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Impersonation:</span>
                  <Badge variant="outline">Super Admin Only</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 