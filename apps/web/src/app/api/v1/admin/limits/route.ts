import { NextResponse } from 'next/server';
import { getLimits, createLimit } from '@/lib/services/limit.service';

export async function GET() {
  try {
    const limits = await getLimits();
    return NextResponse.json(limits);
  } catch (error) {
    console.error('Error fetching limits:', error);
    return NextResponse.json({ message: 'Failed to fetch limits' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newLimit = await createLimit(body);
    return NextResponse.json(newLimit);
  } catch (error) {
    console.error('Error creating limit:', error);
    return NextResponse.json({ message: 'Failed to create limit' }, { status: 500 });
  }
}