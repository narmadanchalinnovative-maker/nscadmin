// @ts-nocheck
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel optimizations
  reactStrictMode: true,

  // Skip TypeScript errors during build (useful for initial deployment)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization for external sources if needed
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: '/external-api/:path*',
        destination: 'http://201.18.192.154:3001/api/:path*',
      },
      {
        source: '/external-notifications/:path*',
        destination: 'http://201.18.192.154:5000/api/:path*',
      },
      {
        source: '/external-whip/:path*',
        destination: 'http://201.18.192.154:8889/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://201.18.192.154:3001/uploads/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://201.18.192.154:3001/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
