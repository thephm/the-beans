"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    // Validate token on mount
    const validateToken = async () => {
      if (loading) return;
      
      // Check if user exists and has admin role
      if (!user || user.role !== 'admin') {
        router.replace('/');
        setValidating(false);
        return;
      }

      // Validate the token is still valid by making an API call
      try {
        await apiClient.getCurrentUser();
        setValidating(false);
      } catch (error) {
        console.error('Token validation failed:', error);
        // Token is invalid, logout and redirect
        logout();
        router.replace('/login?redirect=/admin&error=session_expired');
      }
    };

    validateToken();
  }, [user, loading, router, logout]);

  // Show loading state while checking auth and validating token
  if (loading || validating) {
    return (
      <div className="container mx-auto pt-20 sm:pt-28 px-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  // Don't render admin content for non-admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <>
      {children}
    </>
  )
}
