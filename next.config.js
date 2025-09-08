/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://above-fox-71.clerk.accounts.dev https://api.clerk.com https://challenges.cloudflare.com https://*.cloudflare.com https://*.challenges.cloudflare.com https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://above-fox-71.clerk.accounts.dev https://challenges.cloudflare.com https://*.cloudflare.com https://*.challenges.cloudflare.com",
              "img-src 'self' data: blob: https: http: https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://above-fox-71.clerk.accounts.dev",
              "font-src 'self' data: https://fonts.gstatic.com https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://above-fox-71.clerk.accounts.dev",
              "connect-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://above-fox-71.clerk.accounts.dev https://api.clerk.com https://api.anthropic.com https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://*.cloudflare.com https://*.challenges.cloudflare.com",
              "frame-src 'self' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://above-fox-71.clerk.accounts.dev https://challenges.cloudflare.com https://*.cloudflare.com https://*.challenges.cloudflare.com",
              "worker-src 'self' blob: https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://above-fox-71.clerk.accounts.dev",
              "child-src 'self' blob: https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://above-fox-71.clerk.accounts.dev",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'"
            ].join('; ')
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@anthropic-ai/sdk', '@supabase/supabase-js'],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Optimize for production
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Rewrites
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },
};

module.exports = nextConfig;
