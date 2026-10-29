import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow larger file uploads in Server Actions (20 MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '22mb',
    },
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      // pdf-parse uses canvas in some environments; not needed for text extraction
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
};

export default nextConfig;
