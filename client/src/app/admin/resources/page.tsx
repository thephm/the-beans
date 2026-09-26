'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
import { YouTube } from '@mui/icons-material'

const initialForm = { name: '', slug: '', url: '', resourceType: 'website', platform: 'Web', description: '', state: 'active' }

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

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const uniqueSlug = (name: string, resources: any[]) => {
  const base = slugify(name) || 'resource'
  const existingSlugs = new Set(resources.map((resource) => resource.slug))
  if (!existingSlugs.has(base)) return base

  let suffix = 2
  while (existingSlugs.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

const inferPlatform = (value: string) => {
  const url = value.toLowerCase()
  if (url.includes('reddit.com')) return 'Reddit'
  if (url.includes('discord.com') || url.includes('discord.gg')) return 'Discord'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube'
  if (url.includes('wikipedia.org')) return 'Wikipedia'
  if (url.includes('apps.apple.com')) return 'Apple App Store'
  if (url.includes('play.google.com')) return 'Google Play Store'
  return 'Web'
}

const isAppStorePlatform = (value: string) => value === 'Apple App Store' || value === 'Google Play Store'
const typeForPlatform = (value: string, currentType: string) => isAppStorePlatform(value) ? 'app' : value === 'Web' ? 'website' : value === 'Reddit' || value === 'Discord' ? 'community' : value === 'YouTube' ? 'video' : currentType

export default function AdminResourcesPage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [resources, setResources] = useState<any[]>([])
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)

  const loadResources = () => apiClient.getResources({ search: '', includeArchived: 'true' }).then((data: any) => setResources(data.resources || []))
  useEffect(() => { if (user?.role === 'admin') loadResources() }, [user])

  if (authLoading) return <main className="p-8 pt-28">{t('adminResources.loading', 'Loading...')}</main>
  if (!user || user.role !== 'admin') return <main className="p-8 pt-28">{t('adminResources.accessRequired', 'Admin access required.')}</main>

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const latest = await apiClient.getResources() as any
      const slug = uniqueSlug(form.name, latest.resources || resources)
      await apiClient.createResource({ ...form, slug })
      setForm(initialForm)
      setShowForm(false)
      setMessage(t('adminResources.created', 'Resource created.'))
      await loadResources()
    } catch (error: any) {
      setMessage(error.message || t('adminResources.createFailed', 'Could not create resource.'))
    } finally { setSaving(false) }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-28 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{t('adminResources.title', 'Resources')}</h1>
          {!showForm && <button type="button" onClick={() => { setShowForm(true); setMessage('') }} className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">+ {t('adminResources.add', 'Add')}</button>}
        </div>
        {showForm && <form onSubmit={submit} className="mb-10 grid gap-4 rounded-2xl bg-white p-6 shadow dark:bg-gray-800 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.name', 'Name')}</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: uniqueSlug(event.target.value, resources) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.slug', 'Slug')}</span><input required value={form.slug} readOnly className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300" /></label>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.url', 'URL')}</span><input required value={form.url} onChange={(event) => { const platform = inferPlatform(event.target.value); setForm({ ...form, url: event.target.value, platform, resourceType: typeForPlatform(platform, form.resourceType) }) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400" /></label>
          <label className="w-full text-sm font-medium text-gray-700 dark:text-gray-200 sm:max-w-xs"><span className="mb-1 block">{t('adminResources.platform', 'Platform')}</span><select value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value, resourceType: typeForPlatform(event.target.value, form.resourceType) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"><option>Web</option><option>Reddit</option><option>Discord</option><option>YouTube</option><option>Wikipedia</option><option>Apple App Store</option><option>Google Play Store</option></select></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.resourceType', 'Resource type')}</span><select value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"><option value="website">{t('resources.types.website', 'Website')}</option><option value="directory">{t('resources.types.directory', 'Directory')}</option><option value="community">{t('resources.types.community', 'Community')}</option><option value="app">{t('resources.types.app', 'App')}</option><option value="article">{t('resources.types.article', 'Article')}</option><option value="book">{t('resources.types.book', 'Book')}</option><option value="video">{t('resources.types.video', 'Video')}</option><option value="blog">{t('resources.types.blog', 'Blog')}</option><option value="publication">{t('resources.types.publication', 'Publication')}</option><option value="research">{t('resources.types.research', 'Research')}</option><option value="reference">{t('resources.types.reference', 'Reference')}</option><option value="discovery_tool">{t('resources.types.discoveryTool', 'Discovery tool')}</option><option value="other">{t('resources.types.other', 'Other')}</option></select></label>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.description', 'Description')}</span><textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400" /></label>
          <div className="sm:col-span-2 flex justify-end gap-3"><button type="button" onClick={() => { setShowForm(false); setMessage('') }} className="rounded-lg border border-gray-300 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">{t('common.cancel', 'Cancel')}</button><button disabled={saving} className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50">{saving ? t('adminResources.saving', 'Saving...') : t('common.save', 'Save')}</button></div>
          {message && <p className="self-center text-sm text-gray-600 dark:text-gray-300">{message}</p>}
        </form>}
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('adminResources.name', 'Name')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('adminResources.resourceTypeColumn', 'Resource type')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('adminResources.platform', 'Platform')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('adminResources.state', 'State')}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('adminResources.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {resources.map((resource) => {
                const isDeprecated = resource.state === 'archived'
                return (
                  <tr key={resource.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link href={`/admin/resources/${resource.id}`} className="font-medium text-primary-600 hover:underline dark:text-primary-400">{resource.name}</Link>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">/{resource.slug}</p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide ${typePillClass(resource.resourceType)}`}>{String(t(`resources.types.${resource.resourceType === 'discovery_tool' ? 'discoveryTool' : resource.resourceType}`, resource.resourceType))}</span></td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-900 dark:text-gray-100">{resource.platform === 'YouTube' ? <YouTube fontSize="small" aria-label="YouTube" titleAccess="YouTube" /> : resource.platform || 'Web'}</td>
                    <td className="whitespace-nowrap px-6 py-4"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${isDeprecated ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'}`}>{isDeprecated ? t('adminResources.deprecated', 'Deprecated') : t('adminResources.active', 'Active')}</span></td>
                    <td className="whitespace-nowrap px-6 py-4 text-left"><button onClick={async () => { if (isDeprecated) await apiClient.undeprecateResource(resource.id); else await apiClient.deprecateResource(resource.id); await loadResources() }} className={`rounded-lg border px-3 py-2 text-sm ${isDeprecated ? 'border-green-300 text-green-800 hover:bg-green-50 dark:border-green-700 dark:text-green-200 dark:hover:bg-green-900/30' : 'border-yellow-300 text-yellow-800 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-200 dark:hover:bg-yellow-900/30'}`}>{isDeprecated ? t('adminResources.undeprecate', 'Undeprecate') : t('adminResources.deprecate', 'Deprecate')}</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
