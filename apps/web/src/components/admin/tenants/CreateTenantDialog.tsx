'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';
import { useAuditTracking } from '@/lib/hooks/useAuditTracking';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, User, Mail, Key, Copy, CheckCircle, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required').max(255, 'Name too long'),
  slug: z.string()
    .min(1, 'Tenant slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), 'Slug cannot start or end with hyphen'),
  domain: z.string()
    .optional()
    .refine((domain) => !domain || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain), 'Invalid domain format'),
  description: z.string().optional(),
  adminFirstName: z.string().min(1, 'Admin first name is required').max(255, 'Name too long'),
  adminLastName: z.string().min(1, 'Admin last name is required').max(255, 'Name too long'),
  adminEmail: z.string()
    .optional()
    .refine((email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Invalid email format'),
});

type CreateTenantForm = z.infer<typeof createTenantSchema>;

interface CreateTenantResponse {
  tenant: {
    id: number;
    name: string;
    domain: string;
    slug: string;
  };
  adminCredentials: {
    email: string;
    password: string;
  };
  message: string;
}

// API function
async function createTenant(data: CreateTenantForm): Promise<CreateTenantResponse> {
  const requestBody = {
    name: data.name,
    slug: data.slug,
    domain: data.domain,
    description: data.description,
    adminUser: {
      firstName: data.adminFirstName,
      lastName: data.adminLastName,
      email: data.adminEmail
    }
  };

  const response = await fetch('/api/v1/admin/tenants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to create tenant');
  }

  return result.data;
}

interface CreateTenantDialogProps {
  children?: React.ReactNode;
}

export function CreateTenantDialog({ children }: CreateTenantDialogProps) {
  const t = useTranslations('admin-tenants');
  const [open, setOpen] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [createdTenant, setCreatedTenant] = React.useState<CreateTenantResponse | null>(null);
  const queryClient = useQueryClient();
  const { trackActivity } = useAuditTracking();
  const { toast } = useToast();

  const form = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
      description: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
    },
  });

  // Watch form values for preview
  const watchedSlug = form.watch('slug');
  const watchedAdminFirstName = form.watch('adminFirstName');
  const watchedAdminLastName = form.watch('adminLastName');
  const watchedAdminEmail = form.watch('adminEmail');

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: (data) => {
      browserLogger.info('Tenant created successfully', {
        tenantId: data.tenant.id,
        tenantName: data.tenant.name,
        adminEmail: data.adminCredentials.email
      });

      trackActivity({
        action: 'form_submission',
        component: 'tenant-creation',
        metadata: {
          tenantId: data.tenant.id,
          tenantName: data.tenant.name,
          success: true
        }
      });

      // Invalidate tenant queries
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      
      setCreatedTenant(data);
      setShowSuccess(true);
      form.reset();

      toast({
        title: t('create.toast.createSuccess'),
        description: t('create.toast.createSuccessDescription').replace('{email}', data.adminCredentials.email)
      });
    },
    onError: (error) => {
      browserLogger.error('Failed to create tenant', {
        error: error.message,
        formData: form.getValues()
      });

      trackActivity({
        action: 'form_submission',
        component: 'tenant-creation',
        metadata: {
          success: false,
          error: error.message
        }
      });

      toast({
        title: t('create.toast.createError'),
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const onSubmit = (data: CreateTenantForm) => {
    browserLogger.info('Creating tenant', { formData: data });
    createMutation.mutate(data);
  };

  const handleSlugChange = (value: string) => {
    // Auto-generate slug from name if slug is empty
    if (!form.getValues('slug') && form.getValues('name')) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      form.setValue('slug', autoSlug);
    }
  };

  const copyCredentials = async () => {
    if (!createdTenant) return;
    
    const credentials = `Email: ${createdTenant.adminCredentials.email}\nPassword: ${createdTenant.adminCredentials.password}`;
    
    try {
      await navigator.clipboard.writeText(credentials);
      toast({
        title: 'Credentials copied to clipboard'
      });
    } catch (error) {
      toast({
        title: 'Failed to copy credentials',
        variant: 'destructive'
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setShowSuccess(false);
    setCreatedTenant(null);
    form.reset({
      name: '',
      slug: '',
      domain: '',
      description: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t('actions.createNew')}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('create.title')}
            </DialogTitle>
            <DialogDescription>
              {t('create.description')}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Tenant Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('create.tenantInfo.title')}</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('create.form.name')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('create.form.namePlaceholder')}
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleSlugChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('create.form.nameDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('create.form.slug')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('create.form.slugPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('create.form.slugDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('create.form.domain')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('create.form.domainPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('create.form.domainDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('create.form.description')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('create.form.descriptionPlaceholder')}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('create.form.descriptionDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Admin User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('create.adminInfo.title')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adminFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('create.adminInfo.firstName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('create.adminInfo.firstNamePlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('create.adminInfo.firstNameDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('create.adminInfo.lastName')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('create.adminInfo.lastNamePlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('create.adminInfo.lastNameDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('create.adminInfo.email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('create.adminInfo.emailPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('create.adminInfo.emailDescription').replace('{slug}', watchedSlug || 'your-slug')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Admin User Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('create.adminInfo.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('create.adminInfo.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{t('create.adminInfo.email')}</span>
                      </div>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {watchedAdminEmail || (watchedSlug ? `${watchedSlug}-admin@mono.com` : t('create.adminInfo.emailFormat'))}
                      </code>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{t('create.adminInfo.password')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('create.adminInfo.passwordNote')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-medium">{t('create.adminInfo.adminName')}</span>
                    <p className="text-sm text-muted-foreground">
                      {watchedAdminFirstName || watchedAdminLastName 
                        ? `${watchedAdminFirstName || t('create.adminInfo.defaultFirstName')} ${watchedAdminLastName || t('create.adminInfo.defaultLastName')}`
                        : t('create.adminInfo.defaultFullName')
                      }
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-medium">{t('create.adminInfo.permissions')}</span>
                    <p className="text-sm text-muted-foreground">
                      {t('create.adminInfo.permissionsList')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={createMutation.isPending}
                >
                  {t('create.buttons.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? t('create.buttons.creating') : t('create.buttons.create')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t('create.success.title')}
            </DialogTitle>
            <DialogDescription>
              {t('create.success.message')}
            </DialogDescription>
          </DialogHeader>

          {createdTenant && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('create.success.adminCredentials')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium text-sm">{t('create.adminInfo.adminName')}</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {createdTenant.adminUser.firstName} {createdTenant.adminUser.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-sm">{t('create.success.emailLabel')}</span>
                    <code className="block text-sm bg-muted px-2 py-1 rounded mt-1">
                      {createdTenant.adminCredentials.email}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium text-sm">{t('create.success.passwordLabel')}</span>
                    <code className="block text-sm bg-muted px-2 py-1 rounded mt-1">
                      {createdTenant.adminCredentials.password}
                    </code>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCredentials}
                    className="w-full"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {t('create.success.copyCredentials')}
                  </Button>
                </CardContent>
              </Card>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {t('create.success.securityNote')}
                </AlertDescription>
              </Alert>

              <Button onClick={handleClose} className="w-full">
                {t('create.success.close')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 