'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { registerRealtor } from '@/app/actions/realtor';
import { useRouter } from 'next/navigation';

export default function RealtorOnboardingForm() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setVerificationStatus('Verifying your RECO license...');

    try {
      const formData = new FormData(e.currentTarget);
      
      // 1. Upload License Document
      if (!file) throw new Error('License document is required');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-license.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('licenses')
        .upload(fileName, file);

      if (uploadError) throw new Error('Upload failed: ' + uploadError.message);

      // Since bucket is private, we store the path, not a public URL
      formData.set('license_path', data.path);

      // 2. Server Action - AUTOMATIC RECO verification
      setVerificationStatus('🔍 Verifying with RECO... (this may take up to 30 seconds)');
      const result = await registerRealtor(formData);
      
      if (result.verified) {
        setVerificationStatus('✅ VERIFIED!');
        alert(`🎉 Congratulations! Your RECO license has been verified.\n\n` +
              `License Type: ${result.licenseType || 'Salesperson'}\n` +
              `Brokerage: ${result.brokerageName}\n\n` +
              `You are now a verified realtor!`);
      } else {
        setVerificationStatus('❌ Verification Failed');
        alert(result.message || 'Verification failed. Please check your RECO registration number.');
      }
      
      router.push('/profile');
    } catch (error: any) {
      setVerificationStatus('❌ Failed');
      alert(`Verification Error:\n\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Become a Verified Realtor</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-2">Join our network of verified Ontario real estate professionals.</p>
      
      {/* RECO Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 dark:text-blue-400 text-xl">ℹ️</span>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold">RECO Verification Required</p>
            <p>We verify all licenses through the <a href="https://www.reco.on.ca" target="_blank" rel="noopener noreferrer" className="underline">Real Estate Council of Ontario (RECO)</a> — use the "Agent/Brokerage Search" in their navigation.</p>
          </div>
        </div>
      </div>

      {/* Legal Requirement Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-amber-600 dark:text-amber-400 text-xl">⚠️</span>
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold">Ontario Legal Requirements</p>
            <p className="mt-1">To register, you must have:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>ACTIVE</strong> RECO license status</li>
              <li>Registration under a <strong>RECO-registered brokerage</strong></li>
            </ul>
            <p className="mt-2 text-xs">Note: Ontario law does not allow independent operation. All realtors must be supervised by a Broker of Record.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* RECO Fields - Required */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">RECO Information (Required)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                RECO Registration Number *
              </label>
              <input 
                name="reco_registration_number" 
                type="text" 
                required 
                placeholder="e.g., 123456"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Find this on your RECO certificate or the public register
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Legal Name (as registered with RECO) *
              </label>
              <input 
                name="reco_full_name" 
                type="text" 
                required 
                placeholder="John Smith"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
              />
            </div>
          </div>
        </div>

        {/* Other License Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">License Number (Internal)</label>
            <input name="license_number" type="text" required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brokerage Since</label>
            <input name="broker_since" type="date" required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate ($)</label>
            <input name="hourly_rate" type="number" min="0" placeholder="50" required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Languages (comma separated)</label>
            <input name="languages" type="text" placeholder="English, French, Mandarin" required className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
          <textarea name="bio" rows={4} required placeholder="Tell us about your experience..." className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Official License Document (PDF/JPG)</label>
          <input 
            type="file" 
            accept=".pdf,.jpg,.jpeg,.png" 
            required 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" 
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This document will be kept private and used only for backup verification.</p>
        </div>

        {/* Verification Status */}
        {verificationStatus && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">{verificationStatus}</p>
          </div>
        )}

        {/* Terms Notice */}
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="font-medium mb-1">Legal Disclaimer</p>
          By registering, you confirm that:
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Your RECO license is valid and ACTIVE</li>
            <li>You are registered under a RECO-registered brokerage</li>
            <li>You are supervised by a Broker of Record</li>
          </ul>
          <p className="mt-2">We independently verify license and brokerage status through the Real Estate Council of Ontario public registry. Your status will be re-verified every 30 days.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Verifying & Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}


