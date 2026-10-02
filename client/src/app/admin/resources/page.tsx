'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
import { Search, YouTube } from '@mui/icons-material'

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

export default function AdminResourcesPage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [resources, setResources] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const loadResources = (search = searchTerm) => apiClient.getAdminResources({ search: search.trim(), includeArchived: 'true' }).then((data: any) => setResources(data.resources || []))
  useEffect(() => {
    if (user?.role !== 'admin') return
    let active = true
    const timer = setTimeout(() => {
      apiClient.getAdminResources({ search: searchTerm.trim(), includeArchived: 'true' })
        .then((data: any) => { if (active) setResources(data.resources || []) })
        .catch(() => { if (active) setResources([]) })
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [user?.role, searchTerm])

  if (authLoading) return <main className="p-8 pt-28">{t('adminResources.loading', 'Loading...')}</main>
  if (!user || user.role !== 'admin') return <main className="p-8 pt-28">{t('adminResources.accessRequired', 'Admin access required.')}</main>

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-28 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{t('adminResources.title', 'Resources')}</h1>
        </div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
            {resources.length} {t('adminResources.title', 'Resources')}
          </span>
          <div className="relative w-full sm:ml-auto sm:max-w-sm">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fontSize="small" />
            <input
              type="search"
              aria-label={t('adminResources.search', 'Search by name, description, notes, roaster, or person...')}
              placeholder={t('adminResources.search', 'Search by name, description, notes, roaster, or person...')}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>
          <Link href="/admin/resources/new" className="self-end rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 sm:self-auto">{t('adminResources.add', 'Add')}</Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="w-[35%] px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('adminResources.name', 'Name')}</th>
                <th className="w-[20%] px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('adminResources.resourceTypeColumn', 'Resource type')}</th>
                <th className="w-[15%] px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('adminResources.platform', 'Platform')}</th>
                <th className="w-[12%] px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('adminResources.state', 'State')}</th>
                <th className="w-[18%] px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">{t('adminResources.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {resources.map((resource) => {
                const isDeprecated = resource.state === 'archived'
                return (
                  <tr key={resource.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="break-words px-6 py-4">
                      <Link href={`/admin/resources/${resource.id}`} className="font-medium text-primary-600 hover:underline dark:text-primary-400">{resource.name}</Link>
                      <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">/{resource.slug}</p>
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
