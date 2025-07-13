'use client';

import React from 'react';
import { ThreeLevelChangeProvider } from '@/components/changes';
import { ProductEditorWithProvider } from '@/components/examples/ThreeLevelChangeExample';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TestChangesPage() {
  // Mock product ID for testing
  const testProductId = 'test-product-123';

  return (
    <ThreeLevelChangeProvider showNotifications={true}>
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Three-Level Change System Demo</h1>
          <p className="text-muted-foreground">
            Test the optimistic updates, conflict resolution, and change history features
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
            <CardDescription>
              The Three-Level Change System tracks changes through three stages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-blue-600">Level 1: Optimistic</h3>
                <p className="text-sm text-muted-foreground">
                  Changes appear instantly in the UI before server confirmation.
                  Users see immediate feedback.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-yellow-600">Level 2: Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Server validates changes, checks for conflicts, and applies
                  business rules.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-green-600">Level 3: Committed</h3>
                <p className="text-sm text-muted-foreground">
                  Changes are permanently stored in the database with full
                  audit trail.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Scenarios</CardTitle>
            <CardDescription>
              Try these scenarios to see the system in action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Simulate a conflict by having two "users" edit at once
                  toast.info('Simulating concurrent edit conflict...');
                  setTimeout(() => {
                    toast.warning('Conflict detected! Another user edited this item.');
                  }, 2000);
                }}
              >
                Simulate Conflict
              </Button>
              <p className="text-sm text-muted-foreground">
                Simulates another user editing the same data
              </p>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast.info('Testing approval workflow...');
                  setTimeout(() => {
                    toast.warning('This change requires approval (>50% price reduction)');
                  }, 1000);
                }}
              >
                Test Approval Required
              </Button>
              <p className="text-sm text-muted-foreground">
                Changes that reduce price by more than 50% require approval
              </p>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Simulate offline mode
                  toast.info('Simulating offline mode...');
                  setTimeout(() => {
                    toast.success('Changes will be synced when connection is restored');
                  }, 1000);
                }}
              >
                Test Offline Mode
              </Button>
              <p className="text-sm text-muted-foreground">
                Changes are queued and synced when back online
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Product Editor Example */}
        <ProductEditorWithProvider productId={testProductId} />

        <Card>
          <CardHeader>
            <CardTitle>Integration Code</CardTitle>
            <CardDescription>
              How to use the Three-Level Change System in your components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
              <code>{`import { useThreeLevelChange } from '@/hooks/useThreeLevelChange';
import { ChangeIndicator, ChangeHistory } from '@/components/changes';

function YourEditor({ entityId }) {
  const { mutate, isLoading } = useThreeLevelChange({
    entityType: 'your-entity-type',
    entityId: entityId,
    optimisticUpdate: (old, changes) => ({ ...old, ...changes }),
    requireApproval: (changes) => {
      // Define when approval is needed
      return changes.criticalField !== undefined;
    },
  });

  const handleSave = (formData) => {
    mutate(formData);
  };

  return (
    <div>
      <ChangeIndicator 
        entityType="your-entity-type" 
        entityId={entityId} 
      />
      {/* Your form here */}
      <ChangeHistory 
        entityType="your-entity-type" 
        entityId={entityId} 
      />
    </div>
  );
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </ThreeLevelChangeProvider>
  );
}