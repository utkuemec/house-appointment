import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import MarketplaceFeed from '@/components/MarketplaceFeed';
import Link from 'next/link';

export const revalidate = 0;

export default async function LandlordProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  // 1. Get Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!profile) notFound();

  // 2. Get Listings
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('contact_email', profile.email)
    .order('created_at', { ascending: false });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/browse" className="text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Search
      </Link>

      <div className="bg-white p-8 rounded-xl border shadow-sm mb-10">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-4xl font-bold">
            {profile.full_name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{profile.full_name || 'Landlord'}</h1>
            <p className="text-gray-500 text-lg">{profile.city || 'Toronto, ON'}</p>
            <p className="text-gray-400 text-sm mt-1">Member since {new Date(profile.created_at).getFullYear()}</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Listings by {profile.full_name || 'this landlord'}
      </h2>

      {listings && listings.length > 0 ? (
        <MarketplaceFeed listings={listings} />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
          No active listings found.
        </div>
      )}
    </main>
  );
}

