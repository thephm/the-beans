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
  const [allSpecialties, setAllSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map specialty names to translation keys (matching RoasterCard.tsx approach)
  const getSpecialtyTranslationKey = (name: string): string => {
    const specialtyMap: { [key: string]: string } = {
      'Espresso': 'espresso',
      'Single Origin': 'singleOrigin',
      'Origine unique': 'singleOrigin',
      'Cold Brew': 'coldBrew',
      'Café froid': 'coldBrew',
      'Decaf': 'decaf',
      'Décaféiné': 'decaf',
      'Organic': 'organic',
      'Biologique': 'organic',
      'Artisanal': 'artisanal',
      'Fair Trade': 'fairTrade',
      'Commerce équitable': 'fairTrade',
      'Dark Roast': 'darkRoast',
      'Torréfaction foncée': 'darkRoast',
      'Light Roast': 'lightRoast',
      'Torréfaction claire': 'lightRoast',
      'Medium Roast': 'mediumRoast',
      'Torréfaction moyenne': 'mediumRoast',
      'Pour Over': 'pourOver',
      'Infusion lente': 'pourOver',
      'Direct Trade': 'directTrade',
      'Commerce direct': 'directTrade',
      'Education': 'education',
      'Éducation': 'education',
      'Cupping': 'cupping',
      'Dégustation': 'cupping',
      'Blends': 'blends',
      'Mélanges': 'blends',
      'Ethiopian': 'ethiopian',
      'Éthiopien': 'ethiopian',
      'Italian Roast': 'italianRoast',
      'Torréfaction italienne': 'italianRoast',
      'Nitro Coffee': 'nitroCoffee',
      'Café nitro': 'nitroCoffee',
      'Sustainable': 'sustainable',
      'Durable': 'sustainable',
      'Awards': 'awards',
      'Récompenses': 'awards',
      'Microlots': 'microlots',
      'Experimental': 'experimental',
      'Expérimental': 'experimental',
      'Carbon Neutral': 'carbonNeutral',
      'Carboneutre': 'carbonNeutral',
      'Omni Roast': 'omniRoast',
      'Torréfaction Omni': 'omniRoast',
      'Natural': 'natural',
      'Naturel': 'natural',
      'Washed': 'washed',
      'Lavé': 'washed'
    }
    
    const key = specialtyMap[name]
    return key ? key : name.toLowerCase().replace(/\s+/g, '')
  }

  // Fetch all specialties once when component mounts or language changes
  useEffect(() => {
    fetchSpecialties();
  }, [language]);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Include deprecated specialties so we can show them if they're currently selected
      const response = await fetch(`${apiUrl}/api/specialties?lang=${language}&includeDeprecated=true`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to fetch specialties');
      }

      const data = await response.json();
      // API returns { specialties: [...], pagination: {...} }
      const specialtiesArray = data.specialties || data;
      setAllSpecialties(Array.isArray(specialtiesArray) ? specialtiesArray : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load specialties');
    } finally {
      setLoading(false);
    }
  };

  // Filter and format specialties based on current selected IDs
  // This happens on every render but is fast since it's just array operations
  const specialties = React.useMemo(() => {
    return allSpecialties
      // Filter deprecated specialties UNLESS they are currently selected
      // This allows editing roasters with deprecated specialties while preventing
      // new roasters or other roasters from using deprecated specialties
      .filter((s: any) => !s.deprecated || selectedSpecialtyIds.includes(s.id))
      .map((s: any) => ({
              id: s.id,
              deprecated: s.deprecated,
              roasterCount: s.roasterCount,
              // Create translations structure from flat response
              translations: {
                [language]: {
                  name: s.name || 'Unknown',
                  description: s.description || ''
                }
              },
              createdAt: s.createdAt,
              updatedAt: s.updatedAt
            }))
      .sort((a: any, b: any) => {
        const nameA = a.translations?.[language]?.name || a.translations?.['en']?.name || 'Unknown';
        const nameB = b.translations?.[language]?.name || b.translations?.['en']?.name || 'Unknown';
        return nameA.localeCompare(nameB);
      });
  }, [allSpecialties, selectedSpecialtyIds, language]);

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

  if (specialties.length === 0) {
    return <div className="text-gray-500 text-sm">{t('admin.specialties.noSpecialties', 'No specialties available. Please check the API connection.')}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {specialties.map((specialty) => {
          const isSelected = selectedSpecialtyIds.includes(specialty.id);
          const isDeprecated = specialty.deprecated;
          const specialtyNameFromDb = specialty.translations?.[language]?.name || 
                                      specialty.translations?.['en']?.name || 
                                      'Unknown';
          // Get the translation key and use it to get the translated name
          const translationKey = getSpecialtyTranslationKey(specialtyNameFromDb);
          const specialtyName = t(`specialties.${translationKey}`, specialtyNameFromDb);
          
          return (
            <button
              key={specialty.id}
              type="button"
              onClick={() => handleToggleSpecialty(specialty.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? isDeprecated
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
              title={isDeprecated ? t('admin.specialties.deprecatedWarning', 'This specialty is deprecated. Consider removing it.') : ''}
            >
              {specialtyName}
              {isDeprecated && isSelected && (
                <span className="ml-1.5" title={t('admin.specialties.deprecated', 'Deprecated')}>⚠️</span>
              )}
              {!isDeprecated && isSelected && (
                <span className="ml-1.5">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
