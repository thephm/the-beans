"use client";

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function OAuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const error = searchParams?.get('error') || 'unknown_error';
  const description = searchParams?.get('description') || 'An unknown error occurred';

  const getErrorTitle = () => {
    switch (error) {
      case 'access_denied':
        return t('auth.oauth.accessDenied', 'Access Denied');
      case 'invalid_state':
      case 'expired_state':
        return t('auth.oauth.sessionExpired', 'Session Expired');
      case 'provider_mismatch':
        return t('auth.oauth.providerMismatch', 'Provider Mismatch');
      case 'invalid_callback':
        return t('auth.oauth.invalidCallback', 'Invalid Callback');
      case 'oauth_callback_failed':
        return t('auth.oauth.callbackFailed', 'Authentication Failed');
      default:
        return t('auth.oauth.error', 'Authentication Error');
    }
  };

  const getErrorDescription = () => {
    switch (error) {
      case 'access_denied':
        return t('auth.oauth.accessDeniedDesc', 'You cancelled the authentication process.');
      case 'invalid_state':
        return t('auth.oauth.invalidStateDesc', 'The authentication session is invalid. Please try again.');
      case 'expired_state':
        return t('auth.oauth.expiredStateDesc', 'The authentication session expired. Please try again.');
      default:
        return description;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none flex items-center justify-center pt-24 pb-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="mb-4 text-red-500">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {getErrorTitle()}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {getErrorDescription()}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-primary-500 to-orchid-500 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all"
            >
              {t('auth.oauth.backToLogin', 'Back to Login')}
            </button>
            
            <button
              onClick={() => router.back()}
              className="w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              {t('common.goBack', 'Go Back')}
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded text-left text-xs">
              <p className="font-mono text-gray-600 dark:text-gray-400">
                <strong>Error:</strong> {error}
              </p>
              <p className="font-mono text-gray-600 dark:text-gray-400 mt-2">
                <strong>Description:</strong> {description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
