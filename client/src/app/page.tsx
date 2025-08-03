'use client'

import { useRouter } from 'next/navigation'
import { Hero } from '@/components/Hero'
import { FeaturedRoasters } from '@/components/FeaturedRoasters'
import { SearchSection } from '@/components/SearchSection'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

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
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <SearchSection onSearch={handleSearch} />
      <FeaturedRoasters />
      <Footer />
    </main>
  )
}
