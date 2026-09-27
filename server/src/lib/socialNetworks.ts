export const SOCIAL_NETWORK_KEYS = [
  'instagram',
  'tiktok',
  'facebook',
  'linkedin',
  'youtube',
  'threads',
  'pinterest',
  'bluesky',
  'x',
  'reddit',
] as const;

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isSocialNetworksObject = (value: any) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Keeps only known networks with non-empty http(s) URLs. */
export const normalizeSocialNetworks = (value: any): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!isSocialNetworksObject(value)) return result;
  SOCIAL_NETWORK_KEYS.forEach((key) => {
    const entry = value[key];
    if (typeof entry !== 'string') return;
    const trimmed = entry.trim();
    if (trimmed && isHttpUrl(trimmed)) result[key] = trimmed;
  });
  return result;
};
