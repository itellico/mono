
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionOverviewPanel } from '@/components/admin/subscriptions/SubscriptionOverviewPanel';
import SubscriptionPlansPanel from '@/components/admin/subscriptions/SubscriptionPlansPanel';
import FeaturesPanel from '@/components/admin/subscriptions/FeaturesPanel';
import LimitsPanel from '@/components/admin/subscriptions/LimitsPanel';
import BundlerPanel from '@/components/admin/subscriptions/BundlerPanel';

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Subscription Management</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscription-builder">Subscription Builder</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="bundler">Bundler</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SubscriptionOverviewPanel onNavigateToTab={handleNavigateToTab} />
        </TabsContent>
        <TabsContent value="subscription-builder">
          <SubscriptionPlansPanel />
        </TabsContent>
        <TabsContent value="features">
          <FeaturesPanel />
        </TabsContent>
        <TabsContent value="limits">
          <LimitsPanel />
        </TabsContent>
        <TabsContent value="bundler">
          <BundlerPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
