'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function VerifyPhoneModal({ 
  phone, 
  onVerified, 
  onClose 
}: { 
  phone: string; 
  onVerified: () => void; 
  onClose: () => void; 
}) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Verify OTP for phone change/signup
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Phone Verified!');
      setTimeout(() => {
        onVerified();
      }, 1000);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Verify Phone Number</h3>
        <p className="text-sm text-gray-500 mb-4">
          Enter the 6-digit code sent to <strong>{phone}</strong>
        </p>

        {message && (
          <p className={`text-sm mb-4 ${message.includes('Verified') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input 
            type="text" 
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            placeholder="123456"
            className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
        
        <button 
          className="text-xs text-blue-600 hover:underline mt-4"
          onClick={async () => {
            // Resend logic
            await supabase.auth.signInWithOtp({ phone });
            alert('Code resent!');
          }}
        >
          Resend Code
        </button>
      </div>
    </div>
  );
}

