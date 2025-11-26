'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Listing } from '@/types';
import { updateAppointmentStatus } from '@/app/actions';

export default function AppointmentsModal({
  listing,
  onClose
}: {
  listing: Listing;
  onClose: () => void;
}) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null); // Track which button is loading
  const supabase = createClient();

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*, profiles(email, full_name)')
      .eq('listing_id', listing.id)
      .order('start_time', { ascending: true });

    if (error) console.error(error);
    else setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [listing.id]);

  const handleStatusUpdate = async (apptId: string, newStatus: 'confirmed' | 'cancelled') => {
    setProcessingId(apptId);
    try {
      await updateAppointmentStatus(apptId, newStatus);
      await fetchAppointments(); // Refresh list
    } catch (error) {
      alert('Error updating status: ' + error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Appointment Requests</h3>
            <p className="text-sm text-gray-500 mt-1">{listing.address}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-gray-500">No appointment requests yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <div 
                key={appt.id} 
                className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {new Date(appt.start_time).toLocaleDateString()}
                    </span>
                    <span className="text-gray-600">
                      {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Tenant: <span className="font-medium">{appt.profiles?.email || 'Unknown'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {appt.status === 'pending' && (
                    <>
                      <button
                        disabled={processingId === appt.id}
                        onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {processingId === appt.id ? '...' : 'Accept'}
                      </button>
                      <button
                        disabled={processingId === appt.id}
                        onClick={() => handleStatusUpdate(appt.id, 'cancelled')}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-md hover:bg-red-100 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {appt.status === 'confirmed' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Confirmed
                    </span>
                  )}
                  {appt.status === 'cancelled' && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm font-medium rounded-full">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
