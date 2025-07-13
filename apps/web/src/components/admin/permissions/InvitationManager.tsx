'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Users,
  Shield,
  Star,
  Crown,
  AlertTriangle,
  Eye,
  RefreshCw,
  Copy,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { browserLogger } from '@/lib/browser-logger';

/**
 * InvitationManager Component
 * 
 * Comprehensive cross-tenant invitation management with role assignment,
 * status tracking, and bulk operations.
 * 
 * @component InvitationManager
 * @param {InvitationManagerProps} props - Component props
 * @returns {JSX.Element} Invitation management interface
 * 
 * @example
 * ```tsx
 * <InvitationManager
 *   tenantId="tenant-123"
 *   onInvitationSent={(invitation) => handleInvitationUpdate(invitation)}
 *   currentUserRole="tenant_admin"
 * />
 * ```
 */

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  message?: string;
  tenantId: string;
  tenantName: string;
  inviteCode: string;
  permissions: string[];
}

export interface InvitationFormData {
  emails: string[];
  role: string;
  message: string;
  expiresIn: number; // days
  permissions: string[];
}

export interface InvitationManagerProps {
  /** Current tenant ID */
  tenantId: string;
  /** Current user role */
  currentUserRole: string;
  /** Invitation sent handler */
  onInvitationSent?: (invitation: Invitation) => void;
  /** Invitation updated handler */
  onInvitationUpdated?: (invitation: Invitation) => void;
  /** Additional CSS classes */
  className?: string;
  /** Show cross-tenant invitations */
  showCrossTenant?: boolean;
}

// Mock invitation data
const MOCK_INVITATIONS: Invitation[] = [
  {
    id: 'inv-1',
    email: 'sarah.johnson@example.com',
    role: 'content_moderator',
    status: 'pending',
    invitedBy: 'Admin User',
    invitedAt: '2025-01-15T10:00:00Z',
    expiresAt: '2025-02-14T10:00:00Z',
    message: 'Welcome to our talent platform! You\'ve been invited as a Content Moderator.',
    tenantId: 'tenant-123',
    tenantName: 'Talent Agency Inc',
    inviteCode: 'TA-CM-789',
    permissions: ['profiles.moderate', 'reports.review']
  },
  {
    id: 'inv-2',
    email: 'mike.wilson@photographer.com',
    role: 'account_owner',
    status: 'accepted',
    invitedBy: 'Admin User',
    invitedAt: '2025-01-10T14:30:00Z',
    expiresAt: '2025-02-09T14:30:00Z',
    acceptedAt: '2025-01-11T09:15:00Z',
    message: 'Join us to manage your talent accounts.',
    tenantId: 'tenant-123',
    tenantName: 'Talent Agency Inc',
    inviteCode: 'TA-AO-456',
    permissions: ['accounts.manage.own', 'profiles.manage.own']
  },
  {
    id: 'inv-3',
    email: 'expired@example.com',
    role: 'user',
    status: 'expired',
    invitedBy: 'Admin User',
    invitedAt: '2024-12-15T16:00:00Z',
    expiresAt: '2025-01-14T16:00:00Z',
    message: 'Basic platform access invitation.',
    tenantId: 'tenant-123',
    tenantName: 'Talent Agency Inc',
    inviteCode: 'TA-US-123',
    permissions: ['profiles.view.own']
  }
];

// Available roles for invitations
const AVAILABLE_ROLES = [
  {
    id: 'content_moderator',
    name: 'Content Moderator',
    description: 'Review and moderate content',
    icon: Eye,
    color: 'bg-blue-100 text-blue-700',
    permissions: ['profiles.moderate', 'reports.review']
  },
  {
    id: 'account_owner',
    name: 'Account Owner',
    description: 'Manage talent accounts',
    icon: Star,
    color: 'bg-green-100 text-green-700',
    permissions: ['accounts.manage.own', 'profiles.manage.own']
  },
  {
    id: 'user',
    name: 'User',
    description: 'Basic platform access',
    icon: Users,
    color: 'bg-gray-100 text-gray-700',
    permissions: ['profiles.view.own']
  }
];

export function InvitationManager({
  tenantId,
  currentUserRole,
  onInvitationSent,
  onInvitationUpdated,
  className,
  showCrossTenant = false
}: InvitationManagerProps) {
  
  const [invitations, setInvitations] = useState<Invitation[]>(MOCK_INVITATIONS);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [formData, setFormData] = useState<InvitationFormData>({
    emails: [],
    role: 'user',
    message: '',
    expiresIn: 30,
    permissions: []
  });
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle email input
  const handleEmailAdd = () => {
    const emails = emailInput.split(',').map(e => e.trim()).filter(e => e);
    const validEmails = emails.filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    
    if (validEmails.length > 0) {
      setFormData(prev => ({
        ...prev,
        emails: [...new Set([...prev.emails, ...validEmails])]
      }));
      setEmailInput('');
    }
  };

  // Remove email from list
  const removeEmail = (email: string) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.filter(e => e !== email)
    }));
  };

  // Handle role selection
  const handleRoleChange = (roleId: string) => {
    const role = AVAILABLE_ROLES.find(r => r.id === roleId);
    setFormData(prev => ({
      ...prev,
      role: roleId,
      permissions: role?.permissions || []
    }));
  };

  // Submit invitation
  const handleSubmitInvitation = async () => {
    if (formData.emails.length === 0) return;

    setIsSubmitting(true);
    
    browserLogger.userAction('invitation_sent', 'InvitationManager', {
      tenantId,
      role: formData.role,
      recipientCount: formData.emails.length,
      currentUserRole
    });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new invitations
      const newInvitations = formData.emails.map(email => ({
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        role: formData.role,
        status: 'pending' as const,
        invitedBy: 'Current User',
        invitedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + formData.expiresIn * 24 * 60 * 60 * 1000).toISOString(),
        message: formData.message,
        tenantId,
        tenantName: 'Current Tenant',
        inviteCode: `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        permissions: formData.permissions
      }));

      setInvitations(prev => [...newInvitations, ...prev]);
      
      // Reset form
      setFormData({
        emails: [],
        role: 'user',
        message: '',
        expiresIn: 30,
        permissions: []
      });
      setShowInviteForm(false);
      
      // Notify parent
      newInvitations.forEach(invitation => {
        onInvitationSent?.(invitation);
      });
      
    } catch (error) {
      console.error('Failed to send invitations:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel invitation
  const handleCancelInvitation = (invitationId: string) => {
    browserLogger.userAction('invitation_cancelled', 'InvitationManager', {
      invitationId,
      tenantId
    });

    setInvitations(prev => 
      prev.map(inv => 
        inv.id === invitationId 
          ? { ...inv, status: 'cancelled' as const }
          : inv
      )
    );
  };

  // Resend invitation
  const handleResendInvitation = (invitationId: string) => {
    browserLogger.userAction('invitation_resent', 'InvitationManager', {
      invitationId,
      tenantId
    });

    setInvitations(prev => 
      prev.map(inv => 
        inv.id === invitationId 
          ? { 
              ...inv, 
              status: 'pending' as const,
              invitedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          : inv
      )
    );
  };

  // Copy invitation link
  const copyInvitationLink = (invitation: Invitation) => {
    const link = `${window.location.origin}/invite/${invitation.inviteCode}`;
    navigator.clipboard.writeText(link);
    
    browserLogger.userAction('invitation_link_copied', 'InvitationManager', {
      invitationId: invitation.id,
      tenantId
    });
  };

  // Filter invitations
  const filteredInvitations = invitations.filter(invitation => {
    if (selectedStatus !== 'all' && invitation.status !== selectedStatus) return false;
    return true;
  });

  // Get status styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'pending':
        return { class: 'bg-yellow-100 text-yellow-700', icon: Clock };
      case 'accepted':
        return { class: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 'declined':
        return { class: 'bg-red-100 text-red-700', icon: XCircle };
      case 'expired':
        return { class: 'bg-gray-100 text-gray-700', icon: Calendar };
      case 'cancelled':
        return { class: 'bg-red-100 text-red-700', icon: XCircle };
      default:
        return { class: 'bg-gray-100 text-gray-700', icon: Clock };
    }
  };

  // Get role info
  const getRoleInfo = (roleId: string) => {
    return AVAILABLE_ROLES.find(r => r.id === roleId) || {
      name: roleId,
      color: 'bg-gray-100 text-gray-700',
      icon: Users
    };
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invitation Management</h3>
          <p className="text-sm text-gray-600">
            Manage user invitations and cross-tenant access
          </p>
        </div>
        <Button onClick={() => setShowInviteForm(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Send Invitation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { status: 'pending', count: invitations.filter(i => i.status === 'pending').length, icon: Clock, color: 'text-yellow-600' },
          { status: 'accepted', count: invitations.filter(i => i.status === 'accepted').length, icon: CheckCircle, color: 'text-green-600' },
          { status: 'expired', count: invitations.filter(i => i.status === 'expired').length, icon: Calendar, color: 'text-gray-600' },
          { status: 'total', count: invitations.length, icon: Mail, color: 'text-blue-600' }
        ].map(stat => {
          const StatIcon = stat.icon;
          return (
            <Card key={stat.status}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <StatIcon className={cn('h-5 w-5', stat.color)} />
                  <div>
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {stat.status === 'total' ? 'Total' : stat.status}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Invitation Form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Send New Invitation</CardTitle>
            <CardDescription>
              Invite users to join your tenant with specific roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Addresses</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter email addresses (comma separated)"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEmailAdd()}
                />
                <Button onClick={handleEmailAdd} variant="outline">
                  Add
                </Button>
              </div>
              
              {/* Email List */}
              {formData.emails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.emails.map(email => (
                    <Badge key={email} variant="outline" className="px-3 py-1">
                      {email}
                      <button
                        onClick={() => removeEmail(email)}
                        className="ml-2 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {AVAILABLE_ROLES.map(role => {
                  const RoleIcon = role.icon;
                  const isSelected = formData.role === role.id;
                  
                  return (
                    <div
                      key={role.id}
                      className={cn(
                        'p-3 border rounded-lg cursor-pointer transition-colors',
                        isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => handleRoleChange(role.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn('p-2 rounded', role.color)}>
                          <RoleIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-xs text-gray-600">{role.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Welcome Message (Optional)</label>
              <Textarea
                placeholder="Add a personal message to the invitation..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Expiration */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Expires In (Days)</label>
              <Input
                type="number"
                min="1"
                max="365"
                value={formData.expiresIn}
                onChange={(e) => setFormData(prev => ({ ...prev, expiresIn: parseInt(e.target.value) || 30 }))}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button 
                onClick={handleSubmitInvitation}
                disabled={formData.emails.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send {formData.emails.length > 0 && `(${formData.emails.length})`}
              </Button>
              <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invitations</CardTitle>
          <CardDescription>
            {filteredInvitations.length} invitation{filteredInvitations.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvitations.length > 0 ? (
            <div className="space-y-4">
              {filteredInvitations.map(invitation => {
                const statusInfo = getStatusStyling(invitation.status);
                const StatusIcon = statusInfo.icon;
                const roleInfo = getRoleInfo(invitation.role);
                const RoleIcon = roleInfo.icon;

                return (
                  <div key={invitation.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{invitation.email}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={roleInfo.color}>
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {roleInfo.name}
                              </Badge>
                              <Badge className={statusInfo.class}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {invitation.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {invitation.inviteCode}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-sm text-gray-600">
                          <div>Invited by {invitation.invitedBy} • {new Date(invitation.invitedAt).toLocaleDateString()}</div>
                          <div>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</div>
                          {invitation.message && (
                            <div className="mt-1 italic">&quot;{invitation.message}&quot;</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {invitation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInvitationLink(invitation)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendInvitation(invitation.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelInvitation(invitation.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {(invitation.status === 'expired' || invitation.status === 'declined') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendInvitation(invitation.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="h-8 w-8 mx-auto mb-2" />
              <p>No invitations found</p>
              <p className="text-sm">Send your first invitation to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 