"use client";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import AddPersonForm from "@/components/AddPersonForm";
import LocationFields from "@/components/LocationFields";
import { RoasterSearchField } from "@/components/AddPersonForm";
import PersonRoleButtons from "@/components/PersonRoleButtons";
import { apiClient } from "@/lib/api";
import { PersonRole, RESOURCE_PERSON_ROLES, RoasterPerson } from "@/types";

const normalizeResourceRole = (role: string) => role === 'contact' ? PersonRole.OTHER : role;


const EditPersonPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const personId = params?.id as string;
  const isResourcePerson = searchParams?.get('source') === 'resource';
  const returnToResourceId = searchParams?.get('returnToResource');
  const resourceReturnUrl = returnToResourceId ? `/admin/resources/${encodeURIComponent(returnToResourceId)}` : '/admin/people';
  const [personAssociations, setPersonAssociations] = useState<RoasterPerson[]>([]);
  const [initialRoasterAssociations, setInitialRoasterAssociations] = useState<any[]>([]);
  const [initialRoasterAssociationIds, setInitialRoasterAssociationIds] = useState<string[]>([]);
  const [roasterSearchKey, setRoasterSearchKey] = useState(0);
  const [resourcePerson, setResourcePerson] = useState<any>(null);
  const [resourcePersonForm, setResourcePersonForm] = useState<any>({});
  const [resourceAssociations, setResourceAssociations] = useState<any[]>([]);
  const [initialResourceAssociations, setInitialResourceAssociations] = useState<any[]>([]);
  const [initialResourceIds, setInitialResourceIds] = useState<string[]>([]);
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceResults, setResourceResults] = useState<any[]>([]);
  const [resourceSearchLoading, setResourceSearchLoading] = useState(false);
  const [resourceSaving, setResourceSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [personLoaded, setPersonLoaded] = useState(false);
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
        if (isResourcePerson) {
          const resourcePersonData = await apiClient.getResourcePerson(personId);
          if (!isMounted) return;
          const resourcePersonObject = (resourcePersonData as any)?.person || resourcePersonData;
          const nameParts = (resourcePersonObject.name || '').trim().split(/\s+/);
          const resourceAssociationMap = new Map<string, any>();
          (resourcePersonObject.resources || []).forEach((association: any) => {
            const resource = association.resource;
            if (!resource?.id) return;
            let entry = resourceAssociationMap.get(resource.id);
            if (!entry) {
              entry = {
                resourceId: resource.id,
                resource,
                roles: [],
                isPrimary: false,
              };
              resourceAssociationMap.set(resource.id, entry);
            }
            const role = association.role && normalizeResourceRole(association.role);
            if (role && RESOURCE_PERSON_ROLES.includes(role as PersonRole) && !entry.roles.includes(role)) entry.roles.push(role);
            entry.isPrimary = entry.isPrimary || Boolean(association.isPrimary);
          });
          setResourcePerson(resourcePersonObject);
          setPersonLoaded(true);
          const initialAssociations = Array.from(resourceAssociationMap.values());
          setResourceAssociations(initialAssociations);
          setInitialResourceAssociations(initialAssociations);
          setInitialResourceIds(Array.from(resourceAssociationMap.keys()));
          setResourcePersonForm({
            firstName: nameParts.shift() || '',
            lastName: nameParts.join(' '),
            title: resourcePersonObject.title || '',
            city: resourcePersonObject.city || '',
            country: resourcePersonObject.country || '',
            email: resourcePersonObject.email || '',
            mobile: resourcePersonObject.mobile || '',
            websiteUrl: resourcePersonObject.websiteUrl || '',
            linkedinUrl: resourcePersonObject.linkedinUrl || '',
            instagramUrl: resourcePersonObject.instagramUrl || '',
            bio: resourcePersonObject.bio || '',
            notes: resourcePersonObject.notes || '',
          });
          let matchingRoasterPeople: any[] = [];
          if (resourcePersonObject.email) {
            try {
              const response = await apiClient.getPeopleByEmail(resourcePersonObject.email);
              matchingRoasterPeople = Array.isArray((response as any)?.data) ? (response as any).data : [];
            } catch (error) {
              console.warn('Could not fetch matching roaster people:', error);
            }
          }
          if (!isMounted) return;
          setPersonAssociations(matchingRoasterPeople);
          setInitialRoasterAssociations(matchingRoasterPeople);
          setInitialRoasterAssociationIds(matchingRoasterPeople.map((association) => association.id));
          return;
        }
        const personData = await apiClient.getPerson(personId);
        
        if (!isMounted) return;
        
        // API returns { person: {...} }, extract the person object
        const personObj = (personData as any)?.person || personData;
        setPersonLoaded(true);
        
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
        setInitialRoasterAssociations(associations);
        setInitialRoasterAssociationIds(associations.map((association: any) => association.id));

        let matchingResourcePerson: any = null;
        if (personObj.email) {
          try {
            const resourcePeopleResponse = await apiClient.searchResourcePeople(personObj.email);
            const resourcePeople = Array.isArray((resourcePeopleResponse as any)?.people) ? (resourcePeopleResponse as any).people : [];
            const exactMatch = resourcePeople.find((person: any) => person.email?.trim().toLowerCase() === personObj.email.trim().toLowerCase());
            if (exactMatch) {
              const response = await apiClient.getResourcePerson(exactMatch.id);
              matchingResourcePerson = (response as any)?.person || response;
            }
          } catch (resourceError) {
            console.warn('Could not fetch matching resource person:', resourceError);
          }
        }
        if (!isMounted) return;

        const resourcesById = new Map<string, any>();
        (matchingResourcePerson?.resources || []).forEach((association: any) => {
          const resource = association.resource;
          if (!resource?.id) return;
          let grouped = resourcesById.get(resource.id);
          if (!grouped) {
            grouped = { resourceId: resource.id, resource, roles: [], isPrimary: false };
            resourcesById.set(resource.id, grouped);
          }
          const role = association.role && normalizeResourceRole(association.role);
          if (role && RESOURCE_PERSON_ROLES.includes(role as PersonRole) && !grouped.roles.includes(role)) grouped.roles.push(role);
          grouped.isPrimary = grouped.isPrimary || Boolean(association.isPrimary);
        });
        const loadedResourceAssociations = Array.from(resourcesById.values());
        setResourcePerson(matchingResourcePerson);
        setResourceAssociations(loadedResourceAssociations);
        setInitialResourceAssociations(loadedResourceAssociations);
        setInitialResourceIds(loadedResourceAssociations.map((association) => association.resourceId));
        setResourcePersonForm({
          firstName: personObj.firstName || '',
          lastName: personObj.lastName || '',
          title: matchingResourcePerson?.title || personObj.title || '',
          city: matchingResourcePerson?.city || personObj.city || '',
          country: matchingResourcePerson?.country || personObj.country || '',
          email: matchingResourcePerson?.email || personObj.email || '',
          mobile: matchingResourcePerson?.mobile || personObj.mobile || '',
          websiteUrl: matchingResourcePerson?.websiteUrl || '',
          linkedinUrl: matchingResourcePerson?.linkedinUrl || personObj.linkedinUrl || '',
          instagramUrl: matchingResourcePerson?.instagramUrl || personObj.instagramUrl || '',
          bio: matchingResourcePerson?.bio || personObj.bio || '',
          notes: matchingResourcePerson?.notes || '',
        });
      } catch (err) {
        console.error('Error fetching person data:', err);
        if (isMounted) {
          setErrors({ general: (err as Error).message || 'Failed to load person.' });
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
  }, [personId, isResourcePerson]);

  useEffect(() => {
    const term = resourceSearch.trim();
    if (term.length < 2) {
      setResourceResults([]);
      setResourceSearchLoading(false);
      return;
    }

    let isCurrent = true;
    const timer = setTimeout(async () => {
      setResourceSearchLoading(true);
      try {
        const data = await apiClient.getResources({ search: term, includeArchived: 'true' }) as any;
        if (isCurrent) setResourceResults(Array.isArray(data?.resources) ? data.resources : []);
      } catch {
        if (isCurrent) setResourceResults([]);
      } finally {
        if (isCurrent) setResourceSearchLoading(false);
      }
    }, 250);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [resourceSearch]);

  const addResourceAssociation = (resource: any) => {
    setResourceAssociations((current) => {
      if (current.some((association) => association.resourceId === resource.id)) return current;
      const existing = initialResourceAssociations.find((association) => association.resourceId === resource.id);
      if (existing) return [...current, existing];
      return [...current, { resourceId: resource.id, resource, roles: ['other'], isPrimary: false }];
    });
    setResourceSearch('');
    setResourceResults([]);
  };

  const addRoasterAssociation = (roaster: any | null) => {
    if (!roaster) return;
    setPersonAssociations((current) => {
      if (current.some((association: any) => association.roasterId === roaster.id)) return current;
      const existing = initialRoasterAssociations.find((association) => association.roasterId === roaster.id);
      if (existing) return [...current, existing];
      return [...current, {
        roasterId: roaster.id,
        roaster,
        firstName: resourcePersonForm.firstName,
        lastName: resourcePersonForm.lastName,
        title: resourcePersonForm.title,
        email: resourcePersonForm.email,
        mobile: resourcePersonForm.mobile,
        linkedinUrl: resourcePersonForm.linkedinUrl,
        instagramUrl: resourcePersonForm.instagramUrl,
        bio: resourcePersonForm.bio,
        roles: ['other'],
        isPrimary: false,
      } as any];
    });
    setRoasterSearchKey((key) => key + 1);
  };

  const removeRoasterAssociation = (association: any) => {
    setPersonAssociations((current) => current.filter((entry: any) => entry.roasterId !== association.roasterId));
  };

  const handleResourceSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firstName = (resourcePersonForm.firstName || '').trim();
    const lastName = (resourcePersonForm.lastName || '').trim();
    const name = [firstName, lastName].filter(Boolean).join(' ');
    if (!firstName) {
      setErrors({ firstName: t('admin.people.firstNameRequired', 'First name is required') });
      return;
    }

    const normalizedResourceAssociations = resourceAssociations.map((association) => ({
      ...association,
      roles: association.roles
        .map((role: string) => normalizeResourceRole(role.trim()))
        .filter((role: string) => RESOURCE_PERSON_ROLES.includes(role as PersonRole)),
    }));
    const associationMissingRole = normalizedResourceAssociations.find((association) => association.roles.length === 0);
    if (associationMissingRole) {
      setErrors({ resourceRoleAssociationId: associationMissingRole.resourceId });
      return;
    }

    setErrors({});
    setResourceSaving(true);
    try {
      const resourcePersonData = {
        ...resourcePersonForm,
        name,
        title: resourcePersonForm.title.trim() || null,
        city: resourcePersonForm.city.trim() || null,
        country: resourcePersonForm.country.trim() || null,
        email: resourcePersonForm.email.trim() || null,
        mobile: resourcePersonForm.mobile.trim() || null,
        websiteUrl: resourcePersonForm.websiteUrl.trim() || null,
        linkedinUrl: resourcePersonForm.linkedinUrl.trim() || null,
        instagramUrl: resourcePersonForm.instagramUrl.trim() || null,
        bio: resourcePersonForm.bio.trim() || null,
        notes: resourcePersonForm.notes.trim() || null,
      };
      if (resourcePerson?.id) {
        await apiClient.updateResourcePersonDetails(resourcePerson.id, resourcePersonData);
      }
      await Promise.all(personAssociations.map((association: any) => {
        const personData = {
          firstName,
          lastName,
          title: resourcePersonForm.title.trim(),
          city: resourcePersonForm.city.trim() || null,
          country: resourcePersonForm.country.trim() || null,
          email: resourcePersonForm.email.trim() || null,
          mobile: resourcePersonForm.mobile.trim(),
          linkedinUrl: resourcePersonForm.linkedinUrl.trim() || null,
          instagramUrl: resourcePersonForm.instagramUrl.trim() || null,
          bio: resourcePersonForm.bio.trim(),
          roasterId: association.roasterId,
          roles: association.roles || ['other'],
          isPrimary: Boolean(association.isPrimary),
        };
        return association.id
          ? apiClient.updatePerson(association.id, personData)
          : apiClient.createPerson(personData);
      }));
      let resolvedResourcePersonId = resourcePerson?.id || null;
      for (const association of normalizedResourceAssociations) {
        const data = { role: association.roles[0], roles: association.roles, isPrimary: association.isPrimary };
        if (initialResourceIds.includes(association.resourceId) && resolvedResourcePersonId) {
          await apiClient.updateResourcePerson(association.resourceId, resolvedResourcePersonId, data);
          continue;
        }

        for (const role of association.roles) {
          const relationship = await apiClient.linkResourcePerson(association.resourceId, {
            ...(resolvedResourcePersonId ? { personId: resolvedResourcePersonId } : { person: resourcePersonData }),
            role,
            isPrimary: association.isPrimary,
          }) as any;
          resolvedResourcePersonId = resolvedResourcePersonId || relationship.personId || relationship.person?.id || null;
        }
      }
      await Promise.all(initialRoasterAssociationIds
        .filter((associationId) => !personAssociations.some((association: any) => association.id === associationId))
        .map((associationId) => apiClient.deletePerson(associationId)));
      await Promise.all(initialResourceIds
        .filter((resourceId) => !normalizedResourceAssociations.some((association) => association.resourceId === resourceId))
        .map((resourceId) => apiClient.unlinkResourcePerson(resourceId, personId)));
      window.location.href = resourceReturnUrl;
    } catch (error: any) {
      setErrors({ general: error?.message || 'Could not update person.' });
      setResourceSaving(false);
    }
  };

  const updateResourceAssociation = (index: number, update: any) => {
    setResourceAssociations((current) => current.map((association, associationIndex) => associationIndex === index
      ? { ...association, ...update }
      : association));
  };

  const toggleResourceRole = (associationIndex: number, role: string) => {
    const roles: string[] = resourceAssociations[associationIndex].roles || [];
    const updatedRoles = roles.includes(role) ? roles.filter((selectedRole) => selectedRole !== role) : [...roles, role];
    updateResourceAssociation(associationIndex, { roles: updatedRoles });
    if (updatedRoles.length > 0 && errors.resourceRoleAssociationId === resourceAssociations[associationIndex].resourceId) {
      setErrors({});
    }
  };

  const toggleRoasterRole = (associationIndex: number, role: PersonRole) => {
    setPersonAssociations((current) => current.map((association: any, index) => index === associationIndex
      ? { ...association, roles: (association.roles || []).includes(role)
        ? association.roles.filter((existingRole: PersonRole) => existingRole !== role)
        : [...(association.roles || []), role] }
      : association));
  };

  const toggleRoasterPrimary = (associationIndex: number) => {
    setPersonAssociations((current) => current.map((association: any, index) => index === associationIndex
      ? { ...association, isPrimary: !association.isPrimary }
      : association));
  };

  const resourceRoleOptions = RESOURCE_PERSON_ROLES;
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
              city: updatedPerson.city || null,
              country: updatedPerson.country || null,
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
  if (personId) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-20">
        <div className="mb-8">
          <a href={resourceReturnUrl} className="inline-flex items-center font-medium text-primary-600 hover:underline dark:text-primary-400">{'<'} {returnToResourceId ? t('admin.people.backToResource', 'Back to resource') : t('admin.people.title', 'Back to People')}</a>
        </div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{t('admin.people.editTitle', 'Edit Person')}</h1>
        {errors.general && <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">{errors.general}</p>}
        {personLoaded ? (
          <form onSubmit={handleResourceSave} className="w-full rounded-lg border border-black/90 bg-white p-8 shadow dark:border-purple-400/70 dark:bg-gray-950">
            <div className="mb-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.firstName', 'First Name')}<input required aria-invalid={Boolean(errors.firstName)} aria-describedby={errors.firstName ? 'resource-person-first-name-error' : undefined} value={resourcePersonForm.firstName || ''} onChange={(event) => {
                  const firstNameValue = event.target.value;
                  setResourcePersonForm({ ...resourcePersonForm, firstName: firstNameValue });
                  if (firstNameValue.trim()) {
                    setErrors((currentErrors) => {
                      const nextErrors = { ...currentErrors };
                      delete nextErrors.firstName;
                      return nextErrors;
                    });
                  }
                }} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />{errors.firstName && <span id="resource-person-first-name-error" role="alert" className="mt-1 block text-sm text-red-600 dark:text-red-400">{errors.firstName}</span>}</label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.lastName', 'Last Name')}<input value={resourcePersonForm.lastName || ''} onChange={(event) => setResourcePersonForm({ ...resourcePersonForm, lastName: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.jobTitle', 'Title')}<input value={resourcePersonForm.title || ''} onChange={(event) => setResourcePersonForm({ ...resourcePersonForm, title: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.websiteUrl', 'Website')}<input type="url" value={resourcePersonForm.websiteUrl || ''} onChange={(event) => setResourcePersonForm({ ...resourcePersonForm, websiteUrl: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.email', 'Email')}<input type="email" value={resourcePersonForm.email || ''} onChange={(event) => setResourcePersonForm({ ...resourcePersonForm, email: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.mobile', 'Mobile')}<input value={resourcePersonForm.mobile || ''} onChange={(event) => setResourcePersonForm({ ...resourcePersonForm, mobile: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
              </div>
              <LocationFields
                city={resourcePersonForm.city || ''}
                country={resourcePersonForm.country || ''}
                onChange={(city, country) => setResourcePersonForm((current: any) => ({ ...current, city, country }))}
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.linkedinUrl', 'LinkedIn URL')}<input type="url" value={resourcePersonForm.linkedinUrl || ''} onChange={(event) => setResourcePersonForm({ ...resourcePersonForm, linkedinUrl: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.instagramUrl', 'Instagram URL')}<input type="url" value={resourcePersonForm.instagramUrl || ''} onChange={(event) => setResourcePersonForm({ ...resourcePersonForm, instagramUrl: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
              </div>
            </div>
            <section className="mb-4 space-y-3 sm:col-span-2" aria-labelledby="roaster-associations-heading">
              <h2 id="roaster-associations-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('admin.people.roasterAssociations', 'Roasters')}</h2>
              <div className="max-w-xl">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.addRoasterAssociation', 'Associate a roaster')}</label>
                <RoasterSearchField
                  key={roasterSearchKey}
                  value=""
                  label={t('admin.people.roaster', 'Roaster')}
                  onChange={addRoasterAssociation}
                />
              </div>
              {personAssociations.map((association: any, associationIndex) => (
                <div key={association.id || `new-roaster-${association.roasterId}`} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-4 flex flex-col items-end gap-4 sm:flex-row">
                    <div className="w-full flex-1">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.roaster', 'Roaster')}</label>
                      <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-100 dark:border-green-800 dark:bg-green-900/50">
                        <a href={`/admin/roasters/edit/${association.roasterId}?returnTo=people`} className="flex-1 px-4 py-2 font-semibold text-green-900 hover:underline dark:text-green-100">{association.roaster?.name || t('admin.people.roaster', 'Roaster')}</a>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t('admin.people.removeRoasterAssociationConfirm', 'Remove this roaster association?'))) {
                              removeRoasterAssociation(association);
                            }
                          }}
                          aria-label={t('admin.people.removeRoasterAssociation', 'Remove roaster association')}
                          title={t('admin.people.removeRoasterAssociation', 'Remove roaster association')}
                          className="px-3 py-2 text-lg font-bold leading-none text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.primaryContact', 'Primary Contact')}</label>
                      <button
                        type="button"
                        aria-pressed={Boolean(association.isPrimary)}
                        onClick={() => toggleRoasterPrimary(associationIndex)}
                        className={`w-full rounded-lg border px-6 py-2 text-sm font-semibold transition-colors focus:outline-none sm:w-auto ${association.isPrimary ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-700'}`}
                      >
                        {association.isPrimary ? t('common.yes', 'Yes') : t('common.no', 'No')}
                      </button>
                    </div>
                  </div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.role', 'Role')}</label>
                  <PersonRoleButtons selectedRoles={association.roles || []} onRoleToggle={(role) => toggleRoasterRole(associationIndex, role as PersonRole)} size="sm" layout="wrap" />
                </div>
              ))}
            </section>
            <section className="mb-4 space-y-3 sm:col-span-2" aria-labelledby="resource-associations-heading">
              <h2 id="resource-associations-heading" className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('admin.people.resourceAssociations', 'Resources')}</h2>
              <div className="relative max-w-xl">
                <label htmlFor="person-resource-search" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.addResourceAssociation', 'Associate a resource')}</label>
                <input
                  id="person-resource-search"
                  type="search"
                  value={resourceSearch}
                  onChange={(event) => setResourceSearch(event.target.value)}
                  placeholder={t('admin.people.searchResource', 'Search resources by name')}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
                {resourceSearch.trim().length >= 2 && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                    {resourceSearchLoading ? (
                      <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{t('common.loading', 'Loading...')}</p>
                    ) : resourceResults.filter((resource) => !resourceAssociations.some((association) => association.resourceId === resource.id)).length > 0 ? (
                      resourceResults.filter((resource) => !resourceAssociations.some((association) => association.resourceId === resource.id)).map((resource) => (
                        <button key={resource.id} type="button" onClick={() => addResourceAssociation(resource)} className="block w-full border-b border-gray-200 px-4 py-2 text-left last:border-b-0 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700">
                          {resource.name}
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{t('adminResources.notFound', 'No resources found.')}</p>
                    )}
                  </div>
                )}
              </div>
              {resourceAssociations.map((association, associationIndex) => (
                <div key={association.resourceId} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-4 flex flex-col items-end gap-4 sm:flex-row">
                    <div className="w-full flex-1">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.resource', 'Resource')}</label>
                      <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-100 dark:border-green-800 dark:bg-green-900/50">
                        <a href={`/admin/resources/${association.resourceId}`} className="flex-1 px-4 py-2 font-semibold text-green-900 hover:underline dark:text-green-100">{association.resource.name}</a>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t('admin.people.removeResourceAssociationConfirm', 'Remove this resource association?'))) {
                              setResourceAssociations((current) => current.filter((_, index) => index !== associationIndex));
                            }
                          }}
                          aria-label={t('admin.people.removeResourceAssociation', 'Remove resource association')}
                          title={t('admin.people.removeResourceAssociation', 'Remove resource association')}
                          className="px-3 py-2 text-lg font-bold leading-none text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('admin.people.primaryContact', 'Primary Contact')}</label>
                      <button
                        type="button"
                        aria-pressed={association.isPrimary}
                        onClick={() => updateResourceAssociation(associationIndex, { isPrimary: !association.isPrimary })}
                        className={`w-full rounded-lg border px-6 py-2 text-sm font-semibold transition-colors focus:outline-none sm:w-auto ${association.isPrimary ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-700'}`}
                      >
                        {association.isPrimary ? t('common.yes', 'Yes') : t('common.no', 'No')}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.role', 'Role')}</label>
                    <PersonRoleButtons
                      selectedRoles={association.roles || []}
                      onRoleToggle={(role) => toggleResourceRole(associationIndex, role)}
                      roles={resourceRoleOptions}
                      size="sm"
                      layout="wrap"
                    />
                    {errors.resourceRoleAssociationId === association.resourceId && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{t('admin.people.resourceRoleRequired', 'Each resource association needs at least one role.')}</p>}
                  </div>
                </div>
              ))}
            </section>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 sm:col-span-2">{t('admin.people.bio', 'Bio')}<textarea rows={4} value={resourcePersonForm.bio || ''} onChange={(event) => setResourcePersonForm({ ...resourcePersonForm, bio: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" /></label>
            <div className="sm:col-span-2">
              <label htmlFor="person-private-notes" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.people.notes', 'Notes')}</label>
              <textarea id="person-private-notes" aria-describedby="person-private-notes-help" rows={5} value={resourcePersonForm.notes || ''} onChange={(event) => setResourcePersonForm({ ...resourcePersonForm, notes: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
              <p id="person-private-notes-help" className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('admin.people.notesPrivateHelp', 'These are private notes, not displayed to users')}</p>
            </div>
            <div className="flex justify-end gap-3 sm:col-span-2">
              <button type="button" onClick={() => { window.location.href = resourceReturnUrl; }} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200">{t('common.cancel', 'Cancel')}</button>
              <button type="submit" disabled={resourceSaving} className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{resourceSaving ? t('adminResources.saving', 'Saving...') : t('common.save', 'Save')}</button>
            </div>
          </form>
        ) : !errors.general ? (
          <p className="text-gray-600 dark:text-gray-300">{t('admin.people.noPeopleFound', 'Person not found.')}</p>
        ) : null}
      </div>
    );
  }
  if (personAssociations.length === 0) return <div className="max-w-3xl mx-auto pt-20">{t('people.noPeopleFound', 'Person not found.')}</div>;

  const mainPerson = personAssociations[0];

  return (
    <div className="max-w-3xl mx-auto pt-20">
      <div className="mb-8">
        <button
          className="text-primary-600 dark:text-primary-400 hover:underline text-base font-semibold flex items-center gap-2"
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
