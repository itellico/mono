import { Suspense } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PersonalInfoSection } from '@/components/admin/preferences/PersonalInfoSection';
import { LocalizationSection } from '@/components/admin/preferences/LocalizationSection';
import { NotificationSection } from '@/components/admin/preferences/NotificationSection';
import { SecuritySection } from '@/components/admin/preferences/SecuritySection';
import { ThemeSection } from '@/components/admin/preferences/ThemeSection';
import { User, Globe, Bell, Shield, Palette } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Preferences',
  description: 'Manage your admin account preferences and settings',
};

/**
 * Loading skeleton for preference sections
 */
function PreferenceSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </CardContent>
    </Card>
  );
}

/**
 * Admin Preferences Page
 * 
 * A clean, focused page component that organizes preference sections
 * into tabs for better user experience. Uses Suspense boundaries for 
 * optimal loading states and follows React 19 patterns.
 * 
 * Note: This is a server component for optimal performance. Page access
 * logging is handled by individual client components.
 */
export default function AdminPreferencesPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Account Preferences
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings, preferences, and security options.
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="localization" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Localization
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Suspense fallback={<PreferenceSectionSkeleton />}>
            <PersonalInfoSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="localization" className="space-y-6">
          <Suspense fallback={<PreferenceSectionSkeleton />}>
            <LocalizationSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <Suspense fallback={<PreferenceSectionSkeleton />}>
            <ThemeSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Suspense fallback={<PreferenceSectionSkeleton />}>
            <NotificationSection />
          </Suspense>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Suspense fallback={<PreferenceSectionSkeleton />}>
            <SecuritySection />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}