'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
import { ResourceSummary } from '@/types'
import { YouTube } from '@mui/icons-material'

const typePillClass = (resourceType: string) => {
  switch (resourceType) {
    case 'website': return 'bg-green-600 text-white dark:bg-green-500 dark:text-white'
    case 'article': return 'bg-amber-600 text-white dark:bg-amber-500 dark:text-white'
    case 'community': return 'bg-pink-600 text-white dark:bg-pink-500 dark:text-white'
    case 'discovery_tool': return 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
    case 'app': return 'bg-emerald-700 text-white dark:bg-emerald-500 dark:text-white'
    case 'video': return 'bg-red-600 text-white dark:bg-red-500 dark:text-white'
    case 'book': return 'bg-orange-600 text-white dark:bg-orange-500 dark:text-white'
    case 'research': return 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white'
    case 'reference': return 'bg-teal-600 text-white dark:bg-teal-500 dark:text-white'
    case 'directory': return 'bg-violet-600 text-white dark:bg-violet-500 dark:text-white'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

const descriptionLineClamp = (resourceName: string) => {
  const estimatedTitleLines = Math.max(1, Math.ceil(resourceName.trim().length / 32))
  return Math.max(2, 6 - estimatedTitleLines)
}

export default function ResourcesPage() {
  const { t } = useTranslation()
  const [resources, setResources] = useState<ResourceSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.getResources()
      .then((data: any) => setResources(data.resources || []))
      .catch((error) => console.error('Failed to load resources:', error))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="mb-6 bg-gradient-to-r from-primary-700 to-orchid-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">{t('resources.title', 'Explore the coffee world')}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">{t('resources.subtitle', 'Discover the people, communities, publications, tools and other resources that help us learn about coffee and find roasters.')}</p>
        </header>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label={t('resources.loading', 'Loading resources')}>
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-2xl bg-white/70 dark:bg-gray-800" />)}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Link key={resource.id} href={`/resources/${resource.slug}`} className="group rounded-2xl border border-white/70 bg-white/85 p-6 shadow-lg transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${typePillClass(resource.resourceType)}`}>{t(`resources.types.${resource.resourceType === 'discovery_tool' ? 'discoveryTool' : resource.resourceType}`, resource.resourceType.replace('_', ' '))}</span>
                  {resource.platform && !(resource.resourceType === 'website' && resource.platform === 'Web') && <span className="text-sm text-gray-500 dark:text-gray-400">{resource.platform === 'YouTube' ? <YouTube fontSize="small" aria-label="YouTube" titleAccess="YouTube" /> : resource.platform}</span>}
                </div>
                <h2 className="mb-2 text-2xl font-semibold text-gray-900 group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-300">{resource.name}</h2>
                {(resource.city || resource.province || resource.country) && <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{[resource.city, resource.province, resource.country].filter(Boolean).join(', ')}</p>}
                {resource.description && (
                  <p
                    className="overflow-hidden text-gray-600 dark:text-gray-300"
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: descriptionLineClamp(resource.name),
                    }}
                  >
                    {resource.description}
                  </p>
                )}
                {resource._count && resource._count.roasters > 0 && <p className="mt-5 text-sm font-medium text-primary-700 dark:text-primary-300">{resource._count.roasters} {t('resources.discoveries', 'discovered roasters')}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
