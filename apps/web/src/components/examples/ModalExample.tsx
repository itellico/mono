'use client';

import { useModalStore } from '@/stores/ui/modal-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ModalExample() {
  // ✅ This is ALL you need to use Zustand!
  const { isOpen, modalType, openModal, closeModal } = useModalStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zustand Modal Example</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={() => openModal('user-edit', { userId: 123 })}>
            Open User Modal
          </Button>
          <Button onClick={() => openModal('settings')}>
            Open Settings
          </Button>
        </div>

        {isOpen && (
          <div className="p-4 border rounded bg-gray-50">
            <p>Modal is open: <strong>{modalType}</strong></p>
            <Button onClick={closeModal} variant="outline" className="mt-2">
              Close Modal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 