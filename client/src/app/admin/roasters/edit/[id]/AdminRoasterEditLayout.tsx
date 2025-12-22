"use client";
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import Link from "next/link";

const SECTIONS = [
  { key: "basic", label: "Basic Info." },
  { key: "location", label: "Location" },
  { key: "socials", label: "Socials", count: 2 },
  { key: "contacts", label: "Contacts", count: 1 },
  { key: "specialties", label: "Specialties", count: 2 },
  { key: "countries", label: "Countries", count: 0 },
  { key: "images", label: "Images", count: 2 },
  { key: "urlImages", label: "URL Images", count: 1 },
  { key: "hours", label: "Hours" },
  { key: "settings", label: "Settings" },
];

export default function AdminRoasterEditLayout({ roasterName = "[Roaster Name]" }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(SECTIONS[0].key);

  // Multilingual fallback for roaster name
  const displayRoasterName = roasterName && roasterName !== "[Roaster Name]"
    ? roasterName
    : t('adminForms.roasters.addTitle', 'New Roaster');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Breadcrumbs */}
      <nav className="text-sm text-blue-600 dark:text-blue-400 px-8 py-4">
        <Link href="/admin" className="hover:text-blue-800 dark:hover:text-blue-300">{t('admin.title', 'Admin')}</Link> &gt;{' '}
        <Link href="/admin/roasters" className="hover:text-blue-800 dark:hover:text-blue-300">{t('adminSection.roasters', 'Roasters')}</Link> &gt;{' '}
        <span className="font-semibold text-gray-900 dark:text-gray-100">{displayRoasterName}</span> &gt;{' '}
        <span className="text-gray-700 dark:text-gray-300">{t('adminForms.roasters.basicInformation', 'Basic Information')}</span>
      </nav>
      {/* Page Title & Layout */}
      <div className="flex flex-1 flex-col md:flex-row gap-8 pl-8 pt-12">
        {/* Left Navigation */}
        <aside className="md:w-64 w-full md:border-r border-gray-200 dark:border-gray-700 py-8 flex-shrink-0">
          <ul className="space-y-2">
            {SECTIONS.map((section) => (
              <li key={section.key}>
                <button
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-left font-medium transition-colors ${selected === section.key ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
                  onClick={() => setSelected(section.key)}
                >
                  <span>{section.label}</span>
                  {typeof section.count === "number" && (
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      selected === section.key
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {section.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        {/* Right Pane */}
        <main className="flex-1 flex flex-col justify-between">
          <div className="relative p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow flex flex-col min-h-[400px]">
            {/* Page Title - always visible and prominent */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {SECTIONS.find(s => s.key === selected)?.label}
            </h1>
            {/* Form content goes here */}
            <div className="flex-1" />
            {/* Save button bottom right */}
            <div className="absolute bottom-6 right-6">
              <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow" type="button">
                {t('adminForms.roasters.save', 'Save')}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
