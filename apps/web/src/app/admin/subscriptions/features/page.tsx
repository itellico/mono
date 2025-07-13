'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { FeatureForm } from './components/feature-form';
import { type Feature } from '@prisma/client';

async function getFeatures() {
  const res = await fetch('/api/features');
  const features = await res.json();
  return features;
}

export default function FeaturePage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchFeatures = () => {
    getFeatures().then(setFeatures);
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const handleFormClose = () => {
    setIsDialogOpen(false);
    fetchFeatures();
  };

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Features</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of all available features.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Feature</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Feature</DialogTitle>
              </DialogHeader>
              <FeatureForm onClose={handleFormClose} />
            </DialogContent>
          </Dialog>
        </div>
        <DataTable data={features} columns={columns} />
      </div>
    </>
  );
}
