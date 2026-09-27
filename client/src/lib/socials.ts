export const PRIMARY_SOCIAL_NETWORKS = ['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube'] as const;
export const SECONDARY_SOCIAL_NETWORKS = ['x', 'threads', 'pinterest', 'bluesky', 'reddit'] as const;
export const SOCIAL_NETWORKS = [...PRIMARY_SOCIAL_NETWORKS, ...SECONDARY_SOCIAL_NETWORKS];

export type SocialNetworkKey = typeof SOCIAL_NETWORKS[number];

export const SOCIAL_NETWORK_META: Record<SocialNetworkKey, { label: string; placeholder: string; translationKey: string }> = {
  instagram: { label: 'Instagram', placeholder: 'https://instagram.com/', translationKey: 'adminForms.roasters.instagram' },
  facebook: { label: 'Facebook', placeholder: 'https://facebook.com/', translationKey: 'adminForms.roasters.facebook' },
  tiktok: { label: 'TikTok', placeholder: 'https://tiktok.com/@', translationKey: 'adminForms.roasters.tiktok' },
  linkedin: { label: 'LinkedIn', placeholder: 'https://linkedin.com/', translationKey: 'adminForms.roasters.linkedin' },
  youtube: { label: 'YouTube', placeholder: 'https://youtube.com/', translationKey: 'adminForms.roasters.youtube' },
  x: { label: 'X', placeholder: 'https://x.com/', translationKey: 'adminForms.roasters.x' },
  threads: { label: 'Threads', placeholder: 'https://threads.net/', translationKey: 'adminForms.roasters.threads' },
  pinterest: { label: 'Pinterest', placeholder: 'https://pinterest.com/', translationKey: 'adminForms.roasters.pinterest' },
  bluesky: { label: 'Bluesky', placeholder: 'https://bsky.app/', translationKey: 'adminForms.roasters.bluesky' },
  reddit: { label: 'Reddit', placeholder: 'https://reddit.com/', translationKey: 'adminForms.roasters.reddit' },
};

export function emptySocialNetworks(): Record<string, string> {
  return SOCIAL_NETWORKS.reduce((acc, key) => ({ ...acc, [key]: '' }), {} as Record<string, string>);
}

/** Builds a full form state from a stored socialNetworks map (or legacy entity fields). */
export function socialNetworksToForm(source: any): Record<string, string> {
  return SOCIAL_NETWORKS.reduce((acc, key) => {
    acc[key] = getSocial(source, key) || '';
    return acc;
  }, {} as Record<string, string>);
}

/** Reduces form state to the non-empty, trimmed entries to persist. */
export function socialNetworksToPayload(values: Record<string, string>): Record<string, string> {
  return SOCIAL_NETWORKS.reduce((acc, key) => {
    const value = (values[key] || '').trim();
    if (value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
}

export function countDefinedSocialNetworks(values: Record<string, string>): number {
  return SOCIAL_NETWORKS.filter((key) => (values[key] || '').trim().length > 0).length;
}

export function getSocial(roaster: any, network: string): string | null {
  if (!roaster) return null;
  // Prefer consolidated socialNetworks map
  if (roaster.socialNetworks && typeof roaster.socialNetworks === 'object') {
    const val = roaster.socialNetworks[network];
    if (val) return val;
  }

  // Fallback to legacy individual fields
  if (network in roaster && typeof roaster[network] === 'string') {
    return roaster[network];
  }


  return null;
}
