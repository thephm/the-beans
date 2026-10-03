import React, { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api';

export interface ResourceSelection {
  id: string;
  name: string;
}

interface ResourceSearchFieldProps {
  resource: ResourceSelection | null;
  onChange: (resource: ResourceSelection | null) => void;
}

export default function ResourceSearchField({ resource, onChange }: ResourceSearchFieldProps) {
  const { t } = useTranslation();
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResourceSelection[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const term = query.trim();
    if (resource || term.length < 2) {
      setResults([]);
      setIsSearching(false);
      setError('');
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setError('');
    const timer = setTimeout(async () => {
      try {
        const data = await apiClient.getAdminResources({ search: term, includeArchived: 'true' }) as { resources: ResourceSelection[] };
        if (!cancelled) setResults(data.resources);
      } catch (requestError) {
        if (!cancelled) {
          setResults([]);
          setError(requestError instanceof Error ? requestError.message : t('admin.people.resourceSearchFailed', 'Could not search resources.'));
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, resource, t]);

  return (
    <div className="relative">
      {resource ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/30">
          <span className="flex-1 text-gray-900 dark:text-gray-100">{resource.name}</span>
          <button type="button" onClick={() => onChange(null)} aria-label={t('admin.people.removeResourceAssociation', 'Remove resource association')} className="text-lg font-bold leading-none text-red-600 hover:text-red-700 dark:text-red-400">&times;</button>
        </div>
      ) : (
        <>
          <input
            type="search"
            role="combobox"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            aria-label={t('admin.people.resource', 'Resource')}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isOpen && query.trim().length >= 2}
            placeholder={t('admin.people.searchResource', 'Search resources by name')}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          {isOpen && query.trim().length >= 2 && (
            <div id={listboxId} role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
              {isSearching ? (
                <p className="px-4 py-3 text-sm text-gray-500">{t('common.loading', 'Loading...')}</p>
              ) : error ? (
                <p role="alert" className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</p>
              ) : results.length > 0 ? results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => { onChange(result); setQuery(''); setIsOpen(false); }}
                  className="block w-full border-b border-gray-200 px-4 py-2 text-left last:border-b-0 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  {result.name}
                </button>
              )) : (
                <p className="px-4 py-3 text-sm text-gray-500">{t('admin.people.noResourcesFound', 'No resources found.')}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
