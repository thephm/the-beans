import { PrismaClient } from '@prisma/client';

export const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
