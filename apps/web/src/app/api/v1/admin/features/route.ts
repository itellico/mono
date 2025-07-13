import { NextResponse } from 'next/server';
import { getFeatures, createFeature } from '@/lib/services/feature.service';

export async function GET() {
  try {
    const features = await getFeatures();
    return NextResponse.json(features);
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json({ message: 'Failed to fetch features' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newFeature = await createFeature(body);
    return NextResponse.json(newFeature);
  } catch (error) {
    console.error('Error creating feature:', error);
    return NextResponse.json({ message: 'Failed to create feature' }, { status: 500 });
  }
}