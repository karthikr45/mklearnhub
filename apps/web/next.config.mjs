/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  transpilePackages: ['@learnhub/ui', '@learnhub/types', '@learnhub/utils'],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
