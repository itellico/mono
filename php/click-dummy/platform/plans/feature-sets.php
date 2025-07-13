<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

// Load limits configuration
$limitsConfig = json_decode(file_get_contents('../config/limits-config.json'), true);

echo renderHeader("Feature Sets Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'plans/feature-sets.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Subscription Plans', 'href' => 'index.php'],
            ['label' => 'Feature Sets']
        ]);
        
        echo createHeroSection(
            "Feature Sets Management",
            "Create and manage reusable feature bundles for subscription plans with configurable limits and dependencies",
            "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Feature Set', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Import Features', 'icon' => 'fas fa-upload', 'style' => 'info'],
                ['label' => 'Export Sets', 'icon' => 'fas fa-download', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Feature Sets Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Feature Sets', '6', 'fas fa-layer-group', 'primary');
            echo createStatCard('Total Features', '150+', 'fas fa-puzzle-piece', 'success');
            echo createStatCard('Used in Plans', '12', 'fas fa-tags', 'info');
            echo createStatCard('Dependencies', '24', 'fas fa-link', 'warning');
            ?>
        </div>
        
        <div class="row">
            <!-- Feature Sets List -->
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Feature Sets Library</h5>
                        <div class="btn-group">
                            <button class="btn btn-primary" onclick="createFeatureSet()">
                                <i class="fas fa-plus me-2"></i> Create Feature Set
                            </button>
                            <button class="btn btn-outline-secondary" onclick="bulkActions()">
                                <i class="fas fa-list me-2"></i> Bulk Actions
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <?php foreach ($limitsConfig['feature_sets'] as $setId => $featureSet): ?>
                            <div class="col-md-6">
                                <div class="card border h-100 feature-set-item" data-set-id="<?= $setId ?>">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-3">
                                            <div>
                                                <h6 class="card-title mb-1"><?= htmlspecialchars($featureSet['name']) ?></h6>
                                                <span class="badge bg-primary"><?= count($featureSet['features']) ?> features</span>
                                                <span class="badge bg-info"><?= count($featureSet['required_limits']) ?> limits</span>
                                            </div>
                                            <div class="dropdown">
                                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                    Actions
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item" href="#" onclick="editFeatureSet('<?= $setId ?>')"><i class="fas fa-edit me-2"></i> Edit</a></li>
                                                    <li><a class="dropdown-item" href="#" onclick="duplicateFeatureSet('<?= $setId ?>')"><i class="fas fa-copy me-2"></i> Duplicate</a></li>
                                                    <li><a class="dropdown-item" href="#" onclick="viewUsage('<?= $setId ?>')"><i class="fas fa-chart-bar me-2"></i> Usage Stats</a></li>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li><a class="dropdown-item text-danger" href="#" onclick="deleteFeatureSet('<?= $setId ?>')"><i class="fas fa-trash me-2"></i> Delete</a></li>
                                                </ul>
                                            </div>
                                        </div>
                                        
                                        <p class="text-muted small mb-3"><?= htmlspecialchars($featureSet['description']) ?></p>
                                        
                                        <!-- Features List -->
                                        <div class="mb-3">
                                            <strong class="small">Included Features:</strong>
                                            <div class="mt-1" style="max-height: 120px; overflow-y: auto;">
                                                <?php foreach (array_slice($featureSet['features'], 0, 5) as $feature): ?>
                                                    <div class="small mb-1">
                                                        <i class="fas fa-check text-success me-2"></i> <?= ucwords(str_replace('_', ' ', $feature)) ?>
                                                    </div>
                                                <?php endforeach; ?>
                                                <?php if (count($featureSet['features']) > 5): ?>
                                                    <div class="small text-muted">
                                                        ... and <?= count($featureSet['features']) - 5 ?> more features
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                        
                                        <!-- Required Limits -->
                                        <div class="mb-3">
                                            <strong class="small">Required Limits:</strong>
                                            <div class="mt-1">
                                                <?php foreach ($featureSet['required_limits'] as $limitId): ?>
                                                    <span class="badge bg-light text-dark me-1"><?= ucwords(str_replace('_', ' ', $limitId)) ?></span>
                                                <?php endforeach; ?>
                                            </div>
                                        </div>
                                        
                                        <!-- Usage Stats -->
                                        <div class="d-flex justify-content-between align-items-center">
                                            <small class="text-muted">Used in <?= rand(1, 8) ?> plans</small>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" onclick="editFeatureSet('<?= $setId ?>')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-success" onclick="testFeatureSet('<?= $setId ?>')">
                                                    <i class="fas fa-vial"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Feature Set Editor -->
            <div class="col-lg-4">
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-plus text-primary me-2"></i> Create Feature Set
                        </h6>
                    </div>
                    <div class="card-body">
                        <form id="featureSetForm">
                            <div class="mb-3">
                                <label class="form-label">Set Name</label>
                                <input type="text" class="form-control" id="setName" placeholder="e.g., Premium Features">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="setDescription" rows="3" placeholder="Describe this feature set..."></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-select" id="setCategory">
                                    <option value="core">Core Features</option>
                                    <option value="professional">Professional</option>
                                    <option value="agency">Agency</option>
                                    <option value="enterprise">Enterprise</option>
                                    <option value="marketplace">Marketplace</option>
                                    <option value="communication">Communication</option>
                                </select>
                            </div>
                            <button type="button" class="btn btn-primary w-100" onclick="saveFeatureSet()">
                                <i class="fas fa-save me-2"></i> Create Feature Set
                            </button>
                        </form>
                    </div>
                </div>
                
                <!-- Feature Library -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-puzzle-piece text-success me-2"></i> Available Features
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <input type="text" class="form-control form-control-sm" placeholder="Search features..." id="featureSearch">
                        </div>
                        <div class="feature-library" style="max-height: 300px; overflow-y: auto;">
                            <!-- Core Features -->
                            <div class="mb-3">
                                <strong class="small text-primary">Core Features</strong>
                                <div class="mt-1">
                                    <div class="form-check form-check-sm">
                                        <input class="form-check-input" type="checkbox" id="feature-user-management">
                                        <label class="form-check-label small" for="feature-user-management">User Management</label>
                                    </div>
                                    <div class="form-check form-check-sm">
                                        <input class="form-check-input" type="checkbox" id="feature-basic-search">
                                        <label class="form-check-label small" for="feature-basic-search">Basic Search</label>
                                    </div>
                                    <div class="form-check form-check-sm">
                                        <input class="form-check-input" type="checkbox" id="feature-profile-creation">
                                        <label class="form-check-label small" for="feature-profile-creation">Profile Creation</label>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Professional Features -->
                            <div class="mb-3">
                                <strong class="small text-info">Professional Features</strong>
                                <div class="mt-1">
                                    <div class="form-check form-check-sm">
                                        <input class="form-check-input" type="checkbox" id="feature-advanced-search">
                                        <label class="form-check-label small" for="feature-advanced-search">Advanced Search</label>
                                    </div>
                                    <div class="form-check form-check-sm">
                                        <input class="form-check-input" type="checkbox" id="feature-portfolio-builder">
                                        <label class="form-check-label small" for="feature-portfolio-builder">Portfolio Builder</label>
                                    </div>
                                    <div class="form-check form-check-sm">
                                        <input class="form-check-input" type="checkbox" id="feature-analytics-basic">
                                        <label class="form-check-label small" for="feature-analytics-basic">Basic Analytics</label>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Marketplace Features -->
                            <div class="mb-3">
                                <strong class="small text-warning">Marketplace Features</strong>
                                <div class="mt-1">
                                    <div class="form-check form-check-sm">
                                        <input class="form-check-input" type="checkbox" id="feature-booking-system">
                                        <label class="form-check-label small" for="feature-booking-system">Booking System</label>
                                    </div>
                                    <div class="form-check form-check-sm">
                                        <input class="form-check-input" type="checkbox" id="feature-payment-gateway">
                                        <label class="form-check-label small" for="feature-payment-gateway">Payment Gateway</label>
                                    </div>
                                    <div class="form-check form-check-sm">
                                        <input class="form-check-input" type="checkbox" id="feature-commission-management">
                                        <label class="form-check-label small" for="feature-commission-management">Commission Management</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-outline-primary btn-sm w-100 mt-2" onclick="selectAllFeatures()">
                            <i class="fas fa-check-double me-1"></i> Select Visible Features
                        </button>
                    </div>
                </div>
                
                <!-- Required Limits -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-sliders-h text-warning me-2"></i> Required Limits
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <small class="text-muted">Select limits that must be configured when this feature set is used:</small>
                        </div>
                        <div class="limits-selection" style="max-height: 200px; overflow-y: auto;">
                            <?php foreach ($limitsConfig['limit_types'] as $limitId => $limitType): ?>
                            <div class="form-check form-check-sm mb-1">
                                <input class="form-check-input" type="checkbox" id="limit-req-<?= $limitId ?>">
                                <label class="form-check-label small" for="limit-req-<?= $limitId ?>">
                                    <?= htmlspecialchars($limitType['name']) ?>
                                </label>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Feature Set Edit Modal -->
<div class="modal fade" id="editFeatureSetModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Feature Set</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Feature Set Name</label>
                            <input type="text" class="form-control" id="editSetName">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="editSetDescription" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Priority</label>
                            <select class="form-select" id="editSetPriority">
                                <option value="low">Low Priority</option>
                                <option value="medium">Medium Priority</option>
                                <option value="high">High Priority</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Compatibility</label>
                            <select class="form-select" id="editSetCompatibility">
                                <option value="all">All Plan Types</option>
                                <option value="paid">Paid Plans Only</option>
                                <option value="enterprise">Enterprise Only</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <h6>Features</h6>
                        <div class="border rounded p-2" style="height: 200px; overflow-y: auto;">
                            <div id="editFeaturesList">
                                <!-- Features will be loaded here -->
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Required Limits</h6>
                        <div class="border rounded p-2" style="height: 200px; overflow-y: auto;">
                            <div id="editLimitsList">
                                <!-- Limits will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="updateFeatureSet()">Save Changes</button>
            </div>
        </div>
    </div>
</div>

<script>
// Load the limits configuration
const limitsConfig = <?= json_encode($limitsConfig) ?>;

let currentEditingSet = null;

// Feature set management functions
function createFeatureSet() {
    // Scroll to create form
    document.getElementById('setName').focus();
}

function saveFeatureSet() {
    const name = document.getElementById('setName').value;
    const description = document.getElementById('setDescription').value;
    const category = document.getElementById('setCategory').value;
    
    if (!name || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Get selected features
    const selectedFeatures = [];
    document.querySelectorAll('.feature-library input[type="checkbox"]:checked').forEach(checkbox => {
        selectedFeatures.push(checkbox.id.replace('feature-', '').replace(/-/g, '_'));
    });
    
    // Get required limits
    const requiredLimits = [];
    document.querySelectorAll('.limits-selection input[type="checkbox"]:checked').forEach(checkbox => {
        requiredLimits.push(checkbox.id.replace('limit-req-', ''));
    });
    
    if (selectedFeatures.length === 0) {
        alert('Please select at least one feature');
        return;
    }
    
    alert(`Feature Set Created Successfully!\n\nName: ${name}\nCategory: ${category}\nFeatures: ${selectedFeatures.length}\nRequired Limits: ${requiredLimits.length}`);
    
    // Reset form
    document.getElementById('featureSetForm').reset();
    document.querySelectorAll('.feature-library input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.limits-selection input[type="checkbox"]').forEach(cb => cb.checked = false);
}

function editFeatureSet(setId) {
    currentEditingSet = setId;
    const featureSet = limitsConfig.feature_sets[setId];
    
    // Populate form
    document.getElementById('editSetName').value = featureSet.name;
    document.getElementById('editSetDescription').value = featureSet.description;
    
    // Load features
    const featuresContainer = document.getElementById('editFeaturesList');
    featuresContainer.innerHTML = featureSet.features.map(feature => 
        `<div class="form-check form-check-sm mb-1">
            <input class="form-check-input" type="checkbox" checked id="edit-feature-${feature}">
            <label class="form-check-label small">${feature.replace(/_/g, ' ')}</label>
        </div>`
    ).join('');
    
    // Load limits
    const limitsContainer = document.getElementById('editLimitsList');
    limitsContainer.innerHTML = featureSet.required_limits.map(limitId => 
        `<div class="form-check form-check-sm mb-1">
            <input class="form-check-input" type="checkbox" checked id="edit-limit-${limitId}">
            <label class="form-check-label small">${limitsConfig.limit_types[limitId].name}</label>
        </div>`
    ).join('');
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editFeatureSetModal'));
    modal.show();
}

function updateFeatureSet() {
    if (!currentEditingSet) return;
    
    alert(`Feature Set "${currentEditingSet}" updated successfully!`);
    
    // Hide modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('editFeatureSetModal'));
    modal.hide();
}

function duplicateFeatureSet(setId) {
    const featureSet = limitsConfig.feature_sets[setId];
    alert(`Duplicating "${featureSet.name}"...\n\nThis will create a copy of the feature set with all features and limits.`);
}

function deleteFeatureSet(setId) {
    const featureSet = limitsConfig.feature_sets[setId];
    if (confirm(`Are you sure you want to delete "${featureSet.name}"?\n\nThis action cannot be undone and may affect existing plans.`)) {
        alert(`Feature Set "${featureSet.name}" deleted successfully!`);
    }
}

function viewUsage(setId) {
    const featureSet = limitsConfig.feature_sets[setId];
    alert(`Usage Statistics for "${featureSet.name}":\n\n• Used in 3 active plans\n• 247 subscribers\n• €45,230 monthly revenue\n• Last modified: 2 days ago`);
}

function testFeatureSet(setId) {
    const featureSet = limitsConfig.feature_sets[setId];
    alert(`Testing Feature Set "${featureSet.name}":\n\n✓ All features are valid\n✓ Required limits are available\n✓ No conflicts detected\n✓ Dependencies satisfied`);
}

function bulkActions() {
    alert('Bulk Actions:\n\n• Export selected feature sets\n• Duplicate multiple sets\n• Update priorities\n• Batch delete\n• Import from JSON');
}

function selectAllFeatures() {
    const visibleCheckboxes = document.querySelectorAll('.feature-library input[type="checkbox"]:not([style*="display: none"])');
    visibleCheckboxes.forEach(checkbox => checkbox.checked = true);
}

// Feature search functionality
document.getElementById('featureSearch').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const featureItems = document.querySelectorAll('.feature-library .form-check');
    
    featureItems.forEach(item => {
        const label = item.querySelector('label').textContent.toLowerCase();
        if (label.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
});
</script>

<?php echo renderFooter(); ?>