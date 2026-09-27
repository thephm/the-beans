import { useEffect, useState } from 'react'
import ExpandMore from '@mui/icons-material/ExpandMore'
import AddPersonForm from './AddPersonForm'
import { apiClient } from '@/lib/api'
import { PersonRole } from '@/types'

const resourceRoleOptions = [
  PersonRole.OWNER,
  PersonRole.ADMIN,
  PersonRole.EMPLOYEE,
  PersonRole.BILLING,
  PersonRole.MARKETING,
  PersonRole.SCOUT,
  PersonRole.CUSTOMER,
  PersonRole.OTHER,
]

interface ResourcePeopleSectionProps {
  people: any[]
  onChange: (people: any[]) => void
}

const toFormPerson = (entry: any) => {
  const person = entry.person || entry
  const nameParts = (person.name || '').trim().split(/\s+/)
  return {
    ...person,
    id: entry.personId || person.id,
    firstName: person.firstName || nameParts.shift() || '',
    lastName: person.lastName || nameParts.join(' '),
    title: person.title || '',
    email: person.email || '',
    mobile: person.mobile || '',
    linkedinUrl: person.linkedinUrl || '',
    instagramUrl: person.instagramUrl || '',
    bio: person.bio || person.notes || '',
    roles: person.roles || (entry.role ? [entry.role] : []),
    isPrimary: Boolean(person.isPrimary),
  }
}

const toResourcePerson = (person: any, existing: any = {}) => ({
  ...existing,
  personId: existing.personId || person.id,
  role: person.roles?.[0] || existing.role || 'other',
  person: {
    ...(existing.person || {}),
    id: person.id,
    name: [person.firstName, person.lastName].filter(Boolean).join(' ').trim(),
    email: person.email || null,
    websiteUrl: person.linkedinUrl || person.instagramUrl || null,
    notes: [person.title, person.bio].filter(Boolean).join('\n\n') || null,
  },
})

export default function ResourcePeopleSection({ people, onChange }: ResourcePeopleSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [personSearch, setPersonSearch] = useState('')
  const [personResults, setPersonResults] = useState<any[]>([])
  const safePeople = Array.isArray(people) ? people : []
  const savedPeopleCount = safePeople.filter((entry) => entry.person?.name?.trim()).length
  const hasUnsavedPerson = safePeople.some((entry) => !entry.person?.name?.trim())

  useEffect(() => {
    if (!personSearch.trim()) {
      setPersonResults([])
      return
    }
    const timer = setTimeout(() => {
      apiClient.searchResourcePeople(personSearch.trim())
        .then((data: any) => setPersonResults(data.people || []))
        .catch(() => setPersonResults([]))
    }, 250)
    return () => clearTimeout(timer)
  }, [personSearch])

  const addPerson = () => {
    setEditingIndex(safePeople.length)
    onChange([...safePeople, { person: {} }])
  }
  const updatePerson = (index: number, value: any) => {
    onChange(safePeople.map((entry, entryIndex) => entryIndex === index ? toResourcePerson(value, entry) : entry))
  }
  const removePerson = (index: number) => {
    setEditingIndex(null)
    onChange(safePeople.filter((_, entryIndex) => entryIndex !== index))
  }
  const savePerson = (index: number, value: any) => {
    updatePerson(index, value)
    setEditingIndex(null)
  }
  const cancelPerson = (index: number) => {
    if (safePeople[index]?.person?.name?.trim()) {
      setEditingIndex(null)
      return
    }
    removePerson(index)
  }
  const associatePerson = (person: any) => {
    onChange([...safePeople, { personId: person.id, person, role: 'other' }])
    setPersonSearch('')
    setPersonResults([])
  }

  return (
    <section className="sm:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700" aria-labelledby="resource-people-heading">
      <button type="button" aria-expanded={expanded} aria-controls="resource-people-fields" onClick={() => setExpanded((visible) => !visible)} className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60">
        <span id="resource-people-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-100">People</span>
        <span className="inline-flex min-w-6 justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">{savedPeopleCount}</span>
        <ExpandMore aria-hidden="true" className={`ml-auto text-gray-600 transition-transform dark:text-gray-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <div id="resource-people-fields" hidden={!expanded} className="space-y-4 px-4 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative w-full sm:max-w-xl sm:flex-1">
            <label htmlFor="resource-person-search" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Associate existing person</label>
            <input id="resource-person-search" value={personSearch} onChange={(event) => setPersonSearch(event.target.value)} placeholder="Search by name or email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" />
            {personResults.length > 0 && <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
              {personResults.filter((person) => !safePeople.some((entry) => entry.personId === person.id)).map((person) => <button key={person.id} type="button" onClick={() => associatePerson(person)} className="block w-full border-b border-gray-200 px-4 py-2 text-left last:border-b-0 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"><span className="font-medium">{person.name}</span>{person.email && <span className="ml-2 text-sm text-gray-500">{person.email}</span>}</button>)}
            </div>}
          </div>
          {!hasUnsavedPerson && (
            <button type="button" onClick={addPerson} className="w-full rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 sm:w-auto">Add Person</button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
        {safePeople.map((entry, index) => (
          <div key={entry.id || entry.personId || `resource-person-${index}`} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            {editingIndex === index || !entry.person?.name?.trim() ? (
              <AddPersonForm
                mode={entry.id ? 'edit' : 'add'}
                initialPerson={toFormPerson(entry)}
                roleOptions={resourceRoleOptions}
                onSave={(person) => savePerson(index, person)}
                onCancel={() => cancelPerson(index)}
              />
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <button type="button" onClick={() => setEditingIndex(index)} className="text-left font-semibold text-blue-700 hover:underline dark:text-blue-300">{entry.person.name}</button>
                  {entry.role && <p className="text-sm text-gray-600 dark:text-gray-300">{entry.role}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => removePerson(index)} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20">Disassociate</button>
                  <button type="button" onClick={() => setEditingIndex(index)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Edit</button>
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </section>
  )
}
