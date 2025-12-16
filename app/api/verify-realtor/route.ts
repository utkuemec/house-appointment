import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const BROWSERLESS_KEY = process.env.BROWSERLESS_API_KEY || '2TcJ59qegJk5pch5ccb349591037ef96144e316c2eb0fb926';

/**
 * AUTOMATIC RECO Verification API
 * 
 * GET: Verify a single realtor by ID or RECO number
 * POST: Batch verify all pending realtors
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const realtorId = searchParams.get('id');
  const recoNumber = searchParams.get('reco_number');

  if (!realtorId && !recoNumber) {
    return NextResponse.json({ error: 'Missing id or reco_number parameter' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    
    let realtor;
    if (realtorId) {
      const { data } = await supabase
        .from('realtor_profiles')
        .select('*')
        .eq('id', realtorId)
        .single();
      realtor = data;
    } else if (recoNumber) {
      const { data } = await supabase
        .from('realtor_profiles')
        .select('*')
        .eq('reco_registration_number', recoNumber)
        .single();
      realtor = data;
    }

    if (!realtor) {
      return NextResponse.json({ error: 'Realtor not found' }, { status: 404 });
    }

    const result = await performAutoVerification(
      realtor.reco_registration_number,
      realtor.reco_full_name || ''
    );

    if (result.status !== 'VERIFICATION_FAILED') {
      await supabase
        .from('realtor_profiles')
        .update({
          reco_license_status: result.status,
          reco_brokerage_name: result.brokerageName || null,
          reco_license_type: result.licenseType || null,
          reco_verified_at: result.verified ? new Date().toISOString() : null,
          reco_last_checked: new Date().toISOString(),
          is_verified: result.verified,
        })
        .eq('id', realtor.id);
    }

    return NextResponse.json({
      success: true,
      realtorId: realtor.id,
      verification: result,
    });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ 
      error: 'Verification failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    
    const { data: pendingRealtors, error } = await supabase
      .from('realtor_profiles')
      .select('id, reco_registration_number, reco_full_name')
      .eq('reco_license_status', 'PENDING_VERIFICATION')
      .limit(50);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch pending realtors' }, { status: 500 });
    }

    if (!pendingRealtors || pendingRealtors.length === 0) {
      return NextResponse.json({ message: 'No pending verifications', verified: 0, failed: 0 });
    }

    let verified = 0;
    let failed = 0;
    const results: any[] = [];

    for (const realtor of pendingRealtors) {
      try {
        const result = await performAutoVerification(
          realtor.reco_registration_number,
          realtor.reco_full_name || ''
        );

        if (result.status === 'ACTIVE') {
          await supabase
            .from('realtor_profiles')
            .update({
              reco_license_status: result.status,
              reco_brokerage_name: result.brokerageName || null,
              reco_license_type: result.licenseType || null,
              reco_verified_at: new Date().toISOString(),
              reco_last_checked: new Date().toISOString(),
              is_verified: true,
            })
            .eq('id', realtor.id);
          verified++;
        } else if (result.status === 'NOT_FOUND' || result.status === 'SUSPENDED' || result.status === 'TERMINATED') {
          await supabase
            .from('realtor_profiles')
            .update({
              reco_license_status: result.status,
              reco_last_checked: new Date().toISOString(),
              is_verified: false,
            })
            .eq('id', realtor.id);
          failed++;
        }

        results.push({
          id: realtor.id,
          reco_number: realtor.reco_registration_number,
          status: result.status,
          verified: result.verified,
        });

        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        failed++;
        results.push({
          id: realtor.id,
          reco_number: realtor.reco_registration_number,
          status: 'ERROR',
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: pendingRealtors.length,
      verified,
      failed,
      remaining: pendingRealtors.length - verified - failed,
      results,
    });
  } catch (error) {
    console.error('Batch verification error:', error);
    return NextResponse.json({ error: 'Batch verification failed' }, { status: 500 });
  }
}

interface VerificationResult {
  verified: boolean;
  status: string;
  fullName?: string;
  licenseType?: string;
  brokerageName?: string;
  message: string;
}

async function performAutoVerification(
  registrationNumber: string,
  fullName: string
): Promise<VerificationResult> {
  
  if (!BROWSERLESS_KEY) {
    return {
      verified: false,
      status: 'VERIFICATION_FAILED',
      message: 'Verification service not configured',
    };
  }

  try {
    const response = await fetch(\`https://chrome.browserless.io/function?token=\${BROWSERLESS_KEY}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: \`
          module.exports = async ({ page }) => {
            const registrationNumber = '\${registrationNumber}';
            const searchName = '\${fullName.replace(/'/g, "\\\\'")}';
            
            try {
              await page.goto('https://www.reco.on.ca', { waitUntil: 'networkidle2', timeout: 30000 });
              await page.waitForTimeout(2000);
              
              const searchLink = await page.$('a[href*="agent"], a[href*="search"]');
              if (searchLink) {
                await searchLink.click();
                await page.waitForTimeout(2000);
              }
              
              const searchInput = await page.$('input[type="text"], input[type="search"]');
              if (searchInput) {
                await searchInput.type(registrationNumber);
                const submitBtn = await page.$('button[type="submit"], input[type="submit"]');
                if (submitBtn) {
                  await submitBtn.click();
                  await page.waitForTimeout(3000);
                }
              }
              
              const content = await page.content();
              
              const isActive = content.toLowerCase().includes('active') && 
                             (content.includes(registrationNumber) || content.toLowerCase().includes(searchName.toLowerCase()));
              const isSuspended = content.toLowerCase().includes('suspended');
              const isTerminated = content.toLowerCase().includes('terminated');
              const notFound = content.toLowerCase().includes('no results') || content.toLowerCase().includes('not found');
              
              let brokerageName = null;
              const brokerageMatch = content.match(/brokerage[:\\\\s]*([^<\\\\n]+)/i);
              if (brokerageMatch) {
                brokerageName = brokerageMatch[1].trim().substring(0, 100);
              }
              
              return {
                success: true,
                isActive,
                isSuspended,
                isTerminated,
                notFound,
                brokerageName,
                registrationNumberFound: content.includes(registrationNumber),
              };
            } catch (error) {
              return { success: false, error: error.message };
            }
          }
        \`,
      }),
    });

    if (!response.ok) {
      return {
        verified: false,
        status: 'VERIFICATION_FAILED',
        message: 'Could not connect to verification service',
      };
    }

    const result = await response.json();
    console.log('🔍 RECO Verification result:', JSON.stringify(result, null, 2));

    if (!result.success) {
      return {
        verified: false,
        status: 'VERIFICATION_FAILED',
        message: result.error || 'Verification failed',
      };
    }

    if (result.notFound) {
      return {
        verified: false,
        status: 'NOT_FOUND',
        message: \`RECO registration #\${registrationNumber} not found.\`,
      };
    }

    if (result.isSuspended) {
      return {
        verified: false,
        status: 'SUSPENDED',
        message: \`RECO registration #\${registrationNumber} is SUSPENDED.\`,
      };
    }

    if (result.isTerminated) {
      return {
        verified: false,
        status: 'TERMINATED',
        message: \`RECO registration #\${registrationNumber} is TERMINATED.\`,
      };
    }

    if (result.isActive && result.registrationNumberFound) {
      return {
        verified: true,
        status: 'ACTIVE',
        fullName: fullName,
        licenseType: 'Salesperson',
        brokerageName: result.brokerageName || 'Verified Brokerage',
        message: \`✅ RECO license verified as ACTIVE.\`,
      };
    }

    return {
      verified: false,
      status: 'PENDING_VERIFICATION',
      message: 'Could not automatically verify. Manual review required.',
    };

  } catch (error) {
    console.error('Auto verification error:', error);
    return {
      verified: false,
      status: 'VERIFICATION_FAILED',
      message: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}
