"use client";
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import Link from "next/link";
import PersonRoleButtons from "@/components/PersonRoleButtons";
import { PersonRole } from "@/types";

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
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    website: "",
    founded: "",
  });
  const [locationInfo, setLocationInfo] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    latitude: "",
    longitude: "",
  });
  const [socialInfo, setSocialInfo] = useState({
    instagram: "",
    tiktok: "",
    facebook: "",
    linkedin: "",
    youtube: "",
    threads: "",
    pinterest: "",
    bluesky: "",
    x: "",
    reddit: "",
  });
  const [contactInfo, setContactInfo] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    mobile: "",
    linkedinUrl: "",
    instagramUrl: "",
    roles: [] as PersonRole[],
    isPrimary: false,
    bio: "",
  });

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBasicInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocationInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSocialInfo((prev) => ({ ...prev, [name]: value }));
  };
  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };
  const handleContactRoleToggle = (role: PersonRole) => {
    setContactInfo((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((existingRole) => existingRole !== role)
        : [...prev.roles, role],
    }));
  };

  // Multilingual fallback for roaster name
  const displayRoasterName = roasterName && roasterName !== "[Roaster Name]"
    ? roasterName
    : t('adminForms.roasters.addTitle', 'New Roaster');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      <div className="pt-16 sm:pt-20 px-4 sm:px-8 lg:px-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-2 mb-3 mt-4 sm:mt-6 md:flex-row md:items-center md:gap-6">
            <div className="md:w-64 md:-ml-8 md:pl-8 flex-shrink-0">
              <nav>
                <Link
                  href="/admin/roasters"
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
                >
                  {"<"} {t('admin.roasters.backToRoasters', 'Back to Roasters')}
                </Link>
              </nav>
            </div>
            <div className="flex-1 md:pl-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {isEditing
                  ? t('adminForms.roasters.editRoaster', 'Edit Roaster')
                  : t('admin.roasters.addTitle', 'Add Roaster')
                }
              </h1>
            </div>
          </div>
        </div>
        {/* Page Title & Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-1 flex-col md:flex-row gap-8">
            {/* Left Navigation */}
            <aside className="md:w-64 w-full md:border-r md:border-t border-gray-200 dark:border-gray-700 py-8 pt-8 flex-shrink-0 -ml-8 pl-8">
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
                <div className="flex-1">
                  {selected === "basic" ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.name', 'Name')} *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={basicInfo.name}
                            onChange={handleBasicInfoChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.website', 'Website')}
                          </label>
                          <input
                            type="url"
                            name="website"
                            value={basicInfo.website}
                            onChange={handleBasicInfoChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('adminForms.roasters.description', 'Description')}
                        </label>
                        <textarea
                          name="description"
                          value={basicInfo.description}
                          onChange={handleBasicInfoChange}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.email', 'Email')}
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={basicInfo.email}
                            onChange={handleBasicInfoChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.phone', 'Phone')}
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={basicInfo.phone}
                            onChange={handleBasicInfoChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.founded', 'Founded')}
                          </label>
                          <input
                            type="number"
                            name="founded"
                            value={basicInfo.founded}
                            onChange={handleBasicInfoChange}
                            placeholder="e.g. 2020"
                            min="1800"
                            max="2100"
                            step="1"
                            className="w-full max-w-[8rem] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  ) : selected === "location" ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.address', 'Address')}
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={locationInfo.address}
                            onChange={handleLocationInfoChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.city', 'City')}
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={locationInfo.city}
                            onChange={handleLocationInfoChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.state', 'State')}
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={locationInfo.state}
                            onChange={handleLocationInfoChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.roasters.country', 'Country')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={locationInfo.country}
                            onChange={handleLocationInfoChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="w-full md:w-auto">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.roasters.zipCode', 'Zip Code')}
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            value={locationInfo.zipCode}
                            onChange={handleLocationInfoChange}
                            className="w-full md:w-[8rem] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="w-full md:w-auto">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.roasters.latitude', 'Latitude')}
                          </label>
                          <input
                            type="number"
                            step="any"
                            name="latitude"
                            value={locationInfo.latitude}
                            onChange={handleLocationInfoChange}
                            className="w-full md:w-[10rem] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="w-full md:w-auto">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.roasters.longitude', 'Longitude')}
                          </label>
                          <input
                            type="number"
                            step="any"
                            name="longitude"
                            value={locationInfo.longitude}
                            onChange={handleLocationInfoChange}
                            className="w-full md:w-[10rem] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  ) : selected === "socials" ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.instagram', 'Instagram')}
                          </label>
                          <input
                            type="url"
                            name="instagram"
                            value={socialInfo.instagram}
                            onChange={handleSocialInfoChange}
                            placeholder="https://instagram.com/"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.tiktok', 'TikTok')}
                          </label>
                          <input
                            type="url"
                            name="tiktok"
                            value={socialInfo.tiktok}
                            onChange={handleSocialInfoChange}
                            placeholder="https://tiktok.com/@"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.facebook', 'Facebook')}
                          </label>
                          <input
                            type="url"
                            name="facebook"
                            value={socialInfo.facebook}
                            onChange={handleSocialInfoChange}
                            placeholder="https://facebook.com/"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.linkedin', 'LinkedIn')}
                          </label>
                          <input
                            type="url"
                            name="linkedin"
                            value={socialInfo.linkedin}
                            onChange={handleSocialInfoChange}
                            placeholder="https://linkedin.com/"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.youtube', 'YouTube')}
                          </label>
                          <input
                            type="url"
                            name="youtube"
                            value={socialInfo.youtube}
                            onChange={handleSocialInfoChange}
                            placeholder="https://youtube.com/"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.x', 'X')}
                          </label>
                          <input
                            type="url"
                            name="x"
                            value={socialInfo.x}
                            onChange={handleSocialInfoChange}
                            placeholder="https://x.com/"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.threads', 'Threads')}
                          </label>
                          <input
                            type="url"
                            name="threads"
                            value={socialInfo.threads}
                            onChange={handleSocialInfoChange}
                            placeholder="https://threads.net/"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.pinterest', 'Pinterest')}
                          </label>
                          <input
                            type="url"
                            name="pinterest"
                            value={socialInfo.pinterest}
                            onChange={handleSocialInfoChange}
                            placeholder="https://pinterest.com/"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.bluesky', 'Bluesky')}
                          </label>
                          <input
                            type="url"
                            name="bluesky"
                            value={socialInfo.bluesky}
                            onChange={handleSocialInfoChange}
                            placeholder="https://bsky.app/"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('adminForms.roasters.reddit', 'Reddit')}
                          </label>
                          <input
                            type="url"
                            name="reddit"
                            value={socialInfo.reddit}
                            onChange={handleSocialInfoChange}
                            placeholder="https://reddit.com/"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  ) : selected === "contacts" ? (
                    <div className="space-y-3 max-w-4xl">
                      <div className="grid grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px] gap-2 items-start">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.people.firstName', 'First Name')} *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={contactInfo.firstName}
                            onChange={handleContactInfoChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.people.lastName', 'Last Name')}
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={contactInfo.lastName}
                            onChange={handleContactInfoChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="col-span-2 md:col-auto md:row-span-5">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('admin.people.role', 'Role')}
                          </label>
                          <PersonRoleButtons
                            selectedRoles={contactInfo.roles}
                            onRoleToggle={handleContactRoleToggle}
                            size="sm"
                            layout="wrap"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.people.jobTitle', 'Title')}
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={contactInfo.title}
                            onChange={handleContactInfoChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('admin.people.primaryContact', 'Primary Contact')}
                          </label>
                          <button
                            type="button"
                            className={`px-6 py-2 rounded-lg border text-sm font-semibold transition-colors duration-150 focus:outline-none ${contactInfo.isPrimary ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                            onClick={() => setContactInfo((prev) => ({ ...prev, isPrimary: !prev.isPrimary }))}
                          >
                            {contactInfo.isPrimary ? t('common.yes', 'Yes') : t('common.no', 'No')}
                          </button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.people.email', 'Email')}
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={contactInfo.email}
                            onChange={handleContactInfoChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.people.mobile', 'Mobile')}
                          </label>
                          <input
                            type="text"
                            name="mobile"
                            value={contactInfo.mobile}
                            onChange={handleContactInfoChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.people.instagramUrl', 'Instagram URL')}
                          </label>
                          <input
                            type="url"
                            name="instagramUrl"
                            value={contactInfo.instagramUrl}
                            onChange={handleContactInfoChange}
                            placeholder={t('admin.people.instagramUrlPlaceholder', 'https://www.instagram.com/username')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.people.linkedinUrl', 'LinkedIn URL')}
                          </label>
                          <input
                            type="url"
                            name="linkedinUrl"
                            value={contactInfo.linkedinUrl}
                            onChange={handleContactInfoChange}
                            placeholder={t('admin.people.linkedinUrlPlaceholder', 'https://www.linkedin.com/in/username')}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('admin.people.bio', 'Bio')}
                          </label>
                          <textarea
                            name="bio"
                            value={contactInfo.bio}
                            onChange={handleContactInfoChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('adminForms.roasters.sectionPlaceholder', 'Fields will appear here when you select a section.')}
                    </div>
                  )}
                </div>
              </div>
              {/* Save button */}
              <div className="mt-6 flex justify-end">
                <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow" type="button">
                  {t('adminForms.roasters.save', 'Save')}
                </button>
              </div>
              <div className="flex-1 bg-black" />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
