'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SuggestRoaster() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    roasterName: '',
    city: '',
    state: '',
    country: '',
    website: '',
    submitterRole: 'customer',
    submitterFirstName: '',
    submitterLastName: '',
    submitterEmail: '',
  });

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email && !formData.submitterEmail) {
      setFormData((prev) => ({ ...prev, submitterEmail: user.email }));
    }
  }, [user]);

  const roles = ['customer', 'rando', 'scout', 'owner', 'admin', 'marketing'];

  // Helper to extract domain from URL
  function extractDomain(url: string) {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  // State for duplicate domain and url existence
  const [websiteError, setWebsiteError] = useState('');
  const [websiteChecking, setWebsiteChecking] = useState(false);
  const [websiteFieldClass, setWebsiteFieldClass] = useState('');

  // Check if URL exists and is not a duplicate
  const checkWebsite = async (website: string) => {
    setWebsiteError('');
    setWebsiteFieldClass('');
    if (!website.trim()) return;
    setWebsiteChecking(true);
    // 1. Check if URL exists (HEAD request)
    let urlExists = false;
    try {
      // Use a CORS proxy for client-side check (best effort, not 100% reliable)
      const proxyUrl = 'https://corsproxy.io/?';
      const res = await fetch(proxyUrl + encodeURIComponent(website), { method: 'HEAD' });
      urlExists = res.ok;
    } catch {
      urlExists = false;
    }
    if (!urlExists) {
      setWebsiteError(t('suggest.errors.websiteNotReachable', 'Website could not be reached'));
      setWebsiteFieldClass('border-red-500');
      setWebsiteChecking(false);
      return;
    }
    // 2. Check for duplicate domain
    try {
      const { apiClient } = await import('@/lib/api');
      const allRoasters = await apiClient.getRoasters({ limit: 1000 });
      const domain = extractDomain(website);
      const duplicate = allRoasters.roasters?.find((r: any) => extractDomain(r.website || '') === domain);
      if (duplicate) {
        setWebsiteError(t('suggest.errors.duplicateDomain', 'This roaster is already in the system'));
        setWebsiteFieldClass('border-red-500');
        setWebsiteChecking(false);
        return;
      }
    } catch {
      // Ignore API errors for duplicate check
    }
    setWebsiteError('');
    setWebsiteFieldClass('');
    setWebsiteChecking(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    if (name === 'website') {
      // Debounce checkWebsite
      setWebsiteError('');
      setWebsiteFieldClass('');
      if (value && value.startsWith('http')) {
        // Short debounce
        setTimeout(() => checkWebsite(value), 400);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.roasterName.trim()) {
      setError(t('suggest.errors.roasterNameRequired', 'Roaster name is required'));
      setLoading(false);
      return;
    }

    if (!formData.website.trim()) {
      setError(t('suggest.errors.websiteRequired', 'Website is required'));
      setLoading(false);
      return;
    }

    // First name required for non-customer/rando roles
    if (
      formData.submitterRole !== 'customer' &&
      formData.submitterRole !== 'rando' &&
      !formData.submitterFirstName.trim()
    ) {
      setError(t('suggest.errors.firstNameRequired', 'First name is required'));
      setLoading(false);
      return;
    }

    // Email required for non-rando roles
    if (
      formData.submitterRole !== 'rando' &&
      !formData.submitterEmail.trim()
    ) {
      setError(t('suggest.errors.emailRequired', 'Email is required'));
      setLoading(false);
      return;
    }

    // Email validation (only if provided)
    if (formData.submitterEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.submitterEmail)) {
        setError(t('suggest.errors.invalidEmail', 'Please enter a valid email'));
        setLoading(false);
        return;
      }
    }

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBaseUrl}/api/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        // Handle validation errors array
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const errorMessages = data.errors.map((err: any) => err.msg).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || 'Failed to submit suggestion');
      }

      setSuccess(true);
      // Reset form after 3 seconds and redirect
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || t('suggest.errors.submitFailed', 'Failed to submit suggestion'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('suggest.success.title', 'Thank you!')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {t(
                'suggest.success.message',
                'Your roaster suggestion has been submitted successfully. We will review it soon.'
              )}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              {t('suggest.success.redirect', 'Redirecting to home page...')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none">
      <div className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6 pb-2">
              {t('suggest.title', 'Suggest a Roaster')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t(
                'suggest.subtitle',
                'Know a great coffee roaster that should be on The Beans? Let us know!'
              )}
            </p>
          </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* About the Roaster - Left pane */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {t('suggest.aboutRoaster', 'About the Roaster')}
              </h2>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="roasterName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t('suggest.roasterName', 'Roaster Name')} *
                  </label>
                  <input
                    type="text"
                    id="roasterName"
                    name="roasterName"
                    value={formData.roasterName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="website"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t('suggest.website', 'Website')} *
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className={`w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${websiteFieldClass}`}
                    required
                    onBlur={() => formData.website && checkWebsite(formData.website)}
                  />
                  {websiteChecking && (
                    <div className="text-xs text-gray-500 mt-1">{t('suggest.checkingWebsite', 'Checking website...')}</div>
                  )}
                  {websiteError && (
                    <div className="text-xs text-red-600 mt-1">{websiteError}</div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t('suggest.city', 'City')}
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t('suggest.country', 'Country')}
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* About You - Right pane */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                {t('suggest.aboutYou', 'About You')}
              </h2>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="submitterRole"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t('suggest.yourRole', 'Your Role')} *
                  </label>
                  <select
                    id="submitterRole"
                    name="submitterRole"
                    value={formData.submitterRole}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {t(`roleButtons.${role}`, role.charAt(0).toUpperCase() + role.slice(1))}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t(
                      'suggest.roleHelp',
                      'Scout: Someone who finds roasters. Rando: Anonymous (no contact info needed).'
                    )}
                  </p>
                </div>

                {formData.submitterRole !== 'rando' && (
                  <>
                    <div>
                      <label
                        htmlFor="submitterEmail"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        {t('suggest.email', 'Email')} *
                      </label>
                      <input
                        type="email"
                        id="submitterEmail"
                        name="submitterEmail"
                        value={formData.submitterEmail}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required={formData.submitterRole !== 'rando'}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="submitterFirstName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        {t('suggest.firstName', 'First Name')}
                        {formData.submitterRole !== 'customer' && formData.submitterRole !== 'rando' && ' *'}
                      </label>
                      <input
                        type="text"
                        id="submitterFirstName"
                        name="submitterFirstName"
                        value={formData.submitterFirstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required={formData.submitterRole !== 'customer' && formData.submitterRole !== 'rando'}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="submitterLastName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        {t('suggest.lastName', 'Last Name')}
                      </label>
                      <input
                        type="text"
                        id="submitterLastName"
                        name="submitterLastName"
                        value={formData.submitterLastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error message below both panes */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Submit buttons below both panes */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded shadow hover:bg-gray-400"
            >
              {t('suggest.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t('suggest.submitting', 'Submitting...')
                : t('suggest.submit', 'Submit')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
