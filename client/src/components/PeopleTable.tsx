"use client";
import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { RoasterPerson, Roaster } from '../types';
import { useTranslation } from 'react-i18next';


export default function PeopleTable() {
  const { t } = useTranslation();
  const [people, setPeople] = useState<RoasterPerson[]>([]);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [selectedRoasterId, setSelectedRoasterId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [allPeopleCount, setAllPeopleCount] = useState<number>(0);

  useEffect(() => {
    async function fetchRoasters() {
      setLoading(true);
      try {
        const roastersData = await apiClient.getRoasters();
        setRoasters((roastersData && Array.isArray((roastersData as any).roasters)) ? (roastersData as any).roasters : []);
      } catch (err) {
        setRoasters([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRoasters();
  }, []);

  useEffect(() => {
    async function fetchPeople() {
      setLoading(true);
      try {
        if (selectedRoasterId === 'all') {
          // Fetch people for all roasters and combine
          const allPeople: RoasterPerson[] = [];
          for (const roaster of Array.isArray(roasters) ? roasters : []) {
            try {
              const result = await apiClient.getPeopleForRoaster(roaster.id);
              if (result && Array.isArray((result as any).data)) {
                allPeople.push(...(result as any).data);
              } else if (Array.isArray(result)) {
                allPeople.push(...result);
              }
            } catch (err) {
              // Ignore errors for individual roasters
            }
          }
          setPeople(allPeople);
          setAllPeopleCount(allPeople.length);
        } else {
          const result = await apiClient.getPeopleForRoaster(selectedRoasterId);
          if (result && Array.isArray((result as any).data)) {
            setPeople((result as any).data);
            setAllPeopleCount((result as any).count || (result as any).data.length);
          } else if (Array.isArray(result)) {
            setPeople(result);
            setAllPeopleCount(result.length);
          } else {
            setPeople([]);
            setAllPeopleCount(0);
          }
        }
      } catch (err) {
        setPeople([]);
        setAllPeopleCount(0);
      } finally {
        setLoading(false);
      }
    }
    fetchPeople();
  }, [selectedRoasterId, roasters]);

  const handleRoasterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRoasterId(e.target.value);
  };

  const handleAddPerson = () => {
    // Implement add person logic (e.g., open modal)
    alert('Add person functionality not implemented yet.');
  };

  const filteredPeople = people; // Add filtering logic if needed

  return (
    <div className="mt-8 w-full flex flex-col items-center">
      <div className="w-full max-w-6xl">
        <div className="flex items-center mb-4">
          <label htmlFor="roaster-select" className="mr-2 font-medium">Roaster:</label>
          <select
            id="roaster-select"
            value={selectedRoasterId}
            onChange={handleRoasterChange}
            className="border rounded px-2 py-1"
          >
            <option value="all">All roasters</option>
            {roasters.map(roaster => (
              <option key={roaster.id} value={roaster.id}>{roaster.name}</option>
            ))}
          </select>
          <span className="ml-6 text-gray-500 text-sm">
            {filteredPeople.length} of {allPeopleCount} people
          </span>
          <button
            className="ml-auto bg-purple-600 text-white px-5 py-2 rounded shadow hover:bg-purple-700"
            onClick={handleAddPerson}
          >
            {t('admin.people.add', 'Add Person')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-white border rounded-lg shadow">
            <thead>
              <tr>
                <th className="px-8 py-3 text-left font-semibold">Name</th>
                <th className="px-8 py-3 text-left font-semibold">Email</th>
                <th className="px-8 py-3 text-left font-semibold">Mobile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPeople.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-8 py-4 text-center text-gray-500">No people found.</td>
                        </tr>
                      ) : (
                        filteredPeople.map(person => (
                          <tr key={person.id}>
                            <td className="px-8 py-2 border-b">{person.name}</td>
                            <td className="px-8 py-2 border-b">{person.email}</td>
                            <td className="px-8 py-2 border-b">{person.mobile}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
}

// EditableCell utility (if needed elsewhere)
function EditableCell({ value, onChange, type = 'text', options, ...props }: any) {
  if (type === 'select') {
    let sortedOptions = options;
    if (Array.isArray(options) && options.length && options[0].label && options[0].value) {
      sortedOptions = [...options].sort((a, b) => {
        return a.label.trim().toLowerCase().localeCompare(b.label.trim().toLowerCase());
      });
    }
    return (
      <select className="border rounded px-2 py-1" value={value} onChange={e => onChange(e.target.value)} {...props}>
        {sortedOptions.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
  if (type === 'multiselect') {
    return (
      <select multiple className="border rounded px-2 py-1" value={value} onChange={e => {
        const selected = Array.from(e.target.selectedOptions, (o: any) => o.value);
        onChange(selected);
      }} {...props}>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
  return (
    <input className="border rounded px-2 py-1 w-full" value={value} onChange={e => onChange(e.target.value)} {...props} />
  );
}
