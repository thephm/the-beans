"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.NODE_ENV === 'production') return 'https://the-beans-api.onrender.com';
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) return 'https://the-beans-api.onrender.com';
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams?.get('token');
        const isNewUser = searchParams?.get('isNewUser') === 'true';
        const provider = searchParams?.get('provider');
        const errorParam = searchParams?.get('error');
        const errorDescription = searchParams?.get('description');

        // Handle OAuth errors
        if (errorParam) {
          setError(errorDescription || errorParam);
          setProcessing(false);
          return;
        }

        // Validate token
        if (!token) {
          setError('No authentication token received');
          setProcessing(false);
          return;
        }

        // Fetch user data with the token
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();

        // Log the user in via AuthContext
        login(token, userData);

        // Redirect based on whether it's a new user
        if (isNewUser) {
          // New users might want to complete their profile
          router.push('/profile?welcome=true');
        } else {
          // Existing users go to discover page
          router.push('/discover');
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err?.message || 'Authentication failed');
        setProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none flex items-center justify-center pt-24 pb-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          {processing && !error && (
            <>
              <div className="mb-4">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('auth.oauth.completing', 'Completing sign in...')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('auth.oauth.pleaseWait', 'Please wait while we set up your account')}
              </p>
            </>
          )}

          {error && (
            <>
              <div className="mb-4 text-red-500">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('auth.oauth.error', 'Authentication Error')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-primary-500 to-orchid-500 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all"
              >
                {t('auth.oauth.backToLogin', 'Back to Login')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
