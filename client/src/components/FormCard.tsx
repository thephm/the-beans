import React from 'react';

interface FormCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable form container with consistent styling across the app.
 * Provides proper background, border, shadow, and padding for form content.
 */
export default function FormCard({ children, className = '' }: FormCardProps) {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-8 ${className}`}
    >
      {children}
    </div>
  );
}
