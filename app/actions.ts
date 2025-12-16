'use server';

import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';
import { revalidatePath } from 'next/cache';

// Initialize Resend only if key exists to prevent crashes
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

export async function deleteListing(listingId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error('User must be logged in');
  }

  // Verify ownership (RLS will handle this, but good to double check or handle errors)
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('contact_email', user.email); // Explicit check to be safe

  if (error) {
    throw new Error('Failed to delete listing: ' + error.message);
  }

  revalidatePath('/my-listings');
  revalidatePath('/browse');
  
  return { success: true };
}

export async function createListing(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error('User must be logged in');
  }

  const address = formData.get('address') as string;
  const price = parseInt(formData.get('price') as string);
  const description = formData.get('description') as string;
  const listingType = (formData.get('listingType') as 'rent' | 'sale') || 'rent';
  const bedrooms = parseInt(formData.get('bedrooms') as string) || 0;
  const bathrooms = parseFloat(formData.get('bathrooms') as string) || 0;
  const sqft = parseInt(formData.get('sqft') as string) || 0;
  
  // Handle both manual URL and uploaded images
  const imageUrl = formData.get('imageUrl') as string;
  const uploadedImagesStr = formData.get('uploadedImages') as string;
  
  let images: string[] = [];
  
  if (uploadedImagesStr) {
    try {
      images = JSON.parse(uploadedImagesStr);
    } catch (e) {
      console.error('Failed to parse uploaded images', e);
    }
  }
  
  if (imageUrl && images.length === 0) {
    images = [imageUrl];
  }

  // Create a simplified listing object
  const newListing = {
    address,
    price,
    description,
    images_json: images,
    contact_email: user.email,
    listing_type: listingType,
    bedrooms,
    bathrooms,
    sqft,
    // Generate a pseudo-source-url for internal listings to satisfy uniqueness constraint
    source_url: `https://viewto.app/internal/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };

  const { error } = await supabase.from('listings').insert(newListing);

  if (error) {
    throw new Error('Failed to create listing: ' + error.message);
  }

  revalidatePath('/my-listings');
  revalidatePath('/browse');
  
  return { success: true };
}

export async function createAppointment(listingId: string, startTime: string, endTime: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error('User must be logged in');
  }

  // 1. Fetch Listing Details (to get Landlord Email)
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('address, contact_email')
    .eq('id', listingId)
    .single();

  if (listingError || !listing) {
    throw new Error('Listing not found');
  }

  // 2. Insert Appointment
  const { error: insertError } = await supabase
    .from('appointments')
    .insert({
      listing_id: listingId,
      tenant_user_id: user.id,
      start_time: startTime,
      end_time: endTime,
      status: 'pending'
    });

  if (insertError) {
    throw new Error('Failed to create appointment');
  }

  // 3. Send Email Notification to Landlord
  const formattedTime = new Date(startTime).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  await sendEmailSafely(
    listing.contact_email,
    'New Viewing Request! 🏠',
    `
      <h1>New Viewing Request</h1>
      <p>A tenant (<strong>${user.email}</strong>) has requested to view your property.</p>
      <p><strong>Address:</strong> ${listing.address}</p>
      <p><strong>Requested Time:</strong> ${formattedTime}</p>
      <p>Please log in to your dashboard to Accept or Decline.</p>
    `
  );

  return { success: true };
}

export async function updateAppointmentStatus(appointmentId: string, status: 'confirmed' | 'cancelled') {
  const supabase = createClient();

  // 1. Fetch appointment details (including Listing and Tenant Profile)
  const { data: appt, error: fetchError } = await supabase
    .from('appointments')
    .select(`
      *,
      listings (
        address,
        contact_email
      ),
      profiles (
        email,
        full_name
      )
    `)
    .eq('id', appointmentId)
    .single();

  if (fetchError || !appt) {
    throw new Error('Appointment not found');
  }

  // 2. Update the status in Supabase
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);

  if (updateError) {
    throw new Error('Failed to update appointment status');
  }

  // 3. Send Emails (Only if Confirmed)
  if (status === 'confirmed') {
    const tenantEmail = appt.profiles?.email;
    const landlordEmail = appt.listings?.contact_email;
    const address = appt.listings?.address;
    const formattedTime = new Date(appt.start_time).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    // Email to Tenant
    await sendEmailSafely(
      tenantEmail,
      'Viewing Confirmed! 🎉',
      `
        <h1>Appointment Confirmed</h1>
        <p>Great news! Your viewing request has been accepted.</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
        <p>Please arrive 5 minutes early. If you need to cancel, please reply to this email.</p>
      `
    );

    // Email to Landlord (Confirmation)
    await sendEmailSafely(
      landlordEmail,
      'Viewing Scheduled ✅',
      `
        <h1>Appointment Scheduled</h1>
        <p>You have confirmed a viewing with <strong>${tenantEmail}</strong>.</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
      `
    );
  }

  return { success: true };
}

async function sendEmailSafely(to: string, subject: string, html: string) {
  if (!to) return;

  if (!resend) {
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'ViewTO <onboarding@resend.dev>',
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`[EMAIL SENT] To: ${to}`);
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
    // Don't crash the app if email fails, just log it
  }
}
