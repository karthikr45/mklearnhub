/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@learnhub/types', '@learnhub/utils'],
  eslint: { ignoreDuringBuilds: true },
}
export default nextConfig
