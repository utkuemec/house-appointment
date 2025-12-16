import { NextRequest, NextResponse } from 'next/server';
import { batchReverifyRealtors } from '@/app/actions/recoVerification';

/**
 * RECO License Re-verification Cron Job
 * 
 * Schedule: Run daily to check licenses that haven't been verified in 30+ days
 * 
 * For Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/reverify-licenses",
 *     "schedule": "0 3 * * *"  // Daily at 3 AM UTC
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  // Vercel automatically sets this header for cron requests
  const authHeader = request.headers.get('authorization');
  
  if (process.env.NODE_ENV === 'production') {
    // Option 1: Use Vercel's built-in CRON_SECRET (recommended)
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    console.log('Starting RECO license re-verification batch job...');
    
    const result = await batchReverifyRealtors();
    
    console.log('Re-verification complete:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Re-verification completed',
      ...result,
    });
  } catch (error) {
    console.error('Re-verification cron job failed:', error);
    return NextResponse.json(
      { error: 'Re-verification failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

