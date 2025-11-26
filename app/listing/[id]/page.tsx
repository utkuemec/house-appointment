import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookingButton from '@/components/BookingButton';
import ImageGallery from '@/components/ImageGallery';

export const revalidate = 0;

export default async function ListingDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!listing) {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/browse" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Listings
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{listing.address}</h1>
        <p className="text-2xl font-semibold text-green-700 mt-2">${listing.price.toLocaleString()}/mo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image Gallery */}
        <ImageGallery images={listing.images_json || []} title={listing.address} />

        {/* Details & Action */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About this property</h2>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
              {listing.description || "No description provided."}
            </p>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-lg font-bold text-blue-900 mb-2">Interested?</h3>
            <p className="text-blue-700 mb-6">Book a viewing directly with the landlord to see this property in person.</p>
            <BookingButton listing={listing} />
          </div>
        </div>
      </div>
    </main>
  );
}

