import { PersonRole } from '../types'

interface PersonRolePresentation {
  label: string
  colorClasses: string
}

export const PERSON_ROLE_PRESENTATION: Record<PersonRole | 'billing' | 'customer' | 'rando', PersonRolePresentation> = {
  owner: { label: 'Owner', colorClasses: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-800' },
  admin: { label: 'Admin', colorClasses: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800' },
  roaster: { label: 'Roaster', colorClasses: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800' },
  founder: { label: 'Founder', colorClasses: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800' },
  marketing: { label: 'Marketing', colorClasses: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-800' },
  scout: { label: 'Scout', colorClasses: 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/40 dark:text-lime-200 dark:border-lime-800' },
  employee: { label: 'Employee', colorClasses: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-800' },
  alumni: { label: 'Alumni', colorClasses: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-800' },
  other: { label: 'Other', colorClasses: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/40 dark:text-gray-200 dark:border-gray-800' },
  creator: { label: 'Creator', colorClasses: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-800' },
  author: { label: 'Author', colorClasses: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-800' },
  contributor: { label: 'Contributor', colorClasses: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800' },
  billing: { label: 'Billing', colorClasses: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800' },
  customer: { label: 'Customer', colorClasses: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-800' },
  rando: { label: 'Anonymous', colorClasses: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/40 dark:text-gray-200 dark:border-gray-800' },
}

export const PERSON_ROLE_PILL_CLASSES = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium'

const presentations = new Map<string, PersonRolePresentation>(Object.entries(PERSON_ROLE_PRESENTATION))

export const getPersonRolePresentation = (role: string) => {
  const words = role
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  const presentation = presentations.get(words.join('_').toLowerCase())

  return {
    translationKey: `admin.people.role${words.join('')}`,
    label: presentation?.label || words.join(' ') || role,
    colorClasses: presentation?.colorClasses || PERSON_ROLE_PRESENTATION.other.colorClasses,
  }
}

export const getPersonRoleLabel = (
  role: string,
  translate: (key: string, options: { defaultValue: string }) => string,
) => {
  const { translationKey, label } = getPersonRolePresentation(role)
  return translate(translationKey, { defaultValue: label })
}
