import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { withAdminAuth } from '@/lib/with-admin-auth';
import { z } from 'zod';
import { insertPlatformFeatureSchema } from '@/lib/subscription-schema';

async function handler(request: NextRequest, session: any) {
  try {
    const features = await prisma.platformFeature.findMany();
    return NextResponse.json(features);
  } catch (error) {
    console.error('Error fetching platform features:', error);
    return NextResponse.json({ message: 'Error fetching platform features', error }, { status: 500 });
  }
}

async function createFeature(request: NextRequest, session: any) {
    try {
        const body = await request.json();
        const parsedData = insertPlatformFeatureSchema.parse(body);

        const newFeature = await prisma.platformFeature.create({ data: parsedData });

        return NextResponse.json(newFeature, { status: 201 });

    } catch (error) {
        console.error('Error creating platform feature:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid data provided', errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Error creating platform feature', error }, { status: 500 });
    }
}

export const GET = withAdminAuth(handler, ['super_admin']);
export const POST = withAdminAuth(createFeature, ['super_admin']);