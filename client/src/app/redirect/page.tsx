"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.NODE_ENV === 'production') return 'https://the-beans-api.onrender.com';
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) return 'https://the-beans-api.onrender.com';
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

export default function OAuthRedirectPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const code = params?.get('code');
  const state = params?.get('state');
  const service = params?.get('service') || 'reddit';

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const doExchange = async () => {
      if (!code) return;
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE_URL}/api/oauth/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ service, code, redirectUri: `${window.location.origin}/redirect` }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || data.message || `Server returned ${res.status}`);
        }
        setResult(data);
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    doExchange();
  }, [code]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    } catch (err) {
      alert('Failed to copy');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">{t('admin.oauth.redirectTitle', { service, defaultValue: 'Authorization Response' })}</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
        {loading && <div className="text-gray-600">{t('admin.oauth.exchanging', { defaultValue: 'Exchanging code for tokens...' })}</div>}

        {!loading && error && (
          <div className="text-red-700">{t('admin.oauth.exchangeFailed', { defaultValue: 'Token exchange failed:' })} {error}</div>
        )}

        {!loading && result && (
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600">{t('admin.oauth.accessToken', { defaultValue: 'Access Token' })}</div>
              <div className="font-mono break-all p-2 bg-gray-100 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">{result.access_token || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('admin.oauth.refreshToken', { defaultValue: 'Refresh Token' })}</div>
              <div className="font-mono break-all p-2 bg-gray-100 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">{result.refresh_token || '—'}</div>
              {result.refresh_token && (
                <div className="mt-2 flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => copyToClipboard(result.refresh_token)}>{t('common.copy', { defaultValue: 'Copy' })}</button>
                  <button className="px-4 py-2 bg-gray-200 rounded" onClick={() => router.push('/admin/roasters')}>{t('admin.reddit.done', { defaultValue: 'Done' })}</button>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {t('admin.oauth.nextSteps', { service, envVar: service === 'reddit' ? 'REDDIT_REFRESH_TOKEN' : 'REFRESH_TOKEN', defaultValue: 'Save the refresh token to your server .env and restart the server container.' })}
            </div>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="text-gray-600">{t('admin.oauth.noCode', { defaultValue: 'No authorization code found in the URL.' })}</div>
        )}
      </div>
    </div>
  );
}
