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

  // Back-compat alias mapping (e.g., 'twitter' -> 'x')
  if (network === 'twitter' && roaster.x) return roaster.x;

  return null;
}
