'use client';

import { useState } from 'react';
import { Listing } from '@/types';
import MarketplaceFeed from './MarketplaceFeed';
import PeopleSearch from './PeopleSearch';

export default function BrowseWrapper({ initialListings }: { initialListings: Listing[] }) {
  const [view, setView] = useState<'properties' | 'people'>('properties');

  return (
    <div>
      <div className="flex gap-6 border-b mb-6">
        <button
          onClick={() => setView('properties')}
          className={`pb-3 font-medium text-lg transition-colors ${
            view === 'properties' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Find Properties
        </button>
        <button
          onClick={() => setView('people')}
          className={`pb-3 font-medium text-lg transition-colors ${
            view === 'people' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Find Landlords
        </button>
      </div>

      {view === 'properties' ? (
        <MarketplaceFeed listings={initialListings} />
      ) : (
        <PeopleSearch />
      )}
    </div>
  );
}

