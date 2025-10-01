'use client';

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RoasterImage } from '@/types';
import RoasterImageComponent from './RoasterImage';

interface SimpleImageUploadProps {
  roasterId: string;
  existingImages?: RoasterImage[];
  onImagesUpdated: (images: RoasterImage[]) => void;
  canEdit?: boolean;
}

export default function SimpleImageUpload({ 
  roasterId, 
  existingImages = [], 
  onImagesUpdated, 
  canEdit = false 
}: SimpleImageUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canEdit || uploading) return;
    
    // Extra safety check
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        // Minimum dimensions for good quality display (16:9 aspect ratio minimum)
        const minWidth = 800;
        const minHeight = 450;
        
        if (img.width < minWidth || img.height < minHeight) {
          setError(`Images must be at least ${minWidth}x${minHeight} pixels for best quality`);
          resolve(false);
        } else {
          resolve(true);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setError('Invalid image file');
        resolve(false);
      };
      
      img.src = objectUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.target.files;
    if (!files || !canEdit) return;

    setUploading(true);
    setError(null);

    try {
      // Validate files before upload
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

        // Validate dimensions
        const isDimensionsValid = await validateImageDimensions(file);
        if (!isDimensionsValid) {
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        setUploading(false);
        return;
      }

      const formData = new FormData();
      validFiles.forEach((file) => {
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

      // Fetch updated images
      await fetchImages();
      
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        throw new Error('Failed to delete image');
      }

      await fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image');
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

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="mb-4">
          <div className="flex items-center justify-end">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? t('adminForms.roasters.saving', 'Uploading...') : t('adminForms.roasters.addImages', 'Add Images')}
            </button>
          </div>
          <p className="text-base text-gray-600 mt-2 text-right font-medium">
            {t('adminForms.roasters.imageGuidelines', 'Recommended: 800×450px minimum • JPG, PNG, WebP • Max 5MB each')}
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {existingImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {existingImages.map((image) => (
            <div key={image.id} className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all">
              <div className="aspect-w-16 aspect-h-9">
                <RoasterImageComponent
                  src={image.url}
                  alt={image.description || 'Roaster image'}
                  className="w-full h-48 object-cover"
                  width={300}
                  height={192}
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
                    defaultValue={image.description || ''}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                
                {canEdit && (
                  <div className="mt-2 flex space-x-2">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(image.id)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        {t('roaster.images.setPrimary', 'Set Primary')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteImage(image.id)}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
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
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}