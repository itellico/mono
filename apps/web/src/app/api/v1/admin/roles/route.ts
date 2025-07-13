/**
 * @fileoverview Roles API Route - Proxy to NestJS API
 * 
 * ✅ ARCHITECTURE COMPLIANCE: This route now proxies to NestJS API
 * All business logic, permissions, and database access are handled by NestJS
 * 
 * @author itellico Mono Team
 * @version 2.0.0
 */

import { NextRequest } from 'next/server';
import { proxyGET, proxyPOST } from '@/lib/api-proxy';

/**
 * GET /api/v1/admin/roles
 * Proxy to NestJS GET /api/v1/admin/roles
 */
export async function GET(request: NextRequest) {
  return proxyGET(request);
}

/**
 * POST /api/v1/admin/roles
 * Proxy to NestJS POST /api/v1/admin/roles
 */
export async function POST(request: NextRequest) {
  return proxyPOST(request);
}