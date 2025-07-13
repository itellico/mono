import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAdminAuth } from '@/lib/with-admin-auth';
import { platformFeatures, insertPlatformFeatureSchema } from '@/lib/schemas/subscriptions';
import { eq } from 'drizzle-orm';

async function updateFeature(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: featureIdStr } = await context.params;
        const featureId = parseInt(featureIdStr, 10);
        if (isNaN(featureId)) {
            return NextResponse.json({ message: 'Invalid feature ID' }, { status: 400 });
        }

        const body = await request.json();
        const parsedData = insertPlatformFeatureSchema.partial().parse(body);

        const [updatedFeature] = await db.update(platformFeatures)
            .set({ ...parsedData, updatedAt: new Date() })
            .where(eq(platformFeatures.id, featureId))
            .returning();

        if (!updatedFeature) {
            return NextResponse.json({ message: 'Feature not found' }, { status: 404 });
        }

        return NextResponse.json(updatedFeature);
    } catch (error) {
        console.error('Error updating platform feature:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid data provided', errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Error updating platform feature' }, { status: 500 });
    }
}

async function deleteFeature(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: featureIdStr } = await context.params;
        const featureId = parseInt(featureIdStr, 10);
        if (isNaN(featureId)) {
            return NextResponse.json({ message: 'Invalid feature ID' }, { status: 400 });
        }

        const [deletedFeature] = await db.delete(platformFeatures)
            .where(eq(platformFeatures.id, featureId))
            .returning();

        if (!deletedFeature) {
            return NextResponse.json({ message: 'Feature not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Feature deleted successfully' });
    } catch (error) {
        console.error('Error deleting platform feature:', error);
        return NextResponse.json({ message: 'Error deleting platform feature' }, { status: 500 });
    }
}

export const PUT = withAdminAuth(updateFeature, ['super_admin']);
export const DELETE = withAdminAuth(deleteFeature, ['super_admin']); 