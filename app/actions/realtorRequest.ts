'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateRealtorRequest(listingId: string, status: 'accepted' | 'declined') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User must be logged in');

  // Verify the user is the ASSIGNED REALTOR for this listing
  // (RLS should handle this, but explicit check is safer)
  // Wait, we need to check if the current user's realtor_profile.id matches assigned_realtor_id
  // This is tricky without a join.
  // Simpler: Just check if the listing's assigned_realtor_id matches the user's ID directly?
  // No, assigned_realtor_id points to realtor_profiles.id, which matches profiles.id, which matches auth.uid()
  // So yes, listing.assigned_realtor_id MUST equal user.id

  const { error } = await supabase
    .from('listings')
    .update({ 
      realtor_status: status,
      // If declined, we should probably unassign them? 
      // Or keep them assigned but 'declined' so landlord sees history?
      // Let's keep it simple: If declined, unassign.
      assigned_realtor_id: status === 'declined' ? null : undefined,
      realtor_status: status === 'declined' ? null : status 
    })
    .eq('id', listingId)
    .eq('assigned_realtor_id', user.id);

  if (error) throw new Error('Failed to update request: ' + error.message);

  revalidatePath('/profile');
  return { success: true };
}


