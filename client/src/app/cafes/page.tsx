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

  useEffect(() => {
    fetchCafes()
  }, [sortBy])

  const fetchCafes = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/cafes?sort=${sortBy}`)
      if (response.ok) {
        const data = await response.json()
        setCafes(data)
      }
    } catch (error) {
      console.error('Failed to fetch cafes:', error)
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
              Discover amazing cafes where you can enjoy freshly roasted coffee in a welcoming atmosphere.
            </p>
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <span className="text-gray-700 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="name">Name A-Z</option>
                <option value="-name">Name Z-A</option>
                <option value="-rating">Highest Rated</option>
                <option value="-reviewCount">Most Reviewed</option>
                <option value="city">Location</option>
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {cafes.length} cafes found
            </div>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cafes.map((cafe) => (
                <div key={cafe.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:scale-105">
                  <img
                    src={cafe.imageUrl}
                    alt={cafe.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{cafe.name}</h3>
                      <div className="flex items-center">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-gray-600 ml-1">{cafe.rating}</span>
                        <span className="text-gray-400 ml-1">({cafe.reviewCount})</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-2">📍 {cafe.city}, {cafe.state}</p>
                    <p className="text-gray-700 mb-4 line-clamp-2">{cafe.description}</p>
                    
                    {/* Roaster Link */}
                    <div className="mb-4">
                      <Link 
                        href={`/roasters/${cafe.roasterId}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        ☕ By {cafe.roasterName}
                      </Link>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {cafe.features.slice(0, 3).map((feature) => (
                        <span
                          key={feature}
                          className="px-3 py-1 bg-orchid-100 text-orchid-700 rounded-full text-sm"
                        >
                          {feature}
                        </span>
                      ))}
                      {cafe.features.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          +{cafe.features.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Hours */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">🕒 {cafe.hours}</p>
                    </div>

                    {/* Contact Info */}
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">📍 {cafe.address}</p>
                      {cafe.phone && (
                        <p className="text-sm text-gray-600 mb-2">📞 {cafe.phone}</p>
                      )}
                      {cafe.website && (
                        <a 
                          href={cafe.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          🌐 Visit Website
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 mt-4">
                      <Link
                        href={`/cafes/${cafe.id}`}
                        className="flex-1 bg-gradient-to-r from-primary-500 to-orchid-500 text-white text-center py-2 px-4 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        Visit Cafe 💜
                      </Link>
                      <button className="px-4 py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
                        ❤️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && cafes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">☕</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No cafes found</h3>
              <p className="text-gray-600 mb-6">We're constantly adding new cafes. Check back soon!</p>
              <Link
                href="/discover"
                className="inline-flex items-center bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
              >
                Discover Cafes 🔍
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
