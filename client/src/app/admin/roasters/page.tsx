"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Roaster } from '@/types';

const AdminRoastersPage: React.FC = () => {
  const { t } = useTranslation();
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchRoasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('http://localhost:5000/api/roasters', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch roasters');
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
      const res = await fetch(`http://localhost:5000/api/roasters/${id}`, { 
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

  const onFormSuccess = () => {
    setEditingId(null);
    setShowAddForm(false);
    fetchRoasters();
  };

  const onFormCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
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
    <div className="p-4 pt-28 pl-8 pr-8">
      <div className="mb-6 ml-4 mr-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Roasters</h1>
      </div>
      <div className="ml-4 mr-4">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleAdd}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-auto"
          >
            {t('admin.roasters.addNew', 'Add Roaster')}
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-gray-900">{t('admin.roasters.name', 'Name')}</th>
              <th className="py-3 px-4 text-left font-medium text-gray-900">{t('admin.roasters.location', 'Location')}</th>
              <th className="py-3 px-4 text-center font-medium text-gray-900">{t('admin.roasters.rating', 'Rating')}</th>
              <th className="py-3 px-4 text-center font-medium text-gray-900">{t('admin.roasters.verified', 'Verified')}</th>
              <th className="py-3 px-4 text-center font-medium text-gray-900">{t('admin.roasters.featured', 'Featured')}</th>
              <th className="py-3 px-4 text-center font-medium text-gray-900">{t('admin.roasters.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.isArray(roasters) && roasters.map((roaster) => (
              <tr key={roaster.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <Link
                    href={`/roasters/${roaster.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {roaster.name}
                  </Link>
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
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => handleEdit(roaster.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {t('admin.roasters.edit', 'Edit')}
                    </button>
                    <button
                      onClick={() => confirmDelete(roaster.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {t('admin.roasters.delete', 'Delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(String(formData.latitude)) : undefined,
        longitude: formData.longitude ? parseFloat(String(formData.longitude)) : undefined,
        rating: parseFloat(String(formData.rating)) || 0,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
      };

      const url = roaster 
        ? `http://localhost:5000/api/roasters/${roaster.id}`
        : 'http://localhost:5000/api/roasters';
      
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
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {roaster 
            ? t('admin.roasters.editTitle', 'Edit Roaster') 
            : t('admin.roasters.addTitle', 'Add New Roaster')
          }
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                {t('admin.roasters.basicInfo', 'Basic Information')}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.roasters.name', 'Name')} *
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
                  {t('admin.roasters.description', 'Description')}
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
                  {t('admin.roasters.email', 'Email')}
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
                  {t('admin.roasters.phone', 'Phone')}
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
                  {t('admin.roasters.website', 'Website')}
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                {t('admin.roasters.locationDetails', 'Location & Details')}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.roasters.address', 'Address')}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('admin.roasters.city', 'City')}
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
                    {t('admin.roasters.state', 'State')}
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.roasters.specialties', 'Specialties')} 
                  <span className="text-sm text-gray-500 ml-1">(comma separated)</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.roasters.rating', 'Rating')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="verified"
                    checked={formData.verified}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    {t('admin.roasters.verified', 'Verified')}
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
                  <label className="ml-2 block text-sm text-gray-700">
                    {t('admin.roasters.featured', 'Featured')}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {t('admin.roasters.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? t('admin.roasters.saving', 'Saving...') 
                : t('admin.roasters.save', 'Save')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRoastersPage;