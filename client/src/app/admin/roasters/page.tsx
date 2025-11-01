"use client";
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Roaster, RoasterImage, RoasterPerson, PersonRole } from '@/types';
import SimpleImageUpload from '@/components/SimpleImageUpload';


const AdminRoastersPage: React.FC = () => {
  useEffect(() => {
    fetchRoasters();
  }, []);
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUnverifiedOnly, setShowUnverifiedOnly] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [images, setImages] = useState<RoasterImage[]>([]);

  // person management state
  const [people, setPeople] = useState<RoasterPerson[]>([]);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [editingPerson, setEditingPerson] = useState<RoasterPerson | null>(null);
  const [personForm, setpersonForm] = useState({
    name: '',
    email: '',
    mobile: '',
    bio: '',
    roles: [] as PersonRole[],
    isPrimary: false
  });

  // Check for edit query parameter on mount
  useEffect(() => {
    const editId = searchParams?.get('edit');
    if (editId && roasters.length > 0) {
      setEditingId(editId);
    }
  }, [searchParams, roasters]);

  const fetchRoasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/roasters`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setRoasters(data.roasters || []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }


  const onFormSuccess = () => {
    setEditingId(null);
    setShowAddForm(false);
    fetchRoasters();
  };

  const onFormCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
  };

  if (editingId || showAddForm) {
    const roaster = editingId ? roasters.find(r => r.id === editingId) : undefined;
    return <RoasterForm roaster={roaster} onSuccess={onFormSuccess} onCancel={onFormCancel} />;
  }

  // Render the list of roasters
  return (
    <div className="p-4 pt-20 sm:pt-28 px-4 sm:px-8 lg:px-32">
      <div className="mb-6 max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('adminSection.roasters', 'Roasters')}</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowAddForm(true)}
        >
          {t('admin.roasters.addTitle', 'Add Roaster')}
        </button>
      </div>
      <div className="max-w-6xl mx-auto">
        {roasters.length === 0 ? (
          <div className="text-gray-500 text-center py-12">{t('admin.roasters.noRoasters', 'No roasters found.')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border-b text-left">{t('adminForms.roasters.name', 'Name')}</th>
                  <th className="px-4 py-2 border-b text-left">{t('adminForms.roasters.city', 'City')}</th>
                  <th className="px-4 py-2 border-b text-left">{t('adminForms.roasters.country', 'Country')}</th>
                  <th className="px-4 py-2 border-b text-left">{t('adminForms.roasters.verified', 'Verified')}</th>
                  <th className="px-4 py-2 border-b text-left">{t('adminForms.roasters.featured', 'Featured')}</th>
                  <th className="px-4 py-2 border-b text-left">{t('adminForms.roasters.rating', 'Rating')}</th>
                </tr>
              </thead>
              <tbody>
                {roasters.map((roaster) => (
                  <tr key={roaster.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">
                      <button
                        className="text-blue-600 hover:underline text-left"
                        onClick={() => setEditingId(roaster.id)}
                      >
                        {roaster.name}
                      </button>
                    </td>
                    <td className="px-4 py-2">{roaster.city || '-'}</td>
                    <td className="px-4 py-2">{roaster.country || '-'}</td>
                    <td className="px-4 py-2">{roaster.verified ? '✔️' : ''}</td>
                    <td className="px-4 py-2">{roaster.featured ? '⭐' : ''}</td>
                    <td className="px-4 py-2">{roaster.rating || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

interface RoasterFormProps {
  roaster?: Roaster;
  onSuccess: () => void;
  onCancel: () => void;
}

const RoasterForm: React.FC<RoasterFormProps> = ({ roaster, onSuccess, onCancel }) => {
  // Fetch and set selected source countries when editing a roaster
  useEffect(() => {
    if (roaster?.id) {
      fetchSourceCountries();
    }
  }, [roaster?.id]);
  // Fetch available countries when form mounts
  useEffect(() => {
    fetchCountries();
  }, []);
  const [formData, setFormData] = useState({
    name: roaster?.name || '',
    description: roaster?.description || '',
    email: roaster?.email || '',
    phone: roaster?.phone || '',
    website: roaster?.website || '',
    address: roaster?.address || '',
    city: roaster?.city || '',
    state: roaster?.state || '',
    zipCode: roaster?.zipCode || '',
    country: roaster?.country || '',
    latitude: roaster?.latitude || '',
    longitude: roaster?.longitude || '',
    specialties: roaster?.specialties?.join(', ') || '',
    verified: roaster?.verified || false,
    featured: roaster?.featured || false,
    rating: roaster?.rating || 0,
    onlineOnly: roaster?.onlineOnly || false,
    hours: roaster?.hours || {},
    images: roaster?.images || [],
    ownerName: roaster?.ownerName || '',
    ownerEmail: roaster?.ownerEmail || '',
    ownerBio: roaster?.ownerBio || '',
    ownerMobile: roaster?.ownerMobile || '',
  });
  useEffect(() => {
    if (roaster?.id) {
      const fetchRoaster = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const res = await fetch(`${apiUrl}/api/roasters/${roaster.id}`);
          if (res.ok) {
            const data = await res.json();
            setFormData({
              name: data.name || '',
              description: data.description || '',
              email: data.email || '',
              phone: data.phone || '',
              website: data.website || '',
              address: data.address || '',
              city: data.city || '',
              state: data.state || '',
              zipCode: data.zipCode || '',
              country: data.country || '',
              latitude: data.latitude || '',
              longitude: data.longitude || '',
              specialties: data.specialties?.join(', ') || '',
              verified: data.verified || false,
              featured: data.featured || false,
              rating: data.rating || 0,
              onlineOnly: data.onlineOnly || false,
              hours: convertHoursFormat(data.hours),
              images: data.images || [],
              ownerName: data.ownerName || '',
              ownerEmail: data.ownerEmail || '',
              ownerBio: data.ownerBio || '',
              ownerMobile: data.ownerMobile || '',
            });
          }
        } catch (err) {
          // Optionally handle error
        }
      };
      fetchRoaster();
    }
  }, [roaster?.id]);

  // Fetch images when editing existing roaster
  useEffect(() => {
    if (roaster?.id) {
      fetchImages();
    }
  }, [roaster?.id]);
  // Handles input changes for all fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handles changes for hours fields
  const handleHoursChange = (day: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours?.[day],
          [field]: value,
        },
      },
    }));
  };
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reusable chevron component
  const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <svg 
      className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
  const [images, setImages] = useState<RoasterImage[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // person management state
  const [people, setPeople] = useState<RoasterPerson[]>([]);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [editingPerson, setEditingPerson] = useState<RoasterPerson | null>(null);
  const [personForm, setpersonForm] = useState({
    name: '',
    email: '',
    mobile: '',
    bio: '',
    roles: [] as PersonRole[],
    isPrimary: false
  });

  // Source countries state
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [sourceCountriesExpanded, setSourceCountriesExpanded] = useState(true);
  
  // Section expand/collapse state
  const [basicInfoExpanded, setBasicInfoExpanded] = useState(true);
  const [locationExpanded, setLocationExpanded] = useState(true);
  const [contactsExpanded, setContactsExpanded] = useState(true);
  const [specialtiesExpanded, setSpecialtiesExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  // Basic form UI for editing roaster
  // ...existing code...
  const [hoursExpanded, setHoursExpanded] = useState(true);
  const [imagesExpanded, setImagesExpanded] = useState(true);

  // Utility function to convert Unsplash URLs to proper image URLs
  const convertToImageUrl = (url: string): string => {
    if (!url) return url;
    

    
    // Handle Unsplash URLs
    if (url.includes('unsplash.com')) {
      // If it's already a direct images.unsplash.com URL, return as is
      if (url.includes('images.unsplash.com')) {
        console.log('Already a direct image URL:', url);
        return url;
      }
      
      // Convert various Unsplash URL formats to direct image URLs
      if (url.includes('/photos/')) {
        const photoPathMatch = url.match(/\/photos\/([^/?#]+)/);
        if (photoPathMatch) {
          const photoId = photoPathMatch[1];
          console.log('Extracted photo ID:', photoId);
          
          // For URLs like https://unsplash.com/photos/ZmOhgTobRQI
          // The photo ID is directly after /photos/
          const directImageUrl = `https://images.unsplash.com/photo-${photoId}?w=800&h=600&fit=crop&auto=format&q=80`;
          console.log('Converting to:', directImageUrl);
          
          return directImageUrl;
        }
      }
    }
    

    return url; // Return original URL if not Unsplash or already processed
  };

  // Helper function to convert old hours format to new format
  const convertHoursFormat = (hours: any) => {
  // Restore missing handleInputChange function
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Restore missing handleHoursChange function
  const handleHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => {
      const currentDay = (prev.hours as any)[day];
      let newValue = value;
      // If toggling 'closed' to false, set default times if not present
      if (field === 'closed' && value === false) {
        // Always set both open and close to defaults if not present
        return {
          ...prev,
          hours: {
            ...prev.hours,
            [day]: {
              closed: false,
              open: '08:00',
              close: '18:00',
            }
          }
        };
      }
      // Time validation logic
      if (field === 'open' && typeof value === 'string') {
        const closeTime = currentDay?.close;
        if (closeTime && value >= closeTime) {
          const [hours, minutes] = value.split(':');
          const newCloseHour = Math.min(23, parseInt(hours) + 1);
          newValue = value;
          return {
            ...prev,
            hours: {
              ...prev.hours,
              [day]: {
                ...currentDay,
                open: newValue,
                close: `${newCloseHour.toString().padStart(2, '0')}:${minutes}`
              }
            }
          };
        }
      } else if (field === 'close' && typeof value === 'string') {
        const openTime = currentDay?.open;
        if (openTime && value <= openTime) {
          return prev;
        }
      }
      return {
        ...prev,
        hours: {
          ...prev.hours,
          [day]: {
            ...currentDay,
            [field]: newValue
          }
        }
      };
    });
  };
    if (!hours) {
      return {
        monday: { open: '', close: '', closed: true },
        tuesday: { open: '', close: '', closed: true },
        wednesday: { open: '', close: '', closed: true },
        thursday: { open: '', close: '', closed: true },
        friday: { open: '', close: '', closed: true },
        saturday: { open: '', close: '', closed: true },
        sunday: { open: '', close: '', closed: true },
      };
    }

    // If already in new format, return as-is
    if (hours.monday && typeof hours.monday === 'object' && 'open' in hours.monday) {
      return hours;
    }

    // Convert old format "6:00-20:00" to new format
    const convertedHours: any = {};
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    dayNames.forEach(day => {
      const dayHours = hours[day];
      if (!dayHours || dayHours === 'closed') {
        convertedHours[day] = { open: '', close: '', closed: true };
      } else if (typeof dayHours === 'string' && dayHours.includes('-')) {
        const [open, close] = dayHours.split('-');
        convertedHours[day] = { open: open || '', close: close || '', closed: false };
      } else {
        convertedHours[day] = { open: '', close: '', closed: true };
      }
    });

    return convertedHours;
  };


  // Fetch images when editing existing roaster
  const fetchImages = async () => {
    if (!roaster?.id) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/roasters/${roaster.id}/images`);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
        setImagesLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setImagesLoaded(true);
    }
  };

  // Fetch all available countries for source country selection
  const fetchCountries = async () => {
    try {
      setCountriesLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/countries`);
      if (response.ok) {
        const countries = await response.json();
        setAvailableCountries(countries);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setCountriesLoading(false);
    }
  };

  // Fetch roaster's current source countries
  const fetchSourceCountries = async () => {
    if (!roaster?.id) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/roasters/${roaster.id}/source-countries`);
      if (response.ok) {
        const countries = await response.json();
        setSelectedCountries(countries.map((c: any) => c.id));
      }
    } catch (error) {
      console.error('Error fetching source countries:', error);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // Convert hours back to backend format
      const convertedHours: any = {};
      Object.entries(formData.hours as any).forEach(([day, dayData]: [string, any]) => {
        if (dayData.closed) {
          convertedHours[day] = 'closed';
        } else {
          // Always persist open/close, defaulting if missing
          const open = dayData.open || '08:00';
          const close = dayData.close || '18:00';
          convertedHours[day] = `${open}-${close}`;
        }
      });

      const payload = {
        ...formData,
        hours: convertedHours,
        latitude: formData.latitude ? parseFloat(String(formData.latitude)) : undefined,
        longitude: formData.longitude ? parseFloat(String(formData.longitude)) : undefined,
        rating: parseFloat(String(formData.rating)) || 0,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const url = roaster 
        ? `${apiUrl}/api/roasters/${roaster.id}`
        : `${apiUrl}/api/roasters`;
      
      const method = roaster ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.errors && Array.isArray(errorData.errors)) {
          // Handle validation errors
          const errorMessages = errorData.errors.map((err: any) => err.msg).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(errorData.error || errorData.message || 'Failed to save roaster');
      }

      const savedRoaster = await res.json();
      const roasterId = roaster?.id || savedRoaster.id;

      // Update source countries if roaster was saved successfully
      if (roasterId) {
        const sourceCountriesRes = await fetch(`${apiUrl}/api/roasters/${roasterId}/source-countries`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ countryIds: selectedCountries }),
        });

        if (!sourceCountriesRes.ok) {
          console.error('Failed to update source countries');
          // Don't throw error here as the roaster was successfully saved
        }
      }

      // After saving, fetch the updated roaster and update formData
      if (roasterId) {
        const res = await fetch(`${apiUrl}/api/roasters/${roasterId}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || '',
            description: data.description || '',
            email: data.email || '',
            phone: data.phone || '',
            website: data.website || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            country: data.country || '',
            latitude: data.latitude || '',
            longitude: data.longitude || '',
            specialties: data.specialties?.join(', ') || '',
            verified: data.verified || false,
            featured: data.featured || false,
            rating: data.rating || 0,
            onlineOnly: data.onlineOnly || false,
            hours: convertHoursFormat(data.hours),
            images: data.images || [],
            ownerName: data.ownerName || '',
            ownerEmail: data.ownerEmail || '',
            ownerBio: data.ownerBio || '',
            ownerMobile: data.ownerMobile || '',
          });
        }
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // person management functions
  const fetchPeople = async () => {
    if (!roaster?.id) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/people/roaster/${roaster.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setPeople(data.people || []);
      }
    } catch (error) {
      // Silently handle error
    }
  };

  const resetPersonForm = () => {
    setpersonForm({
      name: '',
      email: '',
      mobile: '',
      bio: '',
      roles: [],
      isPrimary: false
    });
    setEditingPerson(null);
    setShowAddPerson(false);
  };

  const handleAddPerson = () => {
    resetPersonForm();
    setShowAddPerson(true);
  };

  const handleEditPerson = (person: RoasterPerson) => {
    setpersonForm({
      name: person.name,
      email: person.email || '',
      mobile: person.mobile || '',
      bio: person.bio || '',
      roles: person.roles,
      isPrimary: person.isPrimary
    });
    setEditingPerson(person);
    setShowAddPerson(true);
  };

  const handlePersonRoleChange = (role: PersonRole, checked: boolean) => {
    setpersonForm(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  const submitPerson = async () => {
    if (!roaster?.id && !formData.name) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const url = editingPerson 
        ? `${apiUrl}/api/people/${editingPerson.id}`
        : `${apiUrl}/api/people`;
      
      const method = editingPerson ? 'PUT' : 'POST';
      
      const payload = editingPerson
        ? { ...personForm }
        : { ...personForm, roasterId: roaster?.id || 'temp' };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setEditingPerson(null);
        setShowAddPerson(false);
        resetPersonForm();
        if (roaster?.id) {
          fetchPeople(); // Only fetch if roaster exists
        }
      } else {
        const errorData = await response.json();
        
        // Handle validation errors with specific field messages
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => err.msg).join(', ');
          throw new Error(errorMessages);
        }
        
        throw new Error(errorData.error || 'Failed to save person');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save person');
    }
  };

  const deletePerson = async (personId: string) => {
    if (!confirm('Are you sure you want to delete this person?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/people/${personId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        fetchPeople();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete person');
      }
    } catch (error) {
      setError('Failed to delete person');
    }
  };

  // Fetch people when editing existing roaster
  React.useEffect(() => {
    let isMounted = true;
    
    const loadPeople = async () => {
      if (!roaster?.id || !isMounted) return;
      
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/people/roaster/${roaster.id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        
        if (response.ok && isMounted) {
          const data = await response.json();
          setPeople(data.people || []);
        }
      } catch (error) {
        // Silently handle error
      }
    };
    
    loadPeople();
    
    return () => {
      isMounted = false;
    };
  }, [roaster?.id]);

  const getRoleBadgeColor = (role: PersonRole) => {
    switch (role) {
      case PersonRole.OWNER:
        return 'bg-purple-100 text-purple-800';
      case PersonRole.ADMIN:
        return 'bg-blue-100 text-blue-800';
      case PersonRole.BILLING:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 pt-20 sm:pt-28 px-4 sm:px-8 lg:px-32">
      <div className="mb-6 max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4">
          <button
            onClick={onCancel}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('admin.roasters.backToRoasters', 'Back to Roasters')}
          </button>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {roaster 
            ? t('adminForms.roasters.editRoaster', 'Edit Roaster') 
            : t('admin.roasters.addTitle', 'Add Roaster')
          }
        </h1>
      </div>
      <div className="max-w-6xl mx-auto">
        {/* ...existing code... */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 select-none">
                  {t('adminForms.roasters.basicInformation', 'Basic Information')}
                </h3>
                <button
                  type="button"
                  onClick={() => setBasicInfoExpanded(!basicInfoExpanded)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title={basicInfoExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: basicInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {basicInfoExpanded && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('adminForms.roasters.name', 'Name')} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('adminForms.roasters.description', 'Description')}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('adminForms.roasters.email', 'Email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('adminForms.roasters.phone', 'Phone')}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('adminForms.roasters.website', 'Website')}
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Location & Details */}
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 select-none">
                  {t('adminForms.roasters.locationDetails', 'Location & Details')}
                </h3>
                <button
                  type="button"
                  onClick={() => setLocationExpanded(!locationExpanded)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title={locationExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: locationExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {locationExpanded && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('adminForms.roasters.address', 'Address')}
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminForms.roasters.city', 'City')}
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminForms.roasters.state', 'State')}
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.roasters.zipCode', 'Zip Code')}
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.roasters.country', 'Country')}
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.roasters.latitude', 'Latitude')}
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('admin.roasters.longitude', 'Longitude')}
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Source Countries */}
          <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800 select-none">
                {t('adminForms.roasters.sourceCountries', 'Source Countries')}
              </h3>
              <button
                type="button"
                onClick={() => setSourceCountriesExpanded(!sourceCountriesExpanded)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title={sourceCountriesExpanded ? 'Collapse section' : 'Expand section'}
              >
                <svg 
                  className="w-4 h-4 transition-transform duration-200" 
                  style={{ transform: sourceCountriesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {sourceCountriesExpanded && (
              <>
                <p className="text-sm text-gray-600">
                  {t('adminForms.roasters.sourceCountriesDescription', 'Select the coffee origin countries that this roaster sources from.')}
                </p>
                
                {countriesLoading ? (
                  <div className="text-center py-4">
                    <div className="text-gray-500">{t('common.loading', 'Loading...')}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                {availableCountries.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[500px] overflow-y-auto border border-gray-200 rounded-md p-3 bg-white">
                    {availableCountries.map((country) => (
                      <label key={country.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer min-w-0" title={country.name}>
                        <input
                          type="checkbox"
                          checked={selectedCountries.includes(country.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCountries(prev => [...prev, country.id]);
                            } else {
                              setSelectedCountries(prev => prev.filter(id => id !== country.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                        />
                        <div className="flex items-center space-x-1 min-w-0 overflow-hidden">
                          {country.flagSvg && (
                            <img 
                              src={country.flagSvg} 
                              alt={`${country.name} flag`}
                              className="w-4 h-3 flex-shrink-0 object-cover rounded-sm"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm text-gray-700 truncate block">{country.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    {t('adminForms.roasters.noCountriesAvailable', 'No countries available')}
                  </div>
                )}
                {selectedCountries.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    {t('adminForms.roasters.selectedCountriesCount', 'Selected countries: {{count}}', { count: selectedCountries.length })}
                  </div>
                  )}
                </div>
                )}
              </>
            )}
          </div>

          {/* Contacts Pane */}
          <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 select-none">
                {t('adminForms.roasters.contacts', 'Contacts')}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddPerson}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                >
                  {t('adminForms.roasters.addContact', 'Add Contact')}
                </button>
                <button
                  type="button"
                  onClick={() => setContactsExpanded(!contactsExpanded)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title={contactsExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: contactsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
            {contactsExpanded && (
              <>
                {/* Render contact cards for existing contacts */}
                {people.length > 0 ? (
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {people.map((person) => (
                      <div key={person.id} className="w-full">
                        {editingPerson && editingPerson.id === person.id ? (
                          <div className="border rounded-lg p-4 bg-blue-50 mb-4 mx-auto w-full">
                            {error && (
                              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                              </div>
                            )}
                            <div className="space-y-3">
                              <input type="text" placeholder="Name" value={personForm.name} onChange={e => setpersonForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded" required />
                              <input type="email" placeholder="Email" value={personForm.email} onChange={e => setpersonForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                              <input type="text" placeholder="Mobile" value={personForm.mobile} onChange={e => setpersonForm(f => ({ ...f, mobile: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                              <textarea placeholder="Bio" value={personForm.bio} onChange={e => setpersonForm(f => ({ ...f, bio: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                              <div className="flex gap-2">
                                <label className="flex items-center text-sm"><input type="checkbox" checked={personForm.isPrimary} onChange={e => setpersonForm(f => ({ ...f, isPrimary: e.target.checked }))} /> Primary</label>
                              </div>
                              <div className="flex gap-2">
                                <label className="flex items-center text-sm">
                                  <input type="checkbox" checked={personForm.roles.includes(PersonRole.OWNER)} onChange={e => handlePersonRoleChange(PersonRole.OWNER, e.target.checked)} />
                                  <span className="ml-2">Owner</span>
                                </label>
                                <label className="flex items-center text-sm">
                                  <input type="checkbox" checked={personForm.roles.includes(PersonRole.ADMIN)} onChange={e => handlePersonRoleChange(PersonRole.ADMIN, e.target.checked)} />
                                  <span className="ml-2">Admin</span>
                                </label>
                                <label className="flex items-center text-sm">
                                  <input type="checkbox" checked={personForm.roles.includes(PersonRole.BILLING)} onChange={e => handlePersonRoleChange(PersonRole.BILLING, e.target.checked)} />
                                  <span className="ml-2">Billing</span>
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => submitPerson()}>Save</button>
                                <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300" onClick={resetPersonForm}>Cancel</button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border rounded-lg p-4 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between mx-auto w-full">
                            <div>
                              <div className="font-semibold text-gray-900">{person.name}</div>
                              {person.email && <div className="text-sm text-gray-700">{person.email}</div>}
                              {person.mobile && <div className="text-sm text-gray-700">{person.mobile}</div>}
                              {person.bio && <div className="text-xs text-gray-500 mt-1">{person.bio}</div>}
                            </div>
                            <div className="mt-2 sm:mt-0 flex gap-2">
                              <button type="button" className="text-blue-600 hover:underline" onClick={() => handleEditPerson(person)}>
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 mb-4">No contacts found for this roaster.</div>
                )}
                {/* Inline add contact form */}
                {showAddPerson && !editingPerson && (
                  <div className="border rounded-lg p-4 bg-blue-50 mb-4 mx-auto max-w-xl">
                    {error && (
                      <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                      </div>
                    )}
                    <div className="space-y-3">
                      <input type="text" placeholder="Name" value={personForm.name} onChange={e => setpersonForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border rounded" required />
                      <input type="email" placeholder="Email" value={personForm.email} onChange={e => setpersonForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                      <input type="text" placeholder="Mobile" value={personForm.mobile} onChange={e => setpersonForm(f => ({ ...f, mobile: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                      <textarea placeholder="Bio" value={personForm.bio} onChange={e => setpersonForm(f => ({ ...f, bio: e.target.value }))} className="w-full px-3 py-2 border rounded" />
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors duration-150 focus:outline-none ${personForm.isPrimary ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                          onClick={() => setpersonForm(f => ({ ...f, isPrimary: !f.isPrimary }))}
                        >
                          Primary
                        </button>
                      </div>
                      <label className="block text-sm font-medium mb-1 mt-2">Roles</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <button
                          type="button"
                          className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors duration-150 focus:outline-none ${personForm.roles.includes(PersonRole.OWNER) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                          onClick={() => setpersonForm(f => ({ ...f, roles: f.roles.includes(PersonRole.OWNER) ? f.roles.filter(r => r !== PersonRole.OWNER) : [...f.roles, PersonRole.OWNER] }))}
                        >
                          Owner
                        </button>
                        <button
                          type="button"
                          className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors duration-150 focus:outline-none ${personForm.roles.includes(PersonRole.ADMIN) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                          onClick={() => setpersonForm(f => ({ ...f, roles: f.roles.includes(PersonRole.ADMIN) ? f.roles.filter(r => r !== PersonRole.ADMIN) : [...f.roles, PersonRole.ADMIN] }))}
                        >
                          Admin
                        </button>
                        <button
                          type="button"
                          className={`px-4 py-1 rounded-full border text-sm font-semibold transition-colors duration-150 focus:outline-none ${personForm.roles.includes(PersonRole.BILLING) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                          onClick={() => setpersonForm(f => ({ ...f, roles: f.roles.includes(PersonRole.BILLING) ? f.roles.filter(r => r !== PersonRole.BILLING) : [...f.roles, PersonRole.BILLING] }))}
                        >
                          Billing
                        </button>
                      </div>
                      <div className="flex gap-2 mt-4 justify-end">
                        <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={() => submitPerson()}>Save</button>
                        <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300" onClick={resetPersonForm}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
            
            {/* ...existing code... */}

          {/* Specialties Pane */}
          <div className="mt-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 select-none">
                {t('adminForms.roasters.specialties', 'Specialties')}
              </h3>
              <button
                type="button"
                onClick={() => setSpecialtiesExpanded(!specialtiesExpanded)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title={specialtiesExpanded ? 'Collapse section' : 'Expand section'}
              >
                <svg 
                  className="w-4 h-4 transition-transform duration-200" 
                  style={{ transform: specialtiesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {specialtiesExpanded && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('adminForms.roasters.specialties', 'Specialties')} 
                    <span className="text-sm text-gray-500 ml-1">({t('adminForms.roasters.specialtiesHint', 'comma separated')})</span>
                  </label>
                  <input
                    type="text"
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleInputChange}
                    placeholder="espresso, pour over, cold brew"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Settings Pane - Online Only, Rating, Verified, Featured */}
          <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800 select-none">
                {t('adminForms.roasters.settings', 'Settings')}
              </h3>
              <button
                type="button"
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title={settingsExpanded ? 'Collapse section' : 'Expand section'}
              >
                <svg 
                  className="w-4 h-4 transition-transform duration-200" 
                  style={{ transform: settingsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {settingsExpanded && (
              <div className="space-y-4">
            
            <div className="space-y-4">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('adminForms.roasters.rating', 'Rating')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Checkboxes on same line with responsive stacking */}
              <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-3 sm:space-y-0">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="verified"
                    checked={formData.verified}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    {t('adminForms.roasters.verified', 'Verified')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    {t('adminForms.roasters.featured', 'Featured')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="onlineOnly"
                    checked={formData.onlineOnly}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm font-medium text-gray-700">
                    {t('adminForms.roasters.onlineOnly', 'Online Only')}
                  </label>
                </div>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Opening Hours Section - Only show if not online only */}
        {!formData.onlineOnly && (
            <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 select-none">
                  {t('adminForms.roasters.hours.title', 'Opening Hours')}
                </h3>
                <button
                  type="button"
                  onClick={() => setHoursExpanded(!hoursExpanded)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title={hoursExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: hoursExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {hoursExpanded && (
                <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {Object.entries(formData.hours as Record<string, any>).map(([day, dayHours]: [string, any]) => (
                  <div key={day} className="p-3 bg-white rounded-md space-y-2 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="w-full sm:w-24">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {t(`adminForms.roasters.hours.${day}`, day.charAt(0).toUpperCase() + day.slice(1))}
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={dayHours?.closed || false}
                          onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">
                          {t('adminForms.roasters.hours.closed', 'Closed')}
                        </span>
                      </div>
                    </div>
                    {!dayHours?.closed && (
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 sm:pl-28">
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600 w-12">
                            {t('adminForms.roasters.hours.open', 'Open')}:
                          </label>
                          <input
                            type="time"
                            value={dayHours?.open || '08:00'}
                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600 w-12">
                            {t('adminForms.roasters.hours.close', 'Close')}:
                          </label>
                          <input
                            type="time"
                            value={dayHours?.close || '18:00'}
                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
                </div>
              )}
            </div>
          )}

          {/* Images Section - Only show when editing existing roaster and images are loaded */}
          {roaster?.id && imagesLoaded && (
            <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800 select-none">
                  {t('adminForms.roasters.uploadedImages', 'Uploaded Images')}
                </h3>
                <button
                  type="button"
                  onClick={() => setImagesExpanded(!imagesExpanded)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title={imagesExpanded ? 'Collapse section' : 'Expand section'}
                >
                  <svg 
                    className="w-4 h-4 transition-transform duration-200" 
                    style={{ transform: imagesExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              {imagesExpanded && (
                <div>
                  <SimpleImageUpload
                    roasterId={roaster?.id ?? ""}
                    existingImages={images}
                    onImagesUpdated={(updatedImages) => setImages(updatedImages)}
                    canEdit={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* URL Images Section - Show when editing existing roaster with URL images */}
          {roaster?.id && (
            <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 select-none">
                {t('adminForms.roasters.urlImages', 'URL Images')} ({(formData.images || []).length})
              </h3>
              
              {/* Existing URL Images */}
              {formData.images && formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                        <img
                          src={convertToImageUrl(imageUrl)}
                          alt={`${formData.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {

                            // Try alternative format for Unsplash
                            if (imageUrl.includes('unsplash.com') && !e.currentTarget.src.includes('/images/default-cafe.svg')) {
                              const photoId = imageUrl.match(/\/photos\/([^/?#]+)/)?.[1];
                              if (photoId) {
                                e.currentTarget.src = `https://images.unsplash.com/${photoId}?w=800&h=600&fit=crop&auto=format&q=80`;
                                return;
                              }
                            }
                            e.currentTarget.src = '/images/default-cafe.svg';
                          }}
                          onLoad={() => {

                          }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        <input
                          type="text"
                          value={imageUrl}
                          onChange={(e) => {
                            const newImages = [...(formData.images || [])];
                            newImages[index] = e.target.value;
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="text-xs text-gray-600 bg-white border rounded px-2 py-1 w-full mr-2"
                          placeholder="Image URL"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = (formData.images || []).filter((_, i) => i !== index);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="text-red-500 hover:text-red-700 text-sm font-bold px-2 py-1"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New URL Image */}
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Add image URL (e.g., https://unsplash.com/photos/coffee-abc123def or direct URL)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const newUrl = input.value.trim();
                        if (newUrl && newUrl.startsWith('http')) {
                          const convertedUrl = convertToImageUrl(newUrl);
                          const newImages = [...(formData.images || []), convertedUrl];
                          setFormData({ ...formData, images: newImages });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const newUrl = input.value.trim();
                      if (newUrl && newUrl.startsWith('http')) {
                        const convertedUrl = convertToImageUrl(newUrl);
                        const newImages = [...(formData.images || []), convertedUrl];
                        setFormData({ ...formData, images: newImages });
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap sm:w-auto w-full"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">ℹ️ About URL Images:</p>
                <p>Image URLs serve as fallback images when uploaded images are not accessible.</p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-8 flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {t('adminForms.roasters.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? t('adminForms.roasters.saving', 'Saving...') 
                : t('adminForms.roasters.save', 'Save')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminRoastersPage;
