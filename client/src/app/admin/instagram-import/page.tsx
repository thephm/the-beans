"use client";

import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useRef, useState } from 'react';

interface InstagramRawEntry {
  title?: string;
  string_list_data?: Array<{ href?: string; value?: string; timestamp?: number }>;
}

interface ParsedAccount {
  title: string;
  href: string;
  value: string;
}

interface CandidateAccount {
  title: string;
  instagramUrl: string;
  handle: string;
  originalHref: string;
  value: string;
}

type ParseValidationResult = { parsed: ParsedAccount[] } | { error: string };

const getEntriesFromExport = (data: any): { entries: InstagramRawEntry[]; source: string } | { error: string } => {
  if (Array.isArray(data)) {
    return { entries: data, source: 'array' };
  }

  if (data && typeof data === 'object') {
    if (Array.isArray(data.relationships_following)) {
      return { entries: data.relationships_following, source: 'relationships_following' };
    }
    if (Array.isArray(data.relationships_followers)) {
      return { entries: data.relationships_followers, source: 'relationships_followers' };
    }
  }

  return {
    error: 'File format differs from expected. Expected an array of entries or an object with relationships_following / relationships_followers arrays.'
  };
};

const validateAndParseEntries = (entries: InstagramRawEntry[]): ParseValidationResult => {
  const parsed: ParsedAccount[] = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (!entry || !Array.isArray(entry.string_list_data) || entry.string_list_data.length === 0) {
      return {
        error: `File format differs from expected. Entry ${i + 1} is missing string_list_data with at least one item.`
      };
    }
    const first = entry.string_list_data[0];
    if (!first) {
      return {
        error: `File format differs from expected. Entry ${i + 1} is missing string_list_data[0].`
      };
    }
    const titleValue = typeof entry.title === 'string' ? entry.title.trim() : '';
    const value = typeof first.value === 'string' ? first.value.trim() : titleValue;
    let href = typeof first.href === 'string' ? first.href.trim() : '';
    if (href.includes('/_u/')) {
      const match = href.match(/\/_u\/([^/?#]+)/i);
      if (match?.[1]) {
        href = `https://www.instagram.com/${match[1]}`;
      }
    }
    if (!href && value) {
      href = `https://www.instagram.com/${value}`;
    }
    if (href && value && !href.toLowerCase().includes(value.toLowerCase())) {
      href = `https://www.instagram.com/${value}`;
    }
    if (!href) {
      return {
        error: `File format differs from expected. Entry ${i + 1} is missing string_list_data[0].href and string_list_data[0].value.`
      };
    }
    parsed.push({
      title: typeof entry.title === 'string' && entry.title.trim() !== '' ? entry.title : value,
      href,
      value
    });
  }
  return { parsed };
};

export default function AdminInstagramImportPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [candidates, setCandidates] = useState<CandidateAccount[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [analysisTotal, setAnalysisTotal] = useState(0);
  const [analysisIndex, setAnalysisIndex] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [counts, setCounts] = useState({
    total: 0,
    existing: 0,
    ignored: 0,
    unverified: 0
  });

  const [roasterName, setRoasterName] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const current = useMemo(() => candidates[currentIndex], [candidates, currentIndex]);

  useEffect(() => {
    if (current) {
      setRoasterName(current.title || '');
      setWebsite('');
      setCity('');
      setCountry('');
      setActionError(null);
      setActionSuccess(null);
    }
  }, [current]);

  const runProgress = async (total: number) => {
    setAnalysisTotal(total);
    setAnalysisIndex(0);
    for (let i = 0; i < total; i += 1) {
      setAnalysisIndex(i + 1);
      if (i % 25 === 0) {
        await new Promise((resolve) => requestAnimationFrame(() => resolve(true)));
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setScanMessage(null);
    setActionError(null);
    setActionSuccess(null);
    setCandidates([]);
    setCurrentIndex(0);
    setCounts({ total: 0, existing: 0, ignored: 0, unverified: 0 });

    try {
      const text = await file.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch (error) {
        setUploadError('File format differs from expected. The file is not valid JSON.');
        return;
      }

      const entryResult = getEntriesFromExport(json);
      if ('error' in entryResult) {
        setUploadError(entryResult.error);
        return;
      }

      const validation = validateAndParseEntries(entryResult.entries);
      if ('error' in validation) {
        setUploadError(validation.error);
        return;
      }

      const parsed = validation.parsed;
      if (!parsed || parsed.length === 0) {
        setUploadError('No accounts were found in the file.');
        return;
      }

      setIsScanning(true);
      setScanMessage('Analyzing accounts...');
      await runProgress(parsed.length);

      const result = await apiClient.scanInstagramAccounts(parsed);
      const nextCandidates = result?.candidates || [];
      const summary = {
        total: typeof result?.total === 'number' ? result.total : parsed.length,
        existing: typeof result?.existing === 'number' ? result.existing : 0,
        ignored: typeof result?.ignored === 'number' ? result.ignored : 0,
        unverified: typeof result?.unverified === 'number' ? result.unverified : nextCandidates.length
      };
      setCounts(summary);

      if (!nextCandidates.length) {
        setScanMessage('No new accounts found.');
        setCandidates([]);
        setCurrentIndex(0);
      } else {
        setCandidates(nextCandidates);
        setCurrentIndex(0);
        setScanMessage(`Ready to review ${nextCandidates.length} new account${nextCandidates.length === 1 ? '' : 's'}.`);
      }
    } catch (error: any) {
      setUploadError(error?.message || 'Failed to analyze file.');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (analysisTotal > 0 && analysisIndex > 0 && analysisIndex <= analysisTotal) {
      setScanMessage('Analyzing accounts...');
    }
  }, [analysisIndex, analysisTotal]);

  const goNext = () => {
    setCandidates((prev) => {
      const next = [...prev];
      next.splice(currentIndex, 1);
      const nextLength = next.length;
      if (nextLength === 0) {
        setScanMessage('No new accounts found.');
        setCurrentIndex(0);
      } else {
        setCurrentIndex(currentIndex >= nextLength ? nextLength - 1 : currentIndex);
      }
      setActionSuccess(null);
      setActionError(null);
      return next;
    });
  };

  const handleSkip = () => {
    setCounts((prev) => ({
      ...prev,
      unverified: Math.max(prev.unverified - 1, 0)
    }));
    goNext();
  };

  const handleIgnore = async () => {
    if (!current) return;
    try {
      await apiClient.ignoreInstagramAccount({
        instagramUrl: current.instagramUrl,
        title: roasterName || current.title,
        handle: current.handle
      });
      setCounts((prev) => ({
        ...prev,
        ignored: prev.ignored + 1,
        unverified: Math.max(prev.unverified - 1, 0)
      }));
      setActionSuccess('Account ignored.');
      goNext();
    } catch (error: any) {
      setActionError(error?.message || 'Failed to ignore account.');
    }
  };

  const handleAdd = async () => {
    if (!current) return;
    if (!roasterName.trim()) {
      setActionError('Roaster name is required.');
      return;
    }

    try {
      const payload: any = {
        name: roasterName.trim(),
        verified: false,
        showHours: false,
        socialNetworks: { instagram: current.instagramUrl },
        sourceType: 'Instagram',
        sourceDetails: 'Instagram import'
      };

      if (website.trim()) payload.website = website.trim();
      if (city.trim()) payload.city = city.trim();
      if (country.trim()) payload.country = country.trim();

      await apiClient.createRoaster(payload);
      setCounts((prev) => ({
        ...prev,
        existing: prev.existing + 1,
        unverified: Math.max(prev.unverified - 1, 0)
      }));
      setActionSuccess('Roaster added.');
      goNext();
    } catch (error: any) {
      setActionError(error?.message || 'Failed to add roaster.');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('admin.instagramImport.title', 'Import from Insta')}
          </h1>
          <div className="text-red-600 dark:text-red-400">
            {t('admin.instagramImport.adminRequired', 'Admin access required.')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28">
      <div className="w-full max-w-4xl">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('admin.instagramImport.title', 'Import from Insta')}
          </h1>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
              {[
                { label: t('admin.instagramImport.total', 'Total'), value: counts.total, accent: 'text-blue-500' },
                { label: t('admin.instagramImport.exist', 'Exist'), value: counts.existing, accent: 'text-emerald-500' },
                { label: t('admin.instagramImport.unverified', 'Unverified'), value: counts.unverified, accent: 'text-amber-500' },
                { label: t('admin.instagramImport.ignored', 'Ignored'), value: counts.ignored, accent: 'text-rose-500' }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 px-2 py-2 shadow-sm text-center"
                >
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </div>
                  <div className={`text-xl font-semibold ${stat.accent}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-end w-full sm:w-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setSelectedFileName(file?.name || '');
                  if (file) {
                    handleFileUpload(file);
                  }
                  event.target.value = '';
                }}
                className="hidden"
              />
              <div className="flex items-center gap-2 w-full justify-end sm:w-auto">
                <span className="text-sm text-gray-700 dark:text-gray-200 font-mono max-w-[180px] truncate">
                  {selectedFileName || t('admin.instagramImport.noFile', 'No file chosen')}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold"
                >
                  {t('admin.instagramImport.chooseFile', 'Choose File')}
                </button>
              </div>
              {isScanning && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></span>
                  {t('admin.instagramImport.scanning', 'Scanning export...')}
                </div>
              )}
              {!isScanning && scanMessage && !scanMessage.startsWith('Ready to review') && (
                <span className="text-sm text-blue-600 dark:text-blue-400">{scanMessage}</span>
              )}
            </div>
          </div>
          {uploadError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-right">{uploadError}</p>
          )}
        </div>

        {current ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg py-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('admin.instagramImport.formTitle', 'Add Roaster')}
            </h2>
            <div className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a
                href={current.instagramUrl}
                onClick={(event) => {
                  event.preventDefault();
                  window.open(current.instagramUrl, 'insta-review', 'noopener,noreferrer');
                }}
                className="text-blue-600 dark:text-blue-400 underline break-all"
              >
                {current.handle || current.instagramUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/+$/, '')}
              </a>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.instagramImport.roasterName', 'Roaster Name')}
                </label>
                <input
                  type="text"
                  value={roasterName}
                  onChange={(event) => setRoasterName(event.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.instagramImport.website', 'Web site')}
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.instagramImport.city', 'City')}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('admin.instagramImport.country', 'Country')}
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
                />
              </div>
            </div>
          </div>

          {actionError && (
            <div className="mt-4 text-sm text-red-600 dark:text-red-400">{actionError}</div>
          )}
          {actionSuccess && (
            <div className="mt-4 text-sm text-green-600 dark:text-green-400">{actionSuccess}</div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={handleAdd}
              className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {t('admin.instagramImport.add', 'Add')}
            </button>
            <button
              type="button"
              onClick={handleIgnore}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {t('admin.instagramImport.ignore', 'Ignore')}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {t('admin.instagramImport.skip', 'Skip')}
            </button>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  );
}
