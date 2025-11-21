import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api';

export type RoasterSourceType =
  | 'Scout'
  | 'Google'
  | 'Reddit'
  | 'ChatGPT'
  | 'YouTube'
  | 'Instagram'
  | 'TikTok'
  | 'API'
  | 'Other';

interface Person {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface RoasterSourceFieldsProps {
  sourceType: RoasterSourceType;
  sourceDetails: string;
  onSourceTypeChange: (type: RoasterSourceType) => void;
  onSourceDetailsChange: (details: string) => void;
}

const SOURCE_OPTIONS: RoasterSourceType[] = [
  'Scout',
  'Google',
  'Reddit',
  'ChatGPT',
  'YouTube',
  'Instagram',
  'TikTok',
  'API',
  'Other',
];

export default function RoasterSourceFields({
  sourceType,
  sourceDetails,
  onSourceTypeChange,
  onSourceDetailsChange,
}: RoasterSourceFieldsProps) {
  const { t } = useTranslation();
  const [people, setPeople] = useState<Person[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);

  useEffect(() => {
    if (sourceType === 'Scout' || sourceType === 'API') {
      setLoadingPeople(true);
        apiClient.getPeople()
        .then((res: any) => {
          setPeople(res.data || []);
        })
        .catch(() => setPeople([]))
        .finally(() => setLoadingPeople(false));
    }
  }, [sourceType]);

  return (
    <div className="mb-4">
      <label className="block font-semibold mb-1">{t('roaster.sourceType', 'Initial Source')}</label>
      <select
        className="border rounded px-2 py-1 w-full mb-2"
        value={sourceType}
        onChange={e => onSourceTypeChange(e.target.value as RoasterSourceType)}
      >
        <option value="">{t('roaster.selectSourceType', 'Select source type')}</option>
        {SOURCE_OPTIONS.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      {['Scout', 'API'].includes(sourceType) && (
        <div>
          <label className="block mb-1">{t('roaster.sourcePerson', 'Person')}</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={sourceDetails}
            onChange={e => onSourceDetailsChange(e.target.value)}
            disabled={loadingPeople}
          >
            <option value="">{t('roaster.selectPerson', 'Select person')}</option>
            {people.map(person => (
              <option key={person.id} value={person.id}>
                {person.username || `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.id}
              </option>
            ))}
          </select>
        </div>
      )}
      {['Reddit', 'YouTube', 'Instagram', 'TikTok'].includes(sourceType) && (
        <div>
          <label className="block mb-1">{t('roaster.sourceUrl', 'Source URL')}</label>
          <input
            type="url"
            className="border rounded px-2 py-1 w-full"
            value={sourceDetails}
            onChange={e => onSourceDetailsChange(e.target.value)}
            placeholder={t('roaster.sourceUrlPlaceholder', 'Paste URL here')}
          />
        </div>
      )}
      {sourceType === 'Other' && (
        <div>
          <label className="block mb-1">{t('roaster.sourceNotes', 'Source Notes')}</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={sourceDetails}
            onChange={e => onSourceDetailsChange(e.target.value)}
            placeholder={t('roaster.sourceNotesPlaceholder', 'Describe where you found this')}
          />
        </div>
      )}
      {(sourceType === 'Google' || sourceType === 'ChatGPT') && (
        <div className="text-gray-500 text-sm mt-1">
          {t('roaster.noDetailsNeeded', 'No additional details needed.')}
        </div>
      )}
    </div>
  );
}
