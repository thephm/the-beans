import { useEffect, useState } from 'react'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Close from '@mui/icons-material/Close'
import AddPersonForm from './AddPersonForm'
import { apiClient } from '@/lib/api'
import { PersonRole, RESOURCE_PERSON_ROLES } from '@/types'

interface ResourcePeopleSectionProps {
  people: any[]
  onChange: (people: any[]) => void
  resourceId?: string
}

const toFormPerson = (entry: any) => {
  const person = entry.person || entry
  const nameParts = (person.name || '').trim().split(/\s+/)
  const roles = entry.roles || person.roles || (entry.role ? [entry.role] : [])
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
    roles: Array.from(new Set(roles
      .map((role: string) => role === 'contact' ? PersonRole.OTHER : role as PersonRole)
      .filter((role: PersonRole) => RESOURCE_PERSON_ROLES.includes(role)))),
    isPrimary: Boolean(entry.isPrimary),
  }
}

const toResourcePerson = (person: any, existing: any = {}) => ({
  ...existing,
  personId: existing.personId || existing.person?.id || person.id,
  role: person.roles?.[person.roles.length - 1] || existing.role || 'other',
  roles: person.roles?.length ? person.roles : [existing.role || 'other'],
  isPrimary: Boolean(person.isPrimary),
  person: {
    ...(existing.person || {}),
    id: person.id,
    name: [person.firstName, person.lastName].filter(Boolean).join(' ').trim(),
    email: person.email || null,
    title: person.title || null,
    mobile: person.mobile || null,
    websiteUrl: existing.person?.websiteUrl || null,
    linkedinUrl: person.linkedinUrl || null,
    instagramUrl: person.instagramUrl || null,
    bio: person.bio || null,
    notes: existing.person?.notes || null,
  },
})

const groupResourcePeople = (entries: any[]) => {
  const grouped: any[] = []
  const indicesByPersonId = new Map<string, number>()

  entries.forEach((entry, index) => {
    const personId = entry.personId || entry.person?.id
    const roles = Array.from(new Set([
      ...(Array.isArray(entry.roles) ? entry.roles : []),
      ...(entry.role ? [entry.role] : []),
    ].filter(Boolean)))

    if (!personId) {
      grouped.push({ ...entry, roles, _sourceIndex: index })
      return
    }

    const groupedIndex = indicesByPersonId.get(personId)
    if (groupedIndex === undefined) {
      indicesByPersonId.set(personId, grouped.length)
      grouped.push({ ...entry, roles, role: roles[0] || entry.role })
      return
    }

    const existing = grouped[groupedIndex]
    existing.roles = Array.from(new Set([...existing.roles, ...roles]))
    existing.isPrimary = Boolean(existing.isPrimary || entry.isPrimary)
  })

  return grouped
}

export default function ResourcePeopleSection({ people, onChange, resourceId }: ResourcePeopleSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [saveError, setSaveError] = useState('')
  const [personSearch, setPersonSearch] = useState('')
  const [personResults, setPersonResults] = useState<any[]>([])
  const safePeople = groupResourcePeople(Array.isArray(people) ? people : [])
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
  const disassociatePerson = (entry: any, index: number) => {
    const personId = entry.personId || entry.person?.id
    setEditingIndex(null)
    onChange(safePeople.filter((entry, entryIndex) => {
      if (!personId) return entryIndex !== index
      return (entry.personId || entry.person?.id) !== personId
    }))
  }
  const savePerson = async (index: number, value: any) => {
    const updatedPerson = toResourcePerson(value, safePeople[index])
    const existingEntry = safePeople[index]
    const personId = updatedPerson.personId

    setSaveError('')
    try {
      if (resourceId && existingEntry?.id && personId) {
        await apiClient.updateResourcePerson(resourceId, personId, {
          role: updatedPerson.role,
          roles: updatedPerson.roles,
          isPrimary: updatedPerson.isPrimary,
          person: updatedPerson.person,
        })
      }
      updatePerson(index, value)
      setEditingIndex(null)
    } catch (error: any) {
      setSaveError(error?.message || 'Could not save person.')
    }
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
        {saveError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">{saveError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
        {safePeople.map((entry, index) => (
          <div key={entry.id || entry.personId || `resource-person-${index}`} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            {editingIndex === index || !entry.person?.name?.trim() ? (
              <AddPersonForm
                mode={entry.id ? 'edit' : 'add'}
                initialPerson={toFormPerson(entry)}
                roleOptions={RESOURCE_PERSON_ROLES}
                onSave={(person) => savePerson(index, person)}
                onCancel={() => cancelPerson(index)}
              />
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  {resourceId ? (
                    <a href={`/admin/people/edit/${entry.personId || entry.person?.id}?source=resource&returnToResource=${encodeURIComponent(resourceId)}`} className="font-semibold text-blue-700 hover:underline dark:text-blue-300">{entry.person.name}</a>
                  ) : (
                    <button type="button" onClick={() => setEditingIndex(index)} className="text-left font-semibold text-blue-700 hover:underline dark:text-blue-300">{entry.person.name}</button>
                  )}
                  {(entry.roles?.length || entry.role) && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {(entry.roles?.length ? entry.roles : [entry.role]).map((role: string) => (
                        <span key={role} className="inline-flex rounded-full border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Disassociate ${entry.person.name}`}
                    title="Disassociate"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to disassociate this person from the resource?')) {
                        disassociatePerson(entry, index)
                      }
                    }}
                    className="p-1 text-red-600 hover:text-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Close fontSize="small" aria-hidden="true" />
                  </button>
                  {resourceId ? (
                    <a href={`/admin/people/edit/${entry.personId || entry.person?.id}?source=resource&returnToResource=${encodeURIComponent(resourceId)}`} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Edit</a>
                  ) : (
                    <button type="button" onClick={() => setEditingIndex(index)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Edit</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative w-full sm:max-w-xl sm:flex-1">
            <label htmlFor="resource-person-search" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Associate an existing person</label>
            <input id="resource-person-search" value={personSearch} onChange={(event) => setPersonSearch(event.target.value)} placeholder="Search by name or email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100" />
            {personResults.length > 0 && <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
              {personResults.filter((person) => !safePeople.some((entry) => entry.personId === person.id)).map((person) => <button key={person.id} type="button" onClick={() => associatePerson(person)} className="block w-full border-b border-gray-200 px-4 py-2 text-left last:border-b-0 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"><span className="font-medium">{person.name}</span>{person.email && <span className="ml-2 text-sm text-gray-500">{person.email}</span>}</button>)}
            </div>}
          </div>
          {!hasUnsavedPerson && (resourceId ? (
            <a href={`/admin/people/add?source=resource&resourceId=${encodeURIComponent(resourceId)}`} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 sm:w-auto">Add Person</a>
          ) : (
            <button type="button" onClick={addPerson} className="w-full rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 sm:w-auto">Add Person</button>
          ))}
        </div>
      </div>
    </section>
  )
}
