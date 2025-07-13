'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
  Link,
  Server,
  Clock,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  subdomain?: string;
  type: 'primary' | 'alias' | 'redirect';
  status: 'pending' | 'active' | 'failed' | 'expired';
  sslStatus: 'none' | 'pending' | 'active' | 'expired';
  verificationStatus: 'pending' | 'verified' | 'failed';
  verificationMethod: 'dns' | 'file';
  verificationToken?: string;
  createdAt: string;
  lastChecked: string;
  expiresAt?: string;
}

interface DNSRecord {
  id: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX';
  name: string;
  value: string;
  priority?: number;
  ttl: number;
  status: 'pending' | 'active' | 'failed';
}

interface SSLCertificate {
  id: string;
  domain: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  autoRenew: boolean;
  status: 'active' | 'expiring' | 'expired';
}

// Mock data
const mockDomains: Domain[] = [
  {
    id: '1',
    domain: 'clickdami.com',
    type: 'primary',
    status: 'active',
    sslStatus: 'active',
    verificationStatus: 'verified',
    verificationMethod: 'dns',
    createdAt: '2024-01-01T00:00:00Z',
    lastChecked: '2024-01-20T12:00:00Z',
  },
  {
    id: '2',
    domain: 'www.clickdami.com',
    type: 'alias',
    status: 'active',
    sslStatus: 'active',
    verificationStatus: 'verified',
    verificationMethod: 'dns',
    createdAt: '2024-01-01T00:00:00Z',
    lastChecked: '2024-01-20T12:00:00Z',
  },
];

const mockDNSRecords: DNSRecord[] = [
  {
    id: '1',
    type: 'A',
    name: '@',
    value: '192.168.1.1',
    ttl: 3600,
    status: 'active',
  },
  {
    id: '2',
    type: 'CNAME',
    name: 'www',
    value: 'clickdami.com',
    ttl: 3600,
    status: 'active',
  },
  {
    id: '3',
    type: 'TXT',
    name: '_verification',
    value: 'tenant-verify=abc123def456',
    ttl: 300,
    status: 'active',
  },
];

const mockSSLCertificates: SSLCertificate[] = [
  {
    id: '1',
    domain: 'clickdami.com',
    issuer: "Let's Encrypt",
    validFrom: '2024-01-01T00:00:00Z',
    validTo: '2024-04-01T00:00:00Z',
    autoRenew: true,
    status: 'active',
  },
];

// API Functions
async function fetchDomains(): Promise<Domain[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDomains), 500);
  });
}

async function fetchDNSRecords(): Promise<DNSRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockDNSRecords), 500);
  });
}

async function fetchSSLCertificates(): Promise<SSLCertificate[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockSSLCertificates), 500);
  });
}

async function addDomain(domain: { domain: string; type: string }): Promise<Domain> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      id: Date.now().toString(),
      domain: domain.domain,
      type: domain.type as any,
      status: 'pending',
      sslStatus: 'none',
      verificationStatus: 'pending',
      verificationMethod: 'dns',
      verificationToken: 'verify-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      lastChecked: new Date().toISOString(),
    }), 500);
  });
}

function getStatusBadge(status: string, type: 'domain' | 'ssl' | 'verification') {
  const variants: Record<string, any> = {
    active: 'default',
    verified: 'default',
    pending: 'secondary',
    failed: 'destructive',
    expired: 'destructive',
    expiring: 'warning',
    none: 'outline',
  };

  const icons: Record<string, any> = {
    active: CheckCircle,
    verified: CheckCircle,
    pending: Clock,
    failed: XCircle,
    expired: XCircle,
    expiring: AlertCircle,
    none: Globe,
  };

  const Icon = icons[status] || Globe;

  return (
    <Badge variant={variants[status] || 'outline'} className="gap-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

export function DomainSettingsClientPage() {
  const queryClient = useQueryClient();
  const [addDomainOpen, setAddDomainOpen] = useState(false);
  const [newDomain, setNewDomain] = useState({ domain: '', type: 'alias' });
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);

  // Queries
  const { data: domains, isLoading: loadingDomains } = useQuery({
    queryKey: ['domains'],
    queryFn: fetchDomains,
  });

  const { data: dnsRecords, isLoading: loadingDNS } = useQuery({
    queryKey: ['dns-records'],
    queryFn: fetchDNSRecords,
  });

  const { data: sslCertificates, isLoading: loadingSSL } = useQuery({
    queryKey: ['ssl-certificates'],
    queryFn: fetchSSLCertificates,
  });

  // Mutations
  const addDomainMutation = useMutation({
    mutationFn: addDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      setAddDomainOpen(false);
      setNewDomain({ domain: '', type: 'alias' });
      toast.success('Domain added successfully');
    },
    onError: () => {
      toast.error('Failed to add domain');
    },
  });

  const handleAddDomain = () => {
    if (!newDomain.domain) {
      toast.error('Please enter a domain');
      return;
    }
    addDomainMutation.mutate(newDomain);
  };

  const handleVerifyDomain = (domain: Domain) => {
    setSelectedDomain(domain);
    setVerificationOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loadingDomains) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domain Settings</h1>
          <p className="text-muted-foreground">
            Manage your custom domains and DNS settings
          </p>
        </div>
        <Dialog open={addDomainOpen} onOpenChange={setAddDomainOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Domain</DialogTitle>
              <DialogDescription>
                Add a custom domain to your marketplace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  value={newDomain.domain}
                  onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                  placeholder="example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Domain Type</Label>
                <Select
                  value={newDomain.type}
                  onValueChange={(value) => setNewDomain({ ...newDomain, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary Domain</SelectItem>
                    <SelectItem value="alias">Domain Alias</SelectItem>
                    <SelectItem value="redirect">Redirect Domain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddDomainOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDomain} disabled={addDomainMutation.isPending}>
                  Add Domain
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="domains" className="space-y-4">
        <TabsList>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="dns">DNS Records</TabsTrigger>
          <TabsTrigger value="ssl">SSL Certificates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="space-y-4">
          {domains && domains.length > 0 ? (
            <div className="space-y-4">
              {domains.map((domain) => (
                <Card key={domain.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <h3 className="text-lg font-semibold">{domain.domain}</h3>
                          <Badge variant="outline">{domain.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Added {new Date(domain.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Last checked {new Date(domain.lastChecked).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-2 items-end">
                          <div className="flex gap-2">
                            {getStatusBadge(domain.status, 'domain')}
                            {getStatusBadge(domain.sslStatus, 'ssl')}
                            {getStatusBadge(domain.verificationStatus, 'verification')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {domain.verificationStatus !== 'verified' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleVerifyDomain(domain)}
                            >
                              Verify
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No domains configured"
              description="Add your first custom domain to get started"
              action={
                <Button onClick={() => setAddDomainOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              }
            />
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Domain Configuration</AlertTitle>
            <AlertDescription>
              To use a custom domain, you need to update your DNS settings with your domain registrar. 
              Point your domain to our servers and verify ownership.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="dns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>DNS Records</CardTitle>
              <CardDescription>
                Configure your DNS records for proper domain routing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dnsRecords && dnsRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>TTL</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dnsRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <Badge variant="outline">{record.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{record.name}</TableCell>
                        <TableCell className="font-mono text-sm">{record.value}</TableCell>
                        <TableCell>{record.ttl}s</TableCell>
                        <TableCell>{getStatusBadge(record.status, 'domain')}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(record.value)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  title="No DNS records"
                  description="DNS records will appear here once you add a domain"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required DNS Configuration</CardTitle>
              <CardDescription>
                Add these records to your domain's DNS settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">For root domain (example.com)</h4>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  A @ 192.168.1.1
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">For www subdomain</h4>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  CNAME www example.com
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">For domain verification</h4>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  TXT _verification tenant-verify=your-verification-token
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ssl" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SSL Certificates</CardTitle>
              <CardDescription>
                Manage SSL certificates for your domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sslCertificates && sslCertificates.length > 0 ? (
                <div className="space-y-4">
                  {sslCertificates.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lock className="h-5 w-5 text-green-500" />
                          <div>
                            <h4 className="font-medium">{cert.domain}</h4>
                            <p className="text-sm text-muted-foreground">
                              Issued by {cert.issuer}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(cert.status, 'ssl')}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valid from:</span>{' '}
                          {new Date(cert.validFrom).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valid to:</span>{' '}
                          {new Date(cert.validTo).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch checked={cert.autoRenew} />
                          <Label className="text-sm">Auto-renew</Label>
                        </div>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renew Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No SSL certificates"
                  description="SSL certificates will be automatically provisioned when you add a domain"
                />
              )}
            </CardContent>
          </Card>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Free SSL Certificates</AlertTitle>
            <AlertDescription>
              We automatically provision free SSL certificates from Let's Encrypt for all verified domains. 
              Certificates are auto-renewed before expiration.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain Settings</CardTitle>
              <CardDescription>
                Configure domain-related settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Force HTTPS</Label>
                    <p className="text-sm text-muted-foreground">
                      Redirect all HTTP traffic to HTTPS
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>WWW Redirect</Label>
                    <p className="text-sm text-muted-foreground">
                      Redirect www to non-www domain
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Domain Verification Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about domain status changes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SSL Auto-Renewal</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically renew SSL certificates before expiration
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Configure advanced domain options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custom Headers</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Add custom HTTP headers to all responses
                </p>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Header
                </Button>
              </div>

              <div className="space-y-2">
                <Label>IP Whitelist</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Restrict access to specific IP addresses
                </p>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add IP Range
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Domain Verification Dialog */}
      <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Domain Ownership</DialogTitle>
            <DialogDescription>
              Choose a verification method and follow the instructions
            </DialogDescription>
          </DialogHeader>
          {selectedDomain && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Domain: <span className="font-medium">{selectedDomain.domain}</span>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">DNS Verification (Recommended)</h4>
                  <p className="text-sm text-muted-foreground">
                    Add a TXT record to your domain's DNS settings
                  </p>
                  <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                    TXT _verification {selectedDomain.verificationToken}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(selectedDomain.verificationToken || '')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Token
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">File Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload a verification file to your domain
                  </p>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p>1. Download the verification file</p>
                    <p>2. Upload to: /.well-known/tenant-verification.txt</p>
                    <p>3. Click verify below</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setVerificationOpen(false)}>
                  Cancel
                </Button>
                <Button>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Domain
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}