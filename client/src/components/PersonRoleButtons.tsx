import React from 'react';
import { useTranslation } from 'react-i18next';
import { PersonRole } from '../types';

interface PersonRoleButtonsProps {
  selectedRoles: PersonRole[];
  onRoleToggle: (role: PersonRole) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  layout?: 'grid' | 'wrap' | 'column' | 'two-column';
}

export default function PersonRoleButtons({ selectedRoles, onRoleToggle, disabled = false, size = 'md', layout = 'grid' }: PersonRoleButtonsProps) {
  const { t } = useTranslation();
  
  const roles = [
    { value: PersonRole.OWNER, label: t('admin.people.roleOwner', 'Owner') },
    { value: PersonRole.ADMIN, label: t('admin.people.roleAdmin', 'Admin') },
    { value: PersonRole.ROASTER, label: t('admin.people.roleRoaster', 'Roaster') },
    { value: PersonRole.EMPLOYEE, label: t('admin.people.roleEmployee', 'Employee') },
    { value: PersonRole.BILLING, label: t('admin.people.roleBilling', 'Billing') },
    { value: PersonRole.MARKETING, label: t('admin.people.roleMarketing', 'Marketing') },
    { value: PersonRole.SCOUT, label: t('admin.people.roleScout', 'Scout') },
    { value: PersonRole.CUSTOMER, label: t('admin.people.roleCustomer', 'Customer') }
  ];

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
      {roles.map(role => {
        const isSelected = selectedRoles.includes(role.value);

        return (
        <button
          key={role.value}
          type="button"
          aria-pressed={isSelected}
          className={`${widthClasses} ${sizeClasses} rounded-full border font-medium transition-all duration-200 focus:outline-none inline-flex items-center justify-center gap-2 ${
            isSelected
              ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700'
              : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && onRoleToggle(role.value)}
          disabled={disabled}
        >
          <span>{role.label}</span>
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
