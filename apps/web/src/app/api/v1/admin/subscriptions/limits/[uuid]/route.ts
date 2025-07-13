import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { featureLimits } from '@/lib/subscription-schema';
import { withAdminAuth } from '@/lib/with-admin-auth';
import { eq } from 'drizzle-orm';

// PUT update a feature limit
async function updateLimit(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: limitId } = await context.params;
    const id = parseInt(limitId, 10);
    const body = await request.json();
    // TODO: Add validation here with Zod
    const updatedLimit = await db
      .update(featureLimits)
      .set(body)
      .where(eq(featureLimits.id, id))
      .returning();
    if (updatedLimit.length === 0) {
      return NextResponse.json({ error: 'Limit not found' }, { status: 404 });
    }
    return NextResponse.json(updatedLimit[0]);
  } catch (error) {
    const { id } = await context.params;
    console.error(`Error updating feature limit ${id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// DELETE a feature limit
async function deleteLimit(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: limitId } = await context.params;
    const id = parseInt(limitId, 10);
    const deletedLimit = await db
      .delete(featureLimits)
      .where(eq(featureLimits.id, id))
      .returning();
    if (deletedLimit.length === 0) {
      return NextResponse.json({ error: 'Limit not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Limit deleted successfully' });
  } catch (error) {
    const { id } = await context.params;
    console.error(`Error deleting feature limit ${id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export const PUT = withAdminAuth(updateLimit, ['super_admin']);
export const DELETE = withAdminAuth(deleteLimit, ['super_admin']); 