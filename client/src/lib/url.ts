export const stripToRootUrl = (rawValue: string): string => {
  const trimmed = rawValue.trim();
  if (!trimmed) return trimmed;

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return url.origin;
  } catch {
    return trimmed;
  }
};
