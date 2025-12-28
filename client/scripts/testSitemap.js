// Lightweight test to verify sitemap date parsing without running full Next build
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebeans.ca';
const configured = process.env.NEXT_PUBLIC_API_URL;
const candidates = [configured, 'http://localhost:5000', 'http://server:5000', 'http://host.docker.internal:5000'].filter(Boolean);

async function tryFetch(url) {
  try {
    const res = await fetch(`${url}/api/roasters`);
    return res;
  } catch (err) {
    return null;
  }
}

async function run() {
  for (const apiUrl of candidates) {
    if (!apiUrl) continue;
    console.log('Trying API at', apiUrl);
    const res = await tryFetch(apiUrl);
    if (!res) {
      console.log('No response from', apiUrl);
      continue;
    }
    if (!res.ok) {
      console.error('API responded non-OK at', apiUrl, res.status);
      continue;
    }
    const data = await res.json();
    const roasters = data.roasters || [];
    console.log('Roasters count:', roasters.length);
    roasters.forEach((r) => {
      const updatedAt = r.updatedAt;
      const date = updatedAt ? new Date(updatedAt) : undefined;
      const valid = date instanceof Date && !isNaN(date.getTime());
      console.log(r.id, 'updatedAt=', updatedAt, '=> validDate=', valid, valid ? date.toISOString().slice(0,10) : 'N/A');
    });
    return;
  }
  console.error('Failed to reach API on any candidate host:', candidates.join(', '));
  process.exitCode = 4;
}

run();
