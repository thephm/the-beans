"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

import AddPersonForm from "@/components/AddPersonForm";
import PersonLocationFields from "@/components/PersonLocationFields";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

const ResourcePersonAddPage: React.FC<{ resourceId: string }> = ({ resourceId }) => {
  const { t } = useTranslation();
  const [resource, setResource] = useState<any>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    city: '',
    country: '',
    email: '',
    mobile: '',
    websiteUrl: '',
    linkedinUrl: '',
    instagramUrl: '',
    bio: '',
  });
  const [role, setRole] = useState('other');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.getAdminResource(resourceId)
      .then((data: any) => setResource(data))
      .catch((requestError: any) => setError(requestError?.message || t('adminResources.notFound', 'Resource not found.')))
      .finally(() => setLoading(false));
  }, [resourceId, t]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const selectedRole = role.trim();
    if (!firstName) {
      setError(t('admin.people.firstNameRequired', 'First name is required'));
      return;
    }
    if (!selectedRole) {
      setError(t('admin.people.roleRequired', 'Role is required'));
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiClient.linkResourcePerson(resourceId, {
        role: selectedRole,
        roles: [selectedRole],
        isPrimary,
        person: {
          name: [firstName, lastName].filter(Boolean).join(' '),
          title: form.title.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          email: form.email.trim() || null,
          mobile: form.mobile.trim() || null,
          websiteUrl: form.websiteUrl.trim() || null,
          linkedinUrl: form.linkedinUrl.trim() || null,
          instagramUrl: form.instagramUrl.trim() || null,
          bio: form.bio.trim() || null,
        },
      });
      window.location.href = `/admin/resources/${resourceId}`;
    } catch (requestError: any) {
      setError(requestError?.message || t('admin.people.saveFailed', 'Could not save person.'));
      setSaving(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-3xl px-4 pt-20 text-gray-900 dark:text-gray-100">{t('common.loading', 'Loading...')}</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-20">
      <a href={`/admin/resources/${resourceId}`} className="mb-8 inline-flex items-center font-medium text-primary-600 hover:underline dark:text-primary-400">{'<'} {t('adminResources.backToResource', 'Back to resource')}</a>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.people.addTitle', 'Add Person')}</h1>
      {resource && <p className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"><span className="font-semibold">{t('admin.people.resource', 'Resource')}:</span> {resource.name}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {resource && (
        <form onSubmit={handleSubmit} className="grid gap-5 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-950 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.firstName', 'First name')}<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.lastName', 'Last name')}<input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.jobTitle', 'Title')}<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.email', 'Email')}<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
          <div className="sm:col-span-2">
            <PersonLocationFields
              city={form.city}
              country={form.country}
              onChange={(city, country) => setForm((current) => ({ ...current, city, country }))}
            />
          </div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.mobile', 'Mobile')}<input value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.websiteUrl', 'Website')}<input type="url" value={form.websiteUrl} onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.linkedinUrl', 'LinkedIn URL')}<input type="url" value={form.linkedinUrl} onChange={(event) => setForm({ ...form, linkedinUrl: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.instagramUrl', 'Instagram URL')}<input type="url" value={form.instagramUrl} onChange={(event) => setForm({ ...form, instagramUrl: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 sm:col-span-2">{t('admin.people.bio', 'Bio')}<textarea rows={4} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.role', 'Role')}<input required value={role} onChange={(event) => setRole(event.target.value)} maxLength={24} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
          <label className="inline-flex items-center gap-2 self-end pb-3 text-sm text-gray-700 dark:text-gray-200"><input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800" />{t('admin.people.primaryContact', 'Primary contact')}</label>
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={() => { window.location.href = `/admin/resources/${resourceId}`; }} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200">{t('common.cancel', 'Cancel')}</button>
            <button type="submit" disabled={saving} className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{saving ? t('adminResources.saving', 'Saving...') : t('common.save', 'Save')}</button>
          </div>
        </form>
      )}
    </main>
  );
};


const AddPersonPage: React.FC = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const resourceId = searchParams?.get('resourceId');
  const [error, setError] = useState<string>("");

  const handleSave = async (person: any) => {
    setError("");
    
    // Client-side validation
    if (!person.roasterId) {
      setError(t('admin.people.roasterRequired', 'Please select a roaster'));
      return;
    }
    
    if (!person.firstName || !person.firstName.trim()) {
      setError(t('admin.people.firstNameRequired', 'First name is required'));
      return;
    }
    
    try {
      await apiClient.createPerson(person);
      window.location.href = "/admin/people";
    } catch (error: any) {
      // Handle API errors
      const errorMessage = error?.message || "Failed to save person. Please try again.";
      setError(errorMessage);
    }
  };

  if (searchParams?.get('source') === 'resource') {
    return resourceId
      ? <ResourcePersonAddPage resourceId={resourceId} />
      : <main className="p-8 pt-20 text-red-600 dark:text-red-400">{t('adminResources.notFound', 'Resource not found.')}</main>;
  }

  return (
    <div className="max-w-3xl mx-auto pt-20">
      <div className="mb-8">
        <button
          className="text-primary-600 dark:text-primary-400 hover:underline text-base font-semibold flex items-center gap-2"
          onClick={() => window.location.href = '/admin/people'}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to People
        </button>
      </div>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          {t("admin.people.addTitle", "Add Person")}
        </h1>
        <AddPersonForm showRoasterSelector onSave={handleSave} onCancel={() => window.location.href = "/admin/people"} error={error} />
      </div>
    </div>
  );
};

export default AddPersonPage;
