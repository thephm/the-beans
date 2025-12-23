import { apiClient } from '@/lib/api';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // Fetch the roaster data to get the name
  try {
    const roaster = await apiClient.getRoaster<import('@/types').Roaster>(params.id);
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

export default function Head() {
  // This file only exports metadata, no component needed
  return null;
}
