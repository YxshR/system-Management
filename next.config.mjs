/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  // Optimize for production deployment
  output: 'standalone',
  poweredByHeader: false,
  // Enable compression
  compress: true,
  // Optimize images
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif']
  },
  // Environment variables validation
  env: {
    DATABASE_URL: process.env.DATABASE_URL
  }
};

export default nextConfig;
