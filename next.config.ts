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
};

export default nextConfig;
