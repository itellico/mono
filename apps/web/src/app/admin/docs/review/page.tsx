'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DocumentationUpdate {
  id: string;
  type: 'implementation' | 'pattern' | 'guide' | 'api';
  title: string;
  description: string;
  proposedBy: string;
  proposedAt: string;
  expiresAt: string;
  status: 'pending' | 'approved' | 'rejected';
  changes: {
    file: string;
    before: string;
    after: string;
  }[];
  metadata?: {
    feature?: string;
    filesChanged?: string[];
    patternsUsed?: string[];
    learnings?: string;
    gotchas?: string;
  };
}

export default function DocumentationReviewPage() {
  const [updates, setUpdates] = useState<DocumentationUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<DocumentationUpdate | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPendingUpdates();
  }, []);

  const fetchPendingUpdates = async () => {
    try {
      const response = await fetch('/api/v1/platform/documentation/pending');
      if (!response.ok) throw new Error('Failed to fetch updates');
      
      const data = await response.json();
      setUpdates(data.data.updates || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast.error('Failed to load pending updates');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/v1/platform/documentation/approve/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: reviewComment })
      });

      if (!response.ok) throw new Error('Failed to approve update');

      toast.success('Documentation update approved successfully');
      setSelectedUpdate(null);
      setReviewComment('');
      await fetchPendingUpdates();
    } catch (error) {
      console.error('Error approving update:', error);
      toast.error('Failed to approve update');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!reviewComment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/v1/platform/documentation/reject/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reviewComment })
      });

      if (!response.ok) throw new Error('Failed to reject update');

      toast.success('Documentation update rejected');
      setSelectedUpdate(null);
      setReviewComment('');
      await fetchPendingUpdates();
    } catch (error) {
      console.error('Error rejecting update:', error);
      toast.error('Failed to reject update');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'implementation': return 'bg-blue-100 text-blue-800';
      case 'pattern': return 'bg-purple-100 text-purple-800';
      case 'guide': return 'bg-green-100 text-green-800';
      case 'api': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading pending documentation updates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Documentation Review</h1>
        <p className="text-muted-foreground">
          Review and approve proposed documentation updates from Claude and developers
        </p>
      </div>

      {updates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              No pending documentation updates to review
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Updates List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Pending Updates ({updates.length})
            </h2>
            {updates.map((update) => (
              <Card 
                key={update.id}
                className={`cursor-pointer transition-colors ${
                  selectedUpdate?.id === update.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedUpdate(update)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{update.title}</CardTitle>
                      <CardDescription>{update.description}</CardDescription>
                    </div>
                    <Badge className={getTypeColor(update.type)}>
                      {update.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {update.proposedBy}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(update.proposedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {update.changes.length} files
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Update Details */}
          {selectedUpdate ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Update Details</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>{selectedUpdate.title}</CardTitle>
                  <CardDescription>{selectedUpdate.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Metadata */}
                  {selectedUpdate.metadata && (
                    <div className="space-y-2 text-sm">
                      {selectedUpdate.metadata.feature && (
                        <div>
                          <span className="font-medium">Feature:</span> {selectedUpdate.metadata.feature}
                        </div>
                      )}
                      {selectedUpdate.metadata.learnings && (
                        <div>
                          <span className="font-medium">Learnings:</span> {selectedUpdate.metadata.learnings}
                        </div>
                      )}
                      {selectedUpdate.metadata.gotchas && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <div>
                            <span className="font-medium">Gotchas:</span> {selectedUpdate.metadata.gotchas}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* File Changes */}
                  <div className="space-y-2">
                    <h4 className="font-medium">File Changes:</h4>
                    {selectedUpdate.changes.map((change, index) => (
                      <div key={index} className="border rounded p-3 space-y-2">
                        <div className="font-mono text-sm">{change.file}</div>
                        {change.before && (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Before:</div>
                            <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto">
                              {change.before}
                            </pre>
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">After:</div>
                          <pre className="text-xs bg-green-50 p-2 rounded overflow-x-auto">
                            {change.after}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Review Actions */}
                  <div className="space-y-3 pt-4">
                    <Textarea
                      placeholder="Add a comment (optional for approval, required for rejection)"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(selectedUpdate.id)}
                        disabled={processing}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(selectedUpdate.id)}
                        disabled={processing}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                Select an update to review details
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}