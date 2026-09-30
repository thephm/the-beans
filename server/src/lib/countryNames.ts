export const normalizeCountryName = (name: string): string => {
  const trimmed = name.trim();
  const normalized = trimmed.toLowerCase();
  const aliases: Record<string, string> = {
    'u.s.a.': 'United States of America',
    'u.s.a': 'United States of America',
    'usa': 'United States of America',
    'u.s.': 'United States of America',
    'u.s': 'United States of America',
    'united states': 'United States of America',
    'united states of america': 'United States of America',
    'uk': 'United Kingdom',
    'u.k.': 'United Kingdom',
    'united kingdom': 'United Kingdom',
    'south korea': 'Korea, South',
    'north korea': 'Korea, North',
    'dr congo': 'Democratic Republic of Congo',
    'drc': 'Democratic Republic of Congo',
    'democratic republic of the congo': 'Democratic Republic of Congo',
    'republic of the congo': 'Congo',
    'czech republic': 'Czechia'
  };

  return aliases[normalized] || trimmed;
};
