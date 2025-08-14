'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Cafe {
  id: string
  name: string
  description: string
  imageUrl: string
  city: string
  state: string
  address: string
  phone?: string
  website?: string
  email?: string
  rating: number
  reviewCount: number
  priceRange: string
  hours?: {
    [key: string]: string
  }
}

// Utility function to format time from 24-hour to 12-hour format with proper spacing
const formatTime = (timeString: string): string => {
  // Handle time ranges like "6:30-19:00"
  if (timeString.includes('-')) {
    const [startTime, endTime] = timeString.split('-');
    const formattedStart = format24HourTo12Hour(startTime.trim());
    const formattedEnd = format24HourTo12Hour(endTime.trim());
    return `${formattedStart} - ${formattedEnd}`;
  }
  
  return format24HourTo12Hour(timeString);
};

const format24HourTo12Hour = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export default function CafeDetail() {
  const params = useParams()
  const router = useRouter()
  const [cafe, setCafe] = useState<Cafe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (params?.id) {
      fetchCafe(params.id as string)
    }
  }, [params?.id])

  const fetchCafe = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5000/api/cafes/${id}`)
      
      if (!response.ok) {
        throw new Error('Cafe not found')
      }
      
      const data = await response.json()
      setCafe(data)
      
      // Check if cafe is in favorites
      const favorites = JSON.parse(localStorage.getItem('favoriteCafes') || '[]')
      setIsFavorite(favorites.includes(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cafe')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = () => {
    if (!cafe) return
    
    const favorites = JSON.parse(localStorage.getItem('favoriteCafes') || '[]')
    let updatedFavorites
    
    if (isFavorite) {
      updatedFavorites = favorites.filter((id: string) => id !== cafe.id)
    } else {
      updatedFavorites = [...favorites, cafe.id]
    }
    
    localStorage.setItem('favoriteCafes', JSON.stringify(updatedFavorites))
    setIsFavorite(!isFavorite)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-96 bg-gray-200"></div>
              <div className="p-8">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !cafe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">☕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cafe Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The cafe you\'re looking for doesn\'t exist.'}</p>
            <Link
              href="/cafes"
              className="inline-flex items-center bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
            >
              ← Back to Cafes
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href="/cafes" 
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← All Cafes
          </Link>
        </nav>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-96">
            <img
              src={cafe.imageUrl}
              alt={cafe.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-4xl font-bold mb-2">{cafe.name}</h1>
              <p className="text-xl">📍 {cafe.city}, {cafe.state}</p>
            </div>
            <button
              onClick={toggleFavorite}
              className={`absolute top-6 right-6 p-3 rounded-full ${
                isFavorite 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-red-500 hover:bg-red-50'
              } shadow-lg transition-all transform hover:scale-110`}
            >
              ❤️
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2">
                {/* Rating & Reviews */}
                <div className="flex items-center mb-6">
                  <div className="flex items-center mr-6">
                    <span className="text-yellow-400 text-2xl">⭐</span>
                    <span className="text-2xl font-bold ml-2">{cafe.rating}</span>
                    <span className="text-gray-500 ml-2">({cafe.reviewCount} reviews)</span>
                  </div>
                  {cafe.priceRange && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {cafe.priceRange}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="mb-8">
                  <p className="text-gray-700 leading-relaxed">{cafe.description}</p>
                </div>

                {/* Hours */}
                {cafe.hours && (
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Hours</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(
                        typeof cafe.hours === 'string' 
                          ? JSON.parse(cafe.hours) 
                          : cafe.hours
                      ).map(([day, hours]) => (
                        <div key={day} className="flex items-center py-1">
                          <span className="font-medium text-gray-700 capitalize w-24">{day}:</span>
                          <span className="text-gray-600 ml-2">{formatTime(String(hours))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6 sticky top-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Visit Info</h3>
                  
                  {/* Address */}
                  <div className="mb-4">
                    <div className="flex items-start">
                      <span className="text-lg mr-2">📍</span>
                      <div>
                        <p className="font-medium text-gray-900">Address</p>
                        <p className="text-gray-600">{cafe.address}</p>
                        <p className="text-gray-600">{cafe.city}, {cafe.state}</p>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  {cafe.phone && (
                    <div className="mb-4">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">📞</span>
                        <div>
                          <p className="font-medium text-gray-900">Phone</p>
                          <a 
                            href={`tel:${cafe.phone}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {cafe.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {cafe.website && (
                    <div className="mb-4">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">🌐</span>
                        <div>
                          <p className="font-medium text-gray-900">Website</p>
                          <a 
                            href={cafe.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700"
                          >
                            Visit Website
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {cafe.email && (
                    <div className="mb-6">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">✉️</span>
                        <div>
                          <p className="font-medium text-gray-900">Email</p>
                          <a 
                            href={`mailto:${cafe.email}`}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            {cafe.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={toggleFavorite}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all transform hover:scale-105 ${
                        isFavorite
                          ? 'bg-red-100 text-red-700 border-2 border-red-300 hover:bg-red-200'
                          : 'bg-white border-2 border-red-300 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
                    </button>
                    
                    {cafe.website && (
                      <a
                        href={cafe.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-gradient-to-r from-primary-500 to-orchid-500 text-white text-center py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        Visit Website 🌐
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
