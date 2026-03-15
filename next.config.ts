import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['playwright', '@playwright/test', 'playwright-core'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent module identity conflicts between App Router and Pages Router
      // by disabling chunk splitting on the server side
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
