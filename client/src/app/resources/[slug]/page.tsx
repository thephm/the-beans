'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
import { YouTube, Language, LinkedIn, Instagram } from '@mui/icons-material'

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

export default function ResourceDetailPage() {
  const { t } = useTranslation()
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const [resource, setResource] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.slug) return
    apiClient.getResource(params.slug)
      .then(setResource)
      .catch((error) => console.error('Failed to load resource:', error))
      .finally(() => setLoading(false))
  }, [params?.slug])

  if (loading) return <main className="min-h-screen bg-white px-4 pt-32 text-center dark:bg-gray-950 dark:text-white">{t('resources.loading', 'Loading resources')}</main>
  if (!resource) return <main className="min-h-screen bg-white px-4 pt-32 text-center dark:bg-gray-950 dark:text-white">{t('resources.notFound', 'Resource not found')}</main>

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 via-white to-orchid-50 dark:bg-gray-950 dark:bg-none">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <header className="mb-12 max-w-4xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${typePillClass(resource.resourceType)}`}>{resource.resourceType.replace('_', ' ')}</span>
            {resource.platform && !(resource.resourceType === 'website' && resource.platform === 'Web') && <span className="text-sm text-gray-500 dark:text-gray-400">{resource.platform === 'YouTube' ? <YouTube fontSize="small" aria-label="YouTube" titleAccess="YouTube" /> : resource.platform}</span>}
            {resource.state !== 'active' && <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{resource.state}</span>}
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">{resource.name}</h1>
          <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">{resource.description}</p>
          {resource.publisherRoaster && <p className="mb-6 text-gray-600 dark:text-gray-300">{t('resources.providedBy', 'Provided by')} <Link href={`/roasters/${resource.publisherRoaster.id}`} className="font-semibold text-primary-700 hover:underline dark:text-primary-300">{resource.publisherRoaster.name}</Link></p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => { if (window.history.length > 1) router.back(); else router.push('/resources') }} className="inline-flex min-h-11 items-center rounded-lg border border-primary-200 bg-white px-5 py-3 font-semibold text-primary-700 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-primary-800 dark:bg-gray-800 dark:text-primary-300 dark:hover:bg-gray-700">← {t('resources.backButton', 'Back')}</button>
            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">{t('resources.visit', 'Visit')} <span className="ml-2" aria-hidden="true">↗</span></a>
          </div>
        </header>

        {(resource.people?.length > 0 || resource.links?.length > 0 || resource.observations?.length > 0) && (
          <div className="mb-14 grid gap-8 lg:grid-cols-3">
            {resource.people?.length > 0 && <section><h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">{t('resources.people', 'People')}</h2><div className="space-y-3">{resource.people.map((entry: any) => {
              const socialLinks = [
                { key: 'website', url: entry.person.websiteUrl, Icon: Language, label: t('admin.people.websiteUrl', 'Website') },
                { key: 'linkedin', url: entry.person.linkedinUrl, Icon: LinkedIn, label: 'LinkedIn' },
                { key: 'instagram', url: entry.person.instagramUrl, Icon: Instagram, label: 'Instagram' },
              ].filter((social) => Boolean(social.url));

              return (
                <div key={entry.id} className="rounded-xl bg-white/80 p-4 shadow dark:bg-gray-800">
                  <p className="font-semibold text-gray-900 dark:text-white">{entry.person.name}</p>
                  <p className="text-sm text-primary-700 dark:text-primary-300">{entry.role}</p>
                  {socialLinks.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      {socialLinks.map(({ key, url, Icon, label }) => (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${entry.person.name} ${label}`}
                          title={label}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                        >
                          <Icon fontSize="small" aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}</div></section>}
            {resource.links?.length > 0 && <section><h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">{t('resources.links', 'Useful links')}</h2><div className="space-y-3">{resource.links.map((link: any) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-white/80 p-4 shadow hover:ring-2 hover:ring-primary-400 dark:bg-gray-800"><p className="font-semibold text-gray-900 dark:text-white">{link.title} <span aria-hidden="true">↗</span></p>{link.description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{link.description}</p>}</a>)}</div></section>}
            {resource.observations?.length > 0 && <section><h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">{t('resources.coverage', 'Coverage')}</h2><div className="space-y-3">{resource.observations.map((observation: any) => <div key={observation.id} className="rounded-xl bg-white/80 p-4 shadow dark:bg-gray-800"><p className="text-2xl font-semibold text-gray-900 dark:text-white">{observation.value.toLocaleString()}</p><p className="text-sm text-gray-600 dark:text-gray-300">{observation.observationType.replace('_', ' ')}{observation.observedAt ? ` · ${new Date(observation.observedAt).getFullYear()}` : ''}</p></div>)}</div></section>}
          </div>
        )}

      </div>
    </main>
  )
}
