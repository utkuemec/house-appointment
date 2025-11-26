'use client';

import { useState } from 'react';
import { Listing } from '../types';
import { createClient } from '@/utils/supabase/client';
import AvailabilityModal from './AvailabilityModal';
import AppointmentsModal from './AppointmentsModal';
import CreateListingModal from './CreateListingModal';
import { deleteListing } from '@/app/actions';

import Link from 'next/link';

export default function LandlordDashboard({ listings }: { listings: Listing[] }) {
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [appointmentsModalOpen, setAppointmentsModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  const openAvailabilityModal = (listing: Listing) => {
    setSelectedListing(listing);
    setAvailabilityModalOpen(true);
  };

  const openAppointmentsModal = (listing: Listing) => {
    setSelectedListing(listing);
    setAppointmentsModalOpen(true);
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
    
    setDeletingId(listingId);
    try {
      await deleteListing(listingId);
    } catch (error) {
      alert('Error deleting listing: ' + error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 bg-green-50 rounded-xl border border-green-100 mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Landlord Dashboard</h2>
          <p className="text-green-700">Manage your properties and viewing schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
            Landlord Mode Active
          </span>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition font-medium text-sm shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Property
          </button>
        </div>
      </div>
      
      {listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-green-200 border-dashed">
          <p className="text-green-800 font-medium mb-2">You don't have any listings yet.</p>
          <p className="text-green-600 text-sm mb-4">List your property to start receiving viewing requests.</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="text-green-700 hover:text-green-900 underline font-medium"
          >
            Create your first listing now
          </button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white p-5 rounded-lg shadow-sm border border-green-200 relative group">
              <div className="flex justify-between items-start mb-2">
                <Link href={`/listing/${listing.id}`} className="font-bold text-lg text-gray-900 line-clamp-1 hover:text-green-700 hover:underline" title={listing.address}>
                  {listing.address}
                </Link>
                <button 
                  onClick={() => handleDelete(listing.id)}
                  disabled={deletingId === listing.id}
                  className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                  title="Delete Listing"
                >
                  {deletingId === listing.id ? (
                    <span className="w-4 h-4 block border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  )}
                </button>
              </div>
              
              <p className="text-gray-600 font-medium mb-4">${listing.price.toLocaleString()}/mo</p>
              
              <div className="space-y-2">
                <button 
                  onClick={() => openAvailabilityModal(listing)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm font-medium active:scale-95 transform"
                >
                  Manage Availability
                </button>
                <button 
                  onClick={() => openAppointmentsModal(listing)}
                  className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition text-sm font-medium active:scale-95 transform"
                >
                  View Requests
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {availabilityModalOpen && selectedListing && (
        <AvailabilityModal 
          listing={selectedListing} 
          onClose={() => {
            setAvailabilityModalOpen(false);
            setSelectedListing(null);
          }} 
        />
      )}

      {appointmentsModalOpen && selectedListing && (
        <AppointmentsModal 
          listing={selectedListing} 
          onClose={() => {
            setAppointmentsModalOpen(false);
            setSelectedListing(null);
          }} 
        />
      )}

      {createModalOpen && (
        <CreateListingModal onClose={() => setCreateModalOpen(false)} />
      )}
    </div>
  );
}
