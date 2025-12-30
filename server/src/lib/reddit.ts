import axios from 'axios';

interface PostResult {
  subreddit: string;
  success: boolean;
  error?: string;
}

function getSiteName() {
  return (
    process.env.SITE_NAME || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE || 'thebeans.ca'
  );
}

async function getAccessToken() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;
  const refreshToken = process.env.REDDIT_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Reddit client id/secret in environment');
  }

  const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  // Prefer refresh token flow if a refresh token is supplied (recommended for production)
  if (refreshToken) {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const res = await axios.post(tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
        'User-Agent': process.env.REDDIT_USER_AGENT || `the-beans-bot/1.0`,
      },
      timeout: 10000,
    });
    return res.data.access_token as string;
  }

  // Fallback to password grant (script apps) when refresh token is not available.
  if (!username || !password) {
    throw new Error('Missing Reddit credentials in environment (need either refresh token or username+password)');
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', username);
  params.append('password', password);

  const res = await axios.post(tokenUrl, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
      'User-Agent': process.env.REDDIT_USER_AGENT || `the-beans-bot/1.0 by ${username}`,
    },
    timeout: 10000,
  });

  return res.data.access_token as string;
}

function buildTitle(roaster: any) {
  const parts: string[] = [];
  if (roaster.name) parts.push(roaster.name);
  const location = [roaster.city, roaster.state, roaster.country].filter(Boolean).join(', ');
  if (location) parts.push(`from ${location}`);
  const site = getSiteName();
  return `Welcome ${parts.join(' ')} to ${site}`;
}

function buildBody(roaster: any) {
  const site = getSiteName();
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.SITE_NAME || '';
  const roasterUrl = roaster.website || (siteBase ? `${siteBase.replace(/\/$/, '')}/roasters/${roaster.id}` : roaster.website || '');
  const desc = roaster.description || '';
  return `We just added ${roasterUrl || roaster.name} to ${site}.
\n\nDescription:\n${desc}`;
}

export async function postWelcomeToReddit(roaster: any): Promise<PostResult[]> {
  try {
    const token = await getAccessToken();
    const communities = (process.env.REDDIT_COMMUNITIES || '').split(',').map(s => s.trim()).filter(Boolean);
    if (communities.length === 0) {
      throw new Error('No REDDIT_COMMUNITIES configured');
    }

    const title = buildTitle(roaster);
    const text = buildBody(roaster);

    const results: PostResult[] = [];

    for (const raw of communities) {
      const sr = raw.replace(/^\/?r\/?/i, '');
      try {
        const form = new URLSearchParams();
        form.append('sr', sr);
        form.append('title', title);
        form.append('kind', 'self');
        form.append('text', text);

        await axios.post('https://oauth.reddit.com/api/submit', form.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
            'User-Agent': process.env.REDDIT_USER_AGENT || `the-beans-bot/1.0`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        });

        results.push({ subreddit: sr, success: true });
      } catch (err: any) {
        const status = err?.response?.status;
        const data = err?.response?.data;
        const msg = err?.message || 'unknown';
        const details = status ? `status ${status}` : msg;
        const errorText = data ? JSON.stringify(data) : msg;
        results.push({ subreddit: sr, success: false, error: `${details} - ${errorText}` });
        console.error(`Reddit post error for /r/${sr}:`, { status, data, message: msg });
      }
    }

    return results;
  } catch (err: any) {
    throw new Error(`Reddit post failed: ${err?.message || err}`);
  }
}

export default { postWelcomeToReddit };
