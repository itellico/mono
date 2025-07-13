import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  // Allow cross-origin requests from network IP addresses during development
  allowedDevOrigins: ['192.168.178.94'],
  
  // Proxy API requests to Fastify server
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*'
      }
    ];
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
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
        // Redis modules (official client only)
        'redis': false,
        '@redis/client': false,
        '@redis/bloom': false,
        '@redis/graph': false,
        '@redis/json': false,
        '@redis/search': false,
        '@redis/time-series': false,
        
        // Node.js core modules
        'net': false,
        'tls': false,
        'dns': false,
        'fs': false,
        'path': false,
        'crypto': false,
        'stream': false,
        'util': false,
        'events': false,
        'buffer': false,
        'child_process': false,
        'worker_threads': false,
        'perf_hooks': false,
        'cluster': false,
        'os': false,
        'process': false,
        
        // Next.js server-only modules
        'next/headers': false,
        'next/cookies': false,
        
        // Additional database/cache modules
        'mongodb': false,
        'mysql2': false,
        'postgres': false,
        'pg': false,
        'sqlite3': false,
        'better-sqlite3': false,
        'memcached': false,
        'node-cache': false,
      };
      
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Core Node.js modules
        net: false,
        tls: false,
        dns: false,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        events: false,
        buffer: false,
        child_process: false,
        worker_threads: false,
        perf_hooks: false,
        cluster: false,
        os: false,
        process: false,
        
        // Next.js server-only modules
        'next/headers': false,
        'next/cookies': false,
        
        // Redis modules (official client only)
        redis: false,
        '@redis/client': false,
        
        // Database modules
        mongodb: false,
        mysql2: false,
        postgres: false,
        pg: false,
        sqlite3: false,
        'better-sqlite3': false,
        memcached: false,
        'node-cache': false,
      };

      // Exclude specific patterns from client-side bundling
      config.externals = [
        ...(config.externals || []),
        ({ request }: any, callback: any) => {
          if (request && (
            request.includes('redis') ||
            request.includes('@redis') ||
            request.includes('/lib/redis') ||
            request.includes('\\lib\\redis') ||
            request.includes('/services/') ||
            request.includes('\\services\\') ||
            request.includes('/lib/auth.ts') ||
            request.includes('\\lib\\auth.ts') ||
            request.endsWith('/lib/auth') ||
            request.endsWith('\\lib\\auth')
          )) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      ];
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

export default withNextIntl(nextConfig);