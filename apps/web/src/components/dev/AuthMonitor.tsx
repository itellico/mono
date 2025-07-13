'use client';

import { useEffect, useRef, memo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface AuthCall {
  timestamp: string;
  source: string;
  type: string;
  stackTrace?: string;
}

export const AuthMonitor = memo(function AuthMonitor() {
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const callsRef = useRef<AuthCall[]>([]);
  const renderCountRef = useRef(0);
  
  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only render in development and after mounting
  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Increment render count on mount and when auth state changes
  useEffect(() => {
    renderCountRef.current++;
    
    // Log component render
    const call: AuthCall = {
      timestamp: new Date().toISOString(),
      source: 'AuthMonitor',
      type: `Render #${renderCountRef.current}`,
      stackTrace: new Error().stack,
    };
    
    callsRef.current.push(call);
    
    // Log to console with formatting
    console.group(`[AuthMonitor] Render #${renderCountRef.current}`);
    console.log('Loading:', loading);
    console.log('User:', user?.email || 'null');
    console.log('Total auth-related renders:', renderCountRef.current);
    console.log('Stack trace:', call.stackTrace);
    console.groupEnd();
  }, [loading, user?.email]); // Only run when auth state actually changes

  // Monitor actual network requests
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url] = args;
      
      if (typeof url === 'string' && url.includes('/api/v1/auth/me')) {
        const call: AuthCall = {
          timestamp: new Date().toISOString(),
          source: 'Network',
          type: 'Fetch /api/v1/auth/me',
          stackTrace: new Error().stack,
        };
        
        callsRef.current.push(call);
        
        console.group('[AuthMonitor] Network Request');
        console.log('URL:', url);
        console.log('Stack trace:', call.stackTrace);
        console.groupEnd();
      }
      
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);


  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '300px',
        zIndex: 9999,
      }}
    >
      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Auth Monitor</div>
      <div>Renders: {renderCountRef.current}</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user?.email || 'None'}</div>
      <div>API Calls: {callsRef.current.filter(c => c.source === 'Network').length}</div>
      <details style={{ marginTop: '5px' }}>
        <summary style={{ cursor: 'pointer' }}>Call History</summary>
        <div style={{ maxHeight: '200px', overflow: 'auto', marginTop: '5px' }}>
          {callsRef.current.map((call, i) => (
            <div key={i} style={{ marginBottom: '5px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
              <div>{call.timestamp.split('T')[1]}</div>
              <div>{call.source}: {call.type}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
});