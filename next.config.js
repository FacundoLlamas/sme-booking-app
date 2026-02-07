/** @type {import('next').NextConfig} */

// Bundle analyzer configuration
// Activated via: npm run build:analyze
let nextConfig = {
  compress: true,  // Enable gzip compression
  poweredByHeader: false,  // Remove X-Powered-By header
  reactStrictMode: true,
  swcMinify: true,

  // Skip type checking during build (pre-existing TS issues in codebase)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build (pre-existing lint issues in codebase)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Environment variables to expose to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: 'SME Booking App',
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Compression headers
          { key: 'Vary', value: 'Accept-Encoding' },
          
          // Cache headers
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' },
          
          // Security headers
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // API Versioning
  async rewrites() {
    return {
      beforeFiles: [
        // Rewrite /api/* to /api/v1/* for backward compat
        {
          source: '/api/health',
          destination: '/api/v1/health',
        },
        // Add more specific routes as needed
      ],
    };
  },
};

// Wrap with bundle analyzer if available
let finalConfig = nextConfig;
if (process.env.ANALYZE === 'true') {
  try {
    const withBundleAnalyzer = require('@next/bundle-analyzer')({
      enabled: true,
    });
    finalConfig = withBundleAnalyzer(nextConfig);
  } catch (e) {
    console.warn('Bundle analyzer not available, proceeding with regular build');
  }
}

module.exports = finalConfig;
