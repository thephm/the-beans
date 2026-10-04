import { NextRequest, NextResponse } from 'next/server'
import { logRequestDiagnostic } from './server/requestDiagnostics'

export async function middleware(request: NextRequest) {
  if (process.env.REQUEST_DIAGNOSTICS === 'true') {
    try {
      await logRequestDiagnostic(request, {
        REQUEST_DIAGNOSTICS: process.env.REQUEST_DIAGNOSTICS,
        REQUEST_DIAGNOSTIC_SECRET: process.env.REQUEST_DIAGNOSTIC_SECRET,
      })
    } catch {
      // Diagnostic failures must not disrupt requests or expose request/error details.
      console.error(JSON.stringify({
        type: 'request_diagnostic_error',
        timestamp: new Date().toISOString(),
        message: 'Unable to generate request diagnostic',
      }))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
