'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, FileText, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { 
  useDocumentationChange, 
  useApproveDocumentationChange, 
  useRejectDocumentationChange 
} from '@/hooks/useDocumentationChanges';

interface DocumentationChange {
  id: string;
  type: 'implementation' | 'update' | 'new';
  title: string;
  description: string;
  proposedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  changes: FileChange[];
  metadata: any;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  feedback?: string;
}

interface FileChange {
  file: string;
  action: 'update' | 'create' | 'delete';
  before?: string;
  after: string;
  diff?: string;
}

export default function DocumentationReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  
  // Use TanStack Query for data fetching with caching
  const { data: change, isLoading: loading, error } = useDocumentationChange(params.id as string);
  
  // Use mutation hooks for approve/reject actions with optimistic updates
  const approveMutation = useApproveDocumentationChange();
  const rejectMutation = useRejectDocumentationChange();
  
  const processing = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        changeId: params.id as string,
        data: { feedback }
      });
      router.push('/admin/docs');
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        changeId: params.id as string,
        data: { feedback }
      });
      router.push('/admin/docs');
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderDiff = (change: FileChange) => {
    if (change.action === 'create') {
      return (
        <div className="space-y-4">
          <div className="text-sm font-medium text-green-600">New File: {change.file}</div>
          <pre className="bg-green-50 border border-green-200 rounded p-4 text-sm overflow-x-auto">
            <code>{change.after}</code>
          </pre>
        </div>
      );
    }

    if (change.action === 'delete') {
      return (
        <div className="space-y-4">
          <div className="text-sm font-medium text-red-600">Delete File: {change.file}</div>
          <pre className="bg-red-50 border border-red-200 rounded p-4 text-sm overflow-x-auto">
            <code>{change.before}</code>
          </pre>
        </div>
      );
    }

    // Update - show side by side diff
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium">Modified: {change.file}</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-red-600 mb-2">Before</div>
            <pre className="bg-red-50 border border-red-200 rounded p-4 text-sm overflow-x-auto max-h-96">
              <code>{change.before}</code>
            </pre>
          </div>
          <div>
            <div className="text-xs font-medium text-green-600 mb-2">After</div>
            <pre className="bg-green-50 border border-green-200 rounded p-4 text-sm overflow-x-auto max-h-96">
              <code>{change.after}</code>
            </pre>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading documentation change...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!change) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Documentation change not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canReview = change.status === 'pending';

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{change.title}</CardTitle>
              <p className="text-gray-600">{change.description}</p>
            </div>
            {getStatusBadge(change.status)}
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              Proposed by {change.proposedBy}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(change.createdAt).toLocaleString()}
            </div>
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              {change.changes.length} files affected
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metadata */}
      {change.metadata && Object.keys(change.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Change Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {change.metadata.feature && (
              <div>
                <span className="font-medium">Feature: </span>
                {change.metadata.feature}
              </div>
            )}
            {change.metadata.filesChanged && change.metadata.filesChanged.length > 0 && (
              <div>
                <span className="font-medium">Code Files Changed: </span>
                {change.metadata.filesChanged.join(', ')}
              </div>
            )}
            {change.metadata.patternsUsed && change.metadata.patternsUsed.length > 0 && (
              <div>
                <span className="font-medium">Patterns Used: </span>
                {change.metadata.patternsUsed.join(', ')}
              </div>
            )}
            {change.metadata.testingNotes && (
              <div>
                <span className="font-medium">Testing Notes: </span>
                {change.metadata.testingNotes}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-1 lg:grid-cols-3">
              {change.changes.map((fileChange, index) => (
                <TabsTrigger key={index} value={index.toString()} className="text-sm">
                  {fileChange.file.split('/').pop()}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {change.changes.map((fileChange, index) => (
              <TabsContent key={index} value={index.toString()} className="mt-6">
                {renderDiff(fileChange)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Actions */}
      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Feedback (optional for approval, required for rejection)
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback about the documentation changes..."
                rows={4}
              />
            </div>
            
            <Separator />
            
            <div className="flex space-x-4">
              <Button
                onClick={handleApprove}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {processing ? 'Approving...' : 'Approve Changes'}
              </Button>
              
              <Button
                onClick={handleReject}
                disabled={processing}
                variant="destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {processing ? 'Rejecting...' : 'Reject Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Feedback */}
      {change.feedback && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded p-4">
              <p className="text-sm">{change.feedback}</p>
              {change.reviewedBy && change.reviewedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Reviewed by {change.reviewedBy} on {new Date(change.reviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}