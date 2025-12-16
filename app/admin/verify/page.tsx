'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface RealtorPending {
  id: string;
  reco_registration_number: string;
  reco_full_name: string;
  reco_license_status: string;
  created_at: string;
}

export default function AdminVerifyPage() {
  const [pending, setPending] = useState<RealtorPending[]>([]);
  const [verified, setVerified] = useState<RealtorPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRealtors = useCallback(async () => {
    const supabase = createClient();
    
    const { data: pendingData } = await supabase
      .from('realtor_profiles')
      .select('id, reco_registration_number, reco_full_name, reco_license_status, created_at')
      .eq('reco_license_status', 'PENDING_VERIFICATION')
      .order('created_at', { ascending: false });

    const { data: verifiedData } = await supabase
      .from('realtor_profiles')
      .select('id, reco_registration_number, reco_full_name, reco_license_status, created_at')
      .eq('reco_license_status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(20);

    setPending(pendingData || []);
    setVerified(verifiedData || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRealtors();
  }, [fetchRealtors]);

  const handleAutoVerify = async (realtorId: string, recoNumber: string) => {
    setVerifyingId(realtorId);
    setMessage(null);

    try {
      const response = await fetch(`/api/verify-realtor?id=${realtorId}`);
      const result = await response.json();

      if (result.success) {
        setMessage({
          type: result.verification.verified ? 'success' : 'error',
          text: `${recoNumber}: ${result.verification.message}`,
        });
        fetchRealtors();
      } else {
        setMessage({ type: 'error', text: result.error || 'Verification failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error during verification' });
    }

    setVerifyingId(null);
  };

  const handleManualVerify = async (realtorId: string, action: 'approve' | 'reject') => {
    setVerifyingId(realtorId);
    setMessage(null);

    const supabase = createClient();
    
    const { error } = await supabase
      .from('realtor_profiles')
      .update({
        reco_license_status: action === 'approve' ? 'ACTIVE' : 'NOT_FOUND',
        reco_verified_at: action === 'approve' ? new Date().toISOString() : null,
        reco_last_checked: new Date().toISOString(),
        is_verified: action === 'approve',
      })
      .eq('id', realtorId);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    } else {
      setMessage({ 
        type: 'success', 
        text: action === 'approve' ? '✅ Realtor approved!' : '❌ Realtor rejected' 
      });
      fetchRealtors();
    }

    setVerifyingId(null);
  };

  const handleBatchVerify = async () => {
    setBatchLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/verify-realtor', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `Batch complete: ${result.verified} verified, ${result.failed} failed`,
        });
        fetchRealtors();
      } else {
        setMessage({ type: 'error', text: result.error || 'Batch verification failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    }

    setBatchLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🔐 RECO Verification Admin</h1>
          <p className="text-gray-400">Auto + Manual verification for realtors</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4">
            <div className="text-3xl font-bold text-yellow-400">{pending.length}</div>
            <div className="text-yellow-200">⏳ Pending</div>
          </div>
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
            <div className="text-3xl font-bold text-green-400">{verified.length}</div>
            <div className="text-green-200">✅ Verified</div>
          </div>
          <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
            <button
              onClick={handleBatchVerify}
              disabled={batchLoading || pending.length === 0}
              className="w-full h-full flex items-center justify-center gap-2 text-purple-200 hover:text-white transition-colors disabled:opacity-50"
            >
              {batchLoading ? '⏳ Processing...' : '🤖 Batch Auto-Verify'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/50 text-green-200' 
              : 'bg-red-500/20 border border-red-500/50 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">⏳ Pending Verifications</h2>
          
          {pending.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 text-center text-gray-400">
              No pending verifications 🎉
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((realtor) => (
                <div 
                  key={realtor.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-purple-400 font-bold">
                        #{realtor.reco_registration_number}
                      </span>
                      <span className="text-white font-medium">
                        {realtor.reco_full_name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Registered: {new Date(realtor.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a
                      href="https://www.reco.on.ca"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 text-sm"
                    >
                      🔍 RECO
                    </a>
                    
                    <button
                      onClick={() => handleAutoVerify(realtor.id, realtor.reco_registration_number)}
                      disabled={verifyingId === realtor.id}
                      className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 text-sm disabled:opacity-50"
                    >
                      {verifyingId === realtor.id ? '⏳' : '🤖'} Auto
                    </button>
                    
                    <button
                      onClick={() => handleManualVerify(realtor.id, 'approve')}
                      disabled={verifyingId === realtor.id}
                      className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 text-sm disabled:opacity-50"
                    >
                      ✅ Approve
                    </button>
                    
                    <button
                      onClick={() => handleManualVerify(realtor.id, 'reject')}
                      disabled={verifyingId === realtor.id}
                      className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm disabled:opacity-50"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4">✅ Recently Verified</h2>
          
          {verified.length === 0 ? (
            <div className="bg-white/5 rounded-xl p-8 text-center text-gray-400">
              No verified realtors yet
            </div>
          ) : (
            <div className="space-y-2">
              {verified.map((realtor) => (
                <div 
                  key={realtor.id}
                  className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    <span className="font-mono text-green-400">#{realtor.reco_registration_number}</span>
                    <span className="text-white">{realtor.reco_full_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
