import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api';

export type RoasterSourceType =
  | 'Suggestion'
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
  'Suggestion',
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
    if (sourceType === 'Suggestion' || sourceType === 'API') {
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
      <div style={{color:'red',fontWeight:'bold'}}>DEBUG: RoasterSourceFields Rendered</div>
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
      <div>
        <label className="block mb-1">{t('roaster.sourceDetails', 'Source Details')}</label>
        <input
          type="text"
          className="border rounded px-2 py-1 w-full"
          value={sourceDetails}
          onChange={e => onSourceDetailsChange(e.target.value)}
          placeholder={t('roaster.sourceDetailsPlaceholder', 'Enter details (person, URL, or notes)')}
        />
      </div>
    </div>
  );
}
