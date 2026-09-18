import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createServerClient } from '@supabase/ssr'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Audit H1: these middleware limits are per-IP BACKSTOPS against anonymous
// floods only. The campus sits behind a shared NAT, so the old tight limits
// (5 posts/hour, 10 auth/min per IP) throttled the ENTIRE campus at once.
// Real quotas are enforced per-user inside the API routes (lib/ratelimit.ts).
// NOTE (audit H2): the auth limiter only throttles the login/signup PAGES.
// Actual signInWithPassword/signUp calls go browser → Supabase directly and
// never pass through here — configure brute-force limits in the Supabase
// dashboard (Auth → Rate Limits); do not rely on this middleware for that.
const limiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(120, '1 m'),
    prefix: 'rl:api',
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'rl:auth',
  }),
  claim: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'rl:claim',
  }),
}

// Single source of truth for Content-Security-Policy (next.config.ts intentionally
// does NOT set CSP — see its headers()). unsafe-eval is dev-only; wss://*.supabase.co
// is required for Supabase Realtime; the vercel domains cover analytics/speed-insights.
const isDev = process.env.NODE_ENV === 'development'

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  'https://vercel.live',
  'https://*.vercel-insights.com',
  'https://va.vercel-scripts.com',
  ...(isDev ? ["'unsafe-eval'"] : []),
].join(' ')

const connectSrc = [
  "'self'",
  'https://*.supabase.co',
  'wss://*.supabase.co',
  'https://*.vercel-insights.com',
  'https://va.vercel-scripts.com',
].join(' ')

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https://*.supabase.co data: blob:",
  "font-src 'self'",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': contentSecurityPolicy,
}

function applySecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

function rateLimitHtml(retryAfter: number) {
  const seconds = Math.ceil((retryAfter - Date.now()) / 1000)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slow down — Vaapsi</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #080c18;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 24px;
    }
    .card {
      background: #0d1225;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 40px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { color: #f0f2f5; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    p { color: #8b92a5; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
    .timer {
      display: inline-block;
      background: #111830;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 12px 24px;
      color: #f0f2f5;
      font-size: 24px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      margin-bottom: 24px;
    }
    .timer span { color: #8b92a5; font-size: 12px; font-weight: 400; margin-left: 4px; }
    .btn {
      display: inline-block;
      background: #185FA5;
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 12px 32px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .sub { color: #4a5068; font-size: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🛑</div>
    <h1>Too many requests</h1>
    <p>You're moving too fast. Wait a moment and try again.</p>
    <div class="timer" id="countdown">${seconds}<span>s</span></div>
    <br><br>
    <button class="btn" id="retryBtn" disabled onclick="window.location.reload()">Wait...</button>
    <p class="sub">This protects Vaapsi from spam and abuse.</p>
  </div>
  <script>
    let s = ${seconds};
    const cd = document.getElementById('countdown');
    const btn = document.getElementById('retryBtn');
    const t = setInterval(() => {
      s--;
      if (s <= 0) {
        clearInterval(t);
        cd.innerHTML = '0<span>s</span>';
        btn.disabled = false;
        btn.textContent = 'Try again';
      } else {
        cd.innerHTML = s + '<span>s</span>';
      }
    }, 1000);
  </script>
</body>
</html>`
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // --- CSRF protection on API routes ---
  if (path.startsWith('/api/')) {
    const origin = req.headers.get('origin')
    const allowedOrigins = [
  'https://vaapsi.vercel.app',
  'https://vaapsi.live',
  'https://www.vaapsi.live',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
]

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (!origin || !allowedOrigins.includes(origin)) {
        const res = NextResponse.json(
          { error: 'Forbidden — invalid origin' },
          { status: 403 }
        )
        return applySecurityHeaders(res)
      }
    }
  }

  // --- Rate limiting (per-IP backstop; per-user quotas live in the routes) ---
  let limiter: Ratelimit | null = null
  let isApiRoute = false

  if (path.startsWith('/api/')) {
    limiter = limiters.api
    isApiRoute = true
  } else if (path === '/signup' || path === '/login') {
    limiter = limiters.auth
  } else if (path.match(/^\/posts\/[^/]+\/claim$/)) {
    limiter = limiters.claim
  }

  if (limiter) {
    // Prefer x-real-ip (set by Vercel's proxy) — the first x-forwarded-for
    // entry can be attacker-supplied on some setups (audit H1).
    const ip =
      req.headers.get('x-real-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      '127.0.0.1'
    const identifier = `${ip}:${path}`

    try {
      const { success, limit, remaining, reset } = await limiter.limit(identifier)

      if (!success) {
        if (isApiRoute) {
          const res = NextResponse.json(
            { error: 'Too many requests. Please slow down.' },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
              },
            }
          )
          return applySecurityHeaders(res)
        }

        const res = new NextResponse(rateLimitHtml(reset), {
          status: 429,
          headers: {
            'Content-Type': 'text/html',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        })
        return applySecurityHeaders(res)
      }

      const response = NextResponse.next()
      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', reset.toString())
      return applySecurityHeaders(response)

    } catch {
      // Redis unavailable — fail open, let request through
      const response = NextResponse.next()
      return applySecurityHeaders(response)
    }
  }

  // --- Ban check on protected PAGE routes ---
  // NOTE (audit C3): the rate-limit branch above returns early for /api/*, so
  // this check never runs for API calls. Every API route therefore enforces
  // the ban itself via getActiveUser() in lib/auth-server.ts. This page-level
  // check only handles the redirect UX for banned users browsing the site.
  const protectedRoutes = ['/dashboard', '/posts', '/my-posts', '/my-claims', '/profile', '/notifications', '/handoff', '/handoffs']
  const isProtected = protectedRoutes.some(r => path.startsWith(r))

  if (isProtected) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userData } = await supabase.from('users').select('is_banned').eq('id', user.id).single()
      if (userData?.is_banned) {
        const res = NextResponse.redirect(new URL('/banned', req.url))
        return applySecurityHeaders(res)
      }
    }
  }

  const response = NextResponse.next()
  return applySecurityHeaders(response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}