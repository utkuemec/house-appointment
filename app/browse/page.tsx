import { getAllListings } from '@/lib/landlord';
import BrowseWrapper from '@/components/BrowseWrapper';

export const revalidate = 0;

export default async function BrowsePage() {
  const listings = await getAllListings();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse</h1>
        <p className="text-gray-600 mt-2">Find your next home or connect with landlords in Toronto.</p>
      </div>
      <BrowseWrapper initialListings={listings} />
    </main>
  );
}
