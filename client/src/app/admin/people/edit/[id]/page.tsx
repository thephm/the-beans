"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import AddPersonForm from "@/components/AddPersonForm";
import { apiClient } from "@/lib/api";
import { RoasterPerson } from "@/types";


const EditPersonPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const personId = params?.id as string;
  const [person, setPerson] = useState<RoasterPerson | null>(null);
  const [roasters, setRoasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        if (!personId) {
          if (isMounted) {
            setPerson(null);
            setLoading(false);
          }
          return;
        }
        const personData = await apiClient.getPerson(personId);
        
        if (!isMounted) return;
        
        // API returns { person: {...} }, extract the person object
        const personObj = (personData as any)?.person || personData;
        setPerson(personObj as RoasterPerson);
        const roasterData = await apiClient.getRoasters();
        
        if (!isMounted) return;
        
        // If roasterData is { roasters: [...] }, extract roasters
        const roastersList = (roasterData && Array.isArray((roasterData as any).roasters))
          ? (roasterData as any).roasters
          : [];
        setRoasters(roastersList);
      } catch (err) {
        if (isMounted) {
          setPerson(null);
          setRoasters([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [personId]);

  const handleSave = async (updatedPerson: RoasterPerson) => {
    try {
      await apiClient.updatePerson(personId, updatedPerson);
      window.location.href = "/admin/people";
    } catch (error) {
      alert("Failed to update person. Please try again.");
    }
  };

  const handleCancel = () => {
    window.location.href = "/admin/people";
  };

  if (loading) return <div>{t("Loading...")}</div>;
  if (!person) return <div>{t("Person not found.")}</div>;

  return (
    <div className="max-w-3xl mx-auto pt-20">
      <div className="mb-8">
        <button
          className="text-blue-700 hover:text-blue-900 text-base font-semibold flex items-center gap-2"
          onClick={handleCancel}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to People
        </button>
      </div>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">{t("Edit Person")}</h1>
        <AddPersonForm
          mode="edit"
          initialPerson={person}
          roasters={roasters}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default EditPersonPage;
