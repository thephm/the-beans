"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import AddPersonForm from "@/components/AddPersonForm";
import { ResourceSelection } from "@/components/ResourceSearchField";
import { apiClient } from "@/lib/api";

const AddPersonPage: React.FC = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fromResource = searchParams?.get('source') === 'resource';
  const resourceId = fromResource ? searchParams?.get('resourceId') : null;
  const returnUrl = resourceId ? `/admin/resources/${encodeURIComponent(resourceId)}` : '/admin/people';
  const [resource, setResource] = useState<ResourceSelection | null>(null);
  const [loading, setLoading] = useState(fromResource);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!fromResource) {
      setResource(null);
      setLoading(false);
      return;
    }
    if (!resourceId) {
      setError(t('adminResources.notFound', 'Resource not found.'));
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    apiClient.getAdminResource(resourceId)
      .then((data) => { if (!cancelled) setResource(data as ResourceSelection); })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : t('adminResources.notFound', 'Resource not found.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fromResource, resourceId, t]);

  const handleSave = async (person: Parameters<typeof apiClient.createPerson>[0]) => {
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      await apiClient.createPerson(person);
      window.location.href = returnUrl;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('admin.people.saveFailed', 'Could not save person.'));
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-20">
      <a href={returnUrl} className="mb-8 inline-flex items-center font-semibold text-primary-600 hover:underline dark:text-primary-400">
        {'<'} {fromResource ? t('admin.people.backToResource', 'Back to resource') : t('admin.people.backToPeople', 'Back to People')}
      </a>
      <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow dark:border-gray-700 dark:bg-gray-900">
        <h1 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">{t('admin.people.addTitle', 'Add Person')}</h1>
        {loading ? <p>{t('common.loading', 'Loading...')}</p> : fromResource && !resource ? (
          <p role="alert" className="text-red-600 dark:text-red-400">{error}</p>
        ) : (
          <>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">{t('admin.people.associationHelp', 'Select a roaster, a resource, or both. At least one association is required.')}</p>
            <AddPersonForm
              key={resource?.id || 'new-person'}
              showRoasterSelector
              showResourceSelector
              initialResource={resource}
              saving={saving}
              onSave={handleSave}
              onCancel={() => { window.location.href = returnUrl; }}
              error={error}
            />
          </>
        )}
      </div>
    </main>
  );
};

export default AddPersonPage;
