export function normalizePersonRole(role: unknown): unknown {
  return typeof role === 'string' ? role.trim().toLowerCase() : role;
}
