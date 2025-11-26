'use client';

import { useState } from 'react';
import { Listing } from '@/types';
import BookingModal from '@/components/BookingModal';

export default function BookingButton({ listing }: { listing: Listing }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-md active:scale-95 transform"
      >
        Book a Viewing Now
      </button>

      {isModalOpen && (
        <BookingModal 
          listing={listing} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}

