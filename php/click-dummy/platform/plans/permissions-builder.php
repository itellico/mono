<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

// Sample permissions structure
$permissionsConfig = [
    'categories' => [
        'feature' => [
            'name' => 'Feature Access',
            'description' => 'Control access to platform features',
            'icon' => 'puzzle-piece'
        ],
        'data' => [
            'name' => 'Data Operations',
            'description' => 'CRUD operations on different data types',
            'icon' => 'database'
        ],
        'admin' => [
            'name' => 'Administrative',
            'description' => 'Administrative and management functions',
            'icon' => 'shield-alt'
        ],
        'api' => [
            'name' => 'API Access',
            'description' => 'API endpoints and integration permissions',
            'icon' => 'plug'
        ]
    ],
    'permissions' => [
        // Feature permissions
        'feature.comp_card.access' => [
            'name' => 'Comp Card Access',
            'description' => 'Can view and use comp card feature',
            'category' => 'feature',
            'related_limits' => ['comp_cards', 'comp_card_images']
        ],
        'feature.comp_card.create' => [
            'name' => 'Create Comp Cards',
            'description' => 'Can create new comp cards',
            'category' => 'feature',
            'related_limits' => ['comp_cards']
        ],
        'feature.comp_card.delete' => [
            'name' => 'Delete Comp Cards',
            'description' => 'Can delete comp cards',
            'category' => 'feature',
            'related_limits' => []
        ],
        'feature.portfolio.access' => [
            'name' => 'Portfolio Access',
            'description' => 'Can view and use portfolio feature',
            'category' => 'feature',
            'related_limits' => ['portfolios', 'media_files', 'storage']
        ],
        'feature.booking.access' => [
            'name' => 'Booking System Access',
            'description' => 'Can use booking and scheduling features',
            'category' => 'feature',
            'related_limits' => ['projects', 'jobs', 'castings']
        ],
        'feature.messaging.access' => [
            'name' => 'Messaging Access',
            'description' => 'Can send and receive messages',
            'category' => 'feature',
            'related_limits' => ['notifications']
        ],
        'feature.analytics.access' => [
            'name' => 'Analytics Access',
            'description' => 'Can view analytics and reports',
            'category' => 'feature',
            'related_limits' => ['api_calls']
        ],
        
        // Data permissions
        'data.users.read' => [
            'name' => 'View Users',
            'description' => 'Can view user profiles and lists',
            'category' => 'data',
            'related_limits' => []
        ],
        'data.users.create' => [
            'name' => 'Create Users',
            'description' => 'Can create new users',
            'category' => 'data',
            'related_limits' => ['users', 'seats']
        ],
        'data.users.update' => [
            'name' => 'Update Users',
            'description' => 'Can edit user information',
            'category' => 'data',
            'related_limits' => []
        ],
        'data.users.delete' => [
            'name' => 'Delete Users',
            'description' => 'Can delete users',
            'category' => 'data',
            'related_limits' => []
        ],
        
        // Admin permissions
        'admin.accounts.manage' => [
            'name' => 'Manage Accounts',
            'description' => 'Can manage account settings and users',
            'category' => 'admin',
            'related_limits' => ['accounts']
        ],
        'admin.billing.access' => [
            'name' => 'Billing Access',
            'description' => 'Can view and manage billing',
            'category' => 'admin',
            'related_limits' => []
        ],
        'admin.settings.manage' => [
            'name' => 'Manage Settings',
            'description' => 'Can change system settings',
            'category' => 'admin',
            'related_limits' => []
        ],
        
        // API permissions
        'api.rest.access' => [
            'name' => 'REST API Access',
            'description' => 'Can use REST API endpoints',
            'category' => 'api',
            'related_limits' => ['api_calls']
        ],
        'api.webhooks.manage' => [
            'name' => 'Manage Webhooks',
            'description' => 'Can create and manage webhooks',
            'category' => 'api',
            'related_limits' => ['integrations']
        ]
    ]
];

// Load limits configuration for reference
$limitsConfig = json_decode(file_get_contents('../config/limits-config.json'), true);

echo renderHeader("Permissions Builder - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'plans/permissions-builder.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Subscription Plans', 'href' => 'index.php'],
            ['label' => 'Permissions Builder']
        ]);
        
        echo createHeroSection(
            "Permissions Builder",
            "Define feature access permissions and connect them with usage limits for comprehensive access control",
            "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&h=300&fit=crop",
            [
                ['label' => 'New Permission', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Import Permissions', 'icon' => 'fas fa-upload', 'style' => 'info'],
                ['label' => 'Permission Matrix', 'icon' => 'fas fa-th', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Permission Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Permissions', count($permissionsConfig['permissions']), 'fas fa-lock', 'primary');
            echo createStatCard('Categories', count($permissionsConfig['categories']), 'fas fa-folder', 'success');
            echo createStatCard('Connected Limits', '24', 'fas fa-link', 'info');
            echo createStatCard('Permission Sets', '6', 'fas fa-layer-group', 'warning');
            ?>
        </div>
        
        <div class="row">
            <!-- Main Content -->
            <div class="col-lg-9">
                <!-- Permission Management -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="fas fa-lock text-primary me-2"></i> Permission Management
                        </h5>
                    </div>
                    <div class="card-body">
                        <!-- Permission Categories Tabs -->
                        <ul class="nav nav-tabs mb-4" id="permissionCategoryTabs" role="tablist">
                            <?php 
                            $first = true;
                            foreach ($permissionsConfig['categories'] as $categoryId => $category): 
                            ?>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link <?= $first ? 'active' : '' ?>" 
                                        id="<?= $categoryId ?>-tab" 
                                        data-bs-toggle="tab" 
                                        data-bs-target="#<?= $categoryId ?>-permissions" 
                                        type="button">
                                    <i class="fas fa-<?= $category['icon'] ?> me-1"></i> <?= $category['name'] ?>
                                </button>
                            </li>
                            <?php 
                            $first = false;
                            endforeach; 
                            ?>
                        </ul>
                        
                        <!-- Permission Content -->
                        <div class="tab-content" id="permissionCategoryContent">
                            <?php 
                            $first = true;
                            foreach ($permissionsConfig['categories'] as $categoryId => $category): 
                            ?>
                            <div class="tab-pane fade <?= $first ? 'show active' : '' ?>" 
                                 id="<?= $categoryId ?>-permissions" 
                                 role="tabpanel">
                                <div class="row g-3">
                                    <?php 
                                    foreach ($permissionsConfig['permissions'] as $permissionKey => $permission):
                                        if ($permission['category'] !== $categoryId) continue;
                                    ?>
                                    <div class="col-12">
                                        <div class="card border permission-card" data-permission-key="<?= $permissionKey ?>">
                                            <div class="card-body">
                                                <div class="row align-items-center">
                                                    <div class="col-md-6">
                                                        <h6 class="mb-1">
                                                            <i class="fas fa-key text-<?= $categoryId === 'admin' ? 'danger' : ($categoryId === 'api' ? 'warning' : 'primary') ?> me-2"></i>
                                                            <?= htmlspecialchars($permission['name']) ?>
                                                        </h6>
                                                        <p class="text-muted mb-2"><?= htmlspecialchars($permission['description']) ?></p>
                                                        <code class="small"><?= $permissionKey ?></code>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <?php if (!empty($permission['related_limits'])): ?>
                                                        <div>
                                                            <small class="text-muted d-block mb-1">Related Limits:</small>
                                                            <?php foreach ($permission['related_limits'] as $limitId): ?>
                                                                <?php if (isset($limitsConfig['limit_types'][$limitId])): ?>
                                                                <span class="badge bg-light text-dark me-1">
                                                                    <i class="fas fa-sliders-h me-1"></i>
                                                                    <?= $limitsConfig['limit_types'][$limitId]['name'] ?>
                                                                </span>
                                                                <?php endif; ?>
                                                            <?php endforeach; ?>
                                                        </div>
                                                        <?php else: ?>
                                                        <small class="text-muted">No related limits</small>
                                                        <?php endif; ?>
                                                    </div>
                                                    <div class="col-md-2 text-end">
                                                        <div class="btn-group btn-group-sm">
                                                            <button class="btn btn-outline-primary" onclick="editPermission('<?= $permissionKey ?>')" title="Edit">
                                                                <i class="fas fa-edit"></i>
                                                            </button>
                                                            <button class="btn btn-outline-info" onclick="showPermissionMatrix('<?= $permissionKey ?>')" title="Matrix">
                                                                <i class="fas fa-th"></i>
                                                            </button>
                                                            <button class="btn btn-outline-danger" onclick="deletePermission('<?= $permissionKey ?>')" title="Delete">
                                                                <i class="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            <?php 
                            $first = false;
                            endforeach; 
                            ?>
                        </div>
                    </div>
                </div>
                
                <!-- Permission to Feature Mapping -->
                <div class="card mt-4">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="fas fa-project-diagram text-success me-2"></i> Permission-Feature-Limit Relationships
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info mb-4">
                            <h6 class="alert-heading"><i class="fas fa-info-circle me-2"></i>Best Practice Pattern</h6>
                            <div class="row g-3 mt-1">
                                <div class="col-md-4">
                                    <strong>1️⃣ Permission</strong><br>
                                    <small>Controls access (Yes/No)</small><br>
                                    <code>feature.comp_card.access</code>
                                </div>
                                <div class="col-md-4">
                                    <strong>2️⃣ Feature</strong><br>
                                    <small>Groups permissions</small><br>
                                    <code>Comp Card Management</code>
                                </div>
                                <div class="col-md-4">
                                    <strong>3️⃣ Limits</strong><br>
                                    <small>Controls quantity</small><br>
                                    <code>comp_cards: 5, images: 10</code>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Example Mapping -->
                        <h6 class="mb-3">Example: Comp Card Feature</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Permission</th>
                                        <th>Description</th>
                                        <th>Connected Limits</th>
                                        <th>Logic</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><code>feature.comp_card.access</code></td>
                                        <td>Can use comp cards?</td>
                                        <td>
                                            <span class="badge bg-light text-dark">comp_cards</span>
                                            <span class="badge bg-light text-dark">comp_card_images</span>
                                        </td>
                                        <td><small>If NO → feature hidden<br>If YES → check limits</small></td>
                                    </tr>
                                    <tr>
                                        <td><code>feature.comp_card.create</code></td>
                                        <td>Can create new?</td>
                                        <td><span class="badge bg-light text-dark">comp_cards</span></td>
                                        <td><small>If YES + limit > 0 → show create button</small></td>
                                    </tr>
                                    <tr>
                                        <td><code>feature.comp_card.delete</code></td>
                                        <td>Can delete?</td>
                                        <td><small class="text-muted">None</small></td>
                                        <td><small>Binary permission only</small></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Sidebar -->
            <div class="col-lg-3">
                <!-- Quick Actions -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-tools text-primary me-2"></i> Quick Actions
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary btn-sm" onclick="createNewPermission()">
                                <i class="fas fa-plus me-1"></i> Create Permission
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="generateFromFeatures()">
                                <i class="fas fa-magic me-1"></i> Generate from Features
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="showPermissionMatrix()">
                                <i class="fas fa-th me-1"></i> Permission Matrix
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="exportPermissions()">
                                <i class="fas fa-download me-1"></i> Export Permissions
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Permission Sets -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-layer-group text-warning me-2"></i> Permission Sets
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2 mb-3">
                            <button class="btn btn-outline-primary btn-sm" onclick="loadPermissionSet('basic')">
                                <i class="fas fa-user me-1"></i> Basic User
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="loadPermissionSet('professional')">
                                <i class="fas fa-briefcase me-1"></i> Professional
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="loadPermissionSet('agency')">
                                <i class="fas fa-users me-1"></i> Agency Admin
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="loadPermissionSet('platform')">
                                <i class="fas fa-crown me-1"></i> Platform Admin
                            </button>
                        </div>
                        
                        <hr>
                        
                        <small class="text-muted">
                            Permission sets are pre-configured bundles of permissions for common user types.
                        </small>
                    </div>
                </div>
                
                <!-- Best Practices -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-lightbulb text-info me-2"></i> Best Practices
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>✅ DO:</strong>
                            <ul class="small mb-0">
                                <li>Use permissions for access control</li>
                                <li>Use limits for quantity control</li>
                                <li>Follow naming convention</li>
                                <li>Connect related limits</li>
                            </ul>
                        </div>
                        
                        <div>
                            <strong>❌ DON'T:</strong>
                            <ul class="small mb-0">
                                <li>Use limit = 0 for access denial</li>
                                <li>Mix permissions and limits</li>
                                <li>Create redundant permissions</li>
                                <li>Forget to document</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Create/Edit Permission Modal -->
<div class="modal fade" id="permissionModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="permissionModalTitle">Create New Permission</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="permissionForm">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Permission Name</label>
                            <input type="text" class="form-control" id="permissionName" placeholder="e.g., Create Comp Cards">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="permissionCategory">
                                <option value="feature">Feature Access</option>
                                <option value="data">Data Operations</option>
                                <option value="admin">Administrative</option>
                                <option value="api">API Access</option>
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Permission Key</label>
                            <input type="text" class="form-control font-monospace" id="permissionKey" placeholder="feature.comp_card.create">
                            <small class="text-muted">Format: category.resource.action</small>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="permissionDescription" rows="2" placeholder="Describe what this permission allows..."></textarea>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Related Limits</label>
                            <select class="form-select" id="permissionLimits" multiple size="5">
                                <?php foreach ($limitsConfig['limit_types'] as $limitId => $limit): ?>
                                <option value="<?= $limitId ?>"><?= $limit['name'] ?> (<?= $limit['category'] ?>)</option>
                                <?php endforeach; ?>
                            </select>
                            <small class="text-muted">Hold Ctrl/Cmd to select multiple limits that work with this permission</small>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="savePermission()">Save Permission</button>
            </div>
        </div>
    </div>
</div>

<script>
// Configuration data
const permissionsConfig = <?= json_encode($permissionsConfig) ?>;
const limitsConfig = <?= json_encode($limitsConfig) ?>;

// Current edit state
let currentEditPermission = null;

// Create new permission
function createNewPermission() {
    currentEditPermission = null;
    document.getElementById('permissionModalTitle').textContent = 'Create New Permission';
    document.getElementById('permissionForm').reset();
    new bootstrap.Modal(document.getElementById('permissionModal')).show();
}

// Edit permission
function editPermission(permissionKey) {
    currentEditPermission = permissionKey;
    const permission = permissionsConfig.permissions[permissionKey];
    
    document.getElementById('permissionModalTitle').textContent = 'Edit Permission';
    document.getElementById('permissionName').value = permission.name;
    document.getElementById('permissionCategory').value = permission.category;
    document.getElementById('permissionKey').value = permissionKey;
    document.getElementById('permissionDescription').value = permission.description;
    
    // Set selected limits
    const limitSelect = document.getElementById('permissionLimits');
    Array.from(limitSelect.options).forEach(option => {
        option.selected = permission.related_limits.includes(option.value);
    });
    
    new bootstrap.Modal(document.getElementById('permissionModal')).show();
}

// Save permission
function savePermission() {
    const selectedLimits = Array.from(document.getElementById('permissionLimits').selectedOptions)
        .map(option => option.value);
    
    const permissionData = {
        name: document.getElementById('permissionName').value,
        category: document.getElementById('permissionCategory').value,
        key: document.getElementById('permissionKey').value,
        description: document.getElementById('permissionDescription').value,
        related_limits: selectedLimits
    };
    
    const action = currentEditPermission ? 'updated' : 'created';
    alert(`Permission "${permissionData.name}" ${action} successfully!\\n\\nKey: ${permissionData.key}\\nRelated Limits: ${selectedLimits.length}\\n\\nThis would update the permission configuration.`);
    
    bootstrap.Modal.getInstance(document.getElementById('permissionModal')).hide();
}

// Delete permission
function deletePermission(permissionKey) {
    const permission = permissionsConfig.permissions[permissionKey];
    if (confirm(`Are you sure you want to delete the permission "${permission.name}"?\\n\\nThis may affect features and plans using this permission.`)) {
        alert(`Permission "${permission.name}" deleted successfully.`);
    }
}

// Generate permissions from features
function generateFromFeatures() {
    const message = `Generate Permissions from Features\\n\\nThis would analyze all features and automatically generate:\\n\\n`;
    const suggestions = [
        '• feature.[feature_id].access - Basic access permission',
        '• feature.[feature_id].create - Creation permission',
        '• feature.[feature_id].update - Update permission',
        '• feature.[feature_id].delete - Delete permission',
        '• feature.[feature_id].admin - Administrative permission'
    ];
    
    alert(message + suggestions.join('\\n'));
}

// Show permission matrix
function showPermissionMatrix(permissionKey) {
    if (permissionKey) {
        alert(`Permission Matrix for: ${permissionKey}\\n\\nThis would show:\\n• Which plans include this permission\\n• Which roles have this permission\\n• Usage statistics\\n• Dependency analysis`);
    } else {
        alert('Full Permission Matrix\\n\\nThis would display a comprehensive matrix showing:\\n• All permissions by plan tier\\n• Role assignments\\n• Feature dependencies\\n• Limit connections');
    }
}

// Load permission set
function loadPermissionSet(setType) {
    const sets = {
        basic: {
            name: 'Basic User',
            permissions: [
                'feature.comp_card.access',
                'feature.portfolio.access',
                'data.users.read'
            ]
        },
        professional: {
            name: 'Professional',
            permissions: [
                'feature.comp_card.access',
                'feature.comp_card.create',
                'feature.portfolio.access',
                'feature.booking.access',
                'feature.analytics.access',
                'data.users.read'
            ]
        },
        agency: {
            name: 'Agency Admin',
            permissions: [
                'feature.comp_card.access',
                'feature.comp_card.create',
                'feature.comp_card.delete',
                'feature.portfolio.access',
                'feature.booking.access',
                'feature.analytics.access',
                'data.users.read',
                'data.users.create',
                'data.users.update',
                'admin.accounts.manage'
            ]
        },
        platform: {
            name: 'Platform Admin',
            permissions: Object.keys(permissionsConfig.permissions)
        }
    };
    
    const set = sets[setType];
    alert(`Loading ${set.name} Permission Set\\n\\nThis would configure:\\n${set.permissions.length} permissions\\n\\nPermissions:\\n• ${set.permissions.slice(0, 5).join('\\n• ')}${set.permissions.length > 5 ? '\\n• ...' : ''}`);
}

// Export permissions
function exportPermissions() {
    const exportData = {
        permissions: permissionsConfig.permissions,
        categories: permissionsConfig.categories,
        exported: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'permissions-configuration.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

// Auto-generate permission key
document.getElementById('permissionName')?.addEventListener('input', function() {
    if (!currentEditPermission) {
        const category = document.getElementById('permissionCategory').value;
        const name = this.value.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_');
        
        // Try to extract resource and action
        const parts = name.split('_');
        let key = category + '.';
        
        if (parts.length >= 2) {
            key += parts.slice(0, -1).join('_') + '.' + parts[parts.length - 1];
        } else {
            key += name;
        }
        
        document.getElementById('permissionKey').value = key;
    }
});
</script>

<?php echo renderFooter(); ?>