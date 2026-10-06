import React from 'react';
import { useTranslation } from 'react-i18next';
import { COMMON_PERSON_ROLES, RESOURCE_PERSON_ROLES } from '../types';
import { getPersonRoleLabel, getPersonRolePresentation } from '../lib/personRoles';

interface PersonRoleButtonsProps {
  selectedRoles: string[];
  onRoleToggle: (role: string) => void;
  roles?: string[];
  disabled?: boolean;
  size?: 'sm' | 'md';
  layout?: 'grid' | 'wrap' | 'column' | 'two-column';
}

export default function PersonRoleButtons({ selectedRoles, onRoleToggle, roles, disabled = false, size = 'md', layout = 'grid' }: PersonRoleButtonsProps) {
  const { t } = useTranslation();
  
  const allowedRoles = roles || COMMON_PERSON_ROLES;
  const visibleRoles = RESOURCE_PERSON_ROLES.filter((role) => allowedRoles.includes(role));

  const sizeClasses = size === 'sm'
    ? 'px-3 py-1.5 text-sm min-w-[104px]'
    : 'px-4 py-2 text-sm min-w-[112px]';

  const containerClasses = layout === 'wrap'
    ? 'flex flex-wrap gap-2 w-full'
    : layout === 'column'
      ? 'flex flex-col items-start gap-2 w-full'
      : layout === 'two-column'
        ? 'inline-grid grid-cols-[max-content_max-content_max-content_max-content] sm:grid-cols-[max-content_max-content] gap-x-3 gap-y-2 justify-items-start'
        : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 w-full';

  const widthClasses = layout === 'wrap' || layout === 'column' || layout === 'two-column'
    ? 'whitespace-nowrap'
    : 'w-full';

  return (
    <div className={containerClasses}>
      {visibleRoles.map(role => {
        const isSelected = selectedRoles.includes(role);

        return (
        <button
          key={role}
          type="button"
          aria-pressed={isSelected}
          className={`${widthClasses} ${sizeClasses} rounded-full border font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950 inline-flex items-center justify-center gap-2 ${
            isSelected
              ? getPersonRolePresentation(role).colorClasses
              : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && onRoleToggle(role)}
          disabled={disabled}
        >
          <span>{getPersonRoleLabel(role, t)}</span>
          <span className={`${isSelected ? 'opacity-100' : 'opacity-0'} inline-flex items-center justify-center w-4 h-4`}>
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3.5 8.5l3 3 6-7" />
            </svg>
          </span>
        </button>
        );
      })}
    </div>
  );
}
