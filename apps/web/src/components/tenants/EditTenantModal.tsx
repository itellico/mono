'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Building, Mail, Phone, Globe, MapPin, CreditCard, Users, X, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: any | null;
  onSuccess?: (tenant: any) => void;
}

interface TenantFormData {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'pending';
  maxUsers: number;
  features: string[];
  isActive: boolean;
}

const availableFeatures = [
  'Advanced Analytics',
  'Custom Branding',
  'API Access',
  'Priority Support',
  'White-label Solution',
  'Custom Integrations',
  'Advanced Security',
  'Dedicated Account Manager'
];

const planLimits = {
  free: { maxUsers: 10, features: ['Basic Analytics', 'Standard Support'] },
  pro: { maxUsers: 100, features: ['Advanced Analytics', 'Priority Support', 'API Access'] },
  enterprise: { maxUsers: 1000, features: ['All Features', 'Dedicated Support', 'Custom Integrations'] }
};

export function EditTenantModal({ open, onOpenChange, tenant, onSuccess }: EditTenantModalProps) {
  const [formData, setFormData] = useState<TenantFormData | null>(null);
  const [originalData, setOriginalData] = useState<TenantFormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when tenant changes
  useEffect(() => {
    if (tenant && open) {
      const initialData: TenantFormData = {
        id: tenant.id || '',
        name: tenant.name || '',
        slug: tenant.slug || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        website: tenant.website || '',
        description: tenant.description || '',
        address: {
          street: tenant.address?.street || '',
          city: tenant.address?.city || '',
          state: tenant.address?.state || '',
          zipCode: tenant.address?.zipCode || '',
          country: tenant.address?.country || 'United States'
        },
        plan: tenant.plan || 'free',
        status: tenant.status || 'pending',
        maxUsers: tenant.maxUsers || 10,
        features: tenant.features || [],
        isActive: tenant.isActive !== false
      };
      setFormData(initialData);
      setOriginalData(JSON.parse(JSON.stringify(initialData)));
      setHasChanges(false);
    }
  }, [tenant, open]);

  // Check for changes
  useEffect(() => {
    if (formData && originalData) {
      const hasChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(hasChanged);
    }
  }, [formData, originalData]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    if (!formData) return;
    setFormData(prev => prev ? ({
      ...prev,
      name,
      slug: generateSlug(name)
    }) : null);
  };

  const handlePlanChange = (plan: 'free' | 'pro' | 'enterprise') => {
    if (!formData) return;
    const limits = planLimits[plan];
    setFormData(prev => prev ? ({
      ...prev,
      plan,
      maxUsers: limits.maxUsers,
      features: limits.features
    }) : null);
  };

  const toggleFeature = (feature: string) => {
    if (!formData) return;
    setFormData(prev => prev ? ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }) : null);
  };

  const validateForm = (): boolean => {
    if (!formData) return false;
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Tenant name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.address.city.trim()) newErrors.city = 'City is required';
    if (!formData.address.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData || !validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedTenant = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      onSuccess?.(updatedTenant);
      onOpenChange(false);
      setErrors({});
    } catch (error) {
      console.error('Failed to update tenant:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setErrors({});
  };

  const handleReset = () => {
    if (originalData) {
      setFormData(JSON.parse(JSON.stringify(originalData)));
      setErrors({});
    }
  };

  if (!formData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Edit Tenant: {formData.name}
          </DialogTitle>
        </DialogHeader>

        {hasChanges && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Make sure to save before closing.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tenant Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter tenant name"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, slug: e.target.value }) : null)}
                placeholder="tenant-slug"
              />
              {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                  placeholder="contact@tenant.com"
                  className="pl-10"
                />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => prev ? ({ ...prev, website: e.target.value }) : null)}
                  placeholder="https://www.tenant.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData(prev => prev ? ({ ...prev, status: value }) : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
              placeholder="Brief description of the tenant..."
              rows={3}
            />
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => setFormData(prev => prev ? ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }) : null)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => setFormData(prev => prev ? ({ 
                    ...prev, 
                    address: { ...prev.address, city: e.target.value }
                  }) : null)}
                  placeholder="New York"
                />
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => setFormData(prev => prev ? ({ 
                    ...prev, 
                    address: { ...prev.address, state: e.target.value }
                  }) : null)}
                  placeholder="NY"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => setFormData(prev => prev ? ({ 
                    ...prev, 
                    address: { ...prev.address, zipCode: e.target.value }
                  }) : null)}
                  placeholder="10001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Select 
                  value={formData.address.country} 
                  onValueChange={(value) => setFormData(prev => prev ? ({ 
                    ...prev, 
                    address: { ...prev.address, country: value }
                  }) : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
              </div>
            </div>
          </div>

          {/* Plan & Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plan & Features
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select value={formData.plan} onValueChange={handlePlanChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free Plan</SelectItem>
                    <SelectItem value="pro">Pro Plan</SelectItem>
                    <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="maxUsers"
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData(prev => prev ? ({ ...prev, maxUsers: parseInt(e.target.value) || 0 }) : null)}
                    className="pl-10"
                    min="1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex flex-wrap gap-2">
                {availableFeatures.map((feature) => (
                  <Badge
                    key={feature}
                    variant={formData.features.includes(feature) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFeature(feature)}
                  >
                    {feature}
                    {formData.features.includes(feature) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => prev ? ({ ...prev, isActive: checked }) : null)}
              />
              <Label htmlFor="isActive">Active Tenant</Label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex space-x-2">
              {hasChanges && (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset Changes
                </Button>
              )}
            </div>
            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !hasChanges}>
                {isSubmitting ? 'Updating...' : 'Update Tenant'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 