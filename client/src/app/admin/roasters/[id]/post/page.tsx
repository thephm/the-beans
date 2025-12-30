"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.NODE_ENV === 'production') return 'https://the-beans-api.onrender.com';
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) return 'https://the-beans-api.onrender.com';
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

interface PostResult {
  subreddit: string;
  success: boolean;
  error?: string;
}

export default function RoasterPostPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const id = (params as any)?.id;

  const [roasterName, setRoasterName] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [results, setResults] = useState<PostResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // fetch roaster for display
    const fetchRoaster = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/roasters/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setRoasterName(data.name || null);
      } catch (err) {
        // ignore
      }
    };
    fetchRoaster();
  }, [id]);

  const startPost = async () => {
    if (!id) return;
    setIsPosting(true);
    setResults(null);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE_URL}/api/roasters/${id}/post-to-reddit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Server returned ${res.status}`);
      }
      const r: PostResult[] = data.results || [];
      setResults(r);
    } catch (err: any) {
      setError(err?.message || 'Failed to post');
    } finally {
      setIsPosting(false);
    }
  };

  const getIcon = (success?: boolean) => {
    if (success === true) return '✅';
    if (success === false) return '❌';
    return '⏳';
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">{t('adminForms.roasters.post', 'Post')} {roasterName ? `– ${roasterName}` : ''}</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-600 dark:text-gray-300 mb-4">{t('adminForms.roasters.confirmPost', 'Post this roaster to configured Reddit communities?')}</p>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/admin/roasters?edit=${id}`)}
            disabled={isPosting}
            className="px-6 py-3 rounded-lg font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {t('adminForms.roasters.no', 'No')}
          </button>

          <button
            onClick={startPost}
            disabled={isPosting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${isPosting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
          >
            {isPosting ? t('adminForms.roasters.posting', 'Posting...') : t('adminForms.roasters.yes', 'Yes')}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <strong className="text-red-700 dark:text-red-300">{t('adminForms.roasters.postFailed', 'Failed to post to Reddit:')}</strong>
          <div className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</div>
        </div>
      )}

      {results && (
        <div className="rounded-lg p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">{t('adminForms.roasters.postResults', 'Post results:')}</h2>
          <ul className="space-y-2">
            {results.map((r) => (
              <li key={r.subreddit} className="flex items-start gap-3">
                <div className="text-lg">{getIcon(r.success)}</div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">r/{r.subreddit}</div>
                  {r.success ? (
                    <div className="text-sm text-green-700 dark:text-green-300">{t('adminForms.roasters.postSuccess', 'Posted successfully')}</div>
                  ) : (
                    <div className="text-sm text-red-700 dark:text-red-300">{r.error || t('adminForms.roasters.postFailed', 'Failed to post to Reddit:')}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
