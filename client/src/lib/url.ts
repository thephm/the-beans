export const stripToRootUrl = (rawValue: string): string => {
  const trimmed = rawValue.trim();
  if (!trimmed) return trimmed;
  const trimmedNoTrailing = trimmed.replace(/\/+$/, '');

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmedNoTrailing);
  const candidate = hasScheme ? trimmedNoTrailing : `https://${trimmedNoTrailing}`;

  try {
    const url = new URL(candidate);
    url.search = '';
    url.hash = '';
    const path = url.pathname.replace(/\/+$/, '');
    return `${url.origin}${path}`;
  } catch {
    return trimmedNoTrailing;
  }
};
