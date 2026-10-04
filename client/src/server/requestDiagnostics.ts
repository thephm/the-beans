interface DiagnosticRequest {
  method: string
  nextUrl: { pathname: string; hostname: string }
  headers: Pick<Headers, 'get'>
}

interface DiagnosticEnvironment {
  REQUEST_DIAGNOSTICS?: string
  REQUEST_DIAGNOSTIC_SECRET?: string
  NEXT_PUBLIC_SITE_URL?: string
  RENDER_EXTERNAL_URL?: string
}

const internalRequestHeader = 'x-beans-internal-request'
const staticAsset = /\.(?:avif|bmp|css|csv|eot|gif|ico|jpe?g|js|mjs|map|mp3|mp4|ogg|otf|pdf|png|svg|ttf|wav|webm|webp|woff2?)$/i
const crawlerAgent = /Googlebot|Bingbot|GPTBot|ClaudeBot|PerplexityBot|Applebot|AhrefsBot|SemrushBot|MJ12bot|Bytespider|facebookexternalhit/i
const browserAgent = /Mozilla\/5\.0.*(?:Chrome\/|Firefox\/|Version\/.*Safari\/|Edg\/)/i

export function getInternalRequestHeaders(
  targetUrl: string,
  environment: Pick<DiagnosticEnvironment,
    'REQUEST_DIAGNOSTIC_SECRET' | 'NEXT_PUBLIC_SITE_URL' | 'RENDER_EXTERNAL_URL'>,
): Record<string, string> {
  const secret = environment.REQUEST_DIAGNOSTIC_SECRET
  const siteOrigins = [environment.NEXT_PUBLIC_SITE_URL, environment.RENDER_EXTERNAL_URL]
    .filter((url): url is string => Boolean(url))
  if (!secret || siteOrigins.length === 0) return {}

  try {
    const targetOrigin = new URL(targetUrl).origin
    if (!siteOrigins.some(siteUrl => new URL(siteUrl).origin === targetOrigin)) return {}
  } catch {
    return {}
  }
  return { [internalRequestHeader]: secret }
}

function isStaticAsset(path: string): boolean {
  // API routes can have file-like names, including JSON endpoints.
  if (path === '/api' || path.startsWith('/api/')) return false
  return path.startsWith('/_next/static/') ||
    path.startsWith('/_next/data/') ||
    path === '/_next/webpack-hmr' ||
    path === '/_next/image' || path.startsWith('/_next/image/') ||
    path === '/manifest.json' || path === '/site.webmanifest' ||
    (path.startsWith('/locales/') && path.endsWith('.json')) ||
    staticAsset.test(path)
}

function isApplicationOrInfrastructureRequest(request: DiagnosticRequest, path: string): boolean {
  if (path === '/health') return true

  const userAgent = request.headers.get('user-agent')
  if (userAgent?.trim() === 'Render/1.0') return true

  return Boolean(
    request.headers.get('next-router-prefetch') !== null ||
    request.headers.get('purpose')?.toLowerCase() === 'prefetch' ||
    request.headers.get('sec-purpose')?.toLowerCase().split(/\s*[,;]\s*/).includes('prefetch'),
  )
}

export async function logRequestDiagnostic(
  request: DiagnosticRequest,
  environment: DiagnosticEnvironment,
  now = new Date(),
  write: (line: string) => void = console.log,
): Promise<void> {
  if (environment.REQUEST_DIAGNOSTICS !== 'true') return

  const path = request.nextUrl.pathname.split('?')[0]
  if (isStaticAsset(path)) return

  const secret = environment.REQUEST_DIAGNOSTIC_SECRET
  if (secret && request.headers.get(internalRequestHeader) === secret) return

  if (isApplicationOrInfrastructureRequest(request, path)) return

  const userAgent = request.headers.get('user-agent')

  const timestamp = now.toISOString()
  let ipHash = 'unavailable'
  if (secret) {
    const clientIP = request.headers.get('cf-connecting-ip')?.trim() ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    if (clientIP) {
      const dailySalt = `${secret}:${timestamp.slice(0, 10)}`
      const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(`${dailySalt}:${clientIP}`),
      )
      ipHash = Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 12)
    }
  }

  // next start can normalize nextUrl.hostname to localhost; retain the request host without its port.
  const host = request.headers.get('host')?.match(/^(\[[0-9a-f:]+\]|[a-z0-9.-]+)(?::\d+)?$/i)?.[1] ||
    request.nextUrl.hostname
  write(JSON.stringify({
    type: 'request_diagnostic',
    timestamp,
    method: request.method,
    path,
    // Middleware runs before the response; NextResponse.next().status is not the final status.
    status: null,
    ipHash,
    userAgent,
    userAgentCategory: userAgent && crawlerAgent.test(userAgent) ? 'bot-like' :
      userAgent && browserAgent.test(userAgent) ? 'browser-like' : 'unknown',
    cfRay: request.headers.get('cf-ray'),
    country: request.headers.get('cf-ipcountry'),
    host: host.toLowerCase(),
  }))
}
