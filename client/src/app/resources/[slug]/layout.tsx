import { apiClient } from '@/lib/api';
import type { ResourceSummary } from '@/types';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

type ResourceLayoutProps = {
  children: ReactNode;
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const resource = await apiClient.getResource(params.slug) as ResourceSummary;
    if (resource?.name) {
      const title = resource.name.length > 60
        ? `${resource.name.slice(0, 57).trimEnd()}...`
        : resource.name;

      return { title: { absolute: title } };
    }
  } catch {
    // Fall back to the generic resource title when metadata cannot be loaded.
  }

  return { title: 'Resource' };
}

export default function ResourceLayout({ children }: ResourceLayoutProps) {
  return children;
}
