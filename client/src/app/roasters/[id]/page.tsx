import RoasterDetail from '@/components/RoasterDetail';
import { notFound } from 'next/navigation';

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

export default async function RoasterDetailPage({ params }: { params: { id?: string } }) {
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

  return <RoasterDetail id={id} />;
}
