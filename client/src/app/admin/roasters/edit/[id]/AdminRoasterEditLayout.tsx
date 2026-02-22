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

interface AdminRoasterEditLayoutProps {
  roasterId?: string;
  roasterName?: string;
}

export default function AdminRoasterEditLayout({ roasterId, roasterName = "[Roaster Name]" }: AdminRoasterEditLayoutProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(SECTIONS[0].key);
  const isEditing = Boolean(roasterId);

  // Multilingual fallback for roaster name
  const displayRoasterName = roasterName && roasterName !== "[Roaster Name]"
    ? roasterName
    : t('adminForms.roasters.addTitle', 'New Roaster');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      <div className="pt-20 sm:pt-28 px-4 sm:px-8 lg:px-32">
        <div className="max-w-6xl mx-auto">
          <nav className="mb-4">
            <Link
              href="/admin/roasters"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
            >
              {"<"} {t('admin.roasters.backToRoasters', 'Back to Roasters')}
            </Link>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {isEditing
              ? t('adminForms.roasters.editRoaster', 'Edit Roaster')
              : t('admin.roasters.addTitle', 'Add Roaster')
            }
          </h1>
        </div>
        {/* Page Title & Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-1 flex-col md:flex-row gap-8 pt-6">
            {/* Left Navigation */}
            <aside className="md:w-64 w-full md:border-r md:border-t border-gray-200 dark:border-gray-700 py-8 flex-shrink-0 -ml-8 pl-8">
              <ul className="space-y-1">
                {SECTIONS.map((section) => (
                  <li key={section.key}>
                    <button
                      className={`w-full flex items-center justify-between px-4 py-1.5 rounded-lg text-left font-medium transition-colors ${selected === section.key ? "bg-purple-700/20 text-white border border-purple-500" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"}`}
                      onClick={() => setSelected(section.key)}
                    >
                      <span>{section.label}</span>
                      {typeof section.count === "number" && (
                        <span className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-600 text-white">
                          {section.count}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
            {/* Right Pane */}
            <main className="flex-1 flex flex-col">
              <div className="relative p-4 bg-slate-100 dark:bg-slate-800 border border-black/90 dark:border-black rounded-lg shadow flex flex-col min-h-[400px]">
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
              <div className="flex-1 bg-black" />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
