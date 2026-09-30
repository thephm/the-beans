'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
import SocialNetworksFields from '@/components/SocialNetworksFields'
import ResourcePeopleSection from '@/components/ResourcePeopleSection'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { countDefinedSocialNetworks, emptySocialNetworks, socialNetworksToPayload } from '@/lib/socials'

const platforms = ['Web', 'Reddit', 'Discord', 'YouTube', 'Wikipedia', 'Apple App Store', 'Google Play Store']
const resourceTypes = ['website', 'directory', 'community', 'app', 'article', 'book', 'video', 'blog', 'publication', 'research', 'reference', 'discovery_tool', 'other']
const initialForm = { name: '', slug: '', url: '', resourceType: 'website', platform: 'Web', description: '', adminNotes: '', state: 'active', socialNetworks: emptySocialNetworks(), people: [] as any[] }

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

export default function AdminResourceCreatePage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [resources, setResources] = useState<any[]>([])
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showSocials, setShowSocials] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') return
    apiClient.getResources({ includeArchived: 'true' })
      .then((data: any) => setResources(data.resources || []))
      .catch((error: any) => setMessage(error.message || t('adminResources.createFailed', 'Could not create resource.')))
  }, [user?.role, t])

  if (authLoading) return <main className="p-8 pt-28 text-gray-900 dark:text-gray-100">{t('adminResources.loading', 'Loading...')}</main>
  if (!user || user.role !== 'admin') return <main className="p-8 pt-28 text-gray-900 dark:text-gray-100">{t('adminResources.accessRequired', 'Admin access required.')}</main>

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const latest = await apiClient.getResources() as any
      const slug = uniqueSlug(form.name, latest.resources || resources)
      const createdResource: any = await apiClient.createResource({ ...form, slug, people: undefined, socialNetworks: socialNetworksToPayload(form.socialNetworks) })
      await Promise.all(form.people.filter((entry: any) => entry.person?.name).map((entry: any) => apiClient.linkResourcePerson(createdResource.id, {
        role: entry.role || 'other',
        person: entry.person,
      })))
      router.push('/admin/resources')
      router.refresh()
    } catch (error: any) {
      setMessage(error.message || t('adminResources.createFailed', 'Could not create resource.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-28 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4 px-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{t('adminResources.addTitle', 'Add resource')}</h1>
        </div>
        <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-6 shadow dark:bg-gray-800 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.name', 'Name')}</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value, slug: uniqueSlug(event.target.value, resources) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.slug', 'Slug')}</span><input required value={form.slug} readOnly className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300" /></label>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.url', 'URL')}</span><input required value={form.url} onChange={(event) => { const platform = inferPlatform(event.target.value); setForm({ ...form, url: event.target.value, platform, resourceType: typeForPlatform(platform, form.resourceType) }) }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400" /></label>
          <label className="w-full text-sm font-medium text-gray-700 dark:text-gray-200 sm:max-w-xs"><span className="mb-1 block">{t('adminResources.platform', 'Platform')}</span><select value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value, resourceType: typeForPlatform(event.target.value, form.resourceType) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">{platforms.map((platform) => <option key={platform}>{platform}</option>)}</select></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.resourceType', 'Type')}</span><select value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">{resourceTypes.map((type) => <option key={type} value={type}>{t(`resources.types.${type === 'discovery_tool' ? 'discoveryTool' : type}`, type)}</option>)}</select></label>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.description', 'Description')}</span><textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400" /></label>
          <section className="sm:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700" aria-labelledby="resource-socials-heading">
            <button type="button" aria-expanded={showSocials} aria-controls="resource-socials-fields" onClick={() => setShowSocials((visible) => !visible)} className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60">
              <span id="resource-socials-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('adminResources.socials', 'Socials')}</span>
              <span className="inline-flex min-w-6 justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">{countDefinedSocialNetworks(form.socialNetworks)}</span>
              <ExpandMore aria-hidden="true" className={`ml-auto text-gray-600 transition-transform dark:text-gray-300 ${showSocials ? 'rotate-180' : ''}`} />
            </button>
            <div id="resource-socials-fields" hidden={!showSocials} className="px-4 pb-4"><SocialNetworksFields values={form.socialNetworks} onChange={(socialNetworks) => setForm({ ...form, socialNetworks })} idPrefix="resource-new-social" /></div>
          </section>
          <ResourcePeopleSection people={form.people} onChange={(people) => setForm((currentForm) => ({ ...currentForm, people }))} />
          <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.observations', 'Observations')}</span><textarea rows={3} value={form.adminNotes} onChange={(event) => setForm({ ...form, adminNotes: event.target.value })} className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400" /><span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">{t('adminResources.observationsPrivate', 'These observations are private and are not shown to end users.')}</span></label>
          <div className="sm:col-span-2 flex justify-end gap-3"><button type="button" onClick={() => router.push('/admin/resources')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-2 rounded-lg shadow disabled:opacity-70 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600" disabled={saving}>{t('common.cancel', 'Cancel')}</button><button disabled={saving} className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50">{saving ? t('adminResources.saving', 'Saving...') : t('common.save', 'Save')}</button></div>
          {message && <p className="self-center text-sm text-gray-600 dark:text-gray-300">{message}</p>}
        </form>
      </div>
    </main>
  )
}