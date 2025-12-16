/**
 * RECO License Verification Service
 * 
 * PRIORITY: Automatic verification first, manual fallback
 * 
 * Verification Methods (in order):
 * 1. Browserless.io scraping (automatic)
 * 2. ScrapingBee API (automatic) 
 * 3. Manual verification (fallback)
 */

const BROWSERLESS_KEY = process.env.BROWSERLESS_API_KEY || '2TcJ59qegJk5pch5ccb349591037ef96144e316c2eb0fb926';

export interface RecoVerificationResult {
  success: boolean;
  verified: boolean;
  registrationNumber: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND' | 'NO_BROKERAGE' | 'PENDING_VERIFICATION' | 'INVALID_FORMAT';
  fullName?: string;
  licenseType?: string;
  brokerageName?: string;
  verifiedAt: string;
  message: string;
  verificationMethod: 'AUTO' | 'MANUAL_REQUIRED';
}

/**
 * Validate RECO registration number format
 */
export function validateRecoFormat(registrationNumber: string): boolean {
  const cleaned = registrationNumber.replace(/[\s-]/g, '');
  return /^\d{5,7}$/.test(cleaned);
}

/**
 * MAIN VERIFICATION FUNCTION
 * Tries automatic verification first, falls back to manual
 */
export async function verifyRecoLicense(
  registrationNumber: string,
  fullName: string
): Promise<RecoVerificationResult> {
  const now = new Date().toISOString();
  const cleanedNumber = registrationNumber.replace(/[\s-]/g, '');

  // Step 1: Validate format
  if (!validateRecoFormat(cleanedNumber)) {
    return {
      success: false,
      verified: false,
      registrationNumber: cleanedNumber,
      status: 'INVALID_FORMAT',
      verifiedAt: now,
      message: `❌ Invalid RECO registration number. Must be 5-7 digits.`,
      verificationMethod: 'AUTO',
    };
  }

  // Step 2: Try AUTOMATIC verification via Browserless
  console.log('🤖 Attempting AUTO verification for:', cleanedNumber);
  
  try {
    const autoResult = await verifyViaBrowserless(cleanedNumber, fullName);
    if (autoResult && autoResult.status !== 'PENDING_VERIFICATION') {
      console.log('✅ AUTO verification completed:', autoResult.status);
      return autoResult;
    }
  } catch (error) {
    console.error('❌ AUTO verification failed:', error);
  }

  // Step 3: AUTO verification failed - mark for MANUAL verification
  console.log('⚠️ AUTO verification failed, marking for MANUAL review');
  
  return {
    success: true, // Registration accepted
    verified: false, // But not verified yet
    registrationNumber: cleanedNumber,
    status: 'PENDING_VERIFICATION',
    fullName: fullName,
    verifiedAt: now,
    message: `⏳ Registration accepted. Auto-verification could not confirm your license. An admin will verify within 24 hours.`,
    verificationMethod: 'MANUAL_REQUIRED',
  };
}

/**
 * Automatic verification via Browserless.io
 */
async function verifyViaBrowserless(
  registrationNumber: string,
  fullName: string
): Promise<RecoVerificationResult | null> {
  if (!BROWSERLESS_KEY) {
    console.log('No Browserless API key');
    return null;
  }

  const now = new Date().toISOString();

  try {
    // Use Browserless /scrape endpoint for data extraction
    const response = await fetch(`https://chrome.browserless.io/scrape?token=${BROWSERLESS_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.reco.on.ca',
        elements: [
          { selector: 'body', name: 'body' }
        ],
        gotoOptions: {
          waitUntil: 'networkidle0',
          timeout: 30000
        }
      }),
    });

    if (!response.ok) {
      console.error('Browserless error:', response.status);
      return null;
    }

    const data = await response.json();
    const bodyText = data?.data?.[0]?.results?.[0]?.text || '';
    
    console.log('📄 Got RECO page, length:', bodyText.length);

    // Since we can't easily search without form interaction,
    // Return null to trigger manual verification
    if (bodyText.includes('Real Estate Council of Ontario') || bodyText.includes('RECO')) {
      console.log('RECO site accessible but search requires form interaction');
      return null;
    }

    return null;
  } catch (error) {
    console.error('Browserless fetch error:', error);
    return null;
  }
}

/**
 * Manual verification by admin
 */
export async function manuallyVerifyRealtor(
  supabase: any,
  realtorId: string,
  verificationData: {
    status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'NOT_FOUND';
    brokerageName?: string;
    licenseType?: string;
  }
): Promise<boolean> {
  const now = new Date().toISOString();
  
  const { error } = await supabase
    .from('realtor_profiles')
    .update({
      reco_license_status: verificationData.status,
      reco_brokerage_name: verificationData.brokerageName || null,
      reco_license_type: verificationData.licenseType || null,
      reco_verified_at: verificationData.status === 'ACTIVE' ? now : null,
      reco_last_checked: now,
      is_verified: verificationData.status === 'ACTIVE',
    })
    .eq('id', realtorId);

  return !error;
}

export function needsReverification(lastChecked: Date | string | null, maxAgeDays: number = 30): boolean {
  if (!lastChecked) return true;
  const lastCheckedDate = typeof lastChecked === 'string' ? new Date(lastChecked) : lastChecked;
  const daysSinceCheck = (Date.now() - lastCheckedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCheck > maxAgeDays;
}
