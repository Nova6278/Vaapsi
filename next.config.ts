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
};

export default nextConfig;
