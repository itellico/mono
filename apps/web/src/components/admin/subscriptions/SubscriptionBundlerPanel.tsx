"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export function SubscriptionBundlerPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Subscription Bundler
          </CardTitle>
          <CardDescription>
            Create custom subscription bundles with features and limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Subscription bundler will be implemented here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 