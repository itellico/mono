import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clear = false } = body;

    logger.info('[API:option-sets-seed] Running seeder', { clear });

    // Build the seeder command
    let command = 'npm run db:seed:option-sets';

    // Add clear flag if specified
    if (clear) {
      command += ' -- --clear';
    }

    logger.info('[API:option-sets-seed] Executing command:', command);

    // Execute the seeder
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 60000 // 60 second timeout
    });

    logger.info('[API:option-sets-seed] Seeder completed successfully', { 
      stdout: stdout.substring(0, 500),
      stderr: stderr ? stderr.substring(0, 500) : 'No errors'
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Seeder completed successfully',
        output: stdout,
        categories: 'all', // Always seed all categories
        cleared: clear
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('[API:option-sets-seed] Error running seeder', { 
      error: error.message,
      code: error.code,
      signal: error.signal,
      stdout: error.stdout?.substring(0, 500),
      stderr: error.stderr?.substring(0, 500)
    });

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to run seeder',
      details: {
        code: error.code,
        signal: error.signal,
        stdout: error.stdout,
        stderr: error.stderr
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 