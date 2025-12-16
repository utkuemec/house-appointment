'use server';

import { createClient } from '@/utils/supabase/server';
import { verifyRecoLicense, needsReverification, isLicenseStatusValid } from '@/lib/reco-verification';
import { revalidatePath } from 'next/cache';

/**
 * Verify a realtor's RECO license
 * Called during registration and periodically for re-verification
 */
export async function verifyRealtorLicense(realtorId: string) {
  const supabase = createClient();

  // Get the realtor profile
  const { data: realtor, error: fetchError } = await supabase
    .from('realtor_profiles')
    .select('reco_registration_number, reco_full_name')
    .eq('id', realtorId)
    .single();

  if (fetchError || !realtor) {
    throw new Error('Realtor profile not found');
  }

  if (!realtor.reco_registration_number) {
    throw new Error('RECO registration number not provided');
  }

  // Call RECO verification service
  const result = await verifyRecoLicense(
    realtor.reco_registration_number,
    realtor.reco_full_name
  );

  // Update the realtor profile with verification results
  const { error: updateError } = await supabase
    .from('realtor_profiles')
    .update({
      reco_license_status: result.status,
      reco_license_type: result.licenseType || null,
      reco_brokerage_name: result.brokerageName || null,
      reco_full_name: result.fullName || realtor.reco_full_name,
      reco_verified_at: result.success ? result.verifiedAt : null,
      reco_last_checked: result.verifiedAt,
      is_verified: result.success, // Only mark as verified if ACTIVE
    })
    .eq('id', realtorId);

  if (updateError) {
    throw new Error('Failed to update verification status: ' + updateError.message);
  }

  revalidatePath('/profile');
  revalidatePath('/realtors');

  return {
    success: result.success,
    status: result.status,
    message: result.success 
      ? 'License verified successfully!' 
      : `License verification failed: ${result.errorMessage || result.status}`,
  };
}

/**
 * Check if a realtor needs re-verification and trigger if needed
 */
export async function checkAndReverifyIfNeeded(realtorId: string) {
  const supabase = createClient();

  const { data: realtor } = await supabase
    .from('realtor_profiles')
    .select('reco_last_checked, reco_license_status')
    .eq('id', realtorId)
    .single();

  if (!realtor) return { needsVerification: false };

  const shouldReverify = needsReverification(realtor.reco_last_checked, 30);

  if (shouldReverify) {
    try {
      const result = await verifyRealtorLicense(realtorId);
      return { 
        needsVerification: true, 
        verified: result.success,
        newStatus: result.status,
      };
    } catch (error) {
      console.error('Re-verification failed:', error);
      return { needsVerification: true, verified: false, error: true };
    }
  }

  return { 
    needsVerification: false, 
    currentStatus: realtor.reco_license_status,
    isValid: isLicenseStatusValid(realtor.reco_license_status),
  };
}

/**
 * Batch re-verification for all realtors (for cron jobs)
 * This should be called by a scheduled task (e.g., Vercel Cron, AWS Lambda)
 */
export async function batchReverifyRealtors() {
  const supabase = createClient();

  // Get all realtors that need re-verification (last checked > 30 days ago)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: realtors, error } = await supabase
    .from('realtor_profiles')
    .select('id')
    .or(`reco_last_checked.is.null,reco_last_checked.lt.${thirtyDaysAgo.toISOString()}`);

  if (error) {
    console.error('Failed to fetch realtors for re-verification:', error);
    return { success: false, error: error.message };
  }

  const results = {
    total: realtors?.length || 0,
    verified: 0,
    failed: 0,
    statusChanged: 0,
  };

  for (const realtor of realtors || []) {
    try {
      // Get current status before verification
      const { data: before } = await supabase
        .from('realtor_profiles')
        .select('reco_license_status')
        .eq('id', realtor.id)
        .single();

      const result = await verifyRealtorLicense(realtor.id);
      
      if (result.success) {
        results.verified++;
      } else {
        results.failed++;
      }

      // Check if status changed
      if (before && before.reco_license_status !== result.status) {
        results.statusChanged++;
        // TODO: Send notification to realtor about status change
        console.log(`Realtor ${realtor.id} status changed: ${before.reco_license_status} -> ${result.status}`);
      }

      // Rate limiting - wait 2 seconds between requests to avoid overwhelming RECO
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to verify realtor ${realtor.id}:`, error);
      results.failed++;
    }
  }

  return { success: true, results };
}

