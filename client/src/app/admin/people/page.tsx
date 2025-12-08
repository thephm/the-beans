"use client";
// People admin page for managing roaster contacts (light CRM)
import React from 'react';
import PeopleTable from '@/components/PeopleTable';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function PeopleAdminPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('adminSection.people', 'People')}</h1>
          </div>
          <div className="text-red-600 dark:text-red-400">{t('admin.people.adminRequired', 'Admin access required.')}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto pt-20 sm:pt-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('adminSection.people', 'People')}</h1>
        </div>
        <PeopleTable />
      </div>
    </div>
  );
}
