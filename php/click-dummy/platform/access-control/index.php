<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Access Control - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'access-control/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Access Control']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="mb-4">
            <h2 class="mb-1">Access Control Center</h2>
            <p class="text-muted mb-0">Manage roles, permissions, and access policies across the platform</p>
        </div>

        <!-- Quick Actions -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <a href="permission-matrix.php" class="text-decoration-none">
                    <div class="card h-100 hover-shadow">
                        <div class="card-body text-center">
                            <i class="fas fa-th fa-3x text-primary mb-3"></i>
                            <h5>Permission Matrix</h5>
                            <p class="text-muted small mb-0">View and edit permissions across all roles</p>
                        </div>
                    </div>
                </a>
            </div>
            <div class="col-md-3">
                <a href="roles.php" class="text-decoration-none">
                    <div class="card h-100 hover-shadow">
                        <div class="card-body text-center">
                            <i class="fas fa-user-tag fa-3x text-success mb-3"></i>
                            <h5>Manage Roles</h5>
                            <p class="text-muted small mb-0">Create and configure system roles</p>
                        </div>
                    </div>
                </a>
            </div>
            <div class="col-md-3">
                <a href="permissions.php" class="text-decoration-none">
                    <div class="card h-100 hover-shadow">
                        <div class="card-body text-center">
                            <i class="fas fa-key fa-3x text-warning mb-3"></i>
                            <h5>Manage Permissions</h5>
                            <p class="text-muted small mb-0">Define granular access permissions</p>
                        </div>
                    </div>
                </a>
            </div>
            <div class="col-md-3">
                <a href="#" onclick="showAccessPolicies()" class="text-decoration-none">
                    <div class="card h-100 hover-shadow">
                        <div class="card-body text-center">
                            <i class="fas fa-shield-alt fa-3x text-danger mb-3"></i>
                            <h5>Access Policies</h5>
                            <p class="text-muted small mb-0">Configure security and access rules</p>
                        </div>
                    </div>
                </a>
            </div>
        </div>

        <!-- System Overview -->
        <div class="row g-3">
            <!-- Current Status -->
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">System Overview</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <h6 class="text-muted">Role Distribution</h6>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span>Talent</span>
                                        <span class="text-muted">1,234 users</span>
                                    </div>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-warning" style="width: 65%"></div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span>Agency</span>
                                        <span class="text-muted">156 users</span>
                                    </div>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-success" style="width: 15%"></div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span>Guardian</span>
                                        <span class="text-muted">89 users</span>
                                    </div>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-purple" style="width: 8%"></div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span>Admin/Manager</span>
                                        <span class="text-muted">30 users</span>
                                    </div>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar bg-primary" style="width: 5%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-muted">Quick Stats</h6>
                                <div class="list-group">
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        Active Roles
                                        <span class="badge bg-primary rounded-pill">8</span>
                                    </div>
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        Total Permissions
                                        <span class="badge bg-primary rounded-pill">247</span>
                                    </div>
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        Custom Policies
                                        <span class="badge bg-primary rounded-pill">12</span>
                                    </div>
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        Pending Reviews
                                        <span class="badge bg-warning rounded-pill">3</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Recent Changes</h5>
                    </div>
                    <div class="card-body">
                        <div class="activity-timeline">
                            <div class="activity-item">
                                <div class="activity-marker bg-success"></div>
                                <div class="activity-content">
                                    <strong>New permission added</strong>
                                    <p class="text-muted small mb-0">marketplace.premium.access</p>
                                    <small class="text-muted">2 hours ago</small>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-marker bg-primary"></div>
                                <div class="activity-content">
                                    <strong>Role updated</strong>
                                    <p class="text-muted small mb-0">Agency role permissions modified</p>
                                    <small class="text-muted">5 hours ago</small>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-marker bg-warning"></div>
                                <div class="activity-content">
                                    <strong>Policy change</strong>
                                    <p class="text-muted small mb-0">Password requirements updated</p>
                                    <small class="text-muted">1 day ago</small>
                                </div>
                            </div>
                            <div class="activity-item">
                                <div class="activity-marker bg-danger"></div>
                                <div class="activity-content">
                                    <strong>Permission deprecated</strong>
                                    <p class="text-muted small mb-0">legacy.api.access marked for removal</p>
                                    <small class="text-muted">2 days ago</small>
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
.hover-shadow {
    transition: all 0.3s;
}

.hover-shadow:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.bg-purple {
    background-color: #6f42c1;
}

/* Activity Timeline */
.activity-timeline {
    position: relative;
    padding-left: 30px;
}

.activity-timeline::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #e9ecef;
}

.activity-item {
    position: relative;
    padding-bottom: 1.5rem;
}

.activity-marker {
    position: absolute;
    left: -24px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #fff;
    background-color: #6c757d;
}

.activity-content {
    padding-left: 10px;
}
</style>

<script>
function showAccessPolicies() {
    alert('Access Policies would include:\n- Password requirements\n- Session timeout settings\n- IP whitelisting\n- Two-factor authentication\n- API access controls');
}
</script>

<?php echo renderFooter(); ?>