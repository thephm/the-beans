import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function isMastodonPostUrl(value: string): boolean {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    return false;
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  const pathname = parsedUrl.pathname.toLowerCase();
  const looksLikeMastodonPost = /^\/@[^/]+\/\d+(?:\/)?$/.test(pathname);

  return hostname === 'mstdn.ca'
    || hostname === 'mastodon.social'
    || hostname.includes('mastodon')
    || (hostname.includes('mstdn') && looksLikeMastodonPost)
    || looksLikeMastodonPost;
}

async function backfillMastodonPosts() {
  const apply = process.argv.includes('--apply');

  console.log(`Starting Mastodon post backfill (${apply ? 'apply' : 'dry run'})...`);

  const posts = await prisma.post.findMany({
    where: {
      NOT: {
        socialNetwork: {
          equals: 'Mastodon',
          mode: 'insensitive'
        }
      }
    },
    select: {
      id: true,
      url: true,
      socialNetwork: true,
      roaster: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const mastodonPosts = posts.filter((post) => isMastodonPostUrl(post.url));

  console.log(`Found ${mastodonPosts.length} post(s) to update.`);

  for (const post of mastodonPosts) {
    console.log(`- ${post.id}: ${post.roaster.name} (${post.socialNetwork}) ${post.url}`);
  }

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to update these posts.');
    return;
  }

  if (mastodonPosts.length === 0) {
    console.log('No updates needed.');
    return;
  }

  const result = await prisma.post.updateMany({
    where: {
      id: {
        in: mastodonPosts.map((post) => post.id)
      }
    },
    data: {
      socialNetwork: 'Mastodon'
    }
  });

  console.log(`\nUpdated ${result.count} post(s) to Mastodon.`);
}

backfillMastodonPosts()
  .catch((error) => {
    console.error('Mastodon post backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });