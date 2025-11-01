"use client";
import React from "react";
import { useTranslation } from "react-i18next";

import AddPersonForm from "@/components/AddPersonForm";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { Roaster } from "@/types";


const AddPersonPage: React.FC = () => {
  const { t } = useTranslation();
  const [roasters, setRoasters] = useState<Roaster[]>([]);

  useEffect(() => {
    const fetchRoasters = async () => {
      try {
          const data = await apiClient.getRoasters();
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
    <div className="mt-8 w-full flex flex-col items-center">
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
