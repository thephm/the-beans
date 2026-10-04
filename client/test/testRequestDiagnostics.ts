import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import { test } from 'node:test'
import { logRequestDiagnostic } from '../src/server/requestDiagnostics'

// Next's Edge runtime provides Web Crypto; Node 18 needs it installed for these tests.
if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: webcrypto })

const secret = 'test-only-secret'
const environment = { REQUEST_DIAGNOSTICS: 'true', REQUEST_DIAGNOSTIC_SECRET: secret }
const day = new Date('2026-10-04T23:59:59.999Z')
const ip = '203.0.113.42'

function request(path = '/discover', headers: Record<string, string> = {}, method = 'GET') {
  const url = new URL(path, 'https://thebeans.ca')
  return {
    method,
    nextUrl: { pathname: url.pathname, hostname: url.hostname },
    headers: new Headers({ 'x-forwarded-for': `${ip}, 10.0.0.1`, ...headers }),
  }
}

async function capture(
  input = request(),
  env: Parameters<typeof logRequestDiagnostic>[1] = environment,
  now = day,
) {
  const lines: string[] = []
  await logRequestDiagnostic(input, env, now, line => lines.push(line))
  return lines
}

test('disabled, unset, and non-exact flags do no work and emit nothing', async () => {
  const unreadable = {
    method: 'GET',
    get nextUrl(): never { throw new Error('Read URL while disabled') },
    headers: { get(): never { throw new Error('Read headers while disabled') } },
  }
  for (const flag of [undefined, 'false', 'TRUE', '1', '']) {
    const lines: string[] = []
    await logRequestDiagnostic(unreadable, { REQUEST_DIAGNOSTICS: flag }, day, line => lines.push(line))
    assert.deepEqual(lines, [])
  }
})

test('writes only the explicit diagnostic fields, with no private request data', async () => {
  const lines = await capture(request('/discover?search=private-search&email=private@example.com', {
    cookie: 'private-cookie',
    authorization: 'Bearer private-token',
    referer: 'https://example.com/?search=private-referrer',
    'x-username': 'private-username',
    'user-agent': 'GPTBot/1.0',
    'cf-ray': 'test-ray',
    'cf-ipcountry': 'CA',
  }, 'POST'))
  assert.equal(lines.length, 1)
  const expectedHash = createHash('sha256').update(`${secret}:2026-10-04:${ip}`).digest('hex').slice(0, 12)
  assert.deepEqual(JSON.parse(lines[0]), {
    type: 'request_diagnostic',
    timestamp: day.toISOString(),
    method: 'POST',
    path: '/discover',
    status: null,
    ipHash: expectedHash,
    userAgent: 'GPTBot/1.0',
    userAgentCategory: 'bot-like',
    cfRay: 'test-ray',
    country: 'CA',
    host: 'thebeans.ca',
  })
  for (const value of [ip, '10.0.0.1', secret, 'private-search', 'private@example.com',
    'private-cookie', 'private-token', 'private-referrer', 'private-username']) {
    assert.ok(!lines[0].includes(value))
  }
})

test('same IP is stable within a UTC day, rotates at UTC midnight, and differs by IP', async () => {
  const hash = async (input = request(), now = day) => JSON.parse((await capture(input, environment, now))[0]).ipHash
  assert.equal(await hash(), await hash(request(), new Date('2026-10-04T00:00:00Z')))
  assert.equal(await hash(), await hash(request(), new Date('2026-10-05T01:59:59.999+02:00')))
  assert.notEqual(await hash(), await hash(request(), new Date('2026-10-05T00:00:00Z')))
  assert.notEqual(await hash(), await hash(request('/discover', { 'x-forwarded-for': '203.0.113.43' })))
})

test('prefers CF-Connecting-IP and trims the first forwarded client IP', async () => {
  const cf = request('/discover', { 'cf-connecting-ip': ` ${ip} `, 'x-forwarded-for': '198.51.100.2, 10.0.0.1' })
  const forwarded = request('/discover', { 'x-forwarded-for': ` ${ip} , 10.0.0.2` })
  assert.equal(JSON.parse((await capture(cf))[0]).ipHash, JSON.parse((await capture(forwarded))[0]).ipHash)
})

test('missing secret or client IP is unavailable, never a raw-IP fallback', async () => {
  for (const missing of ['', undefined]) {
    const lines = await capture(request(), { REQUEST_DIAGNOSTICS: 'true', REQUEST_DIAGNOSTIC_SECRET: missing })
    assert.equal(JSON.parse(lines[0]).ipHash, 'unavailable')
    assert.ok(!lines[0].includes(ip))
  }
  const lines = await capture(request('/discover', { 'x-forwarded-for': '', 'cf-connecting-ip': '' }))
  assert.equal(JSON.parse(lines[0]).ipHash, 'unavailable')
})

test('IPv6 is hashed without logging the address', async () => {
  const ipv6 = '2001:db8::1234'
  const lines = await capture(request('/discover', { 'cf-connecting-ip': ipv6 }))
  assert.equal(JSON.parse(lines[0]).ipHash,
    createHash('sha256').update(`${secret}:2026-10-04:${ipv6}`).digest('hex').slice(0, 12))
  assert.ok(!lines[0].includes(ipv6))
})

test('uses the request hostname, not Next internal localhost, and removes the port', async () => {
  const input = request('/', { host: 'TheBeans.ca:3000' })
  input.nextUrl.hostname = 'localhost'
  assert.equal(JSON.parse((await capture(input))[0]).host, 'thebeans.ca')
  assert.equal(JSON.parse((await capture(request('/', { host: '[::1]:3000' })))[0]).host, '[::1]')
  assert.equal(JSON.parse((await capture(request('/', { host: 'bad-host/?email=private@example.com' })))[0]).host, 'thebeans.ca')
})

test('excludes Next.js and common browser/static assets including source maps', async () => {
  for (const path of ['/_next/static/chunks/app.js', '/_next/static/anything',
    '/_next/image?url=private&width=100', '/_next/image/example',
    '/favicon.ico', '/favicon-32x32.png', '/apple-touch-icon.png',
    '/images/default-cafe.svg', '/locales/en/common.json', '/locales/en/common.json.map', '/app.js.map',
    '/styles.css', '/font.woff2', '/manifest.json', '/site.webmanifest',
    '/roasters-import-template.csv']) {
    assert.deepEqual(await capture(request(path)), [], path)
  }
})

test('logs pages, APIs, JSON endpoints, crawler metadata and unknown/scanner paths', async () => {
  for (const path of ['/', '/discover', '/roasters/123', '/api', '/api/admin/users',
    '/api/data.json', '/api/export.csv', '/reports.json', '/robots.txt', '/sitemap.xml',
    '/.env', '/wp-login.php', '/missing', '/_next/image-tools']) {
    const lines = await capture(request(path))
    assert.equal(lines.length, 1, path)
    assert.equal(JSON.parse(lines[0]).path, path)
  }
})

test('missing optional headers are null and categories are only transparent hints', async () => {
  const record = JSON.parse((await capture())[0])
  assert.equal(record.userAgent, null)
  assert.equal(record.cfRay, null)
  assert.equal(record.country, null)
  assert.equal(record.userAgentCategory, 'unknown')
  for (const agent of ['Googlebot', 'Bingbot', 'GPTBot', 'ClaudeBot', 'PerplexityBot',
    'Applebot', 'AhrefsBot', 'SemrushBot', 'MJ12bot', 'Bytespider', 'facebookexternalhit']) {
    const record = JSON.parse((await capture(request('/', { 'user-agent': agent })))[0])
    assert.equal(record.userAgentCategory, 'bot-like')
    assert.equal(record.userAgent, agent)
  }
  for (const [agent, category] of [
    ['Mozilla/5.0 Chrome/123.0 Safari/537.36', 'browser-like'],
    ['Mozilla/5.0 Firefox/123.0', 'browser-like'],
    ['Mozilla/5.0 Version/17.0 Safari/605.1.15', 'browser-like'],
    ['curl/8.0', 'unknown'],
  ]) {
    assert.equal(JSON.parse((await capture(request('/', { 'user-agent': agent })))[0]).userAgentCategory, category)
  }
})
