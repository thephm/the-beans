// People admin page for managing roaster contacts (light CRM)
import React from 'react';
import { getServerSession } from 'next-auth';
import { requireAdmin } from '../../lib/auth';
import PeopleTable from '../../../components/PeopleTable';
import { useTranslation } from '../../../contexts/LanguageContext';

export default async function PeopleAdminPage() {
  // Server-side admin check (pseudo, replace with your actual logic)
  const session = await getServerSession();
  requireAdmin(session);

  const { t } = useTranslation();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t('admin.people.title', 'People')}</h1>
      <PeopleTable />
    </main>
  );
}
