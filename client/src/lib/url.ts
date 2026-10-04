export const stripToRootUrl = (rawValue: string, preserveQueryParams: string[] = []): string => {
  const trimmed = rawValue.trim();
  if (!trimmed) return trimmed;
  const trimmedNoTrailing = trimmed.replace(/\/+$/, '');

  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmedNoTrailing);
  const candidate = hasScheme ? trimmedNoTrailing : `https://${trimmedNoTrailing}`;

  try {
    const url = new URL(candidate);
    const preservedParams = new URLSearchParams();
    url.searchParams.forEach((value, key) => {
      if (preserveQueryParams.includes(key)) preservedParams.append(key, value);
    });
    url.search = preservedParams.toString();
    url.hash = '';
    const path = url.pathname.replace(/\/+$/, '');
    return `${url.origin}${path}${url.search}`;
  } catch {
    return trimmedNoTrailing;
  }
};
