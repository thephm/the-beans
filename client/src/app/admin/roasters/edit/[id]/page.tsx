"use client";
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Roaster } from '@/types';

// Import the RoasterForm component from the main roasters page
// We'll need to extract and export it separately
export default function EditRoasterPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [roaster, setRoaster] = useState<Roaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRoaster();
    }
  }, [id]);

  const fetchRoaster = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/roasters/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch roaster');
      }
      
      const data = await res.json();
      setRoaster(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/admin/roasters');
  };

  const handleCancel = () => {
    router.push('/admin/roasters');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading roaster...</div>
      </div>
    );
  }

  if (error || !roaster) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error || 'Roaster not found'}</div>
      </div>
    );
  }

  // For now, redirect to the main roasters page with edit state
  // This is a temporary solution until we refactor RoasterForm into a shared component
  if (typeof window !== 'undefined') {
    router.push(`/admin/roasters?edit=${id}`);
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-500">Redirecting to edit page...</div>
    </div>
  );
}
