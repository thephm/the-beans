import { useState } from 'react'
import ExpandMore from '@mui/icons-material/ExpandMore'
import AddPersonForm from './AddPersonForm'

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
  const safePeople = Array.isArray(people) ? people : []
  const savedPeopleCount = safePeople.filter((entry) => entry.person?.name?.trim()).length
  const hasUnsavedPerson = safePeople.some((entry) => !entry.person?.name?.trim())

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

  return (
    <section className="sm:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700" aria-labelledby="resource-people-heading">
      <button type="button" aria-expanded={expanded} aria-controls="resource-people-fields" onClick={() => setExpanded((visible) => !visible)} className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60">
        <span id="resource-people-heading" className="text-lg font-semibold text-gray-800 dark:text-gray-100">People</span>
        <span className="inline-flex min-w-6 justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">{savedPeopleCount}</span>
        <ExpandMore aria-hidden="true" className={`ml-auto text-gray-600 transition-transform dark:text-gray-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <div id="resource-people-fields" hidden={!expanded} className="space-y-4 px-4 pb-4">
        {safePeople.map((entry, index) => (
          <div key={entry.id || entry.personId || `resource-person-${index}`} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            {editingIndex === index || !entry.person?.name?.trim() ? (
              <AddPersonForm
                mode={entry.id ? 'edit' : 'add'}
                initialPerson={toFormPerson(entry)}
                onSave={(person) => savePerson(index, person)}
                onCancel={() => cancelPerson(index)}
              />
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{entry.person.name}</p>
                  {entry.role && <p className="text-sm text-gray-600 dark:text-gray-300">{entry.role}</p>}
                </div>
                <button type="button" onClick={() => setEditingIndex(index)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">Edit</button>
              </div>
            )}
          </div>
        ))}
        {!hasUnsavedPerson && (
          <div className="flex justify-end pt-3">
            <button type="button" onClick={addPerson} className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700">Add Person</button>
          </div>
        )}
      </div>
    </section>
  )
}
