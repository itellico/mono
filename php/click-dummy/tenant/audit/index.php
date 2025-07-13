<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Audit Logs - Go Models NYC", "Admin User", "Marketplace Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'audit/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Audit Logs']
        ]);
        
        echo createHeroSection(
            "Audit & Activity Logs",
            "Monitor all activities, track changes, and maintain compliance within your tenant environment",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop",
            [
                ['label' => 'Export Logs', 'icon' => 'fas fa-download', 'style' => 'success'],
                ['label' => 'Configure Alerts', 'icon' => 'fas fa-bell', 'style' => 'info'],
                ['label' => 'Retention Policy', 'icon' => 'fas fa-clock', 'style' => 'warning'],
                ['label' => 'Compliance Report', 'icon' => 'fas fa-file-contract', 'style' => 'primary']
            ]
        );
        ?>
        
        <!-- Quick Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Events Today', '3,847', 'fas fa-chart-line', 'primary');
            echo createStatCard('Active Users', '234', 'fas fa-users', 'success');
            echo createStatCard('Data Changes', '156', 'fas fa-database', 'info');
            echo createStatCard('Failed Actions', '12', 'fas fa-exclamation-triangle', 'warning');
            ?>
        </div>
        
        <!-- Filters Section -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="fas fa-filter me-2"></i>
                    Filter Audit Logs
                </h5>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <label class="form-label">Date Range</label>
                        <input type="date" class="form-control" id="dateFrom" value="2024-01-01">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">To</label>
                        <input type="date" class="form-control" id="dateTo" value="2024-01-20">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">User</label>
                        <select class="form-select" id="filterUser">
                            <option value="">All Users</option>
                            <option value="admin">Admin Users</option>
                            <option value="talent">Talent</option>
                            <option value="client">Clients</option>
                            <option value="api">API Access</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Action Type</label>
                        <select class="form-select" id="filterAction">
                            <option value="">All Actions</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                            <option value="view">View</option>
                            <option value="export">Export</option>
                            <option value="login">Login</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">Resource</label>
                        <select class="form-select" id="filterResource">
                            <option value="">All Resources</option>
                            <option value="talent">Talent</option>
                            <option value="casting">Castings</option>
                            <option value="application">Applications</option>
                            <option value="blog">Blog Posts</option>
                            <option value="settings">Settings</option>
                        </select>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-6">
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                            <input type="text" class="form-control" placeholder="Search by keyword, user, or action...">
                        </div>
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-primary" onclick="applyFilters()">
                            <i class="fas fa-filter me-2"></i>Apply Filters
                        </button>
                        <button class="btn btn-outline-secondary" onclick="resetFilters()">
                            <i class="fas fa-undo me-2"></i>Reset
                        </button>
                        <button class="btn btn-success" onclick="exportLogs()">
                            <i class="fas fa-download me-2"></i>Export
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Main Audit Log Table -->
        <div class="card">
            <div class="card-header">
                <ul class="nav nav-tabs card-header-tabs" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" data-bs-toggle="tab" href="#all-activities">
                            <i class="fas fa-list me-2"></i>All Activities
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#talent-activities">
                            <i class="fas fa-users me-2"></i>Talent Activities
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#admin-activities">
                            <i class="fas fa-user-shield me-2"></i>Admin Activities
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-bs-toggle="tab" href="#security-events">
                            <i class="fas fa-shield-alt me-2"></i>Security Events
                        </a>
                    </li>
                </ul>
            </div>
            <div class="card-body">
                <div class="tab-content">
                    <!-- All Activities Tab -->
                    <div class="tab-pane fade show active" id="all-activities">
                        <div class="table-responsive">
                            <table class="table table-hover">
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
                                        <td><small>2024-01-20 15:45:23</small></td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <img src="https://randomuser.me/api/portraits/women/1.jpg" class="rounded-circle me-2" width="32" height="32">
                                                <div>
                                                    <strong>Sarah Johnson</strong><br>
                                                    <small class="text-muted">Admin</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="badge bg-success">CREATE</span></td>
                                        <td>Casting</td>
                                        <td>Created new casting "Summer Fashion Campaign 2024"</td>
                                        <td>192.168.1.100</td>
                                        <td><span class="badge bg-success">Success</span></td>
                                    </tr>
                                    <tr>
                                        <td><small>2024-01-20 15:32:10</small></td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <img src="https://randomuser.me/api/portraits/men/2.jpg" class="rounded-circle me-2" width="32" height="32">
                                                <div>
                                                    <strong>Michael Chen</strong><br>
                                                    <small class="text-muted">Talent</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="badge bg-warning">UPDATE</span></td>
                                        <td>Profile</td>
                                        <td>Updated portfolio - Added 5 new photos</td>
                                        <td>10.0.0.45</td>
                                        <td><span class="badge bg-success">Success</span></td>
                                    </tr>
                                    <tr>
                                        <td><small>2024-01-20 15:28:45</small></td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <i class="fas fa-robot text-primary me-2"></i>
                                                <div>
                                                    <strong>System</strong><br>
                                                    <small class="text-muted">Automated</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="badge bg-info">EXPORT</span></td>
                                        <td>Analytics</td>
                                        <td>Automated weekly analytics report generated</td>
                                        <td>System</td>
                                        <td><span class="badge bg-success">Success</span></td>
                                    </tr>
                                    <tr>
                                        <td><small>2024-01-20 15:15:33</small></td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <img src="https://randomuser.me/api/portraits/women/3.jpg" class="rounded-circle me-2" width="32" height="32">
                                                <div>
                                                    <strong>Emma Rodriguez</strong><br>
                                                    <small class="text-muted">Client</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="badge bg-primary">VIEW</span></td>
                                        <td>Talent Profile</td>
                                        <td>Viewed talent profile: Lisa Park (ID: 12345)</td>
                                        <td>172.16.0.200</td>
                                        <td><span class="badge bg-success">Success</span></td>
                                    </tr>
                                    <tr class="table-warning">
                                        <td><small>2024-01-20 14:58:12</small></td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <img src="https://randomuser.me/api/portraits/men/4.jpg" class="rounded-circle me-2" width="32" height="32">
                                                <div>
                                                    <strong>David Kim</strong><br>
                                                    <small class="text-muted">Admin</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="badge bg-danger">DELETE</span></td>
                                        <td>Blog Post</td>
                                        <td>Deleted blog post "Old Fashion Tips" (ID: 789)</td>
                                        <td>192.168.1.150</td>
                                        <td><span class="badge bg-warning">Pending Review</span></td>
                                    </tr>
                                    <tr class="table-danger">
                                        <td><small>2024-01-20 14:45:00</small></td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <i class="fas fa-user-slash text-danger me-2"></i>
                                                <div>
                                                    <strong>Unknown User</strong><br>
                                                    <small class="text-muted">Anonymous</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span class="badge bg-danger">FAILED LOGIN</span></td>
                                        <td>Authentication</td>
                                        <td>Failed login attempt - Invalid credentials</td>
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
                    
                    <!-- Talent Activities Tab -->
                    <div class="tab-pane fade" id="talent-activities">
                        <h5 class="mb-3">Recent Talent Activities</h5>
                        <div class="activity-timeline">
                            <div class="activity-item mb-3">
                                <div class="d-flex">
                                    <div class="activity-icon bg-success text-white rounded-circle p-2 me-3">
                                        <i class="fas fa-user-plus"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">New Talent Registration</h6>
                                        <p class="mb-1">Jessica Williams completed profile registration</p>
                                        <small class="text-muted">2 hours ago • IP: 192.168.1.50</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="activity-item mb-3">
                                <div class="d-flex">
                                    <div class="activity-icon bg-info text-white rounded-circle p-2 me-3">
                                        <i class="fas fa-images"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">Portfolio Update</h6>
                                        <p class="mb-1">Michael Chen uploaded 8 new portfolio images</p>
                                        <small class="text-muted">3 hours ago • IP: 10.0.0.75</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="activity-item mb-3">
                                <div class="d-flex">
                                    <div class="activity-icon bg-warning text-white rounded-circle p-2 me-3">
                                        <i class="fas fa-file-alt"></i>
                                    </div>
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">Application Submitted</h6>
                                        <p class="mb-1">Sarah Johnson applied for "Fashion Week Runway" casting</p>
                                        <small class="text-muted">5 hours ago • IP: 172.16.0.100</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Admin Activities Tab -->
                    <div class="tab-pane fade" id="admin-activities">
                        <h5 class="mb-3">Administrative Actions</h5>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Configuration Changes</h6>
                                    </div>
                                    <div class="card-body">
                                        <ul class="list-group list-group-flush">
                                            <li class="list-group-item d-flex justify-content-between">
                                                <div>
                                                    <strong>Subscription Plan Updated</strong><br>
                                                    <small>Changed from Basic to Professional</small>
                                                </div>
                                                <small class="text-muted">1h ago</small>
                                            </li>
                                            <li class="list-group-item d-flex justify-content-between">
                                                <div>
                                                    <strong>Feature Enabled</strong><br>
                                                    <small>Activated "Advanced Analytics" module</small>
                                                </div>
                                                <small class="text-muted">3h ago</small>
                                            </li>
                                            <li class="list-group-item d-flex justify-content-between">
                                                <div>
                                                    <strong>API Key Generated</strong><br>
                                                    <small>New production API key created</small>
                                                </div>
                                                <small class="text-muted">1d ago</small>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">User Management</h6>
                                    </div>
                                    <div class="card-body">
                                        <ul class="list-group list-group-flush">
                                            <li class="list-group-item d-flex justify-content-between">
                                                <div>
                                                    <strong>New Admin User</strong><br>
                                                    <small>admin@newuser.com added with Editor role</small>
                                                </div>
                                                <small class="text-muted">2h ago</small>
                                            </li>
                                            <li class="list-group-item d-flex justify-content-between">
                                                <div>
                                                    <strong>Permissions Updated</strong><br>
                                                    <small>Content Manager role modified</small>
                                                </div>
                                                <small class="text-muted">5h ago</small>
                                            </li>
                                            <li class="list-group-item d-flex justify-content-between">
                                                <div>
                                                    <strong>User Deactivated</strong><br>
                                                    <small>contractor@temp.com access revoked</small>
                                                </div>
                                                <small class="text-muted">2d ago</small>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Security Events Tab -->
                    <div class="tab-pane fade" id="security-events">
                        <div class="alert alert-warning mb-4">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>3 Security Events</strong> require your attention
                        </div>
                        
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Severity</th>
                                        <th>Event</th>
                                        <th>Source</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="table-danger">
                                        <td>10:23:45</td>
                                        <td><span class="badge bg-danger">High</span></td>
                                        <td>Multiple failed login attempts</td>
                                        <td>IP: 45.67.89.123</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-danger" onclick="blockIP('45.67.89.123')">
                                                <i class="fas fa-ban"></i> Block IP
                                            </button>
                                        </td>
                                    </tr>
                                    <tr class="table-warning">
                                        <td>09:15:22</td>
                                        <td><span class="badge bg-warning">Medium</span></td>
                                        <td>Unusual data export activity</td>
                                        <td>user@suspicious.com</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-warning" onclick="reviewActivity('export-001')">
                                                <i class="fas fa-eye"></i> Review
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>08:45:10</td>
                                        <td><span class="badge bg-info">Low</span></td>
                                        <td>API rate limit exceeded</td>
                                        <td>API Key: pk_test_***456</td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-info" onclick="adjustRateLimit('pk_test_***456')">
                                                <i class="fas fa-cog"></i> Adjust
                                            </button>
                                        </td>
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

<style>
.activity-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.activity-timeline {
    position: relative;
    padding-left: 60px;
}

.activity-item {
    position: relative;
}

.activity-item:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 19px;
    top: 40px;
    bottom: -20px;
    width: 2px;
    background-color: #dee2e6;
}
</style>

<script>
// Mock functions for demo
function applyFilters() {
    showToast('success', 'Filters applied successfully');
}

function resetFilters() {
    document.getElementById('dateFrom').value = '2024-01-01';
    document.getElementById('dateTo').value = '2024-01-20';
    document.getElementById('filterUser').value = '';
    document.getElementById('filterAction').value = '';
    document.getElementById('filterResource').value = '';
    showToast('info', 'Filters reset');
}

function exportLogs() {
    showToast('info', 'Preparing audit log export...');
    setTimeout(() => {
        showToast('success', 'Audit logs exported successfully!');
    }, 2000);
}

function blockIP(ip) {
    if (confirm(`Block IP address ${ip}?`)) {
        showToast('success', `IP ${ip} has been blocked`);
    }
}

function reviewActivity(id) {
    showToast('info', `Loading activity details for ${id}...`);
}

function adjustRateLimit(key) {
    showToast('info', `Opening rate limit settings for ${key}...`);
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

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tenant Audit Logs page initialized');
});
</script>

<?php echo renderFooter(); ?>