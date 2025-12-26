'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, FiberManualRecord } from '@mui/icons-material'
import RoasterImage from './RoasterImage'

interface ImageData {
  id: string
  url: string
  description?: string
  isPrimary?: boolean
}

interface ImageCarouselProps {
  images: ImageData[]
  altPrefix: string
  className?: string
  height?: string
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ 
  images, 
  altPrefix,
  className = '',
  height = 'h-64 sm:h-80 lg:h-96'
}) => {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // If no images, show default
  const displayImages = images.length > 0 ? images : [{
    id: 'default',
    url: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&h=400&fit=crop&auto=format',
    description: 'Default roaster image'
  }]

  // Minimum swipe distance (in px) to trigger navigation
  const minSwipeDistance = 50

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === displayImages.length - 1 ? 0 : prevIndex + 1
    )
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0) // Reset touch end
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  // Only show navigation if there are multiple images
  const showNavigation = displayImages.length > 1

  return (
    <div 
      ref={containerRef}
      className={`relative ${height} ${className} overflow-hidden group`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Image Display */}
      <div className="relative w-full h-full">
        {displayImages.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <RoasterImage
              src={image.url}
              alt={image.description || `${altPrefix} - ${t('carousel.image')} ${index + 1}`}
              className="w-full h-full object-cover"
              width={800}
              height={400}
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay for better button visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-[1]" />

      {/* Navigation Buttons (Desktop) */}
      {showNavigation && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-[15]"
            aria-label={t('carousel.previous', 'Previous image')}
          >
            <ChevronLeft sx={{ fontSize: 24 }} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-[15]"
            aria-label={t('carousel.next', 'Next image')}
          >
            <ChevronRight sx={{ fontSize: 24 }} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showNavigation && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-[15]">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${
                index === currentIndex 
                  ? 'text-white scale-125' 
                  : 'text-white/50 hover:text-white/75'
              }`}
              aria-label={`${t('carousel.goToImage', 'Go to image')} ${index + 1}`}
            >
              <FiberManualRecord sx={{ fontSize: 12 }} />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      {showNavigation && (
        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium z-[15]">
          {currentIndex + 1} / {displayImages.length}
        </div>
      )}
    </div>
  )
}

export default ImageCarousel
