import React, { useState } from 'react';
import Image from 'next/image';

interface RoasterImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

const RoasterImage: React.FC<RoasterImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  width = 300, 
  height = 200 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Filter out image-specific classes for fallback div
  const fallbackClassName = className
    .split(' ')
    .filter(cls => !['object-cover', 'object-contain', 'object-fill'].includes(cls))
    .join(' ');
  
  // Handle undefined/null src values
  if (!src) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${fallbackClassName}`}
        style={{ width, height }}
      >
        <span className="text-sm font-medium">Image not available</span>
      </div>
    );
  }
  
  // With Cloudinary, all image URLs should be full URLs
  const imageUrl = src;

  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${fallbackClassName}`}
        style={{ width, height }}
      >
        <span className="text-sm font-medium">Image not available</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={() => setImageError(true)}
      crossOrigin="anonymous"
    />
  );
};

export default RoasterImage;