// Client-side auth configuration
export const authConfig = {
  baseUrl: typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  basePath: '/api/auth',
};