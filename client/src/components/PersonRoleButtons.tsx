import React from 'react';
import { useTranslation } from 'react-i18next';
import { PersonRole } from '../types';

interface PersonRoleButtonsProps {
  selectedRoles: PersonRole[];
  onRoleToggle: (role: PersonRole) => void;
}

export default function PersonRoleButtons({ selectedRoles, onRoleToggle }: PersonRoleButtonsProps) {
  const { t } = useTranslation();
  
  const roles = [
    { value: PersonRole.OWNER, label: t('admin.people.roleOwner', 'Owner') },
    { value: PersonRole.ADMIN, label: t('admin.people.roleAdmin', 'Admin') },
    { value: PersonRole.BILLING, label: t('admin.people.roleBilling', 'Billing') },
    { value: PersonRole.MARKETING, label: t('admin.people.roleMarketing', 'Marketing') },
    { value: PersonRole.SCOUT, label: t('admin.people.roleScout', 'Scout') }
  ];

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {roles.map(role => (
        <button
          key={role.value}
          type="button"
          className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors duration-150 focus:outline-none ${
            selectedRoles.includes(role.value) 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
          }`}
          onClick={() => onRoleToggle(role.value)}
        >
          {role.label}
        </button>
      ))}
    </div>
  );
}
