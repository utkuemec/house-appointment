'use client';

import { useState } from 'react';

interface FilterBarProps {
  onFilterChange: (filters: any) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    beds: '',
    baths: '',
  });

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm mb-8 flex flex-wrap gap-4 items-center">
      {/* Price Range */}
      <div className="flex items-center gap-2 border-r pr-4">
        <span className="text-sm font-bold text-gray-700">Price</span>
        <input 
          type="number" 
          placeholder="Min" 
          className="w-24 px-2 py-1 border rounded text-sm outline-none focus:border-blue-500"
          onChange={(e) => handleChange('minPrice', e.target.value)}
        />
        <span className="text-gray-400">-</span>
        <input 
          type="number" 
          placeholder="Max" 
          className="w-24 px-2 py-1 border rounded text-sm outline-none focus:border-blue-500"
          onChange={(e) => handleChange('maxPrice', e.target.value)}
        />
      </div>

      {/* Beds */}
      <div className="flex items-center gap-2 border-r pr-4">
        <span className="text-sm font-bold text-gray-700">Beds</span>
        <select 
          className="px-2 py-1 border rounded text-sm outline-none focus:border-blue-500 bg-white"
          onChange={(e) => handleChange('beds', e.target.value)}
        >
          <option value="">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </select>
      </div>

      {/* Baths */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-700">Baths</span>
        <select 
          className="px-2 py-1 border rounded text-sm outline-none focus:border-blue-500 bg-white"
          onChange={(e) => handleChange('baths', e.target.value)}
        >
          <option value="">Any</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
        </select>
      </div>

      {/* Reset Button (only shows if filters active) */}
      {(filters.minPrice || filters.maxPrice || filters.beds || filters.baths) && (
        <button 
          onClick={() => {
            setFilters({ minPrice: '', maxPrice: '', beds: '', baths: '' });
            onFilterChange({ minPrice: '', maxPrice: '', beds: '', baths: '' });
          }}
          className="ml-auto text-sm text-red-500 hover:underline"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

