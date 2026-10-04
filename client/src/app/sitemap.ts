import { MetadataRoute } from 'next';

import { getInternalRequestHeaders } from '@/server/requestDiagnostics';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebeans.ca';
  
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/suggest`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Fetch dynamic roaster routes (only if API is available)
  let roasterRoutes: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const roastersUrl = `${apiUrl}/api/roasters`;
    const response = await fetch(roastersUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: getInternalRequestHeaders(roastersUrl, {
        REQUEST_DIAGNOSTIC_SECRET: process.env.REQUEST_DIAGNOSTIC_SECRET,
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
        RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      roasterRoutes = (data.roasters || []).map((roaster: { id: string; updatedAt?: string | null }) => {
        const updated = roaster.updatedAt ? new Date(roaster.updatedAt) : undefined;
        const hasValidDate = updated instanceof Date && !isNaN(updated.getTime());
        return {
          url: `${baseUrl}/roasters/${roaster.id}`,
          ...(hasValidDate ? { lastModified: updated } : {}),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      });
    }
  } catch (error) {
    console.error('Failed to fetch roasters for sitemap:', error);
  }

  return [...staticRoutes, ...roasterRoutes];
}
