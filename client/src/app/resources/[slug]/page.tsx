'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
<<<<<<< HEAD
import { useAuth } from '@/contexts/AuthContext'
import { YouTube, Language, LinkedIn, Instagram } from '@mui/icons-material'
=======
import { YouTube, Language, LinkedIn, Instagram, Facebook, Pinterest, Reddit } from '@mui/icons-material'
import { SvgIcon, type SvgIconProps } from '@mui/material'

const ThreadsIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 192 192">
    <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.037l13.779 9.452c5.73-8.695 14.717-10.816 21.348-10.816h.229c7.67.081 13.861 2.544 17.916 7.146 3.353 3.81 5.583 9.139 6.666 15.926a73 73 0 0 0-6.597-1.018c-11.567-1.376-21.536-.962-28.85 1.191-9.617 2.832-17.092 8.639-21.645 16.828-3.688 6.636-4.918 14.415-3.557 22.495 1.45 8.622 5.798 16.286 12.229 21.563 6.235 5.117 14.272 7.708 23.251 7.708h.052c14.86 0 27.032-7.442 32.24-19.745 2.455-5.798 3.717-12.534 3.743-20.036v-1.21c4.699 2.732 8.476 6.22 11.154 10.343 4.201 6.467 5.987 14.371 5.309 23.498-.69 9.288-4.04 17.827-9.439 24.04-5.395 6.208-12.523 10.12-20.635 11.328a42 42 0 0 1-7.397.665c-15.818 0-30.241-9.801-39.462-26.82l-14.854 7.67c11.544 21.34 30.656 34.188 52.59 34.188 2.98 0 5.96-.242 8.892-.728 10.766-1.79 20.447-7.175 28.043-15.593 7.593-8.424 12.223-19.633 13.043-31.575.964-13.984-2.043-25.866-8.936-35.313-4.201-5.757-9.63-10.477-16.123-14.018zm-27.688 40.586c-2.233 5.274-7.087 8.458-13.394 8.796h-.379c-4.646 0-8.542-1.494-11.253-4.318-2.668-2.775-4.114-6.528-4.69-10.854-.577-4.336.086-8.411 1.92-11.799 2.378-4.389 6.448-7.652 11.785-9.447 2.966-.997 6.444-1.497 10.329-1.497 2.37 0 4.847.175 7.388.519v1.668c-.02 6.215-.892 11.626-2.706 16.932" />
  </SvgIcon>
)

const BlueskyIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
  </SvgIcon>
)

const XIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </SvgIcon>
)

const socialIconMap: Record<string, { Icon: ComponentType<SvgIconProps>; label: string }> = {
  instagram: { Icon: Instagram, label: 'Instagram' },
  facebook: { Icon: Facebook, label: 'Facebook' },
  linkedin: { Icon: LinkedIn, label: 'LinkedIn' },
  youtube: { Icon: YouTube, label: 'YouTube' },
  threads: { Icon: ThreadsIcon, label: 'Threads' },
  pinterest: { Icon: Pinterest, label: 'Pinterest' },
  bluesky: { Icon: BlueskyIcon, label: 'Bluesky' },
  x: { Icon: XIcon, label: 'X' },
  twitter: { Icon: XIcon, label: 'X' },
  reddit: { Icon: Reddit, label: 'Reddit' },
}

const isSafeSocialUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const getResourceSocialLinks = (socialNetworks: unknown) => {
  const resourceSocials = typeof socialNetworks === 'object' && socialNetworks !== null
    ? { ...(socialNetworks as Record<string, unknown>) }
    : {}

  if (typeof resourceSocials.x !== 'string' && typeof resourceSocials.twitter === 'string') {
    resourceSocials.x = resourceSocials.twitter
  }
  delete resourceSocials.twitter

  return Object.entries(resourceSocials).flatMap(([key, url]) => {
    if (!socialIconMap[key] || typeof url !== 'string') return []
    const trimmedUrl = url.trim()
    if (!trimmedUrl || !isSafeSocialUrl(trimmedUrl)) return []
    return [{ key, url: trimmedUrl, ...socialIconMap[key] }]
  })
}
>>>>>>> 24e20ae6354bda6defd8904898578dcf88c6a7e1

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
  const { user } = useAuth()
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

  const socialLinks = getResourceSocialLinks(resource.socialNetworks)

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
          {socialLinks.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">{t('resources.socials', 'Socials')}</p>
              <div className="flex flex-wrap items-center gap-2">
                {socialLinks.map(({ key, url, Icon, label }) => (
                  <a
                    key={`${key}-${url}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${resource.name} ${label}`}
                    title={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow transition-colors hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  >
                    <Icon fontSize="small" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => { if (window.history.length > 1) router.back(); else router.push('/resources') }} className="inline-flex min-h-11 items-center rounded-lg border border-primary-200 bg-white px-5 py-3 font-semibold text-primary-700 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-primary-800 dark:bg-gray-800 dark:text-primary-300 dark:hover:bg-gray-700">← {t('resources.backButton', 'Back')}</button>
            {user?.role === 'admin' && <Link href={`/admin/resources/${resource.id}?returnTo=${encodeURIComponent(`/resources/${resource.slug}`)}`} className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-all transform hover:scale-105 hover:bg-blue-700">{t('resources.edit', 'Edit')}</Link>}
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
