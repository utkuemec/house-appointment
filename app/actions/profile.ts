'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be logged in');
  }

  const full_name = formData.get('full_name') as string;
  const phone = formData.get('phone') as string;
  const city = formData.get('city') as string;

  // 1. Update Public Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name, phone, city })
    .eq('id', user.id);

  if (profileError) {
    throw new Error('Failed to update profile: ' + profileError.message);
  }

  // 2. Update Auth Metadata (Optional, but good for consistency)
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name, phone, city }
  });

  if (authError) {
    // Not critical, log it but don't fail
    console.error('Failed to update auth metadata:', authError);
  }

  revalidatePath('/profile');
  
  return { success: true };
}

export async function deleteAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be logged in');
  }

  // 1. Delete User from Auth (Requires Service Role usually, but self-deletion is sometimes allowed via RPC or logic)
  // Standard Supabase Client cannot delete its own user directly via `auth.admin`. 
  // However, we can leverage the `deleteUser` method if we had admin rights, OR we can rely on a Postgres Function.
  // For standard app safety, we usually soft-delete or use a server-side admin client.
  
  // Here we use the SERVICE_ROLE key safely on the server side to perform the deletion
  const supabaseAdmin = createClient(); 
  // Re-initializing with service role isn't straightforward in this helper structure without breaking type safety
  // Instead, we will use the standard client to call a database function if RLS permits, 
  // OR we use the `supabase.auth.admin.deleteUser(id)` pattern if we expose the service key properly.
  
  // SIMPLIFIED MVP APPROACH:
  // 1. Delete Public Profile (Cascade will handle listings/appointments)
  // 2. Sign Out
  // Note: Truly deleting the Auth User requires the Service Role Key. 
  
  // Let's assume we just want to wipe their data for now.
  
  // Using Service Role for true deletion
  const serviceClient = require('@supabase/supabase-js').createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await serviceClient.auth.admin.deleteUser(user.id);

  if (error) {
    throw new Error('Failed to delete account: ' + error.message);
  }

  return { success: true };
}
