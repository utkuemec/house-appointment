'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

export async function hireRealtor(listingId: string, realtorId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User must be logged in');

  // Verify ownership
  const { data: listing } = await supabase
    .from('listings')
    .select('address, contact_email')
    .eq('id', listingId)
    .single();

  if (!listing || listing.contact_email !== user.email) {
    throw new Error('You can only hire a realtor for your own listings.');
  }

  // Fetch Realtor Email to notify them
  const { data: realtor } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', realtorId)
    .single();

  // Update listing with assigned realtor and PENDING status
  const { error } = await supabase
    .from('listings')
    .update({ 
      assigned_realtor_id: realtorId,
      realtor_status: 'pending'
    })
    .eq('id', listingId);

  if (error) throw new Error('Failed to assign realtor: ' + error.message);

  // Send Email to Realtor
  if (realtor && realtor.email) {
    if (resend) {
      await resend.emails.send({
        from: 'ViewTO <onboarding@resend.dev>',
        to: realtor.email,
        subject: 'New Property Management Request! 🏠',
        html: `
          <h1>You've been hired! (Almost)</h1>
          <p><strong>${user.user_metadata.full_name || user.email}</strong> wants you to manage their property at:</p>
          <h3>${listing.address}</h3>
          <p>Please log in to your Realtor Dashboard to <strong>Accept</strong> or <strong>Decline</strong> this request.</p>
        `
      });
    } else {
      console.log(`[MOCK EMAIL] To: ${realtor.email} | Subject: New Job Request for ${listing.address}`);
    }
  }

  revalidatePath('/my-listings');
  revalidatePath('/realtors');
  return { success: true };
}

