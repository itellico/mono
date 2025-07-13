'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BuildingIcon } from 'lucide-react';

export function BusinessSettingsPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BuildingIcon className="h-5 w-5" />
            Business Rules & Policies
          </CardTitle>
          <CardDescription>
            Configure platform business logic, approval processes, and policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Model Management</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Model Approval:</span>
                  <Badge variant="default">Required</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Auto-approve Threshold:</span>
                  <Badge variant="outline">95% confidence</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Photo Review:</span>
                  <Badge variant="default">Manual + AI</Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Platform Features</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Currency Options:</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">USD</Badge>
                    <Badge variant="outline" className="text-xs">EUR</Badge>
                    <Badge variant="outline" className="text-xs">GBP</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Job Applications:</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Portfolio Management:</span>
                  <Badge variant="outline">Phase 4 Planned</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 