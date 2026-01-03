"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminRoasterEditLayout from "./AdminRoasterEditLayout";

export default function EditRoasterPage() {
  const params = useParams();
  const id = params?.id as string;
  const [roasterName, setRoasterName] = useState<string>("[Roaster Name]");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchRoaster = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/roasters/${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        
        if (res.ok) {
          const data = await res.json();
          setRoasterName(data.name || "[Roaster Name]");
        }
      } catch (err) {
        console.error('Error fetching roaster:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoaster();
  }, [id]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return <AdminRoasterEditLayout roasterId={id} roasterName={roasterName} />;
}
