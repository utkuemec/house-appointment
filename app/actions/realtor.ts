'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyRecoLicense, validateRecoFormat } from '@/lib/reco-verification';

export async function registerRealtor(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User must be logged in');

  // Required RECO fields
  const reco_registration_number = formData.get('reco_registration_number') as string;
  const reco_full_name = formData.get('reco_full_name') as string;
  
  if (!reco_registration_number) {
    throw new Error('RECO Registration Number is required');
  }

  if (!reco_full_name) {
    throw new Error('Full legal name (as registered with RECO) is required');
  }

  // Clean registration number
  const cleanRegNumber = reco_registration_number.replace(/[\s-]/g, '');

  // STEP 1: Validate format (5-7 digits for RECO)
  if (!validateRecoFormat(cleanRegNumber)) {
    throw new Error(
      `Invalid RECO Registration Number format. RECO numbers are typically 5-7 digits. You entered: "${cleanRegNumber}"`
    );
  }

  // STEP 2: AUTOMATIC VERIFICATION ATTEMPT
  console.log(`🤖 Attempting AUTO verification for RECO #${cleanRegNumber}`);
  const verificationResult = await verifyRecoLicense(cleanRegNumber, reco_full_name);
  
  console.log(`📋 Verification result:`, verificationResult);

  // If format is invalid, reject immediately
  if (verificationResult.status === 'INVALID_FORMAT') {
    throw new Error(verificationResult.message);
  }

  // Determine if auto-verified
  const isAutoVerified = verificationResult.verified && verificationResult.status === 'ACTIVE';
  
  // STEP 3: Create the profile
  const license_number = formData.get('license_number') as string;
  const license_path = formData.get('license_path') as string;
  const hourly_rate = parseFloat(formData.get('hourly_rate') as string);
  const broker_since = formData.get('broker_since') as string;
  const bio = formData.get('bio') as string;
  
  const languagesStr = formData.get('languages') as string;
  const languages = languagesStr.split(',').map(l => l.trim());

  const { error } = await supabase
    .from('realtor_profiles')
    .insert({
      id: user.id,
      license_number,
      license_url: license_path,
      hourly_rate,
      broker_since,
      languages,
      bio,
      // RECO verification fields
      reco_registration_number: cleanRegNumber,
      reco_full_name: verificationResult.fullName || reco_full_name,
      reco_license_status: verificationResult.status,
      reco_license_type: verificationResult.licenseType || null,
      reco_brokerage_name: verificationResult.brokerageName || null,
      reco_verified_at: isAutoVerified ? verificationResult.verifiedAt : null,
      reco_last_checked: verificationResult.verifiedAt,
      is_verified: isAutoVerified,
    });

  if (error) {
    if (error.code === '23505') {
      if (error.message.includes('reco_registration_number')) {
        throw new Error('This RECO Registration Number is already registered by another user.');
      }
      throw new Error('You are already registered as a realtor. Please edit your profile instead.');
    }
    throw new Error('Failed to register: ' + error.message);
  }

  revalidatePath('/profile');
  revalidatePath('/realtors');
  
  // Different messages based on verification result
  let message: string;
  if (isAutoVerified) {
    message = `✅ AUTO-VERIFIED! Your RECO license #${cleanRegNumber} is ACTIVE. Welcome aboard!`;
  } else if (verificationResult.verificationMethod === 'MANUAL_REQUIRED') {
    message = `⏳ Registration accepted. Auto-verification couldn't confirm your license. An admin will verify within 24 hours.`;
  } else {
    message = verificationResult.message;
  }
  
  return { 
    success: true,
    verified: isAutoVerified,
    status: verificationResult.status,
    brokerageName: verificationResult.brokerageName,
    licenseType: verificationResult.licenseType,
    verificationMethod: verificationResult.verificationMethod || 'AUTO',
    message,
  };
}
