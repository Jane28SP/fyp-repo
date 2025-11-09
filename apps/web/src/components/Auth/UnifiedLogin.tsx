import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface UnifiedLoginProps {
  onLoginSuccess: () => void;
}

const UnifiedLogin: React.FC<UnifiedLoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'attendee' | 'organizer'>('attendee');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (isSignUp) {
        // Register new user, enable email verification
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/verify-email`,
          }
        });

        // Check for duplicate user error
        if (signUpError) {
          // Check if error is due to user already existing
          const errorMessage = signUpError.message?.toLowerCase() || '';
          if (errorMessage.includes('already registered') || 
              errorMessage.includes('user already registered') ||
              errorMessage.includes('email address has already been registered') ||
              errorMessage.includes('user already exists') ||
              errorMessage.includes('duplicate key value')) {
            setError('⚠️ This email is already registered. Please sign in instead.');
            setIsSignUp(false); // Switch to sign in mode
            return;
          }
          throw signUpError;
        }

        // Check if user was actually created (not just returned existing user)
        // Supabase may return existing user without error in some cases
        if (user) {
          // If user already has confirmed email, they're trying to register again
          if (user.email_confirmed_at) {
            setError('⚠️ This email is already registered and verified. Please sign in instead.');
            setIsSignUp(false); // Switch to sign in mode
            return;
          }
          
          // Check if user was just created (new user won't have confirmed_at yet)
          // But if we get here and no error, it's likely a new user
          // However, Supabase might return existing unconfirmed user
          // In that case, we should still show success but mention they need to verify
        }

        // Note: user_profiles record is automatically created by database trigger
        // No need to manually insert here to avoid RLS policy violations

        // Even if there's an error, if user was created, continue to create organizer record
        if (user && userType === 'organizer') {
          // Create organizer record
          const { error: orgError } = await supabase
            .from('organizers')
            .insert([
              {
                user_id: user.id,
                organization_name: organizationName,
                verified: false,
              }
            ]);

          if (orgError) {
            console.error('Failed to create organizer record:', orgError);
            // Don't prevent user from seeing success message
          }
        }

        // Show success message, prompt user to check email
        setSuccessMessage(userType === 'organizer' ? 
          '🎉 Registration successful! Please check your email to verify your account. Your organizer account will be pending approval after verification.' : 
          '✅ Registration successful! Please check your email to verify your account and start exploring events!'
        );
      } else {
        // Login
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Check if email is verified
        if (user && !user.email_confirmed_at) {
          // If email is not verified, send new verification email
          await supabase.auth.resend({
            type: 'signup',
            email: email,
          });
          
          setError('⚠️ Please verify your email address. A new verification email has been sent to your inbox.');
          return;
        }

        // Login successful, show success message
        setSuccessMessage('🎉 Login successful! Redirecting to dashboard...');

        if (user && userType === 'organizer') {
          // Check if user is an organizer
          const { data: organizer, error: roleError } = await supabase
            .from('organizers')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (roleError || !organizer) {
            setSuccessMessage('');
            throw new Error('You do not have organizer permissions, please contact administrator');
          }

          if (!organizer.verified) {
            setSuccessMessage('');
            throw new Error('Your organizer account has not been approved yet');
          }

          // After organizer login success, redirect to organizer dashboard
          setTimeout(() => {
            window.location.href = '/organizer/dashboard';
          }, 1500);
          return;
        }

        // Regular user login success, refresh page to load user state
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (error: any) {
      console.error('Authentication failed:', error);
      // More detailed error handling
      if (error.message?.includes('Invalid API key') || error.message?.includes('API')) {
        setError('⚠️ Supabase configuration error. Please check your configuration.');
      } else if (error.message?.includes('Invalid login credentials') || error.message?.includes('Email not confirmed')) {
        setError(error.message || 'Invalid email or password. Please check your credentials.');
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setError('⚠️ Network error. Please check your internet connection and try again.');
      } else {
        setError(error.message || 'Operation failed, please try again');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="JomEvent Logo" className="h-16 w-16 object-contain" />
            <h1 className="text-4xl font-black" style={{ color: '#E4281F' }}>
              JomEvent!
            </h1>
          </div>
          <h2 className="mt-3 text-center text-2xl font-bold text-gray-900">
            {isSignUp ? '✨ Create Your Account' : '👋 Welcome Back'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-medium">
            🎉 Discover Amazing Events Across Malaysia
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-4 shadow-2xl border-2 border-amber-100 sm:rounded-2xl sm:px-10">
          {/* User type selection - Hidden */}
          {/* <div className="mb-6">
            <label className="block text-sm font-bold text-gray-900 mb-4">
              🎯 Select Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType('attendee')}
                className={`relative rounded-xl border-2 p-4 flex focus:outline-none transition-all duration-200 ${
                  userType === 'attendee'
                    ? 'border-amber-500 ring-2 ring-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-amber-200 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center w-full text-center">
                  <div className={`mb-2 p-3 rounded-full ${
                    userType === 'attendee' ? 'bg-amber-100' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-6 h-6 ${userType === 'attendee' ? 'text-amber-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-gray-900 mb-1">Attendee</div>
                    <div className="text-xs text-gray-600">Browse and book events</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUserType('organizer')}
                className={`relative rounded-xl border-2 p-4 flex focus:outline-none transition-all duration-200 ${
                  userType === 'organizer'
                    ? 'border-red-500 ring-2 ring-red-300 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg transform scale-105'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-red-200 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center w-full text-center">
                  <div className={`mb-2 p-3 rounded-full ${
                    userType === 'organizer' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <svg className={`w-6 h-6 ${userType === 'organizer' ? 'text-red-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <div className="font-bold text-gray-900 mb-1">Organizer</div>
                    <div className="text-xs text-gray-600">Create and manage events</div>
                  </div>
                </div>
              </button>
            </div>
          </div> */}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                📧 Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-2">
                🔒 Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {isSignUp && userType === 'organizer' && (
              <div>
                <label htmlFor="organizationName" className="block text-sm font-bold text-gray-900 mb-2">
                  🏢 Organization Name
                </label>
                <div className="relative">
                  <input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Your Company Name"
                    className="appearance-none block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-yellow-400 via-amber-500 to-red-600 hover:from-yellow-500 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    {isSignUp ? '🎉 Create Account' : '🚀 Sign In'}
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-semibold text-red-600 hover:text-red-700 underline underline-offset-2"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {successMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-bounce-in">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 mb-6 shadow-lg">
                <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Success! 🎉
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {successMessage}
              </p>
              
              {/* Show button only for registration success, auto-redirect for login */}
              {!successMessage.includes('Redirecting') && (
                <button
                  onClick={() => {
                    setSuccessMessage('');
                    setEmail('');
                    setPassword('');
                    setOrganizationName('');
                    setIsSignUp(false);
                  }}
                  className="w-full py-3 px-6 rounded-xl text-white font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Got it! ✓
                </button>
              )}
              
              {/* Loading spinner for login redirect */}
              {successMessage.includes('Redirecting') && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedLogin;
