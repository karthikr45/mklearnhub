/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@learnhub/ui', '@learnhub/types', '@learnhub/utils'],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
