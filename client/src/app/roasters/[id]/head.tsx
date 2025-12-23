import { apiClient } from '@/lib/api';
import type { Roaster } from '@/types';
import { Metadata } from 'next';

  // Fetch the roaster data to get the name
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

export default function Head() {
  // This file only exports metadata, no component needed
  return null;
}
