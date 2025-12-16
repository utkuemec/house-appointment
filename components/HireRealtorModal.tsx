'use client';

import { useState } from 'react';
import { hireRealtor } from '@/app/actions/hireRealtor';

export default function HireRealtorModal({ 
  realtor, 
  myListings,
  onClose 
}: { 
  realtor: any; 
  myListings: any[];
  onClose: () => void;
}) {
  const [selectedListing, setSelectedListing] = useState('');
  const [loading, setLoading] = useState(false);

  const handleHire = async () => {
    if (!selectedListing) {
      alert('Please select a property to assign this realtor to.');
      return;
    }

    setLoading(true);
    try {
      await hireRealtor(selectedListing, realtor.id);
      alert(`Successfully hired ${realtor.profiles.full_name}!`);
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Hire {realtor.profiles.full_name}</h3>
        <p className="text-gray-600 mb-6 text-sm">
          Select one of your properties to assign this realtor. They will be able to manage viewings for it.
        </p>

        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium text-gray-700">Select Property</label>
          <select
            className="w-full border rounded-lg px-3 py-2 bg-white"
            value={selectedListing}
            onChange={(e) => setSelectedListing(e.target.value)}
          >
            <option value="">-- Choose a listing --</option>
            {myListings.map((l) => (
              <option key={l.id} value={l.id}>{l.address}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleHire}
            disabled={loading || !selectedListing}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Confirm Hire'}
          </button>
        </div>
      </div>
    </div>
  );
}


