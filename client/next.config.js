/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export configuration for Render.com deployment
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
}

module.exports = nextConfig
