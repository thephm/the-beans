'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'

const platforms = ['Web', 'Reddit', 'Discord', 'YouTube', 'Wikipedia', 'Apple App Store', 'Google Play Store']
const resourceTypes = ['website', 'directory', 'community', 'app', 'article', 'book', 'video', 'blog', 'publication', 'research', 'reference', 'discovery_tool', 'other']
const isAppStorePlatform = (value: string) => value === 'Apple App Store' || value === 'Google Play Store'
const typeForPlatform = (value: string, currentType: string) => isAppStorePlatform(value) ? 'app' : value === 'Web' ? 'website' : value === 'Reddit' || value === 'Discord' ? 'community' : value === 'YouTube' ? 'video' : currentType

export default function AdminResourceEditPage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [providerRoasters, setProviderRoasters] = useState<any[]>([])
  const [providerSearch, setProviderSearch] = useState('')

  useEffect(() => {
    if (!user?.role || !params?.id) return
    apiClient.getResources({ includeArchived: 'true' }).then((data: any) => {
      const resource = (data.resources || []).find((item: any) => item.id === params.id)
      if (!resource) throw new Error(t('adminResources.notFound', 'Resource not found.'))
      return apiClient.getResource(resource.slug)
    }).then((resource: any) => {
      setProviderRoasters(resource.publisherRoaster ? [resource.publisherRoaster] : [])
      setForm({
      id: resource.id,
      name: resource.name || '',
      slug: resource.slug || '',
      url: resource.url || '',
      resourceType: resource.resourceType || 'website',
      platform: resource.platform || 'Web',
      description: resource.description || '',
      state: resource.state || 'active',
      people: resource.people || [],
      publisherRoasterId: resource.publisherRoaster?.id || ''
      })
    }).catch((error: any) => setMessage(error.message)).finally(() => setLoading(false))
  }, [params?.id, user?.role, t])

  useEffect(() => {
    if (!providerSearch.trim()) return
    const timer = setTimeout(() => {
      apiClient.getRoasters({ search: providerSearch, limit: 10 })
        .then((data: any) => setProviderRoasters(data.roasters || []))
        .catch(() => setProviderRoasters([]))
    }, 250)
    return () => clearTimeout(timer)
  }, [providerSearch])

  if (authLoading || loading) return <main className="p-8 pt-28 text-gray-900 dark:text-gray-100">{t('adminResources.loading', 'Loading...')}</main>
  if (!user || user.role !== 'admin') return <main className="p-8 pt-28 text-gray-900 dark:text-gray-100">{t('adminResources.accessRequired', 'Admin access required.')}</main>
  if (!form) return <main className="p-8 pt-28 text-gray-900 dark:text-gray-100">{message || t('adminResources.notFound', 'Resource not found.')}</main>

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await apiClient.updateResource(form.id, {
        name: form.name,
        url: form.url,
        resourceType: form.resourceType,
        platform: form.platform,
        description: form.description,
        state: form.state,
        publisherRoasterId: form.publisherRoasterId || null
      })
      router.push('/admin/resources')
    } catch (error: any) {
      setMessage(error.message || t('adminResources.updateFailed', 'Could not update resource.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-28 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{t('adminResources.editTitle', 'Edit resource')}</h1>
        </div>
        <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-6 shadow dark:bg-gray-800 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.name', 'Name')}</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.slug', 'Slug')}</span><input readOnly value={form.slug} className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300" /></label>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.url', 'URL')}</span><input required value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" /></label>
          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.platform', 'Platform')}</span><select value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value, resourceType: typeForPlatform(event.target.value, form.resourceType) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">{platforms.map((platform) => <option key={platform}>{platform}</option>)}</select></label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.resourceType', 'Resource type')}</span><select value={form.resourceType} onChange={(event) => setForm({ ...form, resourceType: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">{resourceTypes.map((type) => <option key={type} value={type}>{t(`resources.types.${type === 'discovery_tool' ? 'discoveryTool' : type}`, type)}</option>)}</select></label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.state', 'State')}</span><select value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"><option value="active">{t('adminResources.active', 'Active')}</option><option value="archived">{t('adminResources.deprecated', 'Deprecated')}</option><option value="inactive">{t('adminResources.inactive', 'Inactive')}</option><option value="closed">{t('adminResources.closed', 'Closed')}</option><option value="unknown">{t('adminResources.unknown', 'Unknown')}</option></select></label>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
              <label htmlFor="resource-provider-search" className="mb-1 block">{t('adminResources.providerRoaster', 'Roaster providing this resource')}</label>
              <input id="resource-provider-search" value={providerSearch} onChange={(event) => setProviderSearch(event.target.value)} placeholder={t('adminResources.providerLookup', 'Search roasters')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" />
              {providerRoasters.length > 0 && <div className="mt-2 space-y-2">{providerRoasters.map((roaster) => <button type="button" key={roaster.id} onClick={() => { setForm({ ...form, publisherRoasterId: roaster.id }); setProviderSearch(roaster.name) }} className={`block w-full rounded-lg px-3 py-2 text-left ${form.publisherRoasterId === roaster.id ? 'bg-green-100 font-semibold text-green-900 dark:bg-green-900/50 dark:text-green-100' : 'bg-white text-gray-800 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-600'}`}>{roaster.name}{roaster.city ? ` - ${roaster.city}` : ''}</button>)}</div>}
            </div>
            <label className="flex cursor-pointer items-start gap-3 pt-2 text-sm font-medium text-gray-700 dark:text-gray-200"><input type="checkbox" checked={form.state === 'archived'} onChange={(event) => setForm({ ...form, state: event.target.checked ? 'archived' : 'active' })} className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600" /><span><span className="block">{t('adminResources.deprecateResource', 'Deprecate Resource')}</span><span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-300">{t('adminResources.deprecateHelp', 'Deprecated resources are hidden from the public Resources list but remain available for historical attribution.')}</span></span></label>
          </div>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.description', 'Description')}</span><textarea rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" /></label>
          {form.people.length > 0 && <section className="sm:col-span-2 rounded-lg bg-gray-100 p-5 dark:bg-gray-700" aria-labelledby="resource-people-heading"><h2 id="resource-people-heading" className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-100">{t('resources.people', 'People')}</h2><div className="space-y-2">{form.people.map((entry: any) => <div key={entry.id} className="rounded-lg bg-white px-3 py-2 dark:bg-gray-800"><p className="font-medium text-gray-800 dark:text-gray-100">{entry.person?.name}</p><p className="text-sm text-primary-700 dark:text-primary-300">{entry.role}</p></div>)}</div></section>}
          <div className="sm:col-span-2 flex justify-end"><button disabled={saving} className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50">{saving ? t('adminResources.saving', 'Saving...') : t('common.save', 'Save')}</button></div>
          {message && <p className="self-center text-sm text-gray-600 dark:text-gray-300">{message}</p>}
        </form>
      </div>
    </main>
  )
}
