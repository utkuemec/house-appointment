'use client';

import { useState } from 'react';
import { Listing } from '@/types';
import MarketplaceFeed from './MarketplaceFeed';
import PeopleSearch from './PeopleSearch';

export default function BrowseWrapper({ initialListings }: { initialListings: Listing[] }) {
  const [view, setView] = useState<'rent' | 'sale' | 'people'>('rent');

  // Filter listings for each tab
  const rentListings = initialListings.filter(l => l.listing_type === 'rent' || !l.listing_type);
  const saleListings = initialListings.filter(l => l.listing_type === 'sale');

  return (
    <div>
      <div className="flex gap-8 border-b mb-8 overflow-x-auto">
        <button
          onClick={() => setView('rent')}
          className={`pb-3 font-bold text-lg transition-all whitespace-nowrap ${
            view === 'rent' 
              ? 'text-blue-600 border-b-4 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          For Rent
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full align-middle font-normal">
            {rentListings.length}
          </span>
        </button>
        
        <button
          onClick={() => setView('sale')}
          className={`pb-3 font-bold text-lg transition-all whitespace-nowrap ${
            view === 'sale' 
              ? 'text-purple-600 border-b-4 border-purple-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          For Sale
          <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full align-middle font-normal">
            {saleListings.length}
          </span>
        </button>

        <button
          onClick={() => setView('people')}
          className={`pb-3 font-bold text-lg transition-all whitespace-nowrap ${
            view === 'people' 
              ? 'text-green-600 border-b-4 border-green-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Find Landlords
        </button>
      </div>

      {view === 'rent' && <MarketplaceFeed listings={rentListings} />}
      {view === 'sale' && <MarketplaceFeed listings={saleListings} />}
      {view === 'people' && <PeopleSearch />}
    </div>
  );
}
