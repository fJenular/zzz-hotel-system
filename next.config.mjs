import { spawnSync } from "node:child_process";
import withSerwistInit from "@serwist/next";

// Safe revision helper to get git commit hash or generate uuid fallback
const getRevision = () => {
  try {
    const gitHash = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim();
    return gitHash || crypto.randomUUID();
  } catch (e) {
    return crypto.randomUUID();
  }
};
const revision = getRevision();

const withSerwist = withSerwistInit({
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'xjtxltveuhlkwqenxyes.supabase.co',
        pathname: '/**',
      },
    ],
  },
}

export default withSerwist(nextConfig)