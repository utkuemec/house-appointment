'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function ensureProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false };

  // Check if profile exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile exists but is missing data that we have in metadata, update it
  if (existing) {
    const updates: any = {};
    let needsUpdate = false;

    if (!existing.phone && user.user_metadata.phone) {
      updates.phone = user.user_metadata.phone;
      needsUpdate = true;
    }
    if (!existing.city && user.user_metadata.city) {
      updates.city = user.user_metadata.city;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
      revalidatePath('/profile');
    }
    return { success: true };
  }

  // If not, create it using Auth data
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata.full_name || user.email?.split('@')[0],
      phone: user.user_metadata.phone || null,
      city: user.user_metadata.city || null
    });

  if (error) {
    console.error('Auto-create profile failed:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}

