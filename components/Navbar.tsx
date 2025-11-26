'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SignOutButton from './SignOutButton';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Home, Search, User, Building } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => pathname === path ? 'text-blue-600 font-bold' : 'text-gray-600 hover:text-blue-600';
  const mobileActive = (path: string) => pathname === path ? 'text-blue-600' : 'text-gray-500';

  return (
    <>
      {/* DESKTOP NAV */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              ViewTO
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/browse" className={isActive('/browse')}>
                Browse Listings
              </Link>
              {user && (
                <>
                  <Link href="/my-listings" className={isActive('/my-listings')}>
                    Landlord Dashboard
                  </Link>
                  <Link href="/profile" className={isActive('/profile')}>
                    My Profile
                  </Link>
                </>
              )}
            </div>
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden md:inline-block truncate max-w-[150px]">
                  {user.email}
                </span>
                <SignOutButton />
              </div>
            ) : (
              <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 pb-safe">
        <Link href="/browse" className={`flex flex-col items-center gap-1 ${mobileActive('/browse')}`}>
          <Search size={24} />
          <span className="text-[10px]">Browse</span>
        </Link>
        
        {user && (
          <>
            <Link href="/my-listings" className={`flex flex-col items-center gap-1 ${mobileActive('/my-listings')}`}>
              <Building size={24} />
              <span className="text-[10px]">Landlord</span>
            </Link>
            
            <Link href="/profile" className={`flex flex-col items-center gap-1 ${mobileActive('/profile')}`}>
              <User size={24} />
              <span className="text-[10px]">Profile</span>
            </Link>
          </>
        )}

        {!user && (
          <Link href="/" className={`flex flex-col items-center gap-1 ${mobileActive('/')}`}>
            <User size={24} />
            <span className="text-[10px]">Sign In</span>
          </Link>
        )}
      </div>
    </>
  );
}

