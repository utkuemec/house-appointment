'use client';

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import VerifyPhoneModal from './VerifyPhoneModal';

export default function LoginButton() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false); // New State
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (mode === 'signup') {
      // 1. Sign up the user first (email/password)
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            city,
            full_name: email.split('@')[0], 
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
      } else if (authData.user) {
        // 2. Manually Create Profile (Since we removed the trigger for stability)
        // IMPORTANT: We insert null phone first, then update it after verification
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: email,
            full_name: email.split('@')[0],
            phone: null, // Will be updated after OTP verification
            city: city || null
          });

        if (profileError) {
          console.error("Manual Profile Creation Failed:", profileError);
        }

        // Check if email confirmation is required
        if (authData.user.identities && authData.user.identities.length === 0) {
           setMessage('This email is already registered. Try logging in.');
           setLoading(false);
           return;
        }

        if (!authData.session) {
          setConfirmationSent(true);
          setLoading(false);
          return;
        }

        // If we got a session immediately (Confirm Email is OFF), continue flow...
        try {
          // If manual signup, we already have phone/city in state.
          // We can skip OTP here if we trust the signup, but typically we want verification.
          // However, user complained about seeing "Complete Profile" popup after manual signup.
          // This means the profile row wasn't created yet.
          
          // CRITICAL FIX: Insert Profile Row NOW with Pending Phone
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: email,
              full_name: email.split('@')[0],
              phone: null, // Pending verification
              city: city || null
            });

          if (profileError) console.error("Profile insert error:", profileError);

          const { error: otpError } = await supabase.auth.signInWithOtp({
            phone,
          });

          if (otpError) {
            console.error("OTP Failed:", otpError);
            setMessage('Account created! Phone verification skipped. Check your email.');
            setLoading(false);
          } else {
            setShowVerify(true); 
          }
        } catch (e) {
           setMessage('Account created! Check your email.');
           setLoading(false);
        }
      }
    } else if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
      } else {
        router.push('/browse'); // Redirect to browse after successful login
        router.refresh();
      }
    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile/reset-password`,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Password reset link sent to your email.');
        setMode('signin'); 
      }
      setLoading(false);
    }
  };

  const onPhoneVerified = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { phone }
    });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Upsert profile with Verified Phone
      await supabase
        .from('profiles')
        .upsert({ 
            id: user.id,
            email: user.email,
            phone: phone,
            city: city, // Ensure city is persisted
            full_name: user.email?.split('@')[0]
        });
    }

    if (error) {
      alert('Error saving phone: ' + error.message);
    } else {
      setShowVerify(false);
      setMessage('Success! Welcome to ViewTO.');
      setLoading(false);
      router.push('/browse'); 
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  if (confirmationSent) {
    return (
      <div className="w-full max-w-sm mx-auto bg-green-50 p-8 rounded-xl shadow-lg border border-green-100 text-center relative z-20">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
          ✉️
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">Check your inbox</h3>
        <p className="text-green-700 mb-6">
          We've sent a confirmation link to <strong>{email}</strong>.
        </p>
        <p className="text-sm text-green-600 mb-6">
          Please click the link to verify your email address and activate your account.
        </p>
        <button 
          onClick={() => setConfirmationSent(false)}
          className="text-green-800 hover:underline text-sm font-medium"
        >
          Back to Log In
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-sm mx-auto bg-white p-6 rounded-xl shadow-lg border border-gray-100 relative z-20">
        <div className="flex justify-center gap-4 mb-6">
          {mode !== 'forgot' && (
            <>
              <button
                onClick={() => setMode('signin')}
                className={`pb-2 font-medium ${mode === 'signin' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`pb-2 font-medium ${mode === 'signup' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                Sign Up
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <h3 className="pb-2 font-bold text-gray-900 border-b-2 border-transparent">Reset Password</h3>
          )}
        </div>

        {message && (
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm text-center mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {mode === 'signin' && (
                <div className="flex justify-end mt-1">
                  <button 
                    type="button"
                    onClick={() => { setMode('forgot'); setMessage(null); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Extra Fields for Sign Up */}
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PHONE NUMBER</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+1 647 000 0000"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CITY</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="Toronto"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : mode === 'forgot' ? 'Send Reset Link' : 'Create Account'}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('signin'); setMessage(null); }}
              className="text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Back to Sign In
            </button>
          )}
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
          </>
        )}
      </div>

      {showVerify && (
        <VerifyPhoneModal 
          phone={phone}
          onClose={() => setShowVerify(false)}
          onVerified={onPhoneVerified}
        />
      )}
    </>
  );
}
