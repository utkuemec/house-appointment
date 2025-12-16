'use client';

import { useState } from 'react';
import HireRealtorModal from './HireRealtorModal';

export default function RealtorCard({ 
  realtor, 
  myListings, 
  isLandlord 
}: { 
  realtor: any; 
  myListings: any[]; 
  isLandlord: boolean;
}) {
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-2xl font-bold">
            {realtor.profiles?.full_name?.[0] || 'R'}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{realtor.profiles?.full_name}</h3>
            {/* RECO Verified Badge */}
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              RECO Verified
            </div>
            {realtor.reco_license_type && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{realtor.reco_license_type}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <p>💰 ${realtor.hourly_rate}/hr</p>
          <p>🗣️ {realtor.languages?.join(', ')}</p>
          {realtor.reco_brokerage_name && (
            <p>🏢 {realtor.reco_brokerage_name}</p>
          )}
          <p className="line-clamp-2 italic">"{realtor.bio}"</p>
        </div>

        {/* Verification Info */}
        {realtor.reco_verified_at && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
            Last verified: {new Date(realtor.reco_verified_at).toLocaleDateString()}
          </div>
        )}

        {isLandlord ? (
          <button 
            onClick={() => setIsHireModalOpen(true)}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Hire Realtor
          </button>
        ) : (
          <button 
            disabled 
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 py-2 rounded-lg font-medium cursor-not-allowed"
            title="You must list a property to hire a realtor."
          >
            List a property to hire
          </button>
        )}
      </div>

      {isHireModalOpen && (
        <HireRealtorModal 
          realtor={realtor} 
          myListings={myListings} 
          onClose={() => setIsHireModalOpen(false)} 
        />
      )}
    </>
  );
}


