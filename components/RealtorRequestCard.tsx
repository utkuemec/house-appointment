'use client';

import { useState } from 'react';
import { updateRealtorRequest } from '@/app/actions/realtorRequest';

export default function RealtorRequestCard({ job }: { job: any }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (status: 'accepted' | 'declined') => {
    setLoading(true);
    try {
      await updateRealtorRequest(job.id, status);
      alert(status === 'accepted' ? 'Job Accepted!' : 'Job Declined.');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-purple-50 p-5 rounded-lg border border-purple-200 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <span className="bg-purple-200 text-purple-800 text-xs font-bold px-2 py-1 rounded uppercase">
            New Job Request
          </span>
          <h3 className="font-bold text-lg mt-2">{job.address}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Owner: {job.contact_email}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('accepted')}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            Accept
          </button>
          <button
            onClick={() => handleAction('declined')}
            disabled={loading}
            className="bg-white border border-purple-200 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}


