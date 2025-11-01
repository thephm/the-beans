"use client";
import React from "react";
import { useTranslation } from "react-i18next";

import AddPersonForm from "@/components/AddPersonForm";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Roaster, RoastersResponse } from "@/types";


const AddPersonPage: React.FC = () => {
  const { t } = useTranslation();
  const [roasters, setRoasters] = useState<Roaster[]>([]);

  useEffect(() => {
    const fetchRoasters = async () => {
      try {
        const data = await apiClient.getRoasters() as RoastersResponse;
        setRoasters(Array.isArray(data?.roasters) ? data.roasters : []);
      } catch (err) {
        setRoasters([]);
      }
    };
    fetchRoasters();
  }, []);

  const handleSave = async (person: any) => {
    try {
      await apiClient.createPerson(person);
      window.location.href = "/admin/people";
    } catch (error) {
      alert("Failed to save person. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto pt-20">
      <div className="mb-8">
        <button
          className="text-blue-700 hover:text-blue-900 text-base font-semibold flex items-center gap-2"
          onClick={() => window.location.href = '/admin/people'}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to People
        </button>
      </div>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          {t("admin.people.addTitle", "Add Person")}
        </h1>
        <AddPersonForm roasters={roasters} onSave={handleSave} onCancel={() => window.location.href = "/admin/people"} />
      </div>
    </div>
  );
};

export default AddPersonPage;
