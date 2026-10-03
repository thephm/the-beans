export function normalizePersonRole(role: string): string;
export function normalizePersonRole(role: unknown): unknown;
export function normalizePersonRole(role: unknown): unknown {
  return typeof role === 'string' ? role.trim().toLowerCase() : role;
}

export function normalizePersonRoles(roles: string[]): string[] {
  return [...new Set(roles.map(role => normalizePersonRole(role)))];
}
