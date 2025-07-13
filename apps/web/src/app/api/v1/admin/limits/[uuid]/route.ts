
import { NextResponse } from 'next/server';
import { updateLimit, deleteLimit } from '@/lib/services/limit.service';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updatedLimit = await updateLimit(params.id, body);
    return NextResponse.json(updatedLimit);
  } catch (error) {
    console.error('Error updating limit:', error);
    return NextResponse.json({ message: 'Failed to update limit' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const deletedLimit = await deleteLimit(params.id);
    return NextResponse.json(deletedLimit);
  } catch (error) {
    console.error('Error deleting limit:', error);
    return NextResponse.json({ message: 'Failed to delete limit' }, { status: 500 });
  }
}
