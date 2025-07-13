import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Ruler,
  Palette,
  User
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { getAdminRole, hasPermission } from '@/lib/admin-access-control';
import { redirect } from 'next/navigation';

// Mock application data - will be replaced with real database queries later
const mockApplications = [
  {
    id: '1',
    applicant: {
      firstName: 'Marcus',
      lastName: 'Markowitsch',
      email: 'marcus.markowitsch@example.com',
      phone: '+43 123 456 7890'
    },
    physicalAttributes: {
      height: '185 cm',
      weight: '75 kg',
      eyeColor: 'Blue',
      hairColor: 'Brown'
    },
    experienceLevel: 'Beginner',
    specialties: ['Fashion', 'Commercial'],
    submittedAt: new Date('2024-01-15'),
    status: 'pending'
  },
  {
    id: '2',
    applicant: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1 555 123 4567'
    },
    physicalAttributes: {
      height: '172 cm',
      weight: '58 kg',
      eyeColor: 'Green',
      hairColor: 'Blonde'
    },
    experienceLevel: 'Professional',
    specialties: ['Fashion', 'Runway', 'Editorial'],
    submittedAt: new Date('2024-01-14'),
    status: 'approved'
  },
  {
    id: '3',
    applicant: {
      firstName: 'Emma',
      lastName: 'Stone',
      email: 'emma.stone@example.com',
      phone: '+44 20 7123 4567'
    },
    physicalAttributes: {
      height: '168 cm',
      weight: '55 kg',
      eyeColor: 'Brown',
      hairColor: 'Red'
    },
    experienceLevel: 'Intermediate',
    specialties: ['Commercial', 'Lifestyle'],
    submittedAt: new Date('2024-01-13'),
    status: 'rejected'
  }
];

function formatDate(date: Date) {
  return date.toLocaleDateString();
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return { 
        label: 'Pending Review', 
        variant: 'secondary' as const, 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', 
        icon: Clock 
      };
    case 'approved':
      return { 
        label: 'Approved', 
        variant: 'default' as const, 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', 
        icon: CheckCircle2 
      };
    case 'rejected':
      return { 
        label: 'Rejected', 
        variant: 'destructive' as const, 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', 
        icon: XCircle 
      };
    default:
      return { 
        label: 'Unknown', 
        variant: 'outline' as const, 
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', 
        icon: Clock 
      };
  }
}

export default async function ApplicationsPage() {
  // Check permissions for this specific page
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin/applications');
  }

  const adminInfo = await getAdminRole(parseInt(session.user.id), 1);

  // Check if user can approve models (required for applications page)
  if (!hasPermission(adminInfo, 'canApproveModels')) {
    redirect('/admin?error=insufficient_permissions');
  }

  const applications = mockApplications;
  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const approvedCount = applications.filter(app => app.status === 'approved').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  // Show different UI based on role type
  const isLimitedAccess = adminInfo?.adminRole?.roleType === 'content_moderator';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Model Applications</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and manage model applications
        </p>
        {isLimitedAccess && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-medium">Content Moderator Access:</span> You can approve model applications and manage content.
            </p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input
                placeholder="Search applications by name, email, or status..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{applications.length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {applications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No applications found
              </div>
            ) : (
              applications.map((application) => {
                const statusInfo = getStatusBadge(application.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div key={application.id} className="border dark:border-gray-700 rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {application.applicant.firstName} {application.applicant.lastName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{application.applicant.email}</p>
                        </div>
                        <Badge className={statusInfo.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Submitted {formatDate(application.submittedAt)}</span>
                      </div>
                    </div>

                    {/* Application Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {/* Physical Attributes */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Ruler className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Physical</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div>Height: {application.physicalAttributes.height}</div>
                          <div>Weight: {application.physicalAttributes.weight}</div>
                        </div>
                      </div>

                      {/* Appearance */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Palette className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Appearance</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div>Eyes: {application.physicalAttributes.eyeColor}</div>
                          <div>Hair: {application.physicalAttributes.hairColor}</div>
                        </div>
                      </div>

                      {/* Experience */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Experience</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {application.experienceLevel}
                        </div>
                      </div>

                      {/* Specialties */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">Specialties</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {application.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View Full Profile
                        </Button>
                      </div>

                      {application.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 