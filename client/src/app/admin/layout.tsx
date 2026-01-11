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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    // Validate token on mount
    const validateToken = async () => {
      if (loading) return;
      
      // Check if user exists and has admin role
      if (!user) {
        // No user at all - could be initial load or logged out
        // Don't redirect here, let the auth system handle it
        setValidating(false);
        return;
      }
      
      if (user.role !== 'admin') {
        // User is logged in but not an admin
        router.replace('/');
        setValidating(false);
        return;
      }

      // User is admin, validate the token is still valid
      try {
        await apiClient.getCurrentUser();
        setValidating(false);
      } catch (error) {
        // Token validation failed - api.ts will handle redirect to login
        console.error('Token validation failed:', error);
        setValidating(false);
      }
    };

    validateToken();
  }, [user, loading, router]);

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
