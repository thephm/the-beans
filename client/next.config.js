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
}

module.exports = nextConfig
