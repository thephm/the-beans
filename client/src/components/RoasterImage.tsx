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
  
  // If src is just a filename, construct the full backend URL
  const imageUrl = src.includes('http') 
    ? src 
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/${src}`;

  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}
        style={{ width, height }}
      >
        Image not available
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