<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Platform Audit Dashboard - Super Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'audit/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Platform Administration'],
            ['label' => 'Audit Dashboard']
        ]);
        ?>
        
        <!-- Audit Dashboard Header -->
        <div class="bg-primary text-white p-4 rounded mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="mb-2">Platform Audit Dashboard</h2>
                    <p class="mb-0 opacity-75">Monitor all platform activities, security events, and compliance tracking</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group">
                        <button class="btn btn-light" onclick="exportAuditLogs()">
                            <i class="fas fa-download me-2"></i> Export Logs
                        </button>
                        <button class="btn btn-warning" onclick="showAuditSettings()">
                            <i class="fas fa-cog me-2"></i> Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Quick Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted mb-1">Total Events Today</h6>
                                <h3 class="mb-0">12,459</h3>
                                <small class="text-success">
                                    <i class="fas fa-arrow-up"></i> 23% from yesterday
                                </small>
                            </div>
                            <div class="text-primary">
                                <i class="fas fa-calendar-day fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted mb-1">Security Alerts</h6>
                                <h3 class="mb-0 text-danger">8</h3>
                                <small class="text-danger">
                                    <i class="fas fa-exclamation-triangle"></i> Requires attention
                                </small>
                            </div>
                            <div class="text-danger">
                                <i class="fas fa-shield-alt fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted mb-1">Active Users</h6>
                                <h3 class="mb-0">2,847</h3>
                                <small class="text-muted">Currently online</small>
                            </div>
                            <div class="text-success">
                                <i class="fas fa-users fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted mb-1">API Calls</h6>
                                <h3 class="mb-0">45.2K</h3>
                                <small class="text-info">Last hour</small>
                            </div>
                            <div class="text-info">
                                <i class="fas fa-plug fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Security Alerts Panel -->
        <div class="card border-danger mb-4">
            <div class="card-header bg-danger text-white">
                <h5 class="mb-0">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Security Alerts & Suspicious Activities
                </h5>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Time</th>
                                <th>Severity</th>
                                <th>Event Type</th>
                                <th>Description</th>
                                <th>User/IP</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><small>10:23:45</small></td>
                                <td><span class="badge bg-danger">Critical</span></td>
                                <td>Multiple Failed Logins</td>
                                <td>15 failed login attempts in 5 minutes</td>
                                <td>
                                    <small>user@example.com<br>IP: 192.168.1.100</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-warning" onclick="blockUser('user@example.com')">
                                            <i class="fas fa-ban"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewDetails('alert-001')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><small>09:45:12</small></td>
                                <td><span class="badge bg-warning">High</span></td>
                                <td>Unauthorized API Access</td>
                                <td>Attempted access to admin API without proper credentials</td>
                                <td>
                                    <small>API Key: pk_test_***234<br>IP: 10.0.0.50</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-warning" onclick="revokeAPIKey('pk_test_***234')">
                                            <i class="fas fa-key"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewDetails('alert-002')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><small>08:30:22</small></td>
                                <td><span class="badge bg-warning">Medium</span></td>
                                <td>Bulk Data Export</td>
                                <td>Large data export (>10,000 records) detected</td>
                                <td>
                                    <small>admin@tenant.com<br>Tenant: Fashion Co</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-success" onclick="approveExport('export-003')">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewDetails('alert-003')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Main Audit Tabs -->
        <div class="card">
            <div class="card-header">
                <ul class="nav nav-tabs card-header-tabs" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-bs-toggle="tab" href="#activity-logs">
                            <i class="fas fa-history me-2"></i>Activity Logs
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#data-changes">
                            <i class="fas fa-database me-2"></i>Data Changes
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#access-control">
                            <i class="fas fa-lock me-2"></i>Access Control
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#compliance">
                            <i class="fas fa-check-circle me-2"></i>Compliance
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#analytics">
                            <i class="fas fa-chart-bar me-2"></i>Analytics
                        </a>
                    </li>
                </ul>
            </div>
            <div class="card-body">
                <div class="tab-content">
                    <!-- Activity Logs Tab -->
                    <div class="tab-pane fade show active" id="activity-logs">
                        <!-- Filters -->
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <input type="text" class="form-control" placeholder="Search logs..." id="searchLogs">
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="filterUser">
                                    <option value="">All Users</option>
                                    <option value="admin">Admins Only</option>
                                    <option value="tenant">Tenant Admins</option>
                                    <option value="user">Regular Users</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="filterAction">
                                    <option value="">All Actions</option>
                                    <option value="create">Create</option>
                                    <option value="update">Update</option>
                                    <option value="delete">Delete</option>
                                    <option value="login">Login</option>
                                    <option value="export">Export</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <input type="date" class="form-control" id="filterDate">
                            </div>
                            <div class="col-md-3">
                                <div class="btn-group">
                                    <button class="btn btn-primary" onclick="applyFilters()">
                                        <i class="fas fa-filter me-2"></i>Apply
                                    </button>
                                    <button class="btn btn-outline-secondary" onclick="resetFilters()">
                                        <i class="fas fa-undo me-2"></i>Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Activity Log Table -->
                        <div class="table-responsive">
                            <table class="table table-sm table-hover">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Resource</th>
                                        <th>Details</th>
                                        <th>IP Address</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><small>2024-01-20 14:32:10</small></td>
                                        <td>john@admin.com</td>
                                        <td><span class="badge bg-success">CREATE</span></td>
                                        <td>Tenant</td>
                                        <td>Created new tenant "Fashion Forward Ltd"</td>
                                        <td>192.168.1.50</td>
                                        <td><span class="badge bg-success">Success</span></td>
                                    </tr>
                                    <tr>
                                        <td><small>2024-01-20 14:28:45</small></td>
                                        <td>admin@fashionco.com</td>
                                        <td><span class="badge bg-warning">UPDATE</span></td>
                                        <td>User Permissions</td>
                                        <td>Modified role permissions for "Content Manager"</td>
                                        <td>10.0.0.25</td>
                                        <td><span class="badge bg-success">Success</span></td>
                                    </tr>
                                    <tr>
                                        <td><small>2024-01-20 14:15:22</small></td>
                                        <td>user@example.com</td>
                                        <td><span class="badge bg-danger">DELETE</span></td>
                                        <td>Talent Profile</td>
                                        <td>Deleted talent profile ID: 12345</td>
                                        <td>172.16.0.100</td>
                                        <td><span class="badge bg-success">Success</span></td>
                                    </tr>
                                    <tr>
                                        <td><small>2024-01-20 14:10:33</small></td>
                                        <td>sarah@tenant.com</td>
                                        <td><span class="badge bg-info">LOGIN</span></td>
                                        <td>Authentication</td>
                                        <td>Successful login via SSO</td>
                                        <td>192.168.2.75</td>
                                        <td><span class="badge bg-success">Success</span></td>
                                    </tr>
                                    <tr>
                                        <td><small>2024-01-20 14:05:12</small></td>
                                        <td>api@integration.com</td>
                                        <td><span class="badge bg-primary">EXPORT</span></td>
                                        <td>Talent Data</td>
                                        <td>Exported 500 talent records via API</td>
                                        <td>API Gateway</td>
                                        <td><span class="badge bg-success">Success</span></td>
                                    </tr>
                                    <tr class="table-danger">
                                        <td><small>2024-01-20 13:58:45</small></td>
                                        <td>unknown@hacker.com</td>
                                        <td><span class="badge bg-danger">FAILED LOGIN</span></td>
                                        <td>Authentication</td>
                                        <td>Failed login attempt (invalid credentials)</td>
                                        <td>45.67.89.123</td>
                                        <td><span class="badge bg-danger">Failed</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Pagination -->
                        <nav class="mt-3">
                            <ul class="pagination pagination-sm justify-content-center">
                                <li class="page-item disabled">
                                    <span class="page-link">Previous</span>
                                </li>
                                <li class="page-item active">
                                    <span class="page-link">1</span>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="#">2</a>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="#">3</a>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="#">Next</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    
                    <!-- Data Changes Tab -->
                    <div class="tab-pane fade" id="data-changes">
                        <h5 class="mb-3">Recent Data Modifications</h5>
                        <div class="timeline">
                            <?php
                            $changes = [
                                [
                                    'time' => '2 hours ago',
                                    'user' => 'admin@platform.com',
                                    'action' => 'Modified tenant settings',
                                    'details' => 'Changed subscription plan from Basic to Professional for Fashion Co',
                                    'type' => 'warning'
                                ],
                                [
                                    'time' => '3 hours ago',
                                    'user' => 'system',
                                    'action' => 'Bulk update completed',
                                    'details' => 'Updated 1,245 user profiles with new field requirements',
                                    'type' => 'info'
                                ],
                                [
                                    'time' => '5 hours ago',
                                    'user' => 'tenant@fashionco.com',
                                    'action' => 'Deleted multiple records',
                                    'details' => 'Removed 23 inactive talent profiles',
                                    'type' => 'danger'
                                ],
                                [
                                    'time' => 'Yesterday',
                                    'user' => 'admin@platform.com',
                                    'action' => 'Database migration',
                                    'details' => 'Successfully migrated 10,000+ records to new schema',
                                    'type' => 'success'
                                ]
                            ];
                            
                            foreach ($changes as $change) {
                                echo '<div class="timeline-item mb-3">
                                    <div class="timeline-marker bg-' . $change['type'] . '"></div>
                                    <div class="timeline-content">
                                        <h6 class="mb-1">' . $change['action'] . '</h6>
                                        <p class="mb-1">' . $change['details'] . '</p>
                                        <small class="text-muted">
                                            <i class="fas fa-user me-1"></i>' . $change['user'] . '
                                            <i class="fas fa-clock ms-3 me-1"></i>' . $change['time'] . '
                                        </small>
                                    </div>
                                </div>';
                            }
                            ?>
                        </div>
                    </div>
                    
                    <!-- Access Control Tab -->
                    <div class="tab-pane fade" id="access-control">
                        <h5 class="mb-3">Permission Changes & Role Modifications</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Recent Permission Grants</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="list-group list-group-flush">
                                            <div class="list-group-item">
                                                <div class="d-flex justify-content-between">
                                                    <div>
                                                        <strong>Content Manager Role</strong><br>
                                                        <small>Added: talent.create, talent.edit permissions</small>
                                                    </div>
                                                    <small class="text-muted">2h ago</small>
                                                </div>
                                            </div>
                                            <div class="list-group-item">
                                                <div class="d-flex justify-content-between">
                                                    <div>
                                                        <strong>API Access for Integration Team</strong><br>
                                                        <small>Granted: api.read, api.export permissions</small>
                                                    </div>
                                                    <small class="text-muted">5h ago</small>
                                                </div>
                                            </div>
                                            <div class="list-group-item">
                                                <div class="d-flex justify-content-between">
                                                    <div>
                                                        <strong>New Admin User</strong><br>
                                                        <small>john@admin.com assigned Super Admin role</small>
                                                    </div>
                                                    <small class="text-muted">1d ago</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Permission Revocations</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="list-group list-group-flush">
                                            <div class="list-group-item">
                                                <div class="d-flex justify-content-between">
                                                    <div>
                                                        <strong>Contractor Access</strong><br>
                                                        <small>Removed: billing.view, billing.export</small>
                                                    </div>
                                                    <small class="text-muted">1h ago</small>
                                                </div>
                                            </div>
                                            <div class="list-group-item">
                                                <div class="d-flex justify-content-between">
                                                    <div>
                                                        <strong>Suspended User</strong><br>
                                                        <small>user@suspicious.com - All permissions revoked</small>
                                                    </div>
                                                    <small class="text-muted">3h ago</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Compliance Tab -->
                    <div class="tab-pane fade" id="compliance">
                        <h5 class="mb-3">Compliance & Regulatory Tracking</h5>
                        <div class="row">
                            <div class="col-md-4">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <i class="fas fa-shield-alt fa-3x text-success mb-3"></i>
                                        <h4>GDPR Compliance</h4>
                                        <div class="progress mb-2">
                                            <div class="progress-bar bg-success" style="width: 95%">95%</div>
                                        </div>
                                        <small class="text-muted">Last audit: 3 days ago</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <i class="fas fa-file-contract fa-3x text-primary mb-3"></i>
                                        <h4>Data Retention</h4>
                                        <div class="progress mb-2">
                                            <div class="progress-bar bg-primary" style="width: 88%">88%</div>
                                        </div>
                                        <small class="text-muted">45 records pending review</small>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card text-center">
                                    <div class="card-body">
                                        <i class="fas fa-user-lock fa-3x text-warning mb-3"></i>
                                        <h4>Privacy Requests</h4>
                                        <h5 class="text-warning">12 Pending</h5>
                                        <small class="text-muted">Average response: 24h</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card mt-4">
                            <div class="card-header">
                                <h6 class="mb-0">Recent Compliance Actions</h6>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Request</th>
                                                <th>Status</th>
                                                <th>Handler</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>2024-01-20</td>
                                                <td><span class="badge bg-info">GDPR</span></td>
                                                <td>Data Export Request</td>
                                                <td><span class="badge bg-success">Completed</span></td>
                                                <td>compliance@team.com</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-info">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>2024-01-19</td>
                                                <td><span class="badge bg-warning">Privacy</span></td>
                                                <td>Right to be Forgotten</td>
                                                <td><span class="badge bg-warning">In Progress</span></td>
                                                <td>legal@team.com</td>
                                                <td>
                                                    <button class="btn btn-sm btn-outline-info">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Analytics Tab -->
                    <div class="tab-pane fade" id="analytics">
                        <h5 class="mb-3">Audit Analytics & Insights</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Activity Trends (Last 7 Days)</h6>
                                    </div>
                                    <div class="card-body">
                                        <canvas id="activityChart" height="200"></canvas>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Event Distribution</h6>
                                    </div>
                                    <div class="card-body">
                                        <canvas id="eventChart" height="200"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-md-12">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Top Active Users</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="table-responsive">
                                            <table class="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>User</th>
                                                        <th>Role</th>
                                                        <th>Actions</th>
                                                        <th>Last Active</th>
                                                        <th>Risk Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>admin@platform.com</td>
                                                        <td><span class="badge bg-danger">Super Admin</span></td>
                                                        <td>1,245</td>
                                                        <td>5 min ago</td>
                                                        <td><span class="badge bg-success">Low</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td>manager@tenant.com</td>
                                                        <td><span class="badge bg-warning">Tenant Admin</span></td>
                                                        <td>892</td>
                                                        <td>1 hour ago</td>
                                                        <td><span class="badge bg-success">Low</span></td>
                                                    </tr>
                                                    <tr>
                                                        <td>api@integration.com</td>
                                                        <td><span class="badge bg-info">API User</span></td>
                                                        <td>5,672</td>
                                                        <td>Continuous</td>
                                                        <td><span class="badge bg-warning">Medium</span></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.timeline {
    position: relative;
    padding-left: 30px;
}

.timeline-item {
    position: relative;
}

.timeline-marker {
    position: absolute;
    left: -30px;
    top: 5px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.timeline-item:not(:last-child)::before {
    content: '';
    position: absolute;
    left: -25px;
    top: 17px;
    bottom: -20px;
    width: 2px;
    background-color: #dee2e6;
}

.timeline-content {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
}
</style>

<script>
// Chart.js initialization would go here
document.addEventListener('DOMContentLoaded', function() {
    console.log('Platform Audit Dashboard initialized');
});

// Mock functions for demo
function exportAuditLogs() {
    showToast('info', 'Preparing audit log export...');
    setTimeout(() => {
        showToast('success', 'Audit logs exported successfully!');
    }, 2000);
}

function showAuditSettings() {
    showToast('info', 'Opening audit settings...');
}

function blockUser(email) {
    if (confirm(`Block user ${email}?`)) {
        showToast('success', `User ${email} has been blocked`);
    }
}

function revokeAPIKey(key) {
    if (confirm(`Revoke API key ${key}?`)) {
        showToast('success', `API key ${key} has been revoked`);
    }
}

function approveExport(id) {
    showToast('success', 'Export approved');
}

function viewDetails(id) {
    showToast('info', `Loading details for ${id}...`);
}

function applyFilters() {
    showToast('success', 'Filters applied');
}

function resetFilters() {
    showToast('info', 'Filters reset');
}

// Toast notification function
function showToast(type, message) {
    const toastHtml = `
        <div class="toast align-items-center text-bg-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'info' ? 'info-circle' : 'check-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1090';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}
</script>

<?php echo renderFooter(); ?>