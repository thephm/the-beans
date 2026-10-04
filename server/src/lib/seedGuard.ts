export interface SeedGuardClient {
  user: { count(): Promise<number> };
  roaster: { count(): Promise<number> };
  resource: { count(): Promise<number> };
  specialty: { count(): Promise<number> };
  region: { count(): Promise<number> };
  country: { count(): Promise<number> };
}

export async function hasExistingApplicationData(client: SeedGuardClient): Promise<boolean> {
  const counts = await Promise.all([
    client.user.count(),
    client.roaster.count(),
    client.resource.count(),
    client.specialty.count(),
    client.region.count(),
    client.country.count(),
  ]);

  return counts.some((count) => count > 0);
}
