'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  MailIcon, 
  SendIcon, 
  RotateCcwIcon, 
  Trash2Icon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ActivityIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@/lib/browser-logger';

interface EmailQueueStats {
  total: number;
  pending: number;
  active: number;
  completed: number;
  failed: number;
}

interface EmailQueueCardProps {
  stats: EmailQueueStats;
  isLoading?: boolean;
}

interface TestEmailData {
  to: string;
  subject: string;
  message: string;
}

// Send test email function
async function sendTestEmail(emailData: TestEmailData): Promise<void> {
  const response = await fetch('/api/admin/queue/email/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send test email');
  }
}

// Reprocess failed emails function  
async function reprocessFailedEmails(): Promise<void> {
  const response = await fetch('/api/admin/queue/email/reprocess', {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reprocess emails');
  }
}

// Clear failed emails function
async function clearFailedEmails(): Promise<void> {
  const response = await fetch('/api/admin/queue/email/clear-failed', {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to clear failed emails');
  }
}

export function EmailQueueCard({ stats, isLoading }: EmailQueueCardProps) {
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testEmailData, setTestEmailData] = useState<TestEmailData>({
    to: '',
    subject: 'Test Email from mono Admin',
    message: 'This is a test email sent from the mono admin panel to verify email functionality.'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "The test email has been queued successfully and will be delivered shortly.",
      });
      browserLogger.info('Test email sent successfully');
      setIsTestDialogOpen(false);
      setTestEmailData(prev => ({ ...prev, to: '' })); // Clear email but keep subject/message

      // Refresh queue stats
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send test email",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      browserLogger.error('Failed to send test email', { error: error.message });
    },
  });

  // Reprocess failed emails mutation
  const reprocessMutation = useMutation({
    mutationFn: reprocessFailedEmails,
    onSuccess: () => {
      toast({
        title: "Reprocessing emails",
        description: "Failed emails have been queued for reprocessing.",
      });
      browserLogger.info('Failed emails reprocessed');
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to reprocess emails",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      browserLogger.error('Failed to reprocess emails', { error: error.message });
    },
  });

  // Clear failed emails mutation
  const clearMutation = useMutation({
    mutationFn: clearFailedEmails,
    onSuccess: () => {
      toast({
        title: "Failed emails cleared",
        description: "All failed emails have been removed from the queue.",
      });
      browserLogger.info('Failed emails cleared');
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to clear emails",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      browserLogger.error('Failed to clear emails', { error: error.message });
    },
  });

  const handleSendTestEmail = () => {
    if (!testEmailData.to.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }

    testEmailMutation.mutate(testEmailData);
  };

  if (isLoading) {
    return <EmailQueueCardSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MailIcon className="h-5 w-5" />
            Send Email
          </div>
          <Badge variant="secondary" className="text-lg font-semibold">
            {stats.total}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Background processing queue
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Queue Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Pending</span>
            </div>
            <Badge variant="outline">
              {stats.pending}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Active</span>
            </div>
            <Badge variant="outline">
              {stats.active}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm">Completed</span>
            </div>
            <Badge variant="default" className="bg-green-500">
              {stats.completed}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircleIcon className="h-4 w-4 text-destructive" />
              <span className="text-sm">Failed</span>
            </div>
            <Badge variant="destructive">
              {stats.failed}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <SendIcon className="h-4 w-4" />
                Send Test Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Test Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-email-to">Recipient Email</Label>
                  <Input
                    id="test-email-to"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmailData.to}
                    onChange={(e) => setTestEmailData(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="test-email-subject">Subject</Label>
                  <Input
                    id="test-email-subject"
                    value={testEmailData.subject}
                    onChange={(e) => setTestEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="test-email-message">Message</Label>
                  <Input
                    id="test-email-message"
                    value={testEmailData.message}
                    onChange={(e) => setTestEmailData(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsTestDialogOpen(false)}
                  disabled={testEmailMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendTestEmail}
                  disabled={testEmailMutation.isPending}
                >
                  {testEmailMutation.isPending ? 'Sending...' : 'Send Email'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {stats.failed > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reprocessMutation.mutate()}
                disabled={reprocessMutation.isPending}
                className="flex items-center gap-2"
              >
                <RotateCcwIcon className="h-4 w-4" />
                {reprocessMutation.isPending ? 'Processing...' : `Reprocess (${stats.failed})`}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2Icon className="h-4 w-4" />
                {clearMutation.isPending ? 'Clearing...' : `Empty (${stats.failed} failed)`}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmailQueueCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-6 w-8" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-8" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </CardContent>
    </Card>
  );
} 