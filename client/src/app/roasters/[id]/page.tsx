import RoasterDetail from '@/components/RoasterDetail';
import { apiClient } from '@/lib/api';
import type { Roaster } from '@/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const roaster = await apiClient.getRoaster(params.id) as Roaster;
    if (roaster?.name) {
      return {
        title: { absolute: roaster.name },
        description: roaster.description || undefined,
      };
    }
  } catch {
    // Fall back to the generic roaster title when metadata cannot be loaded.
  }

  return { title: 'Roaster' };
}

const isTruthySearchParam = (value: string | string[] | undefined) => {
  const paramValue = Array.isArray(value) ? value[0] : value;
  if (!paramValue) return false;
  return ['1', 'true', 'yes'].includes(paramValue.toLowerCase());
};

const getApiBaseUrl = () => {
  let url: string | undefined = process.env.NEXT_PUBLIC_API_URL;

  if (url) {
    if (url.includes('localhost')) {
      return url.replace('localhost', 'server');
    }
    return url;
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://the-beans-api.onrender.com';
  }

  url = 'http://localhost:5000';
  return url.includes('localhost') ? url.replace('localhost', 'server') : url;
};

export default async function RoasterDetailPage({
  params,
  searchParams,
}: {
  params: { id?: string };
  searchParams?: { hideShareHeart?: string | string[]; hideActions?: string | string[] };
}) {
  const id = params?.id || '';
  if (!id) {
    notFound();
  }

  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/roasters/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error(`Failed to load roaster ${id}`);
  }

  const hideShareHeart = isTruthySearchParam(searchParams?.hideShareHeart) || isTruthySearchParam(searchParams?.hideActions);

  return <RoasterDetail id={id} hideShareHeart={hideShareHeart} />;
}
