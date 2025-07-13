'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LockStatus } from '@/components/ui/LockStatus';
import { useAuditTracking } from '@/hooks/useAuditTracking';
import { useLocking } from '@/hooks/useLocking';
import { usePageTracking } from '@/hooks/usePageTracking';
import { Save, Search, Eye, RotateCcw } from 'lucide-react';

interface ExampleUser {
  id: string;
  name: string;
  email: string;
  bio: string;
}

/**
 * Example component demonstrating the complete audit and locking system
 * 
 * This shows how to integrate:
 * - useAuditTracking for user activity logging
 * - useLocking for concurrent editing protection  
 * - usePageTracking for navigation tracking
 * - LockStatus for visual lock feedback
 * 
 * @component
 */
export const AuditSystemExample = () => {
  // Example user data
  const [user, setUser] = useState<ExampleUser>({
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Software developer with 5 years of experience...'
  });

  const [originalUser, setOriginalUser] = useState<ExampleUser>(user);
  const [searchQuery, setSearchQuery] = useState('');

  // 🔍 Audit Tracking Hook
  const { trackActivity, trackFieldChange, trackFormSubmit, trackSearch } = useAuditTracking({
    entityType: 'user',
    entityId: user.id,
    component: 'UserEditForm'
  });

  // 🔒 Locking Hook with auto-acquire
  const { lockStatus, acquireLock, releaseLock, forceUnlock } = useLocking({
    entityType: 'user',
    entityId: user.id,
    autoAcquire: true,
    ttlMinutes: 30,
    reason: 'Editing user profile',
    onLockAcquired: (lockInfo) => {
      console.log('Lock acquired:', lockInfo);
    },
    onLockFailed: (error) => {
      console.error('Lock failed:', error);
    }
  });

  // 📊 Page Tracking Hook (automatic)
  const { currentPath, timeOnCurrentPage, trackPageView } = usePageTracking({
    enabled: true,
    metadata: { source: 'audit_example' },
    onPageTracked: (pathname) => console.log('Page tracked:', pathname),
    onTrackingFailed: (error) => console.error('Tracking failed:', error)
  });

  // Field change handlers with audit tracking
  const handleNameChange = (newName: string) => {
    const oldName = user.name;
    setUser(prev => ({ ...prev, name: newName }));
    
    // Track field change
    trackFieldChange('name', oldName, newName, {
      fieldType: 'text',
      characterCount: newName.length
    });
  };

  const handleEmailChange = (newEmail: string) => {
    const oldEmail = user.email;
    setUser(prev => ({ ...prev, email: newEmail }));
    
    trackFieldChange('email', oldEmail, newEmail, {
      fieldType: 'email',
      isValidEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)
    });
  };

  const handleBioChange = (newBio: string) => {
    const oldBio = user.bio;
    setUser(prev => ({ ...prev, bio: newBio }));
    
    trackFieldChange('bio', oldBio, newBio, {
      fieldType: 'textarea',
      characterCount: newBio.length,
      wordCount: newBio.split(/\s+/).length
    });
  };

  // Form submission with audit tracking
  const handleSave = async () => {
    const formData = { name: user.name, email: user.email, bio: user.bio };
    const hasChanges = JSON.stringify(user) !== JSON.stringify(originalUser);
    
    if (!hasChanges) {
      trackActivity({ 
        action: 'form_submission', 
        metadata: { result: 'no_changes', formName: 'userEdit' }
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Track successful form submission
      await trackFormSubmit(formData);
      
      // Update original user state
      setOriginalUser(user);
      
      // Track save action
      trackActivity({ 
        action: 'click', 
        metadata: { 
          button: 'save', 
          result: 'success',
          hasChanges,
          changedFields: Object.keys(formData).filter(key => 
            (user as any)[key] !== (originalUser as any)[key]
          )
        }
      });

      console.log('User saved successfully');
      
    } catch (error) {
      trackActivity({ 
        action: 'form_submission', 
        metadata: { result: 'error', error: String(error) }
      });
    }
  };

  // Search with audit tracking
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length >= 2) {
      trackSearch(query, { source: 'user_search' }, 0);
    }
  };

  // Manual tracking examples
  const handleViewClick = () => {
    trackActivity({ 
      action: 'view', 
      metadata: { 
        viewType: 'user_profile',
        userId: user.id 
      }
    });
  };

  const handleResetForm = () => {
    setUser(originalUser);
    trackActivity({ 
      action: 'click', 
      metadata: { 
        button: 'reset',
        hadChanges: JSON.stringify(user) !== JSON.stringify(originalUser)
      }
    });
  };

  const isFormDisabled = lockStatus.isLocked && !lockStatus.lockInfo?.isOwnedByCurrentUser;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Audit & Locking System Example</CardTitle>
          <CardDescription>
            Demonstration of comprehensive user activity tracking, entity locking, and page navigation monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Current Page:</strong> {currentPath}
            </div>
            <div>
              <strong>Time on Page:</strong> {Math.round(timeOnCurrentPage / 1000)}s
            </div>
            <div>
              <strong>Entity ID:</strong> {user.id}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lock Status */}
      <LockStatus
        isLocked={lockStatus.isLocked}
        lockInfo={lockStatus.lockInfo}
        isLoading={lockStatus.isLoading}
        error={lockStatus.error}
        canForceUnlock={true}
        showDetails={true}
        onForceUnlock={forceUnlock}
        onRefreshLock={() => window.location.reload()}
      />

      {/* Search Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Tracking Example
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search users... (tracked when 2+ characters)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleViewClick}>
              <Eye className="h-4 w-4 mr-1" />
              View Profile
            </Button>
          </div>
          {searchQuery && (
            <Badge variant="secondary" className="mt-2">
              Search query: "{searchQuery}" (length: {searchQuery.length})
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* User Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Profile Editor</CardTitle>
          <CardDescription>
            Form with field-level change tracking and lock protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={user.name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={isFormDisabled}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={user.bio}
              onChange={(e) => handleBioChange(e.target.value)}
              disabled={isFormDisabled}
              rows={3}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Characters: {user.bio.length} | Words: {user.bio.split(/\s+/).filter(w => w).length}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={isFormDisabled}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleResetForm}
                disabled={isFormDisabled}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              {JSON.stringify(user) !== JSON.stringify(originalUser) && (
                <Badge variant="outline">Unsaved changes</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <strong>Lock Status:</strong>
              <pre className="mt-1 p-2 bg-muted rounded">
                {JSON.stringify(lockStatus, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Current User State:</strong>
              <pre className="mt-1 p-2 bg-muted rounded">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 