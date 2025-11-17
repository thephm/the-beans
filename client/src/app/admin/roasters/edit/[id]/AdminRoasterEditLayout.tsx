"use client";
import React, { useState } from "react";
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
  const [selected, setSelected] = useState(SECTIONS[0].key);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Breadcrumb */}
      <nav className="text-sm text-blue-600 px-6 py-4">
        <Link href="/admin">Admin</Link> &gt;{' '}
        <Link href="/admin/roasters">Roasters</Link> &gt;{' '}
        <span className="font-semibold">{roasterName}</span>
      </nav>
      <div className="max-w-7xl mx-auto w-full flex flex-1 flex-col md:flex-row gap-6 px-4 sm:px-6 lg:px-8">
        {/* Left Navigation */}
        <aside className="md:w-64 w-full md:border-r border-gray-200 py-8 flex-shrink-0">
          <ul className="space-y-2">
            {SECTIONS.map((section) => (
              <li key={section.key}>
                <button
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-left font-medium transition-colors ${selected === section.key ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-700"}`}
                  onClick={() => setSelected(section.key)}
                >
                  <span>{section.label}</span>
                  {typeof section.count === "number" && (
                    <span className="ml-2 bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {section.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        {/* Right Pane */}
        <main className="flex-1 flex flex-col justify-between py-12 md:py-16">
          <div>
            <h2 className="text-2xl font-semibold mb-8">{SECTIONS.find(s => s.key === selected)?.label}</h2>
          </div>
          <div className="flex justify-end">
            <button className="bg-green-200 hover:bg-green-300 text-green-900 font-semibold px-6 py-2 rounded-lg shadow" type="button">
              Save
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
