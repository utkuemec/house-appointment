import { createClient } from '@supabase/supabase-js';
import { Listing } from '../types';

// Note: In a real Next.js App Router app, you would use createServerClient from @supabase/ssr
// and pass cookies. For this utility, we'll assume we can instantiate a client 
// with the service role key for secure server-side access or just use the standard client
// if we are passing the user's context. 
// However, since we are matching email, we might just query the public table.
// BUT, to be secure and "server-side", we should use an admin client or the user's client.
// The prompt says "server-side utility function", implying it runs in a Server Component or Action.

export async function getLandlordProperties(userEmail: string): Promise<Listing[]> {
  // In a real app, ensure you use the environment variables securely.
  // We use the service role key to bypass RLS if needed, or just the anon key if RLS allows reading.
  // Since listings are public, we can use the anon key. 
  // But for "Landlord Mode" logic, we are trusted the email passed in.
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('contact_email', userEmail);

  if (error) {
    console.error('Error fetching landlord properties:', error);
    return [];
  }

  return (data as Listing[]) || [];
}

export async function getAllListings(): Promise<Listing[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all listings:', error);
    return [];
  }

  return (data as Listing[]) || [];
}

