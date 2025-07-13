'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Users, 
  Building2, 
  Download, 
  Shield, 
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import { browserLogger } from '@/lib/browser-logger';

/**
 * GDPR Export Interface Component
 * Provides interface for generating GDPR-compliant data exports
 * Currently demo functionality - will be made functional later
 * 
 * @component
 * @example
 * <GDPRExportInterface />
 */
export function GDPRExportInterface() {
  const { trackClick } = useAuditTracking();
  const [exportType, setExportType] = useState('user_export');
  const [userId, setUserId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [dataCategories, setDataCategories] = useState(['profile', 'media']);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const availableCategories = [
    { id: 'profile', label: 'Profile Data', description: 'User profile information' },
    { id: 'media', label: 'Media Assets', description: 'Uploaded files and images' },
    { id: 'activity', label: 'Activity Logs', description: 'User interactions and history' },
    { id: 'preferences', label: 'User Preferences', description: 'Settings and configurations' },
    { id: 'communications', label: 'Communications', description: 'Email and notification history' },
    { id: 'billing', label: 'Billing Data', description: 'Payment and subscription information' }
  ];

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setDataCategories([...dataCategories, categoryId]);
    } else {
      setDataCategories(dataCategories.filter(id => id !== categoryId));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    trackClick('gdpr_export_initiated', { exportType, userId, accountId });
    browserLogger.userAction('gdpr_export_initiated', 'GDPRExportInterface', { exportType });

    try {
      // Demo delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // TODO: Call backup API with GDPR export type
      browserLogger.userAction('gdpr_export_demo_success', 'GDPRExportInterface', { exportType });

    } catch (error) {
      browserLogger.userAction('gdpr_export_error', 'GDPRExportInterface', { error: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Type Selection */}
      <div>
        <h3 className="text-lg font-medium mb-4">Export Type Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* User Export */}
          <Card className={exportType === 'user_export' ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <User className="h-6 w-6" />
                <Button
                  variant={exportType === 'user_export' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportType('user_export')}
                >
                  Select
                </Button>
              </div>
              <CardTitle className="text-sm">User Export</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Export all data for a specific user (GDPR Article 15 & 20)
              </p>
            </CardContent>
          </Card>

          {/* Account Export */}
          <Card className={exportType === 'account_export' ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Users className="h-6 w-6" />
                <Button
                  variant={exportType === 'account_export' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportType('account_export')}
                >
                  Select
                </Button>
              </div>
              <CardTitle className="text-sm">Account Export</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Export all users within an account
              </p>
            </CardContent>
          </Card>

          {/* Tenant Export */}
          <Card className={exportType === 'tenant_export' ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Building2 className="h-6 w-6" />
                <Button
                  variant={exportType === 'tenant_export' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportType('tenant_export')}
                >
                  Select
                </Button>
              </div>
              <CardTitle className="text-sm">Tenant Export</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Full tenant data export (admin only)
              </p>
            </CardContent>
          </Card>

          {/* Custom Export */}
          <Card className={exportType === 'custom_export' ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <FileText className="h-6 w-6" />
                <Button
                  variant={exportType === 'custom_export' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setExportType('custom_export')}
                >
                  Select
                </Button>
              </div>
              <CardTitle className="text-sm">Custom Export</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Flexible data selection and filtering
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Export Configuration */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Export Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Target Selection</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Specify the target for data export
              </p>
            </div>

            {(exportType === 'user_export' || exportType === 'custom_export') && (
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter user ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            )}

            {(exportType === 'account_export' || exportType === 'custom_export') && (
              <div className="space-y-2">
                <Label htmlFor="accountId">Account ID</Label>
                <Input
                  id="accountId"
                  placeholder="Enter account ID"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                />
              </div>
            )}

            {exportType === 'tenant_export' && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Current Tenant</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Export will include all data for the current tenant
                </p>
              </div>
            )}
          </div>

          {/* Data Categories */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Data Categories</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select which types of data to include
              </p>
            </div>

            <div className="space-y-3">
              {availableCategories.map((category) => (
                <div key={category.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={category.id}
                    checked={dataCategories.includes(category.id)}
                    onCheckedChange={(checked) => handleCategoryChange(category.id, checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={category.id} className="text-sm font-medium">
                      {category.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Date Range (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Filter data by creation/modification date
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateStart">Start Date</Label>
              <Input
                id="dateStart"
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateEnd">End Date</Label>
              <Input
                id="dateEnd"
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Legal Information */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium">GDPR Compliance Information</h4>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              <p>• Data exports comply with GDPR Articles 15 (Right of Access) and 20 (Data Portability)</p>
              <p>• Machine-readable JSON format with legal manifest included</p>
              <p>• Secure download links expire after 30 days</p>
              <p>• All export requests are logged for audit purposes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Badge variant="outline" className="flex items-center space-x-1">
          <AlertTriangle className="h-3 w-3 text-yellow-500" />
          <span>Demo Interface - Not Yet Functional</span>
        </Badge>

        <Button 
          onClick={handleExport}
          disabled={isExporting || dataCategories.length === 0}
          className="flex items-center space-x-2"
        >
          {isExporting ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              <span>Generating Export...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Generate Export</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 