"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

interface Roaster {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
}

const AdminCoordinatesPage: React.FC = () => {
  const { t } = useTranslation();
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatedLat, setCalculatedLat] = useState<string>('');
  const [calculatedLng, setCalculatedLng] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasClipboardContent, setHasClipboardContent] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const currentRoaster = roasters[currentIndex];

  // Automatically calculate coordinates when current roaster changes
  useEffect(() => {
    if (currentRoaster) {
      calculateCoordinates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoaster]);

  // Check clipboard content periodically
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        setHasClipboardContent(!!text && text.length > 0);
      } catch {
        setHasClipboardContent(false);
      }
    };
    
    checkClipboard();
    const interval = setInterval(checkClipboard, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchRoasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/roasters/admin/missing-coordinates`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Admin access required');
        }
        throw new Error('Failed to fetch roasters');
      }
      
      const data = await res.json();
      setRoasters(data.roasters || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoasters();
  }, []);


  const buildAddress = (roaster: Roaster): string => {
    const parts = [
      roaster.address,
      roaster.city,
      roaster.state,
      roaster.zipCode,
      roaster.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const calculateCoordinates = async () => {
    if (!currentRoaster) return;
    
    setIsCalculating(true);
    setError(null);
    
    try {
      // Try multiple address variations for better geocoding results
      const addressVariations = [];
      
      // Roaster name + full address (best option)
      addressVariations.push(`${currentRoaster.name}, ${buildAddress(currentRoaster)}`);
      
      // Full address without name
      addressVariations.push(buildAddress(currentRoaster));
      
      // Address without unit number (remove "Unit X", "#X", "Suite X", etc.)
      const addressWithoutUnit = (currentRoaster.address || '')
        .replace(/\b(unit|suite|apt|apartment|#)\s*\d+[a-z]?\b/gi, '')
        .trim();
      if (addressWithoutUnit && addressWithoutUnit !== currentRoaster.address) {
        const parts = [
          addressWithoutUnit,
          currentRoaster.city,
          currentRoaster.state,
          currentRoaster.zipCode,
          currentRoaster.country
        ].filter(Boolean);
        // With roaster name
        addressVariations.push(`${currentRoaster.name}, ${parts.join(', ')}`);
        // Without roaster name
        addressVariations.push(parts.join(', '));
      }
      
      // Just street, city, and country
      if (currentRoaster.address && currentRoaster.city) {
        const streetOnly = currentRoaster.address
          .replace(/\b(unit|suite|apt|apartment|#)\s*\d+[a-z]?\b/gi, '')
          .replace(/,.*$/, '')
          .trim();
        addressVariations.push(`${currentRoaster.name}, ${streetOnly}, ${currentRoaster.city}, ${currentRoaster.country}`);
        addressVariations.push(`${streetOnly}, ${currentRoaster.city}, ${currentRoaster.country}`);
      }
      
      // City and country only as last resort
      if (currentRoaster.city) {
        addressVariations.push(`${currentRoaster.city}, ${currentRoaster.country}`);
      }
      
      let location = null;
      let lastError = null;
      
      // Try each address variation
      for (const address of addressVariations) {
        try {
          const encodedAddress = encodeURIComponent(address);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
            {
              headers: {
                'User-Agent': 'TheBeans/1.0 (coffee roaster directory)'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              location = data[0];
              break; // Found a match, stop trying
            }
          }
          
          // Add small delay between requests to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          lastError = err;
          continue;
        }
      }
      
      if (!location) {
        throw new Error('Address not found with any variation. Please enter coordinates manually.');
      }
      
      setCalculatedLat(parseFloat(location.lat).toFixed(6));
      setCalculatedLng(parseFloat(location.lon).toFixed(6));
    } catch (err: any) {
      setError(err.message || 'Failed to calculate coordinates');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSetCoordinates = async () => {
    if (!currentRoaster || !calculatedLat || !calculatedLng) return;
    
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/roasters/${currentRoaster.id}/coordinates`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          latitude: parseFloat(calculatedLat),
          longitude: parseFloat(calculatedLng),
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update coordinates');
      }
      
      setSuccessMessage(`Coordinates set for ${currentRoaster.name}`);
      setCalculatedLat('');
      setCalculatedLng('');
      
      // Move to next roaster
      setTimeout(() => {
        if (currentIndex < roasters.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setSuccessMessage(null);
        } else {
          // Refresh the list
          fetchRoasters();
          setCurrentIndex(0);
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to save coordinates');
    } finally {
      setIsSaving(false);
    }
  };

  const skipCurrent = () => {
    setCalculatedLat('');
    setCalculatedLng('');
    setSuccessMessage(null);
    setError(null);
    if (currentIndex < roasters.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const getGoogleMapsUrl = (): string => {
    if (!calculatedLat || !calculatedLng) return '';
    return `https://www.google.com/maps?q=${calculatedLat},${calculatedLng}`;
  };

  const getGoogleMapsSearchUrl = (): string => {
    if (!currentRoaster) return '';
    const searchQuery = `${currentRoaster.name}, ${buildAddress(currentRoaster)}`;
    return `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
  };

  const extractCoordinatesFromUrl = (url: string): { lat: string, lng: string } | null => {
    // Try to extract coordinates from various Google Maps URL formats
    
    // Format 1: !3d<lat>!4d<lng> (most accurate - actual place coordinates)
    let match = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (match) {
      return { lat: parseFloat(match[1]).toFixed(6), lng: parseFloat(match[2]).toFixed(6) };
    }
    
    // Format 2: /@lat,lng,zoom
    match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return { lat: parseFloat(match[1]).toFixed(6), lng: parseFloat(match[2]).toFixed(6) };
    }
    
    // Format 3: ?q=lat,lng
    match = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return { lat: parseFloat(match[1]).toFixed(6), lng: parseFloat(match[2]).toFixed(6) };
    }
    
    // Format 4: /place/name/@lat,lng
    match = url.match(/\/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      return { lat: parseFloat(match[1]).toFixed(6), lng: parseFloat(match[2]).toFixed(6) };
    }
    
    return null;
  };

  const handleGoogleMapsUrlPaste = async () => {
    try {
      // Try to read from clipboard automatically
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText) {
        // Fallback to prompt if clipboard is empty
        const url = prompt('Paste Google Maps URL here:');
        if (!url) return;
        
        const coords = extractCoordinatesFromUrl(url);
        if (coords) {
          setCalculatedLat(coords.lat);
          setCalculatedLng(coords.lng);
          setError(null);
        } else {
          setError('Could not extract coordinates from URL. Please paste the full Google Maps URL.');
        }
        return;
      }
      
      // Try to extract coordinates from clipboard
      const coords = extractCoordinatesFromUrl(clipboardText);
      if (coords) {
        setCalculatedLat(coords.lat);
        setCalculatedLng(coords.lng);
        setError(null);
        setSuccessMessage('Coordinates extracted from clipboard!');
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        setError('Could not extract coordinates from clipboard. Make sure you copied a Google Maps URL.');
      }
    } catch (err) {
      // Clipboard API not available or permission denied, fall back to prompt
      const url = prompt('Paste Google Maps URL here:');
      if (!url) return;
      
      const coords = extractCoordinatesFromUrl(url);
      if (coords) {
        setCalculatedLat(coords.lat);
        setCalculatedLng(coords.lng);
        setError(null);
      } else {
        setError('Could not extract coordinates from URL. Please paste the full Google Maps URL.');
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (error && !currentRoaster) {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <Link href="/admin/roasters" className="text-primary-600 hover:text-primary-700 underline mt-2 inline-block">
            {t('common.back', 'Back')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('admin.coordinates.title', 'Set Roaster Coordinates')}
        </h1>
      </div>

      {roasters.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <p className="text-green-700 dark:text-green-400 text-lg">
            {t('admin.coordinates.allSet', 'All roasters have coordinates!')}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {t('admin.coordinates.progress', 'Roaster {{current}} of {{total}}', { 
              current: currentIndex + 1, 
              total: roasters.length 
            })}
          </div>

          {currentRoaster && (
            <div className="flex gap-6">
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {currentRoaster.name}
                {!currentRoaster.verified && (
                  <span className="ml-2 text-sm text-yellow-600 dark:text-yellow-400">
                    ({t('admin.unverified', 'Unverified')})
                  </span>
                )}
              </h2>

              <div className="mb-6">
                <div className="flex items-start gap-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {t('admin.coordinates.address', 'Address')}:
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {buildAddress(currentRoaster)}
                  </p>
                  <a
                    href={getGoogleMapsSearchUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 whitespace-nowrap"
                  >
                    {t('admin.coordinates.search', 'Search')} ↗
                  </a>
                  <button
                    onClick={handleGoogleMapsUrlPaste}
                    disabled={!hasClipboardContent}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title={t('admin.coordinates.paste', 'Paste')}
                  >
                    {t('admin.coordinates.paste', 'Paste')}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                <div className="flex gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('admin.coordinates.latitude', 'Latitude')}
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={calculatedLat}
                      onChange={(e) => setCalculatedLat(e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="40.712776"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('admin.coordinates.longitude', 'Longitude')}
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={calculatedLng}
                      onChange={(e) => setCalculatedLng(e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="-74.005974"
                    />
                  </div>
                  {isCalculating && (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 pb-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-medium">{t('admin.coordinates.workingOnIt', 'Working on it...')}</span>
                    </div>
                  )}
                </div>

                {!isCalculating && calculatedLat && calculatedLng && (
                  <div className="flex gap-3">
                    <a
                      href={getGoogleMapsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                    >
                      {t('admin.coordinates.test', 'Test')} ↗
                    </a>
                    <button
                      onClick={handleSetCoordinates}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {isSaving 
                        ? t('admin.coordinates.saving', 'Saving...') 
                        : t('admin.coordinates.set', 'Set')}
                    </button>
                    <button
                      onClick={skipCurrent}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      {t('admin.coordinates.skip', 'Skip')}
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                  <p className="text-green-700 dark:text-green-400 text-sm">{successMessage}</p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {t('admin.coordinates.workflow', 'Workflow:')}
                </h4>
                <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                  <li><strong>1.</strong> {t('admin.coordinates.workflowStep1', 'Click "Search" (opens in new tab)')}</li>
                  <li><strong>2.</strong> {t('admin.coordinates.workflowStep2', 'Find the exact location on the map')}</li>
                  <li><strong>3.</strong> {t('admin.coordinates.workflowStep3', 'Copy the URL from your browser address bar (Ctrl+L, Ctrl+C)')}</li>
                  <li><strong>4.</strong> {t('admin.coordinates.workflowStep4', 'Click "Paste from Clipboard" - it will auto-read your clipboard!')}</li>
                  <li><strong>5.</strong> {t('admin.coordinates.workflowStep5', 'Click "Test" to verify')}</li>
                  <li><strong>6.</strong> {t('admin.coordinates.workflowStep6', 'Click "Set" to save')}</li>
                </ol>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 italic">
                  {t('admin.coordinates.workflowTip', 'Tip: You can also use "Calculate" for a quick estimate, or type coordinates manually.')}
                </p>
              </div>
              </div>

              {/* Map iframe panel */}
              <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('admin.coordinates.test', 'Test')} Map
                  </h3>
                </div>
                {calculatedLat && calculatedLng ? (
                  <>
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(calculatedLng)-0.01}%2C${parseFloat(calculatedLat)-0.01}%2C${parseFloat(calculatedLng)+0.01}%2C${parseFloat(calculatedLat)+0.01}&layer=mapnik&marker=${calculatedLat}%2C${calculatedLng}`}
                      className="w-full h-[600px] border-0 rounded"
                      title="OpenStreetMap"
                      loading="lazy"
                    />
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <a href={`https://www.openstreetmap.org/?mlat=${calculatedLat}&mlon=${calculatedLng}#map=16/${calculatedLat}/${calculatedLng}`} target="_blank" rel="noopener noreferrer" className="underline">
                        {t('admin.coordinates.openInOsm', 'View on OpenStreetMap')}
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-gray-400 text-lg">
                    {t('admin.coordinates.noCoords', 'Enter coordinates to preview map.')}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminCoordinatesPage;
