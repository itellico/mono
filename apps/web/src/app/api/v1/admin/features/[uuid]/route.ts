
import { NextResponse } from 'next/server';
import { updateFeature, deleteFeature } from '@/lib/services/feature.service';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updatedFeature = await updateFeature(params.id, body);
    return NextResponse.json(updatedFeature);
  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json({ message: 'Failed to update feature' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const deletedFeature = await deleteFeature(params.id);
    return NextResponse.json(deletedFeature);
  } catch (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json({ message: 'Failed to delete feature' }, { status: 500 });
  }
}
