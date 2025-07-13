import { NextRequest, NextResponse } from 'next/server';

let featureSets: any[] = [
  {
    id: '1',
    name: 'Starter Features',
    description: 'Basic features for getting started',
    tier: 'tenant',
    isDefault: false,
    features: [
      {
        id: 'basic-auth',
        name: 'Basic Authentication',
        description: 'Email and password authentication',
        category: 'core',
        tier: 'platform',
        enabled: true,
        limits: {
          max_login_attempts: 5,
          session_timeout_minutes: 60,
        },
      },
      {
        id: 'basic-storage',
        name: 'Basic Storage',
        description: 'File storage with size limits',
        category: 'core',
        tier: 'tenant',
        enabled: true,
        limits: {
          max_storage_gb: 5,
          max_file_size_mb: 50,
        },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: featureSets,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch feature sets',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newFeatureSet = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (body.isDefault) {
      featureSets = featureSets.map(set => ({
        ...set,
        isDefault: set.tier === body.tier ? false : set.isDefault,
      }));
    }

    featureSets.push(newFeatureSet);

    return NextResponse.json({
      success: true,
      data: newFeatureSet,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to create feature set',
      },
      { status: 500 }
    );
  }
}