<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Roles Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'access-control/roles.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Access Control', 'href' => 'index.php'],
            ['label' => 'Roles']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Roles Management</h2>
                <p class="text-muted mb-0">Define and manage system roles</p>
            </div>
            <button class="btn btn-primary" onclick="createNewRole()">
                <i class="fas fa-plus me-2"></i> Create Role
            </button>
        </div>

        <!-- Role Hierarchy Visualization -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Role Hierarchy</h5>
            </div>
            <div class="card-body">
                <div class="role-hierarchy">
                    <div class="hierarchy-level">
                        <div class="role-box super-admin">
                            <i class="fas fa-crown"></i>
                            <strong>Super Admin</strong>
                            <small>Platform owner - all tenants</small>
                        </div>
                    </div>
                    <div class="hierarchy-connector"></div>
                    <div class="hierarchy-level">
                        <div class="role-box tenant-admin">
                            <i class="fas fa-user-shield"></i>
                            <strong>Tenant Admin</strong>
                            <small>Manages their platform instance</small>
                        </div>
                    </div>
                    <div class="hierarchy-connector"></div>
                    <div class="hierarchy-level">
                        <div class="role-box manager">
                            <i class="fas fa-user-tie"></i>
                            <strong>Account Manager</strong>
                            <small>Manages accounts/teams</small>
                        </div>
                    </div>
                    <div class="hierarchy-connector"></div>
                    <div class="hierarchy-level d-flex justify-content-center gap-4">
                        <div class="role-box agency">
                            <i class="fas fa-building"></i>
                            <strong>Agency</strong>
                            <small>Professional account</small>
                        </div>
                        <div class="role-box talent">
                            <i class="fas fa-user"></i>
                            <strong>Talent</strong>
                            <small>Individual performer</small>
                        </div>
                        <div class="role-box guardian">
                            <i class="fas fa-user-friends"></i>
                            <strong>Guardian</strong>
                            <small>Parent/Guardian access</small>
                        </div>
                        <div class="role-box guest">
                            <i class="fas fa-user-circle"></i>
                            <strong>Guest</strong>
                            <small>Public access</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Roles List -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">All Roles</h5>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Role Name</th>
                                <th>Description</th>
                                <th>Type</th>
                                <th>Users</th>
                                <th>Permissions</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="role-icon super-admin-icon me-2">
                                            <i class="fas fa-crown"></i>
                                        </div>
                                        <div>
                                            <strong>Super Admin</strong>
                                            <div class="small text-muted">super_admin</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Complete system access with all permissions</td>
                                <td><span class="badge bg-danger">System</span></td>
                                <td>2 users</td>
                                <td>All permissions</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <button class="btn btn-sm btn-outline-secondary" disabled>
                                        <i class="fas fa-lock"></i>
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="role-icon tenant-admin-icon me-2">
                                            <i class="fas fa-user-shield"></i>
                                        </div>
                                        <div>
                                            <strong>Tenant Admin</strong>
                                            <div class="small text-muted">tenant_admin</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Full administration of their tenant instance</td>
                                <td><span class="badge bg-warning">Tenant</span></td>
                                <td>5 users</td>
                                <td>156 permissions</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="editRole('tenant_admin')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="role-icon manager-icon me-2">
                                            <i class="fas fa-user-tie"></i>
                                        </div>
                                        <div>
                                            <strong>Account Manager</strong>
                                            <div class="small text-muted">account_manager</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Manage users and content within their account</td>
                                <td><span class="badge bg-primary">Custom</span></td>
                                <td>23 users</td>
                                <td>84 permissions</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editRole('account_manager')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="cloneRole('account_manager')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="role-icon agency-icon me-2">
                                            <i class="fas fa-building"></i>
                                        </div>
                                        <div>
                                            <strong>Agency</strong>
                                            <div class="small text-muted">agency</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Professional agency account with team management</td>
                                <td><span class="badge bg-primary">Custom</span></td>
                                <td>156 users</td>
                                <td>67 permissions</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editRole('agency')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="cloneRole('agency')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="role-icon talent-icon me-2">
                                            <i class="fas fa-user"></i>
                                        </div>
                                        <div>
                                            <strong>Talent</strong>
                                            <div class="small text-muted">talent</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Individual talent/model account</td>
                                <td><span class="badge bg-primary">Custom</span></td>
                                <td>1,234 users</td>
                                <td>45 permissions</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editRole('talent')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="cloneRole('talent')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="role-icon guardian-icon me-2">
                                            <i class="fas fa-user-friends"></i>
                                        </div>
                                        <div>
                                            <strong>Guardian</strong>
                                            <div class="small text-muted">guardian</div>
                                        </div>
                                    </div>
                                </td>
                                <td>Parent/Guardian with oversight capabilities</td>
                                <td><span class="badge bg-primary">Custom</span></td>
                                <td>89 users</td>
                                <td>52 permissions</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editRole('guardian')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="cloneRole('guardian')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
/* Role Hierarchy Styles */
.role-hierarchy {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
}

.hierarchy-level {
    margin: 1rem 0;
}

.hierarchy-connector {
    width: 2px;
    height: 30px;
    background-color: #dee2e6;
}

.role-box {
    padding: 1rem 1.5rem;
    border-radius: 0.5rem;
    border: 2px solid;
    background-color: #fff;
    text-align: center;
    min-width: 150px;
    cursor: pointer;
    transition: all 0.2s;
}

.role-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.role-box i {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    display: block;
}

.role-box strong {
    display: block;
    margin-bottom: 0.25rem;
}

.role-box small {
    color: #6c757d;
}

/* Role specific colors */
.super-admin { border-color: #dc3545; color: #dc3545; }
.tenant-admin { border-color: #fd7e14; color: #fd7e14; }
.manager { border-color: #0d6efd; color: #0d6efd; }
.agency { border-color: #20c997; color: #20c997; }
.talent { border-color: #ffc107; color: #ffc107; }
.guardian { border-color: #6f42c1; color: #6f42c1; }
.guest { border-color: #6c757d; color: #6c757d; }

/* Role icon styles */
.role-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
}

.super-admin-icon { background-color: #dc3545; color: white; }
.tenant-admin-icon { background-color: #fd7e14; color: white; }
.manager-icon { background-color: #0d6efd; color: white; }
.agency-icon { background-color: #20c997; color: white; }
.talent-icon { background-color: #ffc107; color: white; }
.guardian-icon { background-color: #6f42c1; color: white; }
</style>

<script>
function createNewRole() {
    alert('Open modal to create a new role with:\n- Role name\n- Description\n- Parent role (for inheritance)\n- Initial permissions');
}

function editRole(roleId) {
    alert('Edit role: ' + roleId + '\n\nWould show:\n- Role details\n- Permission assignment\n- User assignment\n- Inheritance settings');
}

function cloneRole(roleId) {
    alert('Clone role: ' + roleId + '\n\nCreate a new role based on this one');
}
</script>

<?php echo renderFooter(); ?>