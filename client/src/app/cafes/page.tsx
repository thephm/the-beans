'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Cafe {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  phone: string
  website: string
  hours: string
  rating: number
  reviewCount: number
  imageUrl: string
  roasterName: string
  roasterId: string
  features: string[]
}

export default function CafesPage() {
  const [cafes, setCafes] = useState<Cafe[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [favorites, setFavorites] = useState<string[]>([])

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteCafes') || '[]')
    setFavorites(savedFavorites)
  }, [])

  const toggleFavorite = (cafeId: string) => {
    let updatedFavorites
    if (favorites.includes(cafeId)) {
      updatedFavorites = favorites.filter(id => id !== cafeId)
    } else {
      updatedFavorites = [...favorites, cafeId]
    }
    
    setFavorites(updatedFavorites)
    localStorage.setItem('favoriteCafes', JSON.stringify(updatedFavorites))
  }

  // Add debugging to track state changes
  console.log('Render - cafes state:', {
    cafes,
    isArray: Array.isArray(cafes),
    length: cafes?.length,
    type: typeof cafes
  })

  useEffect(() => {
    fetchCafes()
  }, [sortBy])

  const fetchCafes = async () => {
    try {
      console.log('Fetching cafes...')
      const response = await fetch(`http://localhost:5000/api/cafes?sort=${sortBy}`)
      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', data)
        console.log('Cafes array:', data.cafes)
        console.log('Is array?', Array.isArray(data.cafes))
        // Handle the correct API response format
        const cafesArray = data.cafes || []
        console.log('Setting cafes to:', cafesArray)
        setCafes(cafesArray)
      } else {
        console.error('Failed to fetch cafes:', response.status)
        setCafes([])
      }
    } catch (error) {
      console.error('Failed to fetch cafes:', error)
      setCafes([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              Coffee Cafes
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find the perfect spot to enjoy freshly roasted coffee in a cozy atmosphere
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
              <option value="reviewCount">Sort by Reviews</option>
            </select>
          </div>

          {/* Cafes Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : Array.isArray(cafes) && cafes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cafes.map((cafe) => (
                <div key={cafe.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:scale-105">
                  <img
                    src={cafe.imageUrl}
                    alt={cafe.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-xl text-gray-900">{cafe.name}</h3>
                      <div className="flex items-center">
                        <span className="text-yellow-400">⭐</span>
                        <span className="ml-1 text-sm text-gray-600">{cafe.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{cafe.address}</p>
                    <p className="text-gray-600 text-sm mb-2">{cafe.city}, {cafe.state}</p>
                    <p className="text-gray-500 text-xs mb-4">{cafe.reviewCount} reviews</p>
                    <div className="flex space-x-2 mt-4">
                      <Link
                        href={`/cafes/${cafe.id}`}
                        className="flex-1 bg-gradient-to-r from-primary-500 to-orchid-500 text-white text-center py-2 px-4 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        Visit Cafe 💜
                      </Link>
                      <button 
                        onClick={() => toggleFavorite(cafe.id)}
                        className={`px-4 py-2 border rounded-lg transition-all transform hover:scale-105 ${
                          favorites.includes(cafe.id)
                            ? 'bg-red-100 border-red-300 text-red-600 hover:bg-red-200'
                            : 'border-primary-500 text-primary-600 hover:bg-primary-50'
                        }`}
                      >
                        {favorites.includes(cafe.id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">☕</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No cafes found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search criteria or check back later.</p>
              <button 
                onClick={fetchCafes}
                className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
