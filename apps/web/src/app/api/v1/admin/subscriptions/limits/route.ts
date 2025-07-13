import { NextRequest, NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import { withAdminAuth } from '@/lib/with-admin-auth';
import { Prisma } from '@prisma/client';

// GET all feature limits
async function getAllLimits(request: NextRequest) {
  try {
    const limits = await prisma.featureLimit.findMany();
    return NextResponse.json(limits);
  } catch (error) {
    console.error('Error fetching feature limits:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST a new feature limit
async function createLimit(request: NextRequest) {
  try {
    const body = await request.json();
    // TODO: Add validation here with Zod
    const newLimit = await prisma.featureLimit.create({ data: body });
    return NextResponse.json(newLimit, { status: 201 });
  } catch (error) {
    console.error('Error creating feature limit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAdminAuth(getAllLimits, ['super_admin']);
export const POST = withAdminAuth(createLimit, ['super_admin']); 