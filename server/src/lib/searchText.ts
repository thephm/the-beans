import { PrismaClient } from '@prisma/client';

export const normalizeForSearch = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export const getAccentInsensitiveRoasterIds = async (
  prisma: PrismaClient,
  term: string
): Promise<string[] | null> => {
  const trimmed = term.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT r.id
      FROM roasters r
      LEFT JOIN roaster_specialties rs ON rs."roasterId" = r.id
      LEFT JOIN specialties s ON s.id = rs."specialtyId"
      LEFT JOIN specialty_translations st ON st."specialtyId" = s.id
      WHERE
        unaccent(COALESCE(r.name, '')) ILIKE '%' || unaccent(${trimmed}) || '%'
        OR unaccent(COALESCE(r.description, '')) ILIKE '%' || unaccent(${trimmed}) || '%'
        OR unaccent(COALESCE(r.city, '')) ILIKE '%' || unaccent(${trimmed}) || '%'
        OR unaccent(COALESCE(r.state, '')) ILIKE '%' || unaccent(${trimmed}) || '%'
        OR unaccent(COALESCE(r.country, '')) ILIKE '%' || unaccent(${trimmed}) || '%'
        OR unaccent(COALESCE(st.name, '')) ILIKE '%' || unaccent(${trimmed}) || '%'
    `;

    return rows.map((row) => row.id);
  } catch (error) {
    console.warn('Accent-insensitive search unavailable, falling back.', error);
    return null;
  }
};
