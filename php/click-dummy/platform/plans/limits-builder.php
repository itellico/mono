<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

// Load limits configuration
$limitsConfig = json_decode(file_get_contents('../config/limits-config.json'), true);

echo renderHeader("Limits Builder - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'plans/limits-builder.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Subscription Plans', 'href' => 'index.php'],
            ['label' => 'Limits Builder']
        ]);
        
        echo createHeroSection(
            "Limits Builder",
            "Define and configure resource limits with values, units, and enforcement rules for subscription plans",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop",
            [
                ['label' => 'New Limit Type', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Import Limits', 'icon' => 'fas fa-upload', 'style' => 'info'],
                ['label' => 'Preset Templates', 'icon' => 'fas fa-layer-group', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Limits Builder Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Limit Types', count($limitsConfig['limit_types']), 'fas fa-sliders-h', 'primary');
            echo createStatCard('Categories', count(array_unique(array_column($limitsConfig['limit_types'], 'category'))), 'fas fa-folder', 'success');
            echo createStatCard('Presets', count($limitsConfig['predefined_limits']), 'fas fa-layer-group', 'info');
            echo createStatCard('Active Plans', '5', 'fas fa-tags', 'warning');
            ?>
        </div>
        
        <div class="row">
            <!-- Limits Configuration Interface -->
            <div class="col-lg-9">
                <!-- Limit Categories -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="fas fa-sliders-h text-primary me-2"></i> Limit Types Configuration
                        </h5>
                    </div>
                    <div class="card-body">
                        <!-- Category Tabs -->
                        <ul class="nav nav-tabs mb-4" id="limitCategoryTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="access-tab" data-bs-toggle="tab" data-bs-target="#access-limits" type="button">
                                    <i class="fas fa-users me-1"></i> Access Control
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="storage-tab" data-bs-toggle="tab" data-bs-target="#storage-limits" type="button">
                                    <i class="fas fa-database me-1"></i> Storage
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="usage-tab" data-bs-toggle="tab" data-bs-target="#usage-limits" type="button">
                                    <i class="fas fa-chart-line me-1"></i> Usage
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="business-tab" data-bs-toggle="tab" data-bs-target="#business-limits" type="button">
                                    <i class="fas fa-briefcase me-1"></i> Business
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="content-tab" data-bs-toggle="tab" data-bs-target="#content-limits" type="button">
                                    <i class="fas fa-images me-1"></i> Content
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="other-tab" data-bs-toggle="tab" data-bs-target="#other-limits" type="button">
                                    <i class="fas fa-ellipsis-h me-1"></i> Other
                                </button>
                            </li>
                        </ul>
                        
                        <!-- Category Content -->
                        <div class="tab-content" id="limitCategoryContent">
                            <?php 
                            $categories = [
                                'access' => ['icon' => 'users', 'name' => 'Access Control'],
                                'storage' => ['icon' => 'database', 'name' => 'Storage'],
                                'usage' => ['icon' => 'chart-line', 'name' => 'Usage'],
                                'business' => ['icon' => 'briefcase', 'name' => 'Business'],
                                'content' => ['icon' => 'images', 'name' => 'Content'],
                                'other' => ['icon' => 'ellipsis-h', 'name' => 'Other']
                            ];
                            
                            foreach ($categories as $categoryId => $categoryInfo): 
                                $isFirst = $categoryId === 'access';
                            ?>
                            <div class="tab-pane fade <?= $isFirst ? 'show active' : '' ?>" id="<?= $categoryId ?>-limits" role="tabpanel">
                                <div class="row g-3">
                                    <?php 
                                    foreach ($limitsConfig['limit_types'] as $limitId => $limitType): 
                                        // Show limits for current category, or all uncategorized limits in "other"
                                        $limitCategory = $limitType['category'] ?? 'other';
                                        if ($categoryId === 'other') {
                                            if (in_array($limitCategory, ['access', 'storage', 'usage', 'business', 'content'])) {
                                                continue;
                                            }
                                        } elseif ($limitCategory !== $categoryId) {
                                            continue;
                                        }
                                    ?>
                                    <div class="col-12">
                                        <div class="card border mb-3" data-limit-id="<?= $limitId ?>">
                                            <div class="card-header bg-light">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <h6 class="mb-0">
                                                        <i class="fas fa-<?= $categoryInfo['icon'] ?> text-<?= $categoryId === 'access' ? 'success' : ($categoryId === 'storage' ? 'primary' : 'info') ?> me-2"></i>
                                                        <?= htmlspecialchars($limitType['name']) ?>
                                                    </h6>
                                                    <div class="btn-group btn-group-sm">
                                                        <button class="btn btn-outline-primary" onclick="editLimit('<?= $limitId ?>')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-outline-success" onclick="cloneLimit('<?= $limitId ?>')">
                                                            <i class="fas fa-copy"></i>
                                                        </button>
                                                        <button class="btn btn-outline-danger" onclick="deleteLimit('<?= $limitId ?>')">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="card-body">
                                                <p class="text-muted mb-3"><?= htmlspecialchars($limitType['description']) ?></p>
                                                
                                                <div class="row g-3">
                                                    <!-- Limit Configuration -->
                                                    <div class="col-md-4">
                                                        <h6 class="small text-muted mb-2">Configuration</h6>
                                                        <div class="mb-2">
                                                            <small class="text-muted">Units:</small>
                                                            <div class="mt-1">
                                                                <?php foreach ($limitType['units'] as $unit): ?>
                                                                    <span class="badge bg-light text-dark me-1"><?= $unit ?></span>
                                                                <?php endforeach; ?>
                                                            </div>
                                                        </div>
                                                        <div class="mb-2">
                                                            <small class="text-muted">Default Unit:</small>
                                                            <span class="badge bg-primary ms-2"><?= $limitType['default_unit'] ?></span>
                                                        </div>
                                                        <div class="mb-2">
                                                            <small class="text-muted">Enforcement:</small>
                                                            <span class="badge bg-<?= $limitType['enforcement'] === 'hard' ? 'danger' : ($limitType['enforcement'] === 'soft' ? 'warning' : 'info') ?> ms-2">
                                                                <?= ucfirst($limitType['enforcement']) ?>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <!-- Preset Values -->
                                                    <div class="col-md-8">
                                                        <h6 class="small text-muted mb-2">Preset Values by Plan Tier</h6>
                                                        <div class="table-responsive">
                                                            <table class="table table-sm table-hover">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Tier</th>
                                                                        <th>Value</th>
                                                                        <th>Unit</th>
                                                                        <th>Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <?php foreach ($limitsConfig['predefined_limits'] as $tier => $limits): ?>
                                                                        <?php if (isset($limits[$limitId])): ?>
                                                                        <tr>
                                                                            <td>
                                                                                <span class="badge bg-<?= $tier === 'starter' ? 'secondary' : ($tier === 'professional' ? 'primary' : ($tier === 'agency' ? 'warning' : ($tier === 'enterprise' ? 'danger' : 'dark'))) ?>">
                                                                                    <?= ucfirst($tier) ?>
                                                                                </span>
                                                                            </td>
                                                                            <td>
                                                                                <input type="number" 
                                                                                       class="form-control form-control-sm" 
                                                                                       id="value-<?= $tier ?>-<?= $limitId ?>" 
                                                                                       value="<?= $limits[$limitId]['value'] ?>"
                                                                                       onchange="updatePresetValue('<?= $tier ?>', '<?= $limitId ?>')">
                                                                            </td>
                                                                            <td>
                                                                                <select class="form-select form-select-sm" 
                                                                                        id="unit-<?= $tier ?>-<?= $limitId ?>"
                                                                                        onchange="updatePresetUnit('<?= $tier ?>', '<?= $limitId ?>')">
                                                                                    <?php foreach ($limitType['units'] as $unit): ?>
                                                                                        <option value="<?= $unit ?>" <?= $unit === $limits[$limitId]['unit'] ? 'selected' : '' ?>>
                                                                                            <?= $unit ?>
                                                                                        </option>
                                                                                    <?php endforeach; ?>
                                                                                </select>
                                                                            </td>
                                                                            <td>
                                                                                <button class="btn btn-sm btn-outline-success" onclick="savePreset('<?= $tier ?>', '<?= $limitId ?>')" title="Save">
                                                                                    <i class="fas fa-check"></i>
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                        <?php endif; ?>
                                                                    <?php endforeach; ?>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <!-- Validation Rules -->
                                                <?php if (isset($limitsConfig['validation_rules'][$limitId])): ?>
                                                <div class="mt-3 pt-3 border-top">
                                                    <h6 class="small text-muted mb-2">Validation Rules</h6>
                                                    <div class="row g-2">
                                                        <div class="col-md-4">
                                                            <small class="text-muted">Min Value:</small>
                                                            <span class="badge bg-light text-dark ms-2">
                                                                <?= $limitsConfig['validation_rules'][$limitId]['min_value'] ?>
                                                            </span>
                                                        </div>
                                                        <div class="col-md-4">
                                                            <small class="text-muted">Max Value:</small>
                                                            <span class="badge bg-light text-dark ms-2">
                                                                <?= $limitsConfig['validation_rules'][$limitId]['max_value'] ?>
                                                            </span>
                                                        </div>
                                                        <div class="col-md-4">
                                                            <small class="text-muted">Allowed Units:</small>
                                                            <?php foreach ($limitsConfig['validation_rules'][$limitId]['allowed_units'] as $unit): ?>
                                                                <span class="badge bg-light text-dark ms-1"><?= $unit ?></span>
                                                            <?php endforeach; ?>
                                                        </div>
                                                    </div>
                                                </div>
                                                <?php endif; ?>
                                            </div>
                                        </div>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
                
                <!-- Create/Edit Limit Modal -->
                <div class="modal fade" id="limitModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="limitModalTitle">Create New Limit Type</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="limitForm">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label class="form-label">Limit Name</label>
                                            <input type="text" class="form-control" id="limitName" placeholder="e.g., Database Size">
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Limit ID</label>
                                            <input type="text" class="form-control" id="limitId" placeholder="database_size" readonly>
                                            <small class="text-muted">Auto-generated from name</small>
                                        </div>
                                        <div class="col-12">
                                            <label class="form-label">Description</label>
                                            <textarea class="form-control" id="limitDescription" rows="2" placeholder="Describe what this limit controls..."></textarea>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Category</label>
                                            <select class="form-select" id="limitCategory">
                                                <option value="access">Access Control</option>
                                                <option value="storage">Storage</option>
                                                <option value="usage">Usage</option>
                                                <option value="business">Business</option>
                                                <option value="content">Content</option>
                                                <option value="communication">Communication</option>
                                                <option value="performance">Performance</option>
                                                <option value="customization">Customization</option>
                                                <option value="connectivity">Connectivity</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label">Enforcement Type</label>
                                            <select class="form-select" id="limitEnforcement">
                                                <option value="hard">Hard (immediate block)</option>
                                                <option value="soft">Soft (warning first)</option>
                                                <option value="block">Block (prevent action)</option>
                                                <option value="throttle">Throttle (slow down)</option>
                                                <option value="queue">Queue (delay execution)</option>
                                            </select>
                                        </div>
                                        <div class="col-md-8">
                                            <label class="form-label">Available Units</label>
                                            <input type="text" class="form-control" id="limitUnits" placeholder="MB, GB, TB (comma separated)">
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Default Unit</label>
                                            <input type="text" class="form-control" id="limitDefaultUnit" placeholder="GB">
                                        </div>
                                        
                                        <div class="col-12">
                                            <h6>Validation Rules</h6>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Min Value</label>
                                            <input type="number" class="form-control" id="limitMinValue" placeholder="0">
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Max Value</label>
                                            <input type="number" class="form-control" id="limitMaxValue" placeholder="10000">
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Step Size</label>
                                            <input type="number" class="form-control" id="limitStepSize" placeholder="1">
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" onclick="saveLimitType()">Save Limit Type</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Sidebar Tools -->
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
                            <button class="btn btn-primary btn-sm" onclick="createNewLimit()">
                                <i class="fas fa-plus me-1"></i> Create New Limit
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="importLimits()">
                                <i class="fas fa-upload me-1"></i> Import Limits
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="exportAllLimits()">
                                <i class="fas fa-download me-1"></i> Export All Limits
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="validateAllLimits()">
                                <i class="fas fa-check-circle me-1"></i> Validate All
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Preset Templates -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-layer-group text-warning me-2"></i> Preset Templates
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="loadPresetTemplate('saas')">
                                <i class="fas fa-cloud me-1"></i> SaaS Template
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="loadPresetTemplate('marketplace')">
                                <i class="fas fa-store me-1"></i> Marketplace Template
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="loadPresetTemplate('enterprise')">
                                <i class="fas fa-building me-1"></i> Enterprise Template
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="loadPresetTemplate('custom')">
                                <i class="fas fa-cogs me-1"></i> Custom Template
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Limit Summary -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-chart-pie text-info me-2"></i> Limit Summary
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>Total Limit Types:</strong>
                            <span class="badge bg-primary float-end"><?= count($limitsConfig['limit_types']) ?></span>
                        </div>
                        
                        <div class="mb-3">
                            <strong>By Category:</strong>
                            <?php 
                            $categoryCount = array_count_values(array_column($limitsConfig['limit_types'], 'category'));
                            foreach ($categoryCount as $category => $count): 
                            ?>
                            <div class="d-flex justify-content-between align-items-center mt-1">
                                <small class="text-muted"><?= ucfirst($category) ?></small>
                                <span class="badge bg-light text-dark"><?= $count ?></span>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        
                        <hr>
                        
                        <div class="mb-3">
                            <strong>Enforcement Types:</strong>
                            <?php 
                            $enforcementCount = array_count_values(array_column($limitsConfig['limit_types'], 'enforcement'));
                            foreach ($enforcementCount as $enforcement => $count): 
                            ?>
                            <div class="d-flex justify-content-between align-items-center mt-1">
                                <small class="text-muted"><?= ucfirst($enforcement) ?></small>
                                <span class="badge bg-light text-dark"><?= $count ?></span>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Load configuration data
const limitsConfig = <?= json_encode($limitsConfig) ?>;

// Current edit state
let currentEditLimit = null;

// Generate limit ID from name
function generateLimitId(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
}

// Update preset value
function updatePresetValue(tier, limitId) {
    const value = document.getElementById(`value-${tier}-${limitId}`).value;
    console.log(`Updating ${tier} ${limitId} value to ${value}`);
}

// Update preset unit
function updatePresetUnit(tier, limitId) {
    const unit = document.getElementById(`unit-${tier}-${limitId}`).value;
    console.log(`Updating ${tier} ${limitId} unit to ${unit}`);
}

// Save preset
function savePreset(tier, limitId) {
    const value = document.getElementById(`value-${tier}-${limitId}`).value;
    const unit = document.getElementById(`unit-${tier}-${limitId}`).value;
    
    alert(`Preset saved for ${tier} tier:\\nLimit: ${limitId}\\nValue: ${value} ${unit}\\n\\nThis would update the configuration file.`);
}

// Create new limit
function createNewLimit() {
    currentEditLimit = null;
    document.getElementById('limitModalTitle').textContent = 'Create New Limit Type';
    document.getElementById('limitForm').reset();
    new bootstrap.Modal(document.getElementById('limitModal')).show();
}

// Edit existing limit
function editLimit(limitId) {
    currentEditLimit = limitId;
    const limit = limitsConfig.limit_types[limitId];
    
    document.getElementById('limitModalTitle').textContent = 'Edit Limit Type';
    document.getElementById('limitName').value = limit.name;
    document.getElementById('limitId').value = limitId;
    document.getElementById('limitDescription').value = limit.description;
    document.getElementById('limitCategory').value = limit.category;
    document.getElementById('limitEnforcement').value = limit.enforcement;
    document.getElementById('limitUnits').value = limit.units.join(', ');
    document.getElementById('limitDefaultUnit').value = limit.default_unit;
    
    if (limitsConfig.validation_rules[limitId]) {
        document.getElementById('limitMinValue').value = limitsConfig.validation_rules[limitId].min_value;
        document.getElementById('limitMaxValue').value = limitsConfig.validation_rules[limitId].max_value;
    }
    
    new bootstrap.Modal(document.getElementById('limitModal')).show();
}

// Clone limit
function cloneLimit(limitId) {
    const limit = limitsConfig.limit_types[limitId];
    currentEditLimit = null;
    
    document.getElementById('limitModalTitle').textContent = 'Clone Limit Type';
    document.getElementById('limitName').value = limit.name + ' (Copy)';
    document.getElementById('limitId').value = generateLimitId(limit.name + ' Copy');
    document.getElementById('limitDescription').value = limit.description;
    document.getElementById('limitCategory').value = limit.category;
    document.getElementById('limitEnforcement').value = limit.enforcement;
    document.getElementById('limitUnits').value = limit.units.join(', ');
    document.getElementById('limitDefaultUnit').value = limit.default_unit;
    
    new bootstrap.Modal(document.getElementById('limitModal')).show();
}

// Delete limit
function deleteLimit(limitId) {
    const limit = limitsConfig.limit_types[limitId];
    if (confirm(`Are you sure you want to delete the limit "${limit.name}"?\\n\\nThis will affect all features using this limit.`)) {
        alert(`Limit "${limit.name}" deleted successfully.`);
    }
}

// Save limit type
function saveLimitType() {
    const limitData = {
        name: document.getElementById('limitName').value,
        id: document.getElementById('limitId').value || generateLimitId(document.getElementById('limitName').value),
        description: document.getElementById('limitDescription').value,
        category: document.getElementById('limitCategory').value,
        enforcement: document.getElementById('limitEnforcement').value,
        units: document.getElementById('limitUnits').value.split(',').map(u => u.trim()),
        default_unit: document.getElementById('limitDefaultUnit').value,
        validation: {
            min_value: parseInt(document.getElementById('limitMinValue').value) || 0,
            max_value: parseInt(document.getElementById('limitMaxValue').value) || 10000,
            step_size: parseInt(document.getElementById('limitStepSize').value) || 1
        }
    };
    
    const action = currentEditLimit ? 'updated' : 'created';
    alert(`Limit type "${limitData.name}" ${action} successfully!\\n\\nThis would update the limits configuration.`);
    
    bootstrap.Modal.getInstance(document.getElementById('limitModal')).hide();
}

// Import limits
function importLimits() {
    alert('Import Limits\\n\\nThis would allow importing limit configurations from:\\n• JSON files\\n• CSV templates\\n• Other platforms\\n• Backup files');
}

// Export all limits
function exportAllLimits() {
    const exportData = {
        limit_types: limitsConfig.limit_types,
        predefined_limits: limitsConfig.predefined_limits,
        validation_rules: limitsConfig.validation_rules,
        exported: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'limits-configuration.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

// Validate all limits
function validateAllLimits() {
    let issues = [];
    
    // Check for missing validation rules
    Object.entries(limitsConfig.limit_types).forEach(([limitId, limit]) => {
        if (!limitsConfig.validation_rules[limitId]) {
            issues.push(`Missing validation rules for "${limit.name}"`);
        }
        
        // Check preset values
        Object.entries(limitsConfig.predefined_limits).forEach(([tier, limits]) => {
            if (!limits[limitId] && tier !== 'platform') {
                issues.push(`Missing preset value for "${limit.name}" in ${tier} tier`);
            }
        });
    });
    
    if (issues.length === 0) {
        alert('✅ All limits validated successfully!\\n\\nNo issues found.');
    } else {
        alert(`⚠️ Validation Issues Found:\\n\\n${issues.join('\\n')}`);
    }
}

// Load preset template
function loadPresetTemplate(templateType) {
    const templates = {
        saas: {
            name: 'SaaS Template',
            limits: ['users', 'storage', 'api_calls', 'custom_fields']
        },
        marketplace: {
            name: 'Marketplace Template',
            limits: ['users', 'accounts', 'projects', 'media_files', 'portfolios']
        },
        enterprise: {
            name: 'Enterprise Template',
            limits: ['users', 'seats', 'accounts', 'api_calls', 'storage', 'integrations']
        },
        custom: {
            name: 'Custom Template',
            limits: Object.keys(limitsConfig.limit_types)
        }
    };
    
    const template = templates[templateType];
    alert(`Loading ${template.name}\\n\\nThis would configure the following limits:\\n• ${template.limits.join('\\n• ')}`);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for limit name to auto-generate ID
    document.getElementById('limitName').addEventListener('input', function() {
        if (!currentEditLimit) {
            document.getElementById('limitId').value = generateLimitId(this.value);
        }
    });
});
</script>

<?php echo renderFooter(); ?>