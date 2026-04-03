import type { NextConfig } from "next";

const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "external-content.duckduckgo.com",
      },
    ],
  },
} satisfies NextConfig;

export default nextConfig;