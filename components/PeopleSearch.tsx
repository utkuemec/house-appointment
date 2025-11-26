'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function PeopleSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Debounce search
  useEffect(() => {
    const searchPeople = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      // Search profiles by name, email or city
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(20);

      setResults(data || []);
      setLoading(false);
    };

    const timer = setTimeout(searchPeople, 300);
    return () => clearTimeout(timer);
  }, [query, supabase]);

  return (
    <div className="py-8">
      <div className="mb-12 relative max-w-xl">
        <input
          type="text"
          placeholder="Search landlords by name, email, or city..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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

      {loading ? (
        <div className="text-center py-8 text-gray-500">Searching...</div>
      ) : results.length === 0 && query.length >= 2 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500">No landlords found matching "{query}"</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {results.map((person) => (
            <Link 
              href={`/landlord/${person.id}`} 
              key={person.id}
              className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 group"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {person.full_name?.[0]?.toUpperCase() || person.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{person.full_name || 'User'}</h3>
                <p className="text-sm text-gray-500 truncate max-w-[180px]">{person.city || 'Toronto, ON'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

