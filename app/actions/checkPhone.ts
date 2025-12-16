'use server';

import { createClient } from '@/utils/supabase/server';

export async function checkPhoneUnique(phone: string) {
  const supabase = createClient();
  
  // Check if phone exists in ANY profile (excluding current user if we knew their ID, but here we check global uniqueness)
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .single();

  // If data exists, phone is taken
  if (data) {
    return { unique: false };
  }
  
  return { unique: true };
}

