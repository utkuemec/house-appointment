import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch Profile Data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 1. Fetch "My Bookings" (I am the Tenant)
  const { data: myBookings } = await supabase
    .from('appointments')
    .select('*, listings(address, contact_email)')
    .eq('tenant_user_id', user.id)
    .order('start_time', { ascending: true });

  // 2. Fetch "Incoming Requests" (I am the Landlord)
  const { data: myListings } = await supabase
    .from('listings')
    .select('id')
    .eq('contact_email', user.email || '');

  let allIncoming: any[] = [];
  if (myListings && myListings.length > 0) {
    const listingIds = myListings.map(l => l.id);
    const { data: requests } = await supabase
      .from('appointments')
      .select('*, listings(address), profiles(email, full_name, phone)')
      .in('listing_id', listingIds)
      .order('start_time', { ascending: true });
    
    allIncoming = requests || [];
  }

  // 3. Fetch "Job Requests" (I am the Realtor)
  // I need to find listings where assigned_realtor_id = user.id AND realtor_status = 'pending'
  let realtorJobRequests: any[] = [];
  
  // Check if I am a realtor first
  const { data: isRealtor } = await supabase
    .from('realtor_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (isRealtor) {
    const { data: jobs } = await supabase
      .from('listings')
      .select('*')
      .eq('assigned_realtor_id', user.id)
      .eq('realtor_status', 'pending');
    
    realtorJobRequests = jobs || [];
  }

  return (
    <ProfileClient 
      profile={profile}
      userEmail={user.email || ''}
      userMetadata={user.user_metadata} 
      incomingRequests={allIncoming}
      myBookings={myBookings || []}
      realtorJobRequests={realtorJobRequests}
    />
  );
}
