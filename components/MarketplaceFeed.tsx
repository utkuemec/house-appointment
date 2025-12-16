'use client';

import { useState } from 'react';
import { Listing } from '../types';
import BookingModal from './BookingModal';
import Link from 'next/link';
import FilterBar from './FilterBar';

export default function MarketplaceFeed({ listings }: { listings: Listing[] }) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    beds: '',
    baths: '',
  });

  const filteredListings = listings.filter(listing => {
    // Text Search
    const matchesSearch = listing.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.description && listing.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Advanced Filters
    const price = listing.price || 0;
    const beds = listing.bedrooms || 0;
    const baths = listing.bathrooms || 0;

    const matchesMinPrice = filters.minPrice ? price >= parseInt(filters.minPrice) : true;
    const matchesMaxPrice = filters.maxPrice ? price <= parseInt(filters.maxPrice) : true;
    const matchesBeds = filters.beds ? beds >= parseInt(filters.beds) : true;
    const matchesBaths = filters.baths ? baths >= parseInt(filters.baths) : true;

    return matchesSearch && matchesMinPrice && matchesMaxPrice && matchesBeds && matchesBaths;
  });

  const ListingCard = ({ listing }: { listing: Listing }) => (
    <Link href={`/listing/${listing.id}`} key={listing.id} className="flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
      <div className="h-56 bg-gray-200 relative overflow-hidden">
        {listing.images_json && listing.images_json[0] ? (
          <img 
            src={listing.images_json[0]} 
            alt={listing.address} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold shadow-sm">
          ${listing.price.toLocaleString()}
          {listing.listing_type === 'sale' ? '' : '/mo'}
        </div>
        <div className="absolute top-4 left-4">
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase text-white ${listing.listing_type === 'sale' ? 'bg-purple-600' : 'bg-blue-600'}`}>
            {listing.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
          </span>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-xl mb-2 text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors" title={listing.address}>
          {listing.address}
        </h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{listing.description}</p>
        
        <div className="mt-auto pt-4 border-t">
          <span className="w-full block text-center bg-slate-900 text-white py-3 rounded-lg font-medium group-hover:bg-slate-800 transition-colors">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="py-4">
      {/* Search Bar & Filters */}
      <div className="mb-12 space-y-6">
        <div className="relative max-w-xl">
          <input
            type="text"
            placeholder="Search by address, neighborhood, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-3 pl-12 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <svg 
            className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <FilterBar onFilterChange={setFilters} />
      </div>

      {/* Results Grid */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No listings found matching "{searchQuery}"</p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-2 text-blue-600 hover:underline font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
