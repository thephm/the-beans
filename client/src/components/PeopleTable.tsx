"use client";
import React, { useEffect, useState } from 'react';
import { SortArrow } from '@/components/SortArrow';
import AddPersonForm from './AddPersonForm';
import { apiClient } from '../lib/api';
import { RoasterPerson, Roaster } from '../types';
import { useTranslation } from 'react-i18next';


export default function PeopleTable() {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const { t } = useTranslation();
  const [people, setPeople] = useState<RoasterPerson[]>([]);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredPeople, setFilteredPeople] = useState<RoasterPerson[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit, setLimit] = useState<number>(100);

  useEffect(() => {
    async function fetchRoastersAndPeople() {
      setLoading(true);
      try {
        // Fetch all roasters (including unverified) - backend max limit is 100
        const roastersData = await apiClient.getRoasters({ limit: 100 });
        const roastersList = (roastersData && Array.isArray((roastersData as any).roasters)) ? (roastersData as any).roasters : [];
        console.log('Fetched roasters:', roastersList.length);
        setRoasters(roastersList);

        // Fetch all people with pagination and sorting
        const params: any = { page: currentPage, limit };
        if (sortConfig) {
          params.sortBy = sortConfig.key;
          params.sortOrder = sortConfig.direction;
        }

        const peopleData = await apiClient.getPeople(params);
        const allPeople = (peopleData && Array.isArray((peopleData as any).data)) ? (peopleData as any).data : [];
        
        console.log('Total people fetched:', allPeople.length);
        setPeople(allPeople);
        setFilteredPeople(allPeople);

        // Update pagination info
        if (peopleData && (peopleData as any).pagination) {
          setTotalPages((peopleData as any).pagination.pages || 1);
        }
      } catch (err) {
        console.error('Error fetching roasters and people:', err);
        setPeople([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRoastersAndPeople();
  }, [currentPage, limit, sortConfig]);

  // Filter people based on search term (client-side filtering for now)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPeople(people);
    } else {
      const filtered = people.filter(person => {
        const fullName = `${person.firstName} ${person.lastName || ''}`.trim();
        return (
          fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.roaster?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          person.roles?.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
      setFilteredPeople(filtered);
    }
  }, [searchTerm, people]);

  // Sorting is now handled by the backend

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
  };

  const cancelDelete = () => {
    setDeletingId(null);
    setDeleteError(null);
  };

  const doDelete = async (id: string) => {
    try {
      setDeleteError(null);
      await apiClient.deletePerson(id);
      setPeople(people.filter(p => p.id !== id));
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting person:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete person');
    }
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t('admin.people.search', 'Search by name, email, roaster, title, or role...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 mb-4">
        {/* Person count */}
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {filteredPeople.length === people.length 
            ? `${filteredPeople.length} ${t('admin.people.title', 'People')}`
            : `${filteredPeople.length} ${t('admin.people.of', 'of')} ${people.length} ${t('admin.people.title', 'People')}`
          }
        </span>
        
        {/* Add Person button */}
        <button
          className="sm:ml-auto bg-green-600 dark:bg-green-700 text-white px-5 py-2 rounded shadow hover:bg-green-700 dark:hover:bg-green-600 w-full sm:w-auto"
          onClick={() => window.location.href = '/admin/people/add'}
        >
          {t('common.add', 'Add')}
        </button>
      </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm text-center text-gray-500 dark:text-gray-400">
              {t('loading', 'Loading...')}
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm text-center text-gray-500 dark:text-gray-400">
              {t('admin.people.noPeopleFound', 'No people found.')}
            </div>
          ) : (
            filteredPeople.map(person => (
              <div key={person.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                {/* Person Header */}
                <div className="mb-3">
                  <a
                    href={`/admin/people/edit/${person.id}`}
                    className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {`${person.firstName} ${person.lastName || ''}`.trim()}
                  </a>
                  {person.title && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {person.title}
                    </div>
                  )}
                  {person.roles && person.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {person.roles.map((role, index) => (
                        <span
                          key={index}
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            role === 'owner' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                            role === 'admin' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                            role === 'roaster' ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200' :
                            role === 'employee' ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200' :
                            role === 'billing' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                            role === 'marketing' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {t(`admin.people.role${role.charAt(0).toUpperCase() + role.slice(1)}`, role)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Roaster */}
                {person.roaster && (
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">🏢</span>
                      <a
                        href={`/admin/roasters/edit/${person.roaster.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        {person.roaster.name}
                      </a>
                      {/* Show if person has same email in multiple roasters */}
                      {person.email && people.filter(p => p.email === person.email && p.id !== person.id).length > 0 && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          (+{people.filter(p => p.email === person.email && p.id !== person.id).length} more)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Email */}
                {person.email && (
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">📧</span>
                      <a
                        href={`mailto:${person.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        {person.email}
                      </a>
                    </div>
                  </div>
                )}

                {/* Mobile */}
                {person.mobile && (
                  <div className="mb-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">📱</span>
                      <span className="text-gray-900 dark:text-gray-200">{person.mobile}</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-8 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'firstName' ? { key: 'firstName', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'firstName', direction: 'asc' })}>
                  {t('adminForms.roasters.name', 'Name')}{sortConfig?.key === 'firstName' && <SortArrow direction={sortConfig.direction} />}
                </th>
                <th className="px-8 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'roaster' ? { key: 'roaster', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'roaster', direction: 'asc' })}>
                  {t('adminSection.roasters', 'Roaster')}{sortConfig?.key === 'roaster' && <SortArrow direction={sortConfig.direction} />}
                </th>
                <th className="px-8 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'roles' ? { key: 'roles', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'roles', direction: 'asc' })}>
                  {t('adminSection.role', 'Role')}{sortConfig?.key === 'roles' && <SortArrow direction={sortConfig.direction} />}
                </th>
                <th className="px-8 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'email' ? { key: 'email', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'email', direction: 'asc' })}>
                  {t('adminForms.roasters.email', 'Email')}{sortConfig?.key === 'email' && <SortArrow direction={sortConfig.direction} />}
                </th>
                <th className="px-8 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => setSortConfig(sortConfig?.key === 'mobile' ? { key: 'mobile', direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' } : { key: 'mobile', direction: 'asc' })}>
                  {t('adminForms.roasters.phone', 'Mobile')}{sortConfig?.key === 'mobile' && <SortArrow direction={sortConfig.direction} />}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-4 text-center text-gray-500 dark:text-gray-400">{t('loading', 'Loading...')}</td>
                </tr>
              ) : filteredPeople.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-4 text-center text-gray-500 dark:text-gray-400">{t('admin.people.noPeopleFound', 'No people found.')}</td>
                </tr>
              ) : (
                filteredPeople.map(person => (
                  <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-8 py-2 border-b border-gray-200 dark:border-gray-700">
                      <a
                        href={`/admin/people/edit/${person.id}`}
                        className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline cursor-pointer"
                      >
                        {`${person.firstName} ${person.lastName || ''}`.trim()}
                      </a>
                      {person.title && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {person.title}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-2 border-b border-gray-200 dark:border-gray-700">
                      {person.roaster ? (
                        <div>
                          <a
                            href={`/admin/roasters/edit/${person.roaster.id}`}
                            className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline cursor-pointer"
                          >
                            {person.roaster.name}
                          </a>
                          {/* Show if person has same email in multiple roasters */}
                          {person.email && people.filter(p => p.email === person.email && p.id !== person.id).length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              +{people.filter(p => p.email === person.email && p.id !== person.id).length} more roaster(s)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-8 py-2 border-b border-gray-200 dark:border-gray-700">
                      {person.roles && person.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {person.roles.map((role, index) => (
                            <span
                              key={index}
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                role === 'owner' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                                role === 'admin' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                role === 'roaster' ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200' :
                                role === 'employee' ? 'bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200' :
                                role === 'billing' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                role === 'marketing' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {t(`admin.people.role${role.charAt(0).toUpperCase() + role.slice(1)}`, role)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-8 py-2 border-b border-gray-200 dark:border-gray-700">
                      {person.email ? (
                        <a
                          href={`mailto:${person.email}`}
                          className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline cursor-pointer"
                        >
                          {person.email}
                        </a>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-8 py-2 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">{person.mobile}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + Math.max(1, currentPage - 2);
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// EditableCell utility (if needed elsewhere)
export function EditableCell({ value, onChange, type = 'text', options, ...props }: any) {
  if (type === 'select') {
    let sortedOptions = options;
    if (Array.isArray(options) && options.length && options[0].label && options[0].value) {
      sortedOptions = [...options].sort((a, b) => {
        return a.label.trim().toLowerCase().localeCompare(b.label.trim().toLowerCase());
      });
    }
    return (
      <select className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={value} onChange={e => onChange(e.target.value)} {...props}>
        {sortedOptions.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
  if (type === 'multiselect') {
    // Placeholder for multiselect implementation
    return <span>Multiselect not implemented</span>;
  }
  // Default to text input
  return (
    <input
      className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      {...props}
    />
  );
}



