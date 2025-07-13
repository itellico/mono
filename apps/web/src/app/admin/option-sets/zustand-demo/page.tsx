'use client';

import React from 'react';
import { useModalStore } from '@/stores/ui/modal-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ZustandDemoPage() {
  const { isOpen, modalType, modalData, openModal, closeModal } = useModalStore();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Zustand Integration Demo
        </h1>
        <p className="text-gray-600">
          See how easy it is to add Zustand to the mono platform!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demo Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Zustand Store Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => openModal('user-edit', { userId: 123, name: 'John Doe' })}
                variant="default"
              >
                Open User Edit Modal
              </Button>
              <Button 
                onClick={() => openModal('settings', { section: 'preferences' })}
                variant="secondary"
              >
                Open Settings Modal
              </Button>
              <Button 
                onClick={() => openModal('confirmation', { action: 'delete', item: 'user' })}
                variant="destructive"
              >
                Open Confirmation Modal
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={closeModal}
                variant="outline"
                disabled={!isOpen}
              >
                Close Modal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current State Display */}
        <Card>
          <CardHeader>
            <CardTitle>Current Store State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Modal Open:</span>
                <Badge variant={isOpen ? "default" : "secondary"}>
                  {isOpen ? "Yes" : "No"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Modal Type:</span>
                <Badge variant="outline">
                  {modalType || "None"}
                </Badge>
              </div>

              <div>
                <span className="font-medium">Modal Data:</span>
                <pre className="mt-1 p-2 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(modalData, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Example */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>How Easy Was This?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">1</div>
                <div className="text-sm text-gray-600">Install Zustand</div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">npm install zustand</code>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">2</div>
                <div className="text-sm text-gray-600">Create Store</div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">create&lt;State&gt;()</code>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">3</div>
                <div className="text-sm text-gray-600">Use in Component</div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">useModalStore()</code>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-medium">
                ✅ Total Integration Time: ~5 minutes
              </p>
              <p className="text-green-700 text-sm">
                No breaking changes to existing code. Works perfectly with TanStack Query and Redis caching.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Simulation */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                Mock {modalType?.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')} Modal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">This is a simulated modal window.</p>

              {modalData && (
                <div className="mb-4">
                  <strong>Modal Data:</strong>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-sm">
                    {JSON.stringify(modalData, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={closeModal} variant="outline">
                  Close
                </Button>
                <Button onClick={closeModal}>
                  Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 