'use client'

import { Coffee } from '@mui/icons-material'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50 via-white to-orchid-50">
      <div className="text-center">
        <div className="mb-4">
          <Coffee sx={{ fontSize: 96, color: '#6b7280' }} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors inline-block"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}
