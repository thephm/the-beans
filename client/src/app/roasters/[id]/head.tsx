import { apiClient } from '@/lib/api';
import type { Roaster } from '@/types';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const roaster = await apiClient.getRoaster(params.id) as Roaster;
    if (roaster && roaster.name) {
      return {
        title: roaster.name,
        description: roaster.description || undefined,
      };
    }
  } catch (e) {
    // fallback
  }
  return {
    title: 'Roaster',
  };
}
