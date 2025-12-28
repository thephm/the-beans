export function parseFromDate(input?: string | null): Date | undefined {
  if (!input) return undefined;
  const s = String(input).trim();
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (isoDateOnly) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }
  return new Date(s);
}

export function parseToDate(input?: string | null): Date | undefined {
  if (!input) return undefined;
  const s = String(input).trim();
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (isoDateOnly) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
  }
  return new Date(s);
}

export default { parseFromDate, parseToDate };
