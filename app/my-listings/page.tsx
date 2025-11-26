import { createClient } from '@/utils/supabase/server';
import { getLandlordProperties } from '@/lib/landlord';
import LandlordDashboard from '@/components/LandlordDashboard';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function MyListingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect('/');
  }

  const listings = await getLandlordProperties(user.email);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <LandlordDashboard listings={listings} />
    </main>
  );
}
