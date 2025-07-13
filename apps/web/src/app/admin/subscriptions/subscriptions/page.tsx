'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { SubscriptionForm } from './components/subscription-form';
import { type TenantSubscription } from '@prisma/client';

async function getSubscriptions() {
  const res = await fetch('/api/subscriptions');
  const subscriptions = await res.json();
  return subscriptions;
}

export default function SubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchSubscriptions = () => {
    getSubscriptions().then(setSubscriptions);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleFormClose = () => {
    setIsDialogOpen(false);
    fetchSubscriptions();
  };

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Tenant Subscriptions</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of all tenant subscriptions.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Subscription</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Subscription</DialogTitle>
              </DialogHeader>
              <SubscriptionForm onClose={handleFormClose} />
            </DialogContent>
          </Dialog>
        </div>
        <DataTable data={subscriptions} columns={columns} />
      </div>
    </>
  );
}
