'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SignOutButton from './SignOutButton';
import ThemeToggle from './ThemeToggle';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

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
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              ViewTO
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/browse" className={isActive('/browse')}>
                Browse Listings
              </Link>
              <Link href="/realtors" className={isActive('/realtors')}>
                Find Realtors
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

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:inline-block truncate max-w-[150px]">
                  {user.email}
                </span>
                <SignOutButton />
              </div>
            ) : (
              <Link href="/" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hidden md:block">
                Sign In below
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 z-50 pb-safe text-gray-600 dark:text-gray-400">
        <Link href="/browse" className={`flex flex-col items-center gap-1 ${mobileActive('/browse')}`}>
          <span className="text-lg">🔍</span>
          <span className="text-[10px]">Browse</span>
        </Link>
        
        {user && (
          <>
            <Link href="/my-listings" className={`flex flex-col items-center gap-1 ${mobileActive('/my-listings')}`}>
              <span className="text-lg">🏠</span>
              <span className="text-[10px]">Landlord</span>
            </Link>
            
            <Link href="/profile" className={`flex flex-col items-center gap-1 ${mobileActive('/profile')}`}>
              <span className="text-lg">👤</span>
              <span className="text-[10px]">Profile</span>
            </Link>
          </>
        )}

        {!user && (
          <Link href="/" className={`flex flex-col items-center gap-1 ${mobileActive('/')}`}>
            <span className="text-lg">🔑</span>
            <span className="text-[10px]">Sign In</span>
          </Link>
        )}
      </div>
    </>
  );
}

