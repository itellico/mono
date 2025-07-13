"use client";

import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Full screen banner */}
      <div className="hidden lg:flex lg:w-1/3 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/mono.jpg)' }}
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex items-end p-12">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">itellico Mono</h1>
            <p className="text-lg opacity-90">Multi-tenant SaaS Platform</p>
          </div>
        </div>
      </div>

      {/* Right side - Content */}
      <div className="flex-1 lg:w-2/3 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-muted">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile header - only shown on small screens */}
          <div className="text-center lg:hidden">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
              itellico Mono
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Multi-tenant SaaS Platform
            </p>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}