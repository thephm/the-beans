import { PrismaClient } from '@prisma/client';

export const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateUniquePersonSlug = async (
  prisma: Pick<PrismaClient, 'person'>,
  name: string
): Promise<string> => {
  const baseSlug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'person';
  let slug = baseSlug;
  let suffix = 2;
  while (await prisma.person.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix++}`;
  }
  return slug;
};

export const generateUniqueRoasterSlug = async (
  prisma: PrismaClient,
  roasterName: string
): Promise<string> => {
  const baseSlug = slugify(roasterName) || 'roaster';
  let candidateSlug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.roaster.findUnique({
      where: { slug: candidateSlug },
      select: { id: true }
    });

    if (!existing) {
      return candidateSlug;
    }

    candidateSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};
