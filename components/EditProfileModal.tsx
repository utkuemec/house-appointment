'use client';

import { useState } from 'react';
import { updateProfile, deleteAccount } from '@/app/actions/profile';
import { createClient } from '@/utils/supabase/client';
import VerifyPhoneModal from './VerifyPhoneModal';
import { useRouter } from 'next/navigation';

interface Profile {
  full_name: string | null;
  phone: string | null;
  city: string | null;
}

export default function EditProfileModal({ 
  profile, 
  onClose 
}: { 
  profile: Profile; 
  onClose: () => void; 
}) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [formDataState, setFormDataState] = useState<FormData | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const newPhone = formData.get('phone') as string;

    // If phone number changed, verify it first
    if (newPhone && newPhone !== profile.phone) {
      setPendingPhone(newPhone);
      setFormDataState(formData);
      
      const { error } = await supabase.auth.signInWithOtp({ phone: newPhone });
      
      if (error) {
        alert('Error sending code: ' + error.message);
        setLoading(false);
      } else {
        setShowVerify(true);
      }
      return;
    }
    
    // If no phone change, just update
    try {
      await updateProfile(formData);
      onClose();
    } catch (error) {
      alert('Error updating profile: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const onPhoneVerified = async () => {
    if (!formDataState) return;
    
    try {
      await updateProfile(formDataState);
      onClose();
    } catch (error) {
      alert('Error updating profile after verification: ' + error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('ARE YOU SURE? This will permanently delete your account, listings, and appointments. This cannot be undone.')) return;
    
    setDeleting(true);
    try {
      await deleteAccount();
      // Force sign out on client side to clean up
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      alert('Error deleting account: ' + error);
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                name="full_name"
                type="text"
                defaultValue={profile.full_name || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input 
                name="phone"
                type="tel"
                defaultValue={profile.phone || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Changing this will require verification.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input 
                name="city"
                type="text"
                defaultValue={profile.city || ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || deleting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting || loading}
              className="w-full text-red-600 text-sm font-medium hover:text-red-800 hover:underline disabled:opacity-50"
            >
              {deleting ? 'Deleting Account...' : 'Delete My Account'}
            </button>
          </div>
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
