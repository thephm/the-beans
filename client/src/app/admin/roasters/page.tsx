"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Roaster, RoasterImage } from '@/types';
import SimpleImageUpload from '@/components/SimpleImageUpload';

const AdminRoastersPage: React.FC = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUnverifiedOnly, setShowUnverifiedOnly] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [images, setImages] = useState<RoasterImage[]>([]);

  const fetchRoasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/roasters`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch roasters: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      // Handle different response formats
      const roastersArray = Array.isArray(data) ? data : (data.data || data.roasters || []);
      setRoasters(roastersArray);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoasters();
  }, []);

  // Handle URL parameters for direct editing
  useEffect(() => {
    if (searchParams) {
      const editId = searchParams.get('edit');
      if (editId && editId.trim() !== '') {
        setEditingId(editId);
      } else {
        // If no edit parameter, make sure we're showing the list
        setEditingId(null);
        setShowAddForm(false);
      }
    } else {
      // If no search params at all, reset to list view
      setEditingId(null);
      setShowAddForm(false);
    }
  }, [searchParams]);

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleAdd = () => {
    setShowAddForm(true);
  };

  const confirmDelete = (id: string) => setDeletingId(id);
  const cancelDelete = () => setDeletingId(null);
  
  const doDelete = async (id: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/roasters/${id}`, { 
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete roaster');
      setDeletingId(null);
      fetchRoasters();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    }
  };

  const handleVerify = async (roasterId: string) => {
    setVerifyingId(roasterId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/roasters/${roasterId}/verify`, {
        method: 'PATCH',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to verify roaster');
      fetchRoasters();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setVerifyingId(null);
    }
  };

  const onFormSuccess = () => {
    setEditingId(null);
    setShowAddForm(false);
    fetchRoasters();
    
    // Check if there's a returnTo parameter to navigate back
    if (searchParams) {
      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        router.push(returnTo);
        return;
      }
    }
  };

  const onFormCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    
    // Check if there's a returnTo parameter to navigate back
    if (searchParams) {
      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        router.push(returnTo);
        return;
      }
    }
  };

  if (loading) return <div className="p-4">{t('loading', 'Loading...')}</div>;
  if (error) return <div className="p-4 text-red-600">{t('error')}: {error}</div>;

  if (editingId || showAddForm) {
    const roaster = editingId ? roasters.find(r => r.id === editingId) : undefined;
    return (
      <RoasterForm 
        roaster={roaster}
        onSuccess={onFormSuccess}
        onCancel={onFormCancel}
      />
    );
  }

  return (
    <div className="p-4 pt-20 sm:pt-28 px-4 sm:px-8 lg:px-16 xl:px-32">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Roasters</h1>
      </div>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <div className="flex items-center gap-8">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showUnverifiedOnly}
                onChange={(e) => setShowUnverifiedOnly(e.target.checked)}
                className="mr-2 accent-blue-600"
              />
              <span className="text-gray-700">{t('adminSection.roasters.showUnverifiedOnly', 'Show unverified only')}</span>
            </label>
            <button
              onClick={handleAdd}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              {t('adminSection.roasters.addNew', 'Add Roaster')}
            </button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {Array.isArray(roasters) && roasters
            .filter(roaster => showUnverifiedOnly ? !roaster.verified : true)
            .map((roaster) => (
            <div key={roaster.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <button
                  onClick={() => handleEdit(roaster.id)}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 text-left"
                >
                  {roaster.name}
                </button>
                <div className="flex space-x-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ★ {roaster.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                📍 {[roaster.city, roaster.state, roaster.country].filter(Boolean).join(', ')}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  roaster.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {roaster.verified ? '✓ Verified' : '⚠ Unverified'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  roaster.featured ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {roaster.featured ? '⭐ Featured' : 'Not Featured'}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleEdit(roaster.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium"
                >
                  {t('adminSection.roasters.edit', 'Edit')}
                </button>
                <button
                  onClick={() => confirmDelete(roaster.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium"
                >
                  {t('adminSection.roasters.delete', 'Delete')}
                </button>
                {!roaster.verified && (
                  <button
                    onClick={() => handleVerify(roaster.id)}
                    disabled={verifyingId === roaster.id}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50"
                  >
                    {verifyingId === roaster.id ? 'Verifying...' : 'Verify'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-gray-900">{t('adminForms.roasters.name', 'Name')}</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-900">{t('adminForms.roasters.location', 'Location')}</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-900">{t('adminForms.roasters.rating', 'Rating')}</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-900">{t('adminForms.roasters.verified', 'Verified')}</th>
                  <th className="py-3 px-4 text-center font-medium text-gray-900">{t('adminForms.roasters.featured', 'Featured')}</th>
                  <th className="py-3 px-4 text-left font-medium text-gray-900">{t('adminSection.roasters.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Array.isArray(roasters) && roasters
                  .filter(roaster => showUnverifiedOnly ? !roaster.verified : true)
                  .map((roaster) => (
                  <tr key={roaster.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEdit(roaster.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-left underline"
                      >
                        {roaster.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {[roaster.city, roaster.state, roaster.country].filter(Boolean).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {roaster.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        roaster.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {roaster.verified ? t('admin.roasters.yes', 'Yes') : t('admin.roasters.no', 'No')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        roaster.featured ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {roaster.featured ? t('admin.roasters.yes', 'Yes') : t('admin.roasters.no', 'No')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(roaster.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          {t('adminSection.roasters.edit', 'Edit')}
                        </button>
                        <button
                          onClick={() => confirmDelete(roaster.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                        >
                          {t('adminSection.roasters.delete', 'Delete')}
                        </button>
                        {!roaster.verified && (
                          <button
                            onClick={() => handleVerify(roaster.id)}
                            disabled={verifyingId === roaster.id}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                          >
                            {verifyingId === roaster.id ? 'Verifying...' : 'Verify'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {t('admin.roasters.confirmDeleteTitle', 'Confirm Delete')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('admin.roasters.confirmDelete', 'Are you sure you want to delete this roaster? This action cannot be undone.')}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                {t('admin.roasters.cancel', 'Cancel')}
              </button>
              <button
                onClick={() => doDelete(deletingId)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {t('admin.roasters.deleteConfirm', 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

// RoasterForm component will be defined next
const RoasterForm: React.FC<{
  roaster?: Roaster;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ roaster, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<RoasterImage[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Utility function to convert Unsplash URLs to proper image URLs
  const convertToImageUrl = (url: string): string => {
    if (!url) return url;
    
    console.log('Processing URL:', url);
    
    // Handle Unsplash URLs
    if (url.includes('unsplash.com')) {
      // If it's already a direct images.unsplash.com URL, return as is
      if (url.includes('images.unsplash.com')) {
        console.log('Already a direct image URL:', url);
        return url;
      }
      
      // Convert various Unsplash URL formats to direct image URLs
      if (url.includes('/photos/')) {
        const photoPathMatch = url.match(/\/photos\/([^/?#]+)/);
        if (photoPathMatch) {
          const photoId = photoPathMatch[1];
          console.log('Extracted photo ID:', photoId);
          
          // For URLs like https://unsplash.com/photos/ZmOhgTobRQI
          // The photo ID is directly after /photos/
          const directImageUrl = `https://images.unsplash.com/photo-${photoId}?w=800&h=600&fit=crop&auto=format&q=80`;
          console.log('Converting to:', directImageUrl);
          
          return directImageUrl;
        }
      }
    }
    
    console.log('No conversion needed, returning original URL:', url);
    return url; // Return original URL if not Unsplash or already processed
  };

  // Helper function to convert old hours format to new format
  const convertHoursFormat = (hours: any) => {
    if (!hours) {
      return {
        monday: { open: '', close: '', closed: true },
        tuesday: { open: '', close: '', closed: true },
        wednesday: { open: '', close: '', closed: true },
        thursday: { open: '', close: '', closed: true },
        friday: { open: '', close: '', closed: true },
        saturday: { open: '', close: '', closed: true },
        sunday: { open: '', close: '', closed: true },
      };
    }

    // If already in new format, return as-is
    if (hours.monday && typeof hours.monday === 'object' && 'open' in hours.monday) {
      return hours;
    }

    // Convert old format "6:00-20:00" to new format
    const convertedHours: any = {};
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    dayNames.forEach(day => {
      const dayHours = hours[day];
      if (!dayHours || dayHours === 'closed') {
        convertedHours[day] = { open: '', close: '', closed: true };
      } else if (typeof dayHours === 'string' && dayHours.includes('-')) {
        const [open, close] = dayHours.split('-');
        convertedHours[day] = { open: open || '', close: close || '', closed: false };
      } else {
        convertedHours[day] = { open: '', close: '', closed: true };
      }
    });

    return convertedHours;
  };

  const [formData, setFormData] = useState({
    name: roaster?.name || '',
    description: roaster?.description || '',
    email: roaster?.email || '',
    phone: roaster?.phone || '',
    website: roaster?.website || '',
    address: roaster?.address || '',
    city: roaster?.city || '',
    state: roaster?.state || '',
    zipCode: roaster?.zipCode || '',
    country: roaster?.country || '',
    latitude: roaster?.latitude || '',
    longitude: roaster?.longitude || '',
    specialties: roaster?.specialties?.join(', ') || '',
    verified: roaster?.verified || false,
    featured: roaster?.featured || false,
    rating: roaster?.rating || 0,
    onlineOnly: roaster?.onlineOnly || false,
    hours: convertHoursFormat(roaster?.hours),
    ownerEmail: roaster?.owner?.email || '',
    images: roaster?.images || [],
  });

  // Fetch images when editing existing roaster
  const fetchImages = async () => {
    if (!roaster?.id) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/roasters/${roaster.id}/images`);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
        setImagesLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setImagesLoaded(true);
    }
  };

  // Load images when component mounts with existing roaster (delayed to prevent auto-trigger)
  React.useEffect(() => {
    if (roaster?.id && !imagesLoaded) {
      const timer = setTimeout(() => {
        fetchImages();
      }, 1000); // Delay to prevent auto-trigger
      
      return () => clearTimeout(timer);
    }
  }, [roaster?.id, imagesLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: newValue
      };
      
      // If onlineOnly is being checked, set all hours to closed
      if (name === 'onlineOnly' && newValue === true) {
        updatedData.hours = {
          monday: { closed: true, open: '', close: '' },
          tuesday: { closed: true, open: '', close: '' },
          wednesday: { closed: true, open: '', close: '' },
          thursday: { closed: true, open: '', close: '' },
          friday: { closed: true, open: '', close: '' },
          saturday: { closed: true, open: '', close: '' },
          sunday: { closed: true, open: '', close: '' }
        };
      }
      
      return updatedData;
    });
  };

  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => {
      const currentDay = (prev.hours as any)[day];
      let newValue = value;
      
      // Time validation logic
      if (field === 'open' && typeof value === 'string') {
        const closeTime = currentDay?.close;
        if (closeTime && value >= closeTime) {
          // If opening time is after closing time, adjust closing time
          const [hours, minutes] = value.split(':');
          const newCloseHour = Math.min(23, parseInt(hours) + 1);
          newValue = value;
          return {
            ...prev,
            hours: {
              ...prev.hours,
              [day]: {
                ...currentDay,
                open: newValue,
                close: `${newCloseHour.toString().padStart(2, '0')}:${minutes}`
              }
            }
          };
        }
      } else if (field === 'close' && typeof value === 'string') {
        const openTime = currentDay?.open;
        if (openTime && value <= openTime) {
          // If closing time is before opening time, don't allow it
          return prev;
        }
      }
      
      return {
        ...prev,
        hours: {
          ...prev.hours,
          [day]: {
            ...currentDay,
            [field]: newValue
          }
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Convert hours back to backend format
      const convertedHours: any = {};
      Object.entries(formData.hours as any).forEach(([day, dayData]: [string, any]) => {
        if (dayData.closed) {
          convertedHours[day] = 'closed';
        } else if (dayData.open && dayData.close) {
          convertedHours[day] = `${dayData.open}-${dayData.close}`;
        } else {
          convertedHours[day] = '';
        }
      });

      const payload = {
        ...formData,
        hours: convertedHours,
        latitude: formData.latitude ? parseFloat(String(formData.latitude)) : undefined,
        longitude: formData.longitude ? parseFloat(String(formData.longitude)) : undefined,
        rating: parseFloat(String(formData.rating)) || 0,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const url = roaster 
        ? `${apiUrl}/api/roasters/${roaster.id}`
        : `${apiUrl}/api/roasters`;
      
      const method = roaster ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Handle validation errors
          const errorMessages = errorData.errors.map((err: any) => err.msg).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(errorData.error || errorData.message || 'Failed to save roaster');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pt-20 sm:pt-28 px-4 sm:px-8 lg:px-32">
      <div className="mb-6 max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4">
          <button
            onClick={onCancel}
            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            ← {t('adminSection.roasters', 'Roasters')}
          </button>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {roaster 
            ? t('adminForms.roasters.editRoaster', 'Edit Roaster') 
            : t('admin.roasters.addTitle', 'Add Roaster')
          }
        </h1>
      </div>
      <div className="max-w-6xl mx-auto">

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 select-none">
                {t('adminForms.roasters.basicInformation', 'Basic Information')}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminForms.roasters.name', 'Name')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminForms.roasters.description', 'Description')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminForms.roasters.ownerEmail', 'Owner Email')}
                </label>
                <input
                  type="email"
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleInputChange}
                  placeholder={t('adminForms.roasters.ownerEmailPlaceholder', 'Leave blank for no owner')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminForms.roasters.email', 'Email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminForms.roasters.phone', 'Phone')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminForms.roasters.website', 'Website')}
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Location & Details */}
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 select-none">
                {t('adminForms.roasters.locationDetails', 'Location & Details')}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminForms.roasters.address', 'Address')}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('adminForms.roasters.city', 'City')}
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('adminForms.roasters.state', 'State')}
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.roasters.zipCode', 'Zip Code')}
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.roasters.country', 'Country')}
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.roasters.latitude', 'Latitude')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.roasters.longitude', 'Longitude')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Specialties Pane */}
          <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 select-none">
              {t('adminForms.roasters.specialties', 'Specialties')}
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('adminForms.roasters.specialties', 'Specialties')} 
                <span className="text-sm text-gray-500 ml-1">({t('adminForms.roasters.specialtiesHint', 'comma separated')})</span>
              </label>
              <input
                type="text"
                name="specialties"
                value={formData.specialties}
                onChange={handleInputChange}
                placeholder="espresso, pour over, cold brew"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Settings Pane - Online Only, Rating, Verified, Featured */}
          <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 select-none">
              {t('adminForms.roasters.settings', 'Settings')}
            </h3>
            
            <div className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminForms.roasters.rating', 'Rating')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Checkboxes on same line with responsive stacking */}
              <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-3 sm:space-y-0">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="verified"
                    checked={formData.verified}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    {t('adminForms.roasters.verified', 'Verified')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    {t('adminForms.roasters.featured', 'Featured')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="onlineOnly"
                    checked={formData.onlineOnly}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    {t('adminForms.roasters.onlineOnly', 'Online Only')}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Opening Hours Section - Only show if not online only */}
          {!formData.onlineOnly && (
            <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 select-none">
                {t('adminForms.roasters.hours.title', 'Opening Hours')}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {Object.entries(formData.hours as Record<string, any>).map(([day, dayHours]: [string, any]) => (
                  <div key={day} className="p-3 bg-white rounded-md space-y-2 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="w-full sm:w-24">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {t(`adminForms.roasters.hours.${day}`, day.charAt(0).toUpperCase() + day.slice(1))}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={dayHours?.closed || false}
                          onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">
                          {t('adminForms.roasters.hours.closed', 'Closed')}
                        </span>
                      </div>
                    </div>
                    {!dayHours?.closed && (
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 sm:pl-28">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600 w-12">
                            {t('adminForms.roasters.hours.open', 'Open')}:
                          </label>
                          <input
                            type="time"
                            value={dayHours?.open || '08:00'}
                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600 w-12">
                            {t('adminForms.roasters.hours.close', 'Close')}:
                          </label>
                          <input
                            type="time"
                            value={dayHours?.close || '18:00'}
                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images Section - Only show when editing existing roaster and images are loaded */}
          {roaster && roaster.id && imagesLoaded && (
            <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 select-none">
                {t('adminForms.roasters.uploadedImages', 'Uploaded Images')}
              </h3>
              <SimpleImageUpload
                roasterId={roaster.id}
                existingImages={images}
                onImagesUpdated={(updatedImages) => setImages(updatedImages)}
                canEdit={true}
              />
            </div>
          )}

          {/* URL Images Section - Show when editing existing roaster with URL images */}
          {roaster && roaster.id && (
            <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 select-none">
                {t('adminForms.roasters.urlImages', 'URL Images')} ({(formData.images || []).length})
              </h3>
              
              {/* Existing URL Images */}
              {formData.images && formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                        <img
                          src={convertToImageUrl(imageUrl)}
                          alt={`${formData.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log('Image failed to load:', convertToImageUrl(imageUrl));
                            // Try alternative format for Unsplash
                            if (imageUrl.includes('unsplash.com') && !e.currentTarget.src.includes('/images/default-cafe.svg')) {
                              const photoId = imageUrl.match(/\/photos\/([^/?#]+)/)?.[1];
                              if (photoId) {
                                e.currentTarget.src = `https://images.unsplash.com/${photoId}?w=800&h=600&fit=crop&auto=format&q=80`;
                                return;
                              }
                            }
                            e.currentTarget.src = '/images/default-cafe.svg';
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', convertToImageUrl(imageUrl));
                          }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) => {
                            const newImages = [...(formData.images || [])];
                            newImages[index] = e.target.value;
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="text-xs text-gray-600 bg-white border rounded px-2 py-1 w-full mr-2"
                          placeholder="Image URL"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = (formData.images || []).filter((_, i) => i !== index);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="text-red-500 hover:text-red-700 text-sm font-bold px-2 py-1"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New URL Image */}
              <div className="mb-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Add image URL (e.g., https://unsplash.com/photos/coffee-abc123def or direct URL)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const newUrl = input.value.trim();
                        if (newUrl && newUrl.startsWith('http')) {
                          const convertedUrl = convertToImageUrl(newUrl);
                          const newImages = [...(formData.images || []), convertedUrl];
                          setFormData({ ...formData, images: newImages });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const newUrl = input.value.trim();
                      if (newUrl && newUrl.startsWith('http')) {
                        const convertedUrl = convertToImageUrl(newUrl);
                        const newImages = [...(formData.images || []), convertedUrl];
                        setFormData({ ...formData, images: newImages });
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">ℹ️ About URL Images:</p>
                <p>Image URLs serve as fallback images when uploaded images are not accessible.</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-8 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {t('adminForms.roasters.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? t('adminForms.roasters.saving', 'Saving...') 
                : t('adminForms.roasters.save', 'Save')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRoastersPage;