# Manual Login Test Guide

This guide will help you test the login flow and identify which admin pages are working vs broken.

## Prerequisites

1. Make sure both servers are running:
   ```bash
   # Terminal 1: API Server
   cd apps/api && pnpm run dev
   
   # Terminal 2: Frontend
   pnpm run dev
   ```

2. Open browser dev tools (F12) to monitor network requests and console errors

## Step 1: Login Test

1. Navigate to: http://localhost:3000/auth/signin
2. Fill in the form:
   - Email: `1@1.com`
   - Password: `Admin123!`
3. Click "Sign In"
4. **Expected**: Should redirect to `/admin` or dashboard
5. **Watch for**: Console errors, network failures, or redirect issues

## Step 2: Admin Navigation Test

If login succeeds, test each admin page by clicking through the sidebar:

### Core Admin Pages to Test

1. **Dashboard** - `/admin`
   - Should show admin dashboard
   - Look for: Loading states, data display, errors

2. **Tenants** - `/admin/tenants`
   - Should show tenant list
   - Look for: Data loading, table display, search functionality

3. **Categories** - `/admin/categories`
   - Should show category management
   - Look for: CRUD operations, bulk actions

4. **Tags** - `/admin/tags`
   - Should show tag management
   - Look for: Tag operations, filtering

5. **Permissions** - `/admin/permissions`
   - Should show permission management
   - Look for: Role assignments, permission checks

6. **Settings** - `/admin/settings`
   - Should show platform settings
   - Look for: Configuration options, save functionality

7. **Monitoring** - `/admin/monitoring`
   - Should show system metrics
   - Look for: Charts, real-time data

## Step 3: Error Documentation

For each page that fails, document:

1. **URL** - Which page failed
2. **Error Type** - Console error, network error, or UI issue
3. **Error Message** - Exact error text
4. **Screenshot** - If helpful for context

## Step 4: Permission Issues

If certain pages show "Access Denied" or permission errors:

1. This indicates the user (1@1.com) lacks proper roles/permissions
2. We saw in the API response that user has: `"roles":[],"permissions":[]`
3. This suggests missing role assignments in the database

## Common Issues to Watch For

### 1. Authentication Problems
- Login redirects to `/auth/signin` immediately
- "Not authenticated" errors
- Session/cookie issues

### 2. Permission Errors
- "Access Denied" messages
- Empty pages due to missing permissions
- 403 errors in network tab

### 3. API Connection Issues
- Network errors to `localhost:3001`
- CORS errors
- 500 server errors

### 4. Frontend Issues
- React component errors
- Hydration mismatches
- UI rendering problems

## Detailed Network Monitoring

In Dev Tools Network tab, check for:

1. **Auth Requests**:
   - POST `/api/v1/public/auth/login` - Should return 200 with user data
   - GET `/api/v1/public/auth/me` - Should return current user

2. **Admin API Requests**:
   - Various `/api/v1/admin/*` calls
   - Check status codes (200 = success, 401 = auth, 403 = permissions, 500 = server error)

3. **Cookie Handling**:
   - `accessToken` and `refreshToken` cookies should be set after login
   - Check if cookies are being sent with requests

## Expected Findings

Based on the code analysis, I expect:

1. **Login will work** - API endpoint returns success
2. **User has no permissions** - Empty roles/permissions arrays
3. **Admin pages may show permission errors** - Due to missing roles
4. **Some pages may have other technical issues** - Need to identify which ones

Please run through this test and report back with:
- Which pages work correctly
- Which pages show errors (with error details)
- Any authentication/redirect issues
- Screenshots of significant errors

This will help us prioritize fixes and understand the current state of the admin system.