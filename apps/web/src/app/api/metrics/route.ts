import { NextRequest, NextResponse } from 'next/server';

// Basic Next.js metrics for Prometheus scraping
export async function GET(request: NextRequest) {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Basic metrics in Prometheus format
    const metrics = [
      '# HELP nextjs_process_memory_usage_bytes Process memory usage in bytes',
      '# TYPE nextjs_process_memory_usage_bytes gauge',
      `nextjs_process_memory_rss_bytes ${memUsage.rss}`,
      `nextjs_process_memory_heap_total_bytes ${memUsage.heapTotal}`,
      `nextjs_process_memory_heap_used_bytes ${memUsage.heapUsed}`,
      `nextjs_process_memory_external_bytes ${memUsage.external}`,
      '',
      '# HELP nextjs_process_uptime_seconds Process uptime in seconds',
      '# TYPE nextjs_process_uptime_seconds gauge',
      `nextjs_process_uptime_seconds ${uptime}`,
      '',
      '# HELP nextjs_build_info Build information',
      '# TYPE nextjs_build_info gauge',
      `nextjs_build_info{version="15.3.4",environment="${process.env.NODE_ENV || 'development'}"} 1`,
      '',
    ].join('\n');

    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}