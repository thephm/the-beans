'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchSection } from '@/components/SearchSection'

interface Roaster {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  specialties: string[]
  rating: number
  distance: number
  imageUrl: string
}

export default function DiscoverPage() {
  const searchParams = useSearchParams()
  const [roasters, setRoasters] = useState<Roaster[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    specialty: '',
    distance: 25
  })

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    const urlLocation = searchParams.get('location') || ''
    
    setFilters(prev => ({
      ...prev,
      search: urlSearch,
      location: urlLocation
    }))
  }, [searchParams])

  const searchRoasters = async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      if (filters.search) searchParams.append('search', filters.search)
      if (filters.location) searchParams.append('location', filters.location)
      if (filters.specialty) searchParams.append('specialty', filters.specialty)
      searchParams.append('distance', filters.distance.toString())

      const response = await fetch(`http://localhost:5000/api/search/roasters?${searchParams}`)
      if (response.ok) {
        const data = await response.json()
        setRoasters(data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only search when filters have been initialized (including from URL params)
    if (filters.search || filters.location || filters.specialty) {
      searchRoasters()
    } else {
      // If no filters are set, still do an initial search to show all roasters
      searchRoasters()
    }
  }, [filters.search, filters.location, filters.specialty, filters.distance])

  // Remove the debounced search effect since we're handling it in the main effect
  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     searchRoasters()
  //   }, 500) // Debounce search by 500ms
    
  //   return () => clearTimeout(timeoutId)
  // }, [filters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="pt-32 pb-16">{/* Increased from pt-24 to pt-32 to account for fixed navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              Discover Coffee Roasters
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find the perfect coffee roaster near you.
            </p>
          </div>

          {/* Search Section */}
          <div className="mb-12">
            <SearchSection 
              searchQuery={filters.search}
              location={filters.location}
              onSearchQueryChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
              onLocationChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
              onSearch={(searchQuery, location) => {
                setFilters(prev => ({ ...prev, search: searchQuery, location: location }))
                searchRoasters()
              }}
            />
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : roasters.length > 0 ? (
              roasters.map((roaster) => (
                <div key={roaster.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <img
                    src={roaster.imageUrl}
                    alt={roaster.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{roaster.name}</h3>
                      <div className="flex items-center">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-gray-600 ml-1">{roaster.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">📍 {roaster.city}, {roaster.state}</p>
                    <p className="text-gray-700 mb-4">{roaster.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {roaster.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                        >
                          ☕ {specialty}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">📍 {roaster.distance} miles</span>
                      <button className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
                        View Details 💜
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">☕</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No roasters found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or location.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
// force recompile
