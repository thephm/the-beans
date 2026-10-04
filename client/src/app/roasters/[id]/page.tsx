import RoasterDetail from '@/components/RoasterDetail';
import type { Roaster } from '@/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getInternalRequestHeaders } from '@/server/requestDiagnostics';

const isValidRoasterId = (id: string | undefined) =>
  Boolean(id && id !== 'null' && id !== 'undefined');

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params?.id;
  if (!isValidRoasterId(id)) {
    return { title: 'Roaster' };
  }

  const apiUrl = `${getApiBaseUrl()}/api/roasters/${encodeURIComponent(id)}`;
  const response = await fetch(apiUrl, {
    cache: 'no-store',
    headers: getInternalRequestHeaders(apiUrl, {
      REQUEST_DIAGNOSTIC_SECRET: process.env.REQUEST_DIAGNOSTIC_SECRET,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
    }),
  });

  if (response.status === 404) {
    return { title: 'Roaster' };
  }

  if (!response.ok) {
    throw new Error(`Failed to load roaster metadata ${id}`);
  }

  const roaster = await response.json() as Roaster;
  return {
    title: roaster?.name ? { absolute: roaster.name } : 'Roaster',
    description: roaster?.description || undefined,
  };
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
  if (!isValidRoasterId(id)) {
    notFound();
  }

  const apiBaseUrl = getApiBaseUrl();
  const apiUrl = `${apiBaseUrl}/api/roasters/${encodeURIComponent(id)}`;
  const response = await fetch(apiUrl, {
    cache: 'no-store',
    headers: getInternalRequestHeaders(apiUrl, {
      REQUEST_DIAGNOSTIC_SECRET: process.env.REQUEST_DIAGNOSTIC_SECRET,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
    }),
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
