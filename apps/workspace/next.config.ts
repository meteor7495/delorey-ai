import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@delorey/api-client', '@delorey/ui'],
};

export default nextConfig;
