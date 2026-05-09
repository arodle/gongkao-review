import type { NextConfig } from 'next';

const isStatic = process.env.BUILD_MODE === 'static';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    unoptimized: isStatic,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },
  ...(isStatic && {
    output: 'export',
    basePath: '/gongkao-review',
    trailingSlash: true,
  }),
};

export default nextConfig;
