
import { NextResponse } from 'next/server';
import { updateBundle, deleteBundle } from '@/lib/services/bundle.service';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { bundle, featureIds } = await request.json();
    const updatedBundle = await updateBundle(params.id, bundle, featureIds);
    return NextResponse.json(updatedBundle);
  } catch (error) {
    console.error('Error updating bundle:', error);
    return NextResponse.json({ message: 'Failed to update bundle' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const deletedBundle = await deleteBundle(params.id);
    return NextResponse.json(deletedBundle);
  } catch (error) {
    console.error('Error deleting bundle:', error);
    return NextResponse.json({ message: 'Failed to delete bundle' }, { status: 500 });
  }
}
