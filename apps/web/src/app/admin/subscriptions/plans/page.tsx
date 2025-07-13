'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { PlanForm } from './components/plan-form';
import { type SubscriptionPlan } from '@prisma/client';

async function getPlans() {
  const res = await fetch('/api/plans');
  const plans = await res.json();
  return plans;
}

export default function PlanPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchPlans = () => {
    getPlans().then(setPlans);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleFormClose = () => {
    setIsDialogOpen(false);
    fetchPlans();
  };

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Subscription Plans</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of all available subscription plans.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Plan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Plan</DialogTitle>
              </DialogHeader>
              <PlanForm onClose={handleFormClose} />
            </DialogContent>
          </Dialog>
        </div>
        <DataTable data={plans} columns={columns} />
      </div>
    </>
  );
}
