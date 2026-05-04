import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const limiters = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'rl:api',
  }),
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    prefix: 'rl:auth',
  }),
  claim: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'rl:claim',
  }),
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

  let limiter: Ratelimit | null = null
  let isApiRoute = false

  if (path === '/api/notify') {
    limiter = limiters.api
    isApiRoute = true
  } else if (path === '/signup' || path === '/login') {
    limiter = limiters.auth
  } else if (path.match(/^\/posts\/[^/]+\/claim$/)) {
    limiter = limiters.claim
  }

  if (!limiter) return NextResponse.next()

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const identifier = `${ip}:${path}`

  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  if (!success) {
    // API routes get JSON
    if (isApiRoute) {
      return NextResponse.json(
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
    }

    // Page routes get styled HTML with countdown
    return new NextResponse(rateLimitHtml(reset), {
      status: 429,
      headers: {
        'Content-Type': 'text/html',
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    })
  }

  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())

  return response
}

export const config = {
  matcher: ['/api/notify', '/signup', '/login', '/posts/:id/claim'],
}