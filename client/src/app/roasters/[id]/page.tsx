'use client'


import RoasterDetail from '@/components/RoasterDetail';
import { useParams } from 'next/navigation';

export default function RoasterDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  if (!id) return <div>Invalid roaster id.</div>;
  return <RoasterDetail id={id} />;
}
