import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-transparent mb-6">
              About The Beans
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connecting coffee lovers with exceptional roasters and cafes in their community.
            </p>
          </div>

          {/* Mission Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-orchid-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">☕</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            </div>
            <p className="text-lg text-gray-700 text-center leading-relaxed">
              We believe that great coffee is more than just a beverage—it's a community experience. 
              The Beans connects coffee enthusiasts with local artisanal roasters and welcoming cafes, 
              fostering relationships between passionate coffee makers and the people who appreciate their craft.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 text-xl">🗺️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Discover Local</h3>
              <p className="text-gray-600">
                Find amazing coffee roasters and cafes in your neighborhood and beyond.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-orchid-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-orchid-600 text-xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Build Community</h3>
              <p className="text-gray-600">
                Connect with fellow coffee lovers and share your favorite discoveries.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-lavender-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-lavender-600 text-xl">⭐</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality First</h3>
              <p className="text-gray-600">
                Every roaster and cafe in our platform is carefully curated for excellence.
              </p>
            </div>
          </div>

          {/* Story Section */}
          <div className="bg-gradient-to-r from-primary-500 to-orchid-500 rounded-2xl p-8 text-white mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg leading-relaxed mb-4">
                The Beans was born from a simple frustration: finding truly exceptional coffee shouldn't be hard. 
                As coffee enthusiasts ourselves, we noticed that the best roasters and cafes were often hidden gems, 
                known only to locals or discovered by chance.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                We created The Beans to change that. Our platform brings together passionate coffee roasters, 
                welcoming cafe owners, and curious coffee lovers in one beautiful, easy-to-use community.
              </p>
              <p className="text-lg leading-relaxed">
                Whether you're searching for that perfect espresso blend, looking for a cozy cafe to work from, 
                or wanting to discover what's brewing in your neighborhood, The Beans is your guide to coffee excellence.
              </p>
            </div>
          </div>

          {/* Values Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-primary-600 mb-3">🌱 Sustainability</h3>
                <p className="text-gray-700">
                  We champion roasters and cafes that prioritize ethical sourcing, fair trade practices, 
                  and environmental responsibility.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-orchid-600 mb-3">🤝 Community</h3>
                <p className="text-gray-700">
                  Coffee brings people together. We foster connections between coffee makers and coffee lovers 
                  that extend beyond transactions.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-lavender-600 mb-3">✨ Quality</h3>
                <p className="text-gray-700">
                  We believe everyone deserves exceptional coffee. That's why we carefully curate every 
                  roaster and cafe on our platform.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary-600 mb-3">🚀 Innovation</h3>
                <p className="text-gray-700">
                  We're constantly improving our platform to make discovering and enjoying great coffee 
                  easier and more delightful.
                </p>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Meet the Team</h2>
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-orchid-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-4xl">☕</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Coffee Enthusiasts</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We're a small but passionate team of coffee lovers, designers, and developers who believe 
                that great coffee experiences should be accessible to everyone. Our diverse backgrounds 
                in technology, hospitality, and coffee culture inform everything we build.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Discover Amazing Coffee?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join our community and start exploring the best coffee your area has to offer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/discover"
                className="bg-gradient-to-r from-primary-500 to-orchid-500 text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 text-lg"
              >
                Start Exploring 🔍
              </Link>
              <Link
                href="/signup"
                className="border-2 border-primary-500 text-primary-600 px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors text-lg"
              >
                Join the Community 💜
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
