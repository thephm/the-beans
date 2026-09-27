'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { apiClient } from '@/lib/api'
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

export default function AdminResourcesPage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [resources, setResources] = useState<any[]>([])

  const loadResources = () => apiClient.getResources({ search: '', includeArchived: 'true' }).then((data: any) => setResources(data.resources || []))
  useEffect(() => { if (user?.role === 'admin') loadResources() }, [user])

  if (authLoading) return <main className="p-8 pt-28">{t('adminResources.loading', 'Loading...')}</main>
  if (!user || user.role !== 'admin') return <main className="p-8 pt-28">{t('adminResources.accessRequired', 'Admin access required.')}</main>

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-28 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{t('adminResources.title', 'Resources')}</h1>
          <Link href="/admin/resources/new" className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700">+ {t('adminResources.add', 'Add')}</Link>
        </div>
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
