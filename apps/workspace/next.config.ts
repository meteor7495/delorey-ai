import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@seloma/api-client', '@seloma/ui'],
};

export default nextConfig;
