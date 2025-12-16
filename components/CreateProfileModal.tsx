'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import VerifyPhoneModal from './VerifyPhoneModal';
import { checkPhoneUnique } from '@/app/actions/checkPhone';

export default function CreateProfileModal({ 
  email, 
  onClose 
}: { 
  email: string; 
  onClose: () => void; 
}) {
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [formDataState, setFormDataState] = useState<FormData | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const phone = formData.get('phone') as string;

    // 1. Check Uniqueness
    const { unique } = await checkPhoneUnique(phone);
    if (!unique) {
      alert('This phone number is already registered to another account.');
      setLoading(false);
      return;
    }

    // 2. Trigger Verification
    setPendingPhone(phone);
    setFormDataState(formData);
    
    const { error } = await supabase.auth.signInWithOtp({ phone });
    
    if (error) {
      alert('Error sending code: ' + error.message);
      setLoading(false);
    } else {
      setShowVerify(true);
    }
  };

  const onPhoneVerified = async () => {
    if (!formDataState) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: formDataState.get('full_name'),
        phone: formDataState.get('phone'),
        city: formDataState.get('city')
      });

    if (error) {
      alert('Error saving profile: ' + error.message);
    } else {
      router.refresh();
      onClose();
    }
    setShowVerify(false);
    setLoading(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Complete Your Profile</h3>
              <p className="text-sm text-gray-500 mt-1">We need a few details before you can continue.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                name="full_name"
                type="text"
                required
                defaultValue={email.split('@')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input 
                name="phone"
                type="tel"
                required
                placeholder="+1 647 000 0000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input 
                name="city"
                type="text"
                required
                placeholder="Toronto"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Save Profile'}
            </button>
          </form>
        </div>
      </div>

      {showVerify && (
        <VerifyPhoneModal 
          phone={pendingPhone}
          onClose={() => {
            setShowVerify(false);
            setLoading(false);
          }}
          onVerified={onPhoneVerified}
        />
      )}
    </>
  );
}
