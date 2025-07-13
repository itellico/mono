'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Shield, Users, Settings, Database, Activity } from 'lucide-react';
import Link from 'next/link';

const platformSections = [
  {
    title: 'Plans & Pricing',
    description: 'Manage subscription plans and feature sets',
    icon: Package,
    href: '/platform/plans',
  },
  {
    title: 'Access Control',
    description: 'Roles, permissions, and security policies',
    icon: Shield,
    href: '/platform/access-control',
  },
  {
    title: 'User Management',
    description: 'Manage platform users and accounts',
    icon: Users,
    href: '/platform/users',
  },
  {
    title: 'System Settings',
    description: 'Configure platform-wide settings',
    icon: Settings,
    href: '/platform/settings',
  },
  {
    title: 'Data Management',
    description: 'Database operations and migrations',
    icon: Database,
    href: '/platform/data',
  },
  {
    title: 'Monitoring',
    description: 'System health and performance metrics',
    icon: Activity,
    href: '/platform/monitoring',
  },
];

export default function PlatformPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Administration</h1>
        <p className="text-muted-foreground">Manage platform-level settings and configurations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platformSections.map((section) => (
          <Card key={section.title} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={section.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}