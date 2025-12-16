'use client';

import { useState } from 'react';
import { updateAppointmentStatus } from '@/app/actions';

interface IncomingRequestProps {
  request: any;
}

export default function IncomingRequestCard({ request }: IncomingRequestProps) {
  const [status, setStatus] = useState(request.status);
  const [loading, setLoading] = useState(false);

  const handleAction = async (newStatus: 'confirmed' | 'cancelled') => {
    if (!confirm(`Are you sure you want to ${newStatus === 'confirmed' ? 'accept' : 'decline'} this request?`)) return;
    
    setLoading(true);
    try {
      await updateAppointmentStatus(request.id, newStatus);
      setStatus(newStatus);
      // Reload page to move card to correct section
      window.location.reload();
    } catch (error) {
      alert('Error: ' + error);
      setLoading(false);
    }
  };

  // Don't render if cancelled (unless we want a history tab later)
  if (status === 'cancelled') return null;

  return (
    <div className={`bg-white p-5 rounded-lg border shadow-sm transition-all ${status === 'pending' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-green-500'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-semibold text-lg">{request.listings?.address}</h3>
          <p className="text-gray-600 text-sm mt-1">
            {status === 'pending' ? 'Request from:' : 'Tenant:'} <span className="font-medium">{request.profiles?.full_name || request.profiles?.email}</span>
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {request.profiles?.phone && `Phone: ${request.profiles.phone}`}
          </p>
        </div>
        
        <div className="text-right flex flex-col items-end gap-2">
          <div>
            <p className="font-bold text-gray-900">
              {new Date(request.start_time).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(request.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {status === 'pending' ? (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => handleAction('confirmed')}
                disabled={loading}
                className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => handleAction('cancelled')}
                disabled={loading}
                className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded hover:bg-red-100 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase">
                Confirmed
              </span>
              <button
                onClick={() => handleAction('cancelled')}
                disabled={loading}
                className="text-xs text-red-500 hover:underline mt-1"
              >
                Cancel Appointment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
