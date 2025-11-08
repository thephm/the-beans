/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Keep for compatibility with image hosting
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },

    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.infrastructureLogging = {
        level: 'error',
      }
    }
    return config
  },
}

module.exports = nextConfig
