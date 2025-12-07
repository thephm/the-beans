'use client'

import { useRouter } from 'next/navigation'
import { Hero } from '@/components/Hero'
import { FeaturedRoasters } from '@/components/FeaturedRoasters'
import { SearchSection } from '@/components/SearchSection'

export default function Home() {
  const router = useRouter()

  const handleSearch = (searchQuery: string, location: string) => {
    // Navigate to discover page with search parameters
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim())
    }
    if (location.trim()) {
      params.set('location', location.trim())
    }
    
    const queryString = params.toString()
    const url = queryString ? `/discover?${queryString}` : '/discover'
    
    router.push(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none">
      <Hero />
      <SearchSection onSearch={handleSearch} />
      <FeaturedRoasters />
    </div>
  )
}
