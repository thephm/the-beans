'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/ImageUpload';
import { Roaster, RoasterImage } from '@/types';
import { Warning, Lock } from '@mui/icons-material';

export default function EditRoasterImages() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [roaster, setRoaster] = useState<Roaster | null>(null);
  const [images, setImages] = useState<RoasterImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const roasterId = params?.id as string;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (roasterId) {
      fetchRoaster();
      fetchImages();
    }
  }, [roasterId, user]);

  const fetchRoaster = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roasters/${roasterId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roaster');
      }

      const data = await response.json();
      setRoaster(data);
      
      // Check if user can edit (admin or email match)
      const isAdmin = user?.role === 'admin';
      const emailMatch = data.email && user?.email && data.email === user.email;
      setCanEdit(isAdmin || emailMatch);
      
    } catch (error) {
      console.error('Error fetching roaster:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch roaster');
    }
  };

  const fetchImages = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roasters/${roasterId}/images`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const handleImagesUpdated = (updatedImages: RoasterImage[]) => {
    setImages(updatedImages);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !roaster) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="mb-4">
              <Warning sx={{ fontSize: 96, color: '#f59e0b' }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('roaster.edit.error', 'Error Loading Roaster')}
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('common.goBack', 'Go Back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="mb-4">
              <Lock sx={{ fontSize: 96, color: '#ef4444' }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('roaster.edit.unauthorized', 'Access Denied')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('roaster.edit.unauthorizedMessage', 'You do not have permission to edit this roaster.')}
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('common.goBack', 'Go Back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <nav className="mb-4">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              ← {t('common.back', 'Back')}
            </button>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('roaster.edit.manageImages', 'Manage Images')}
              </h1>
              <p className="text-gray-600 mt-1">
                {roaster.name}
              </p>
            </div>
            
            {user?.role === 'admin' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/admin/roasters?edit=${roasterId}`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  {t('roaster.edit.editDetails', 'Edit Details')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <ImageUpload
            roasterId={roasterId}
            existingImages={images}
            onImagesUpdated={handleImagesUpdated}
            canEdit={canEdit}
          />
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            {t('roaster.images.guidelines', 'Image Guidelines')}
          </h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• {t('roaster.images.guideline1', 'Upload high-quality images that showcase your roaster')}</li>
            <li>• {t('roaster.images.guideline2', 'Supported formats: JPG, PNG, WebP (max 5MB each)')}</li>
            <li>• <span className="font-medium">{t('roaster.images.recommendedSize', 'Recommended: 800×450px minimum for best quality')}</span></li>
            <li>• {t('roaster.images.guideline3', 'Set one image as primary for main display')}</li>
            <li>• {t('roaster.images.guideline4', 'Add descriptions for accessibility')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}