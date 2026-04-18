import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/lumina',
  serverExternalPackages: ['better-sqlite3'],
  env: {
    BUILT_AT: process.env.BUILT_AT ?? new Date().toISOString(),
  },
}

export default nextConfig;
