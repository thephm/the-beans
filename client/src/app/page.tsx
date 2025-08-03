import { Hero } from '@/components/Hero'
import { FeaturedRoasters } from '@/components/FeaturedRoasters'
import { SearchSection } from '@/components/SearchSection'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <SearchSection />
      <FeaturedRoasters />
      <Footer />
    </main>
  )
}
