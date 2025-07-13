import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from network IP addresses during development
  allowedDevOrigins: ['192.168.178.94', 'app.mono', 'mono.mono'],
  
  // Temporarily disable TypeScript checks during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Proxy API requests to Fastify server
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*'
      }
    ];
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("handlebars");
    }
    
    // Server-side only modules should not be bundled for client
    if (!isServer) {
      // Completely exclude redis and related modules from client bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        // Redis modules
        'redis': false,
        '@redis/client': false,
        
        // Node.js core modules
        'net': false,
        'tls': false,
        'dns': false,
        'fs': false,
        'path': false,
        'crypto': false,
        
        // Next.js server-only modules
        'next/headers': false,
        'next/cookies': false,
      };
    }
    
    return config;
  },
  
  // Additional experimental features for better error handling
  serverExternalPackages: [
    'redis',
    '@redis/client',
    'mongodb',
    'mysql2',
    'pg',
    'sqlite3',
    'better-sqlite3'
  ],
};

export default nextConfig;