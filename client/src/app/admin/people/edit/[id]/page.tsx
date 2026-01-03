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
  const [personAssociations, setPersonAssociations] = useState<RoasterPerson[]>([]);
  const [roasters, setRoasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        if (!personId) {
          if (isMounted) {
            setPersonAssociations([]);
            setLoading(false);
          }
          return;
        }
        const personData = await apiClient.getPerson(personId);
        
        if (!isMounted) return;
        
        // API returns { person: {...} }, extract the person object
        const personObj = (personData as any)?.person || personData;
        
        // Start with at least the current person
        let associations = [personObj];
        
        console.log('Edit page - Initial person:', personObj);
        
        // Try to fetch all roaster associations for this person by email
        if (personObj.email) {
          try {
            const allPeopleResponse = await apiClient.getPeopleByEmail(personObj.email);
            console.log('Edit page - getPeopleByEmail response:', allPeopleResponse);
            
            const peopleList = Array.isArray((allPeopleResponse as any).data) ? (allPeopleResponse as any).data : [];
            console.log('Edit page - People list count:', peopleList.length);
            
            if (peopleList.length > 0) {
              associations = peopleList;
              console.log('Edit page - Using', associations.length, 'associations for', personObj.email);
            }
          } catch (peopleErr) {
            console.warn('Could not fetch people by email, showing single person only:', peopleErr);
          }
        }
        
        setPersonAssociations(associations);
        
        const roasterData = await apiClient.getRoasters({ limit: 100 });
        
        if (!isMounted) return;
        
        // If roasterData is { roasters: [...] }, extract roasters
        const roastersList = (roasterData && Array.isArray((roasterData as any).roasters))
          ? (roasterData as any).roasters
          : [];
        setRoasters(roastersList);
      } catch (err) {
        console.error('Error fetching person data:', err);
        if (isMounted) {
          // Don't clear associations if we have at least the main person
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

  const handleSave = async (updatedPerson: any) => {
    setErrors({});
    
    // Client-side validation
    if (!updatedPerson.firstName || !updatedPerson.firstName.trim()) {
      setErrors({ general: t('admin.people.firstNameRequired', 'First name is required') });
      return;
    }
    
    try {
      // Update each roaster association
      if (updatedPerson.associations && updatedPerson.associations.length > 0) {
        await Promise.all(
          updatedPerson.associations.map((association: any) =>
            apiClient.updatePerson(association.id, {
              firstName: updatedPerson.firstName,
              lastName: updatedPerson.lastName,
              title: updatedPerson.title,
              email: updatedPerson.email,
              mobile: updatedPerson.mobile,
              linkedinUrl: updatedPerson.linkedinUrl,
              instagramUrl: updatedPerson.instagramUrl,
              bio: updatedPerson.bio,
              roasterId: association.roasterId,
              roles: association.roles,
              isPrimary: association.isPrimary,
            })
          )
        );
      } else {
        // Fallback: update just the main person record
        await apiClient.updatePerson(personId, updatedPerson);
      }
      // Go back to people list after successful save
      window.location.href = "/admin/people";
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to update person. Please try again.";
      setErrors({ general: errorMessage });
    }
  };

  const handleCancel = () => {
    window.location.href = "/admin/people";
  };

  const handleDelete = () => {
    setDeleteConfirmId(personId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiClient.deletePerson(deleteConfirmId);
      window.location.href = "/admin/people";
    } catch (error) {
      alert("Failed to delete person. Please try again.");
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  if (loading) return <div className="max-w-3xl mx-auto pt-20">{t('common.loading', 'Loading...')}</div>;
  if (personAssociations.length === 0) return <div className="max-w-3xl mx-auto pt-20">{t('people.noPeopleFound', 'Person not found.')}</div>;

  const mainPerson = personAssociations[0];

  return (
    <div className="max-w-3xl mx-auto pt-20">
      <div className="mb-8">
        <button
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-base font-semibold flex items-center gap-2"
          onClick={handleCancel}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('admin.people.title', 'Back to People')}
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">{t('admin.people.editTitle', 'Edit Person')}</h1>
      
      <div className="w-full bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
        {deleteConfirmId && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded">
            <div className="text-sm text-red-800 dark:text-red-200 mb-3">
              {t('admin.people.confirmDelete', 'Are you sure you want to delete this person?')}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
              >
                {t('admin.people.deleteConfirm', 'Delete')}
              </button>
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
              >
                {t('admin.people.deleteCancel', 'Cancel')}
              </button>
            </div>
          </div>
        )}
        <AddPersonForm
          mode="edit"
          initialPerson={mainPerson}
          roasters={roasters}
          roasterAssociations={personAssociations}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
          error={errors.general}
        />
      </div>
    </div>
  );
};

export default EditPersonPage;
