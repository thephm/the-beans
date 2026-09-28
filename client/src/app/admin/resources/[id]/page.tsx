'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import SocialNetworksFields from '@/components/SocialNetworksFields'
import ResourcePeopleSection from '@/components/ResourcePeopleSection'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { countDefinedSocialNetworks, socialNetworksToForm, socialNetworksToPayload } from '@/lib/socials'

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
  const [showSocials, setShowSocials] = useState(false)
  const [providerRoasters, setProviderRoasters] = useState<any[]>([])
  const [selectedProviderRoaster, setSelectedProviderRoaster] = useState<any>(null)
  const [providerSearch, setProviderSearch] = useState('')
  const [initialPeopleIds, setInitialPeopleIds] = useState<string[]>([])

  useEffect(() => {
    if (!user?.role || !params?.id) return
    apiClient.getResources({ includeArchived: 'true' }).then((data: any) => {
      const resource = (data.resources || []).find((item: any) => item.id === params.id)
      if (!resource) throw new Error(t('adminResources.notFound', 'Resource not found.'))
      return apiClient.getAdminResource(resource.id)
    }).then((resource: any) => {
      setSelectedProviderRoaster(resource.publisherRoaster || null)
      setInitialPeopleIds(Array.from(new Set((resource.people || []).map((entry: any) => entry.personId).filter(Boolean))))
      setProviderRoasters([])
      setForm({
      id: resource.id,
      name: resource.name || '',
      slug: resource.slug || '',
      url: resource.url || '',
      resourceType: resource.resourceType || 'website',
      platform: resource.platform || 'Web',
      description: resource.description || '',
      adminNotes: resource.adminNotes || '',
      state: resource.state || 'active',
      people: resource.people || [],
      publisherRoasterId: resource.publisherRoaster?.id || '',
      socialNetworks: socialNetworksToForm(resource)
      })
    }).catch((error: any) => setMessage(error.message)).finally(() => setLoading(false))
  }, [params?.id, user?.role, t])

  useEffect(() => {
    if (!providerSearch.trim()) {
      setProviderRoasters([])
      return
    }
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
        adminNotes: form.adminNotes,
        state: form.state,
        publisherRoasterId: form.publisherRoasterId || null,
        socialNetworks: socialNetworksToPayload(form.socialNetworks)
      })
      const currentPeople = form.people.filter((entry: any) => entry.person?.name)
      await Promise.all(currentPeople
        .filter((entry: any) => !entry.id)
        .map((entry: any) => apiClient.linkResourcePerson(form.id, { personId: entry.personId, role: entry.role || 'other', isPrimary: Boolean(entry.isPrimary), person: entry.person })))
      await Promise.all(initialPeopleIds.filter((personId) => !currentPeople.some((entry: any) => entry.personId === personId)).map((personId) => apiClient.unlinkResourcePerson(form.id, personId)))
      router.push('/admin/resources')
      router.refresh()
    } catch (error: any) {
      setMessage(error.message || t('adminResources.updateFailed', 'Could not update resource.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-28 dark:bg-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4 px-6">
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
              {selectedProviderRoaster && form.publisherRoasterId === selectedProviderRoaster.id && <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-green-100 dark:border-gray-700 dark:bg-green-900/50">
                <span className="flex-1 px-4 py-2 font-semibold text-green-900 dark:text-green-100">{selectedProviderRoaster.name}{selectedProviderRoaster.city ? ` - ${selectedProviderRoaster.city}` : ''}</span>
                <button type="button" onClick={() => { setForm({ ...form, publisherRoasterId: '' }); setSelectedProviderRoaster(null); setProviderSearch(''); setProviderRoasters([]) }} aria-label={t('adminResources.clearProviderRoaster', 'Remove roaster')} title={t('adminResources.clearProviderRoaster', 'Remove roaster')} className="px-3 py-2 text-lg font-bold leading-none text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">&times;</button>
              </div>}
              {providerSearch.trim() && providerRoasters.length > 0 && <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">{providerRoasters.map((roaster) => <button key={roaster.id} type="button" onClick={() => { setForm({ ...form, publisherRoasterId: roaster.id }); setSelectedProviderRoaster(roaster); setProviderSearch(''); setProviderRoasters([]) }} className="block w-full border-b border-gray-200 px-4 py-2 text-left text-gray-800 last:border-b-0 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700">{roaster.name}{roaster.city ? ` - ${roaster.city}` : ''}</button>)}</div>}
            </div>
            <label className="sm:col-span-2 flex cursor-pointer items-start gap-3 pt-2 text-sm font-medium text-gray-700 dark:text-gray-200"><input type="checkbox" checked={form.state === 'archived'} onChange={(event) => setForm({ ...form, state: event.target.checked ? 'archived' : 'active' })} className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600" /><span><span className="block">{t('adminResources.deprecateResource', 'Deprecate Resource')}</span><span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-300">{t('adminResources.deprecateHelp', 'Deprecated resources are hidden from the public Resources list but remain available for historical attribution.')}</span></span></label>
          </div>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.description', 'Description')}</span><textarea rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" /></label>
          <section className="sm:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700" aria-labelledby="resource-socials-heading">
              <button type="button" aria-expanded={showSocials} aria-controls="resource-socials-fields" onClick={() => setShowSocials((visible) => !visible)} className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <span id="resource-socials-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('adminResources.socials', 'Socials')}</span>
                <span className="inline-flex min-w-6 justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">{countDefinedSocialNetworks(form.socialNetworks)}</span>
                <ExpandMore aria-hidden="true" className={`ml-auto text-gray-600 transition-transform dark:text-gray-300 ${showSocials ? 'rotate-180' : ''}`} />
              </button>
              <div id="resource-socials-fields" hidden={!showSocials} className="px-4 pb-4"><SocialNetworksFields values={form.socialNetworks} onChange={(socialNetworks) => setForm({ ...form, socialNetworks })} idPrefix="resource-social" /></div>
            </section>
          <ResourcePeopleSection resourceId={form.id} people={Array.isArray(form.people) ? form.people : []} onChange={(people) => setForm((currentForm) => ({ ...currentForm, people }))} />
          <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-200"><span className="mb-1 block">{t('adminResources.observations', 'Observations')}</span><textarea rows={3} value={form.adminNotes} onChange={(event) => setForm({ ...form, adminNotes: event.target.value })} className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" /><span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">{t('adminResources.observationsPrivate', 'These observations are private and are not shown to end users.')}</span></label>
          <div className="sm:col-span-2 flex justify-end gap-3"><button type="button" onClick={() => router.push('/admin/resources')} className="rounded-lg border border-gray-300 px-5 py-2 font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">{t('common.cancel', 'Cancel')}</button><button disabled={saving} className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50">{saving ? t('adminResources.saving', 'Saving...') : t('common.save', 'Save')}</button></div>
          {message && <p className="self-center text-sm text-gray-600 dark:text-gray-300">{message}</p>}
        </form>
      </div>
    </main>
  )
}
