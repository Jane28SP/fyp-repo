import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Supabase handles email verification automatically via URL parameters
        // Check hash fragment for access_token (SPA redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const hashType = hashParams.get('type');

        if (accessToken && hashType === 'email') {
          // Handle hash-based verification (SPA redirect)
          try {
            // Set the session from the hash
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) throw sessionError;
            
            // Check if user is verified
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) throw userError;
            
            if (user && user.email_confirmed_at) {
              setStatus('success');
              setMessage('Email verified successfully! You can now log in to your account.');
              
              // Clear the hash from URL
              window.history.replaceState(null, '', window.location.pathname);
              
              // Redirect to login page after 3 seconds
              setTimeout(() => {
                navigate('/login');
              }, 3000);
              return;
            } else {
              setStatus('error');
              setMessage('Verification failed. Please request a new verification email.');
              return;
            }
          } catch (error: any) {
            console.error('Verification error:', error);
            setStatus('error');
            setMessage(error.message || 'Verification failed. Please request a new verification email.');
            return;
          }
        }

        // Handle query parameter-based verification
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token_hash,
            type: type as any,
          });

          if (error) {
            console.error('Verification error:', error);
            setStatus('error');
            setMessage(error.message || 'Verification failed. The link may have expired. Please request a new verification email.');
            return;
          }

          // Success
          setStatus('success');
          setMessage('Email verified successfully! You can now log in to your account.');
          
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        // If no verification parameters found, check if user is already verified
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email_confirmed_at) {
          setStatus('success');
          setMessage('Your email is already verified! You can log in to your account.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        // No verification parameters found
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again, or request a new verification email.');
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
                <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying Your Email</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified! 🎉</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-6">Redirecting to login page...</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 px-6 rounded-xl text-white font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Go to Login
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
                <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 px-6 rounded-xl text-white font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 px-6 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Back to Home
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
