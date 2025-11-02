'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Specialty } from '@/types';

interface SpecialtyPillSelectorProps {
  selectedSpecialtyIds: string[];
  onChange: (specialtyIds: string[]) => void;
  language?: string;
}

export default function SpecialtyPillSelector({ 
  selectedSpecialtyIds, 
  onChange,
  language = 'en' 
}: SpecialtyPillSelectorProps) {
  const { t } = useTranslation();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpecialties();
  }, [language]);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${apiUrl}/api/specialties?lang=${language}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to fetch specialties');
      }

      const data = await response.json();
      // Filter out deprecated specialties for new selections
      const activeSpecialties = data.specialties.filter((s: Specialty) => !s.deprecated);
      setSpecialties(activeSpecialties);
    } catch (err: any) {
      setError(err.message || 'Failed to load specialties');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSpecialty = (specialtyId: string) => {
    const newSelection = selectedSpecialtyIds.includes(specialtyId)
      ? selectedSpecialtyIds.filter(id => id !== specialtyId)
      : [...selectedSpecialtyIds, specialtyId];
    
    onChange(newSelection);
  };

  if (loading) {
    return <div className="text-gray-500 text-sm">{t('common.loading', 'Loading...')}</div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {specialties.map((specialty) => {
          const isSelected = selectedSpecialtyIds.includes(specialty.id);
          return (
            <button
              key={specialty.id}
              type="button"
              onClick={() => handleToggleSpecialty(specialty.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {specialty.name}
              {isSelected && (
                <span className="ml-1.5">✓</span>
              )}
            </button>
          );
        })}
      </div>
      {selectedSpecialtyIds.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          {t('adminForms.roasters.noSpecialtiesSelected', 'No specialties selected')}
        </p>
      )}
    </div>
  );
}
