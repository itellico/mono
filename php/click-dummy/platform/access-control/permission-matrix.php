<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Permission Matrix - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'access-control/permission-matrix.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Access Control', 'href' => 'index.php'],
            ['label' => 'Permission Matrix']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Permission Matrix</h2>
                <p class="text-muted mb-0">Overview of all permissions across all roles</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="exportMatrix()">
                    <i class="fas fa-download me-2"></i> Export
                </button>
                <button class="btn btn-primary" onclick="saveChanges()">
                    <i class="fas fa-save me-2"></i> Save Changes
                </button>
            </div>
        </div>

        <!-- Filter Controls -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label small text-muted">Filter by Module</label>
                        <select class="form-select" id="moduleFilter" onchange="filterMatrix()">
                            <option value="">All Modules</option>
                            <option value="user">User Management</option>
                            <option value="content">Content Management</option>
                            <option value="marketplace">Marketplace</option>
                            <option value="analytics">Analytics</option>
                            <option value="admin">Administration</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-muted">Filter by Role</label>
                        <select class="form-select" id="roleFilter" onchange="filterMatrix()">
                            <option value="">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="agency">Agency</option>
                            <option value="talent">Talent</option>
                            <option value="guardian">Guardian</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-muted">Quick Search</label>
                        <input type="text" class="form-control" placeholder="Search permissions..." onkeyup="searchMatrix(this.value)">
                    </div>
                </div>
            </div>
        </div>

        <!-- Matrix Table -->
        <div class="card">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0 permission-matrix">
                        <thead class="sticky-top bg-light">
                            <tr>
                                <th class="permission-col" style="width: 300px;">
                                    <div class="d-flex align-items-center">
                                        <span>Permission</span>
                                        <button class="btn btn-sm btn-link ms-auto" onclick="toggleAllPermissions()">
                                            <i class="fas fa-sort-alpha-down"></i>
                                        </button>
                                    </div>
                                </th>
                                <th class="role-col text-center" style="width: 120px;">
                                    <div class="role-header">
                                        <div class="fw-bold">Super Admin</div>
                                        <small class="text-muted">Full Access</small>
                                    </div>
                                </th>
                                <th class="role-col text-center" style="width: 120px;">
                                    <div class="role-header">
                                        <div class="fw-bold">Tenant Admin</div>
                                        <small class="text-muted">Tenant Owner</small>
                                    </div>
                                </th>
                                <th class="role-col text-center" style="width: 120px;">
                                    <div class="role-header">
                                        <div class="fw-bold">Manager</div>
                                        <small class="text-muted">Account</small>
                                    </div>
                                </th>
                                <th class="role-col text-center" style="width: 120px;">
                                    <div class="role-header">
                                        <div class="fw-bold">Agency</div>
                                        <small class="text-muted">Professional</small>
                                    </div>
                                </th>
                                <th class="role-col text-center" style="width: 120px;">
                                    <div class="role-header">
                                        <div class="fw-bold">Talent</div>
                                        <small class="text-muted">Individual</small>
                                    </div>
                                </th>
                                <th class="role-col text-center" style="width: 120px;">
                                    <div class="role-header">
                                        <div class="fw-bold">Guardian</div>
                                        <small class="text-muted">Parent</small>
                                    </div>
                                </th>
                                <th class="role-col text-center" style="width: 120px;">
                                    <div class="role-header">
                                        <div class="fw-bold">Guest</div>
                                        <small class="text-muted">Public</small>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- User Management Section -->
                            <tr class="section-header">
                                <td colspan="8" class="bg-light fw-bold">
                                    <i class="fas fa-users me-2"></i> User Management
                                </td>
                            </tr>
                            <tr>
                                <td class="permission-name">
                                    <div class="d-flex align-items-center">
                                        <code class="small">user.profile.view</code>
                                        <span class="ms-2 text-muted">View user profiles</span>
                                    </div>
                                </td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                            </tr>
                            <tr>
                                <td class="permission-name">
                                    <div class="d-flex align-items-center">
                                        <code class="small">user.profile.edit</code>
                                        <span class="ms-2 text-muted">Edit own profile</span>
                                    </div>
                                </td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                            </tr>
                            <tr>
                                <td class="permission-name">
                                    <div class="d-flex align-items-center">
                                        <code class="small">user.profile.delete</code>
                                        <span class="ms-2 text-muted">Delete user accounts</span>
                                    </div>
                                </td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                            </tr>
                            
                            <!-- Content Management Section -->
                            <tr class="section-header">
                                <td colspan="8" class="bg-light fw-bold">
                                    <i class="fas fa-file-alt me-2"></i> Content Management
                                </td>
                            </tr>
                            <tr>
                                <td class="permission-name">
                                    <div class="d-flex align-items-center">
                                        <code class="small">content.portfolio.create</code>
                                        <span class="ms-2 text-muted">Create portfolios</span>
                                    </div>
                                </td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                            </tr>
                            <tr>
                                <td class="permission-name">
                                    <div class="d-flex align-items-center">
                                        <code class="small">content.comp_card.create</code>
                                        <span class="ms-2 text-muted">Create comp cards</span>
                                    </div>
                                </td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-minus text-warning" title="Limited"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                            </tr>
                            
                            <!-- Marketplace Section -->
                            <tr class="section-header">
                                <td colspan="8" class="bg-light fw-bold">
                                    <i class="fas fa-shopping-cart me-2"></i> Marketplace
                                </td>
                            </tr>
                            <tr>
                                <td class="permission-name">
                                    <div class="d-flex align-items-center">
                                        <code class="small">marketplace.products.list</code>
                                        <span class="ms-2 text-muted">View marketplace products</span>
                                    </div>
                                </td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                            </tr>
                            <tr>
                                <td class="permission-name">
                                    <div class="d-flex align-items-center">
                                        <code class="small">marketplace.products.create</code>
                                        <span class="ms-2 text-muted">Create marketplace listings</span>
                                    </div>
                                </td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-minus text-warning" title="With approval"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                            </tr>
                            
                            <!-- Platform Administration -->
                            <tr class="section-header">
                                <td colspan="8" class="bg-light fw-bold">
                                    <i class="fas fa-cogs me-2"></i> Platform Administration
                                </td>
                            </tr>
                            <tr>
                                <td class="permission-name">
                                    <div class="d-flex align-items-center">
                                        <code class="small">admin.settings.view</code>
                                        <span class="ms-2 text-muted">View platform settings</span>
                                    </div>
                                </td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                            </tr>
                            <tr>
                                <td class="permission-name">
                                    <div class="d-flex align-items-center">
                                        <code class="small">admin.settings.edit</code>
                                        <span class="ms-2 text-muted">Modify platform settings</span>
                                    </div>
                                </td>
                                <td class="text-center"><i class="fas fa-check text-success"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                                <td class="text-center"><i class="fas fa-times text-danger"></i></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Legend -->
        <div class="card mt-3">
            <div class="card-body">
                <h6 class="card-title">Legend</h6>
                <div class="d-flex gap-4">
                    <div><i class="fas fa-check text-success me-2"></i> Full Access</div>
                    <div><i class="fas fa-minus text-warning me-2"></i> Limited Access</div>
                    <div><i class="fas fa-times text-danger me-2"></i> No Access</div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.permission-matrix {
    font-size: 0.875rem;
}

.permission-matrix thead th {
    border-bottom: 2px solid #dee2e6;
    font-weight: 600;
}

.role-header {
    line-height: 1.2;
}

.section-header td {
    padding: 0.75rem;
    border-left: 4px solid #0d6efd;
}

.permission-name code {
    background-color: #f8f9fa;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Consolas', monospace;
}

.permission-matrix tbody tr:hover {
    background-color: #f8f9fa;
}

.permission-matrix td {
    vertical-align: middle;
}

/* Make the permission column sticky */
.permission-col {
    position: sticky;
    left: 0;
    background-color: white;
    z-index: 1;
}

.permission-matrix tbody tr:hover .permission-col {
    background-color: #f8f9fa;
}

/* Interactive checkboxes instead of icons (optional enhancement) */
.permission-toggle {
    width: 20px;
    height: 20px;
    cursor: pointer;
}
</style>

<script>
function filterMatrix() {
    const moduleFilter = document.getElementById('moduleFilter').value;
    const roleFilter = document.getElementById('roleFilter').value;
    
    // Implementation for filtering
    console.log('Filtering by module:', moduleFilter, 'and role:', roleFilter);
}

function searchMatrix(query) {
    // Implementation for search
    console.log('Searching for:', query);
}

function exportMatrix() {
    alert('Export functionality would generate a CSV or PDF of the permission matrix');
}

function saveChanges() {
    alert('Save functionality would persist any permission changes made in the matrix');
}

function toggleAllPermissions() {
    alert('Toggle between expanded/collapsed view of permissions');
}
</script>

<?php echo renderFooter(); ?>