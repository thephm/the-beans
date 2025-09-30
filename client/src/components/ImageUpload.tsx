'use client';

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RoasterImage } from '@/types';
import RoasterImageComponent from '@/components/RoasterImage';

interface ImageUploadProps {
  roasterId: string;
  existingImages?: RoasterImage[];
  onImagesUpdated: (images: RoasterImage[]) => void;
  canEdit?: boolean;
}

export default function ImageUpload({ 
  roasterId, 
  existingImages = [], 
  onImagesUpdated, 
  canEdit = false 
}: ImageUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImages = async (files: File[]) => {
    if (!canEdit) return;
    
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roasters/${roasterId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload images');
      }

      const data = await response.json();
      
      // Fetch updated images list
      await fetchImages();
      
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roasters/${roasterId}/images`);
      if (response.ok) {
        const data = await response.json();
        onImagesUpdated(data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!canEdit) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roasters/${roasterId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }

      await fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete image');
    }
  };

  const setPrimaryImage = async (imageId: string) => {
    if (!canEdit) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roasters/${roasterId}/images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set primary image');
      }

      await fetchImages();
    } catch (error) {
      console.error('Error setting primary image:', error);
      setError(error instanceof Error ? error.message : 'Failed to set primary image');
    }
  };

  const updateImageDescription = async (imageId: string, description: string) => {
    if (!canEdit) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roasters/${roasterId}/images/${imageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update description');
      }

      await fetchImages();
    } catch (error) {
      console.error('Error updating description:', error);
      setError(error instanceof Error ? error.message : 'Failed to update description');
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || !canEdit) return;

    const validFiles: File[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        continue;
      }

      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      uploadImages(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('roaster.images.title', 'Roaster Images')}
        </h3>
        {canEdit && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? t('roaster.images.uploading', 'Uploading...') : t('roaster.images.addImages', 'Add Images')}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {canEdit && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-gray-600">
                <p className="text-lg">{t('roaster.images.dropImages', 'Drop images here or click to select')}</p>
                <p className="text-sm text-gray-500">{t('roaster.images.supportedFormats', 'Supports JPG, PNG, WebP (max 5MB each)')}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {existingImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {existingImages.map((image) => (
            <div key={image.id} className="group relative bg-white rounded-lg shadow-md overflow-hidden">
              <div className="aspect-w-16 aspect-h-9">
                <RoasterImageComponent
                  src={image.url}
                  alt={image.description || 'Roaster image'}
                  className="w-full h-48 object-cover"
                />
              </div>
              
              {image.isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                  {t('roaster.images.primary', 'Primary')}
                </div>
              )}

              <div className="p-4 space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder={t('roaster.images.description', 'Image description...')}
                    value={image.description || ''}
                    onChange={(e) => updateImageDescription(image.id, e.target.value)}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {canEdit && (
                  <div className="flex space-x-2">
                    {!image.isPrimary && (
                      <button
                        onClick={() => setPrimaryImage(image.id)}
                        className="flex-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
                      >
                        {t('roaster.images.setPrimary', 'Set Primary')}
                      </button>
                    )}
                    <button
                      onClick={() => deleteImage(image.id)}
                      className="flex-1 px-3 py-2 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                    >
                      {t('roaster.images.delete', 'Delete')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-2">{t('roaster.images.noImages', 'No images uploaded yet')}</p>
        </div>
      )}
    </div>
  );
}