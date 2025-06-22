/** @type {import('next').NextConfig} */
import withBundleAnalyzer from '@next/bundle-analyzer'

// Initialize bundle analyzer with environment variable control
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/onboarding',
        destination: 'http://localhost:5000/public/index.html',
      },
      {
        source: '/api/onboarding/:path*',
        destination: 'http://localhost:5000/api/onboarding/:path*',
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  experimental: {
    optimizeCss: {
      inlineThreshold: 2,
      minify: true,
      fonts: true
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
      };
      
      config.optimization.moduleIds = 'deterministic';
    }
    
    return config;
  },
}

// Apply bundle analyzer wrapper
export default bundleAnalyzer(nextConfig) 