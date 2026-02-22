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
    ? 'px-3 py-1.5 text-xs'
    : 'px-4 py-2 text-sm';

  const containerClasses = layout === 'wrap'
    ? 'flex flex-wrap gap-2'
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
      {roles.map(role => (
        <button
          key={role.value}
          type="button"
          className={`${widthClasses} ${sizeClasses} rounded-lg border font-semibold transition-colors duration-150 focus:outline-none ${
            selectedRoles.includes(role.value) 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && onRoleToggle(role.value)}
          disabled={disabled}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}
