import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    dangerouslyAllowSVG: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' https://vaapsi.live https://www.vaapsi.live",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-insights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "connect-src 'self' https://vaapsi.live https://www.vaapsi.live https://*.supabase.co wss://*.supabase.co https://api.resend.com https://*.vercel-insights.com",
              "font-src 'self'",
              "frame-src 'none'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;