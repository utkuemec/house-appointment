import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import RealtorCard from '@/components/RealtorCard';

export const revalidate = 0;

export default async function RealtorDirectoryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch verified realtors with ACTIVE RECO license
  const { data: realtors } = await supabase
    .from('realtor_profiles')
    .select('*, profiles(full_name, email, city, avatar_url)')
    .eq('is_verified', true)
    .eq('reco_license_status', 'ACTIVE'); // Only show ACTIVE licenses

  // Fetch user's listings to populate the hire modal
  let myListings: any[] = [];
  if (user) {
    const { data } = await supabase
      .from('listings')
      .select('id, address')
      .eq('contact_email', user.email || '');
    myListings = data || [];
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hire a Realtor</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Find RECO-verified professionals to manage your property viewings.</p>
        <Link href="/become-realtor" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Are you a realtor? Join us.
        </Link>
      </div>

      {/* RECO Trust Badge */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6 flex items-center gap-3">
        <span className="text-green-600 text-xl">✓</span>
        <p className="text-sm text-green-800 dark:text-green-200">
          All realtors below are verified through the <strong>Real Estate Council of Ontario (RECO)</strong> public registry.
        </p>
      </div>

      {(!realtors || realtors.length === 0) ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">No verified realtors found yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {realtors.map((realtor: any) => (
            <RealtorCard 
              key={realtor.id} 
              realtor={realtor} 
              myListings={myListings}
              isLandlord={myListings.length > 0}
            />
          ))}
        </div>
      )}
    </main>
  );
}
