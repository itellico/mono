'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package, Settings, DollarSign, Users } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const stats = [
  {
    title: 'Active Plans',
    value: '12',
    description: 'Currently active subscription plans',
    icon: Package,
  },
  {
    title: 'Feature Sets',
    value: '8',
    description: 'Configured feature combinations',
    icon: Settings,
  },
  {
    title: 'Monthly Revenue',
    value: '$45,231',
    description: 'From all subscriptions',
    icon: DollarSign,
  },
  {
    title: 'Subscribers',
    value: '1,429',
    description: 'Active paying customers',
    icon: Users,
  },
];

export default function PlansPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/platform">Platform</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Plans</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage platform subscription plans and pricing</p>
        </div>
        <Button asChild>
          <Link href="/platform/plans/new">
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Feature Set Builder</CardTitle>
            <CardDescription>Create and manage feature combinations for plans</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/platform/plans/feature-set-builder">
                <Settings className="mr-2 h-4 w-4" />
                Open Builder
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Templates</CardTitle>
            <CardDescription>Pre-configured plan templates for quick setup</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Package className="mr-2 h-4 w-4" />
              Browse Templates
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Calculator</CardTitle>
            <CardDescription>Calculate optimal pricing for your plans</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <DollarSign className="mr-2 h-4 w-4" />
              Open Calculator
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}