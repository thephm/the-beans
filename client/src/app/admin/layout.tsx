"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;
    
    // Redirect non-admin users to 404
    if (!user || user.role !== 'admin') {
      router.replace('/not-found');
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
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
