<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

// Load limits configuration
$limitsConfig = json_decode(file_get_contents('../config/limits-config.json'), true);

echo renderHeader("Feature Builder - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'plans/feature-builder.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Subscription Plans', 'href' => 'index.php'],
            ['label' => 'Feature Builder']
        ]);
        
        echo createHeroSection(
            "Feature Builder",
            "Create and configure individual features with their required and optional limits for subscription plans",
            "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=300&fit=crop",
            [
                ['label' => 'New Feature', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Import Features', 'icon' => 'fas fa-upload', 'style' => 'info'],
                ['label' => 'Validate Limits', 'icon' => 'fas fa-check-circle', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Feature Builder Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Features', '32', 'fas fa-puzzle-piece', 'primary');
            echo createStatCard('Limit Types', '14', 'fas fa-sliders-h', 'success');
            echo createStatCard('Dependencies', '87', 'fas fa-link', 'info');
            echo createStatCard('Categories', '6', 'fas fa-folder', 'warning');
            ?>
        </div>
        
        <div class="row">
            <!-- Feature Builder Interface -->
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Feature Builder Interface</h5>
                        <div class="btn-group">
                            <button class="btn btn-primary" onclick="saveFeature()">
                                <i class="fas fa-save me-2"></i> Save Feature
                            </button>
                            <button class="btn btn-outline-secondary" onclick="previewFeature()">
                                <i class="fas fa-eye me-2"></i> Preview
                            </button>
                            <button class="btn btn-outline-info" onclick="validateFeature()">
                                <i class="fas fa-check-circle me-2"></i> Validate
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Feature Basic Info -->
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Feature Name</label>
                                    <input type="text" class="form-control" id="featureName" placeholder="e.g., Advanced Analytics">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Feature Description</label>
                                    <textarea class="form-control" id="featureDescription" rows="3" placeholder="Detailed reporting, dashboards, and business intelligence..."></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Feature ID</label>
                                    <input type="text" class="form-control" id="featureId" placeholder="advanced_analytics" readonly>
                                    <small class="text-muted">Auto-generated from feature name</small>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Category</label>
                                    <select class="form-select" id="featureCategory">
                                        <option value="core">Core Features</option>
                                        <option value="professional">Professional Features</option>
                                        <option value="agency">Agency Features</option>
                                        <option value="enterprise">Enterprise Features</option>
                                        <option value="marketplace">Marketplace Features</option>
                                        <option value="communication">Communication Features</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Complexity Level</label>
                                    <select class="form-select" id="featureComplexity">
                                        <option value="simple">Simple (1-2 limits)</option>
                                        <option value="moderate">Moderate (3-5 limits)</option>
                                        <option value="complex">Complex (6+ limits)</option>
                                        <option value="enterprise">Enterprise (custom limits)</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Feature Icon</label>
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i id="featureIconPreview" class="fas fa-puzzle-piece"></i>
                                        </span>
                                        <input type="text" class="form-control" id="featureIcon" value="fas fa-puzzle-piece" placeholder="Font Awesome class">
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Limit Assignment Interface -->
                        <div class="row">
                            <!-- Available Limits -->
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">
                                    <i class="fas fa-sliders-h text-primary me-2"></i> Available Limits
                                    <small class="text-muted ms-2">(Drag to assign to feature)</small>
                                </h6>
                                
                                <!-- Limit Category Filter -->
                                <div class="mb-3">
                                    <select class="form-select form-select-sm" id="limitFilter" onchange="filterLimits()">
                                        <option value="all">All Categories</option>
                                        <option value="access">Access Control</option>
                                        <option value="storage">Storage & Files</option>
                                        <option value="usage">Usage & API</option>
                                        <option value="business">Business Operations</option>
                                        <option value="content">Content Management</option>
                                        <option value="communication">Communication</option>
                                        <option value="performance">Performance</option>
                                        <option value="customization">Customization</option>
                                        <option value="connectivity">Connectivity</option>
                                    </select>
                                </div>
                                
                                <div class="available-limits border rounded p-3" style="min-height: 400px; max-height: 600px; overflow-y: auto;">
                                    <?php foreach ($limitsConfig['limit_types'] as $limitId => $limitType): ?>
                                    <div class="limit-item card mb-2 available-limit" 
                                         data-limit-id="<?= $limitId ?>" 
                                         data-category="<?= $limitType['category'] ?>"
                                         draggable="true"
                                         ondragstart="dragLimitStart(event)">
                                        <div class="card-body p-2">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div class="flex-grow-1">
                                                    <h6 class="card-title mb-1 small fw-bold"><?= htmlspecialchars($limitType['name']) ?></h6>
                                                    <p class="text-muted mb-1" style="font-size: 0.8rem;"><?= htmlspecialchars($limitType['description']) ?></p>
                                                    <div>
                                                        <span class="badge bg-<?= $limitType['category'] === 'storage' ? 'primary' : ($limitType['category'] === 'access' ? 'success' : 'info') ?>"><?= ucfirst($limitType['category']) ?></span>
                                                        <span class="badge bg-light text-dark"><?= $limitType['enforcement'] ?></span>
                                                        <span class="badge bg-secondary"><?= $limitType['default_unit'] ?></span>
                                                    </div>
                                                </div>
                                                <div class="drag-handle text-muted">
                                                    <i class="fas fa-grip-vertical"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            
                            <!-- Feature Limit Configuration -->
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">
                                    <i class="fas fa-cogs text-success me-2"></i> Feature Limit Configuration
                                    <small class="text-muted ms-2">(Required vs Optional)</small>
                                </h6>
                                
                                <!-- Required Limits -->
                                <div class="mb-4">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h6 class="text-danger mb-0">🔴 Required Limits</h6>
                                        <small class="text-muted">Essential for feature functionality</small>
                                    </div>
                                    <div class="required-limits border rounded p-3" 
                                         style="min-height: 150px;"
                                         ondrop="dropLimit(event, 'required')" 
                                         ondragover="allowDrop(event)">
                                        <div class="text-center text-muted p-3" id="requiredEmptyMessage">
                                            <i class="fas fa-exclamation-circle fa-2x mb-2" style="opacity: 0.3;"></i>
                                            <p class="small">Drag limits here that are required for this feature to work</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Optional Limits -->
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <h6 class="text-info mb-0">🔵 Optional Limits</h6>
                                        <small class="text-muted">Enhance feature capabilities</small>
                                    </div>
                                    <div class="optional-limits border rounded p-3" 
                                         style="min-height: 150px;"
                                         ondrop="dropLimit(event, 'optional')" 
                                         ondragover="allowDrop(event)">
                                        <div class="text-center text-muted p-3" id="optionalEmptyMessage">
                                            <i class="fas fa-plus-circle fa-2x mb-2" style="opacity: 0.3;"></i>
                                            <p class="small">Drag limits here that provide additional capabilities</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Feature Impact Analysis -->
                                <div class="card bg-light">
                                    <div class="card-body p-3">
                                        <h6 class="card-title mb-2">
                                            <i class="fas fa-chart-line text-warning me-2"></i> Impact Analysis
                                        </h6>
                                        <div id="impactAnalysis">
                                            <small class="text-muted">Configure limits to see impact analysis</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Feature Management -->
            <div class="col-lg-4">
                <!-- Existing Features -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-list text-primary me-2"></i> Existing Features
                        </h6>
                    </div>
                    <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                        <?php foreach ($limitsConfig['individual_features'] as $featureId => $feature): ?>
                        <div class="card mb-2 border existing-feature" data-feature-id="<?= $featureId ?>">
                            <div class="card-body p-2">
                                <div class="d-flex justify-content-between align-items-start mb-1">
                                    <h6 class="card-title mb-0 small"><?= htmlspecialchars($feature['name']) ?></h6>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary btn-sm" onclick="loadFeature('<?= $featureId ?>')" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-success btn-sm" onclick="cloneFeature('<?= $featureId ?>')" title="Clone">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm" onclick="deleteFeature('<?= $featureId ?>')" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <p class="text-muted mb-1" style="font-size: 0.75rem;"><?= htmlspecialchars($feature['description']) ?></p>
                                <div>
                                    <span class="badge bg-secondary"><?= ucfirst($feature['category']) ?></span>
                                    <small class="text-muted">
                                        <?= count($feature['required_limits']) ?> req + <?= count($feature['optional_limits']) ?> opt
                                    </small>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- Feature Configuration Summary -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-cogs text-warning me-2"></i> Configuration Summary
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>Required Limits:</strong>
                            <div id="requiredLimitsSummary" class="mt-1">
                                <span class="badge bg-danger">0</span> limits required
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <strong>Optional Limits:</strong>
                            <div id="optionalLimitsSummary" class="mt-1">
                                <span class="badge bg-info">0</span> limits optional
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <strong>Complexity Level:</strong>
                            <div id="complexityLevel" class="mt-1">
                                <span class="badge bg-success">Simple</span>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <strong>Resource Impact:</strong>
                            <div id="resourceImpact" class="mt-1">
                                <div class="progress">
                                    <div class="progress-bar bg-success" role="progressbar" style="width: 0%"></div>
                                </div>
                                <small class="text-muted">Low impact</small>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-success btn-sm" onclick="saveFeature()">
                                <i class="fas fa-save me-1"></i> Save Feature
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="resetBuilder()">
                                <i class="fas fa-undo me-1"></i> Reset Builder
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="exportFeature()">
                                <i class="fas fa-download me-1"></i> Export JSON
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Feature Templates -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-magic text-info me-2"></i> Feature Templates
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="createTemplate('basic')">
                                <i class="fas fa-bolt me-1"></i> Basic Feature
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="createTemplate('storage')">
                                <i class="fas fa-database me-1"></i> Storage Feature
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="createTemplate('api')">
                                <i class="fas fa-plug me-1"></i> API Feature
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="createTemplate('enterprise')">
                                <i class="fas fa-building me-1"></i> Enterprise Feature
                            </button>
                        </div>
                        
                        <hr>
                        
                        <h6 class="small">Limit Categories:</h6>
                        <div class="mb-2">
                            <?php 
                            $categories = array_unique(array_column($limitsConfig['limit_types'], 'category'));
                            foreach ($categories as $category): 
                            ?>
                            <span class="badge bg-light text-dark me-1 mb-1"><?= ucfirst($category) ?></span>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Feature Builder State
let currentFeature = {
    id: '',
    name: '',
    description: '',
    category: 'core',
    complexity: 'simple',
    icon: 'fas fa-puzzle-piece',
    required_limits: [],
    optional_limits: []
};

// Load configuration data
const limitsConfig = <?= json_encode($limitsConfig) ?>;

// Drag and Drop Functions for Limits
function dragLimitStart(event) {
    event.dataTransfer.setData('text/plain', event.target.dataset.limitId);
    event.target.style.opacity = '0.5';
}

function allowDrop(event) {
    event.preventDefault();
}

function dropLimit(event, limitType) {
    event.preventDefault();
    const limitId = event.dataTransfer.getData('text/plain');
    
    // Add limit to the appropriate array
    if (limitType === 'required' && !currentFeature.required_limits.includes(limitId)) {
        currentFeature.required_limits.push(limitId);
    } else if (limitType === 'optional' && !currentFeature.optional_limits.includes(limitId)) {
        currentFeature.optional_limits.push(limitId);
    }
    
    updateLimitDisplay();
    updateConfigurationSummary();
    updateImpactAnalysis();
    
    // Reset opacity
    document.querySelector(`[data-limit-id="${limitId}"]`).style.opacity = '1';
}

// Update limit display in the drop zones
function updateLimitDisplay() {
    updateRequiredLimitsDisplay();
    updateOptionalLimitsDisplay();
}

function updateRequiredLimitsDisplay() {
    const container = document.querySelector('.required-limits');
    const emptyMessage = document.getElementById('requiredEmptyMessage');
    
    // Clear existing limits (except empty message)
    const existingLimits = container.querySelectorAll('.assigned-limit');
    existingLimits.forEach(limit => limit.remove());
    
    if (currentFeature.required_limits.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    
    currentFeature.required_limits.forEach(limitId => {
        const limitType = limitsConfig.limit_types[limitId];
        
        const limitDiv = document.createElement('div');
        limitDiv.className = 'card mb-2 assigned-limit border-danger';
        limitDiv.setAttribute('data-limit-id', limitId);
        limitDiv.innerHTML = `
            <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="card-title mb-1 small fw-bold">${limitType.name}</h6>
                        <p class="text-muted mb-1" style="font-size: 0.8rem;">${limitType.description}</p>
                        <div>
                            <span class="badge bg-danger">Required</span>
                            <span class="badge bg-light text-dark">${limitType.enforcement}</span>
                        </div>
                    </div>
                    <button class="btn btn-outline-danger btn-sm" onclick="removeLimitFromFeature('${limitId}', 'required')" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(limitDiv);
    });
}

function updateOptionalLimitsDisplay() {
    const container = document.querySelector('.optional-limits');
    const emptyMessage = document.getElementById('optionalEmptyMessage');
    
    // Clear existing limits (except empty message)
    const existingLimits = container.querySelectorAll('.assigned-limit');
    existingLimits.forEach(limit => limit.remove());
    
    if (currentFeature.optional_limits.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    
    currentFeature.optional_limits.forEach(limitId => {
        const limitType = limitsConfig.limit_types[limitId];
        
        const limitDiv = document.createElement('div');
        limitDiv.className = 'card mb-2 assigned-limit border-info';
        limitDiv.setAttribute('data-limit-id', limitId);
        limitDiv.innerHTML = `
            <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="card-title mb-1 small fw-bold">${limitType.name}</h6>
                        <p class="text-muted mb-1" style="font-size: 0.8rem;">${limitType.description}</p>
                        <div>
                            <span class="badge bg-info">Optional</span>
                            <span class="badge bg-light text-dark">${limitType.enforcement}</span>
                        </div>
                    </div>
                    <button class="btn btn-outline-info btn-sm" onclick="removeLimitFromFeature('${limitId}', 'optional')" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(limitDiv);
    });
}

// Remove limit from feature
function removeLimitFromFeature(limitId, limitType) {
    if (limitType === 'required') {
        currentFeature.required_limits = currentFeature.required_limits.filter(id => id !== limitId);
    } else {
        currentFeature.optional_limits = currentFeature.optional_limits.filter(id => id !== limitId);
    }
    
    updateLimitDisplay();
    updateConfigurationSummary();
    updateImpactAnalysis();
}

// Update configuration summary
function updateConfigurationSummary() {
    // Update required limits summary
    document.getElementById('requiredLimitsSummary').innerHTML = `
        <span class="badge bg-danger">${currentFeature.required_limits.length}</span> limits required
    `;
    
    // Update optional limits summary
    document.getElementById('optionalLimitsSummary').innerHTML = `
        <span class="badge bg-info">${currentFeature.optional_limits.length}</span> limits optional
    `;
    
    // Update complexity level
    const totalLimits = currentFeature.required_limits.length + currentFeature.optional_limits.length;
    let complexity, badgeClass;
    
    if (totalLimits <= 2) {
        complexity = 'Simple';
        badgeClass = 'bg-success';
    } else if (totalLimits <= 5) {
        complexity = 'Moderate';
        badgeClass = 'bg-warning';
    } else if (totalLimits <= 8) {
        complexity = 'Complex';
        badgeClass = 'bg-danger';
    } else {
        complexity = 'Enterprise';
        badgeClass = 'bg-dark';
    }
    
    document.getElementById('complexityLevel').innerHTML = `
        <span class="badge ${badgeClass}">${complexity}</span>
    `;
    
    // Update resource impact
    const impact = Math.min(100, totalLimits * 12);
    const progressBar = document.querySelector('#resourceImpact .progress-bar');
    const progressText = document.querySelector('#resourceImpact .text-muted');
    
    progressBar.style.width = `${impact}%`;
    progressBar.className = `progress-bar ${impact > 70 ? 'bg-danger' : impact > 40 ? 'bg-warning' : 'bg-success'}`;
    
    let impactLevel;
    if (impact <= 30) impactLevel = 'Low impact';
    else if (impact <= 60) impactLevel = 'Medium impact';
    else if (impact <= 85) impactLevel = 'High impact';
    else impactLevel = 'Very high impact';
    
    progressText.textContent = impactLevel;
}

// Update impact analysis
function updateImpactAnalysis() {
    const container = document.getElementById('impactAnalysis');
    
    if (currentFeature.required_limits.length === 0 && currentFeature.optional_limits.length === 0) {
        container.innerHTML = '<small class="text-muted">Configure limits to see impact analysis</small>';
        return;
    }
    
    const allLimits = [...currentFeature.required_limits, ...currentFeature.optional_limits];
    const categories = {};
    
    allLimits.forEach(limitId => {
        const limitType = limitsConfig.limit_types[limitId];
        if (!categories[limitType.category]) {
            categories[limitType.category] = 0;
        }
        categories[limitType.category]++;
    });
    
    let html = '<div class="impact-categories">';
    Object.entries(categories).forEach(([category, count]) => {
        html += `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="text-muted">${category}</small>
                <span class="badge bg-light text-dark">${count} limit${count > 1 ? 's' : ''}</span>
            </div>
        `;
    });
    html += '</div>';
    
    html += '<hr class="my-2">';
    html += `<small class="text-muted"><strong>Total:</strong> ${allLimits.length} limits across ${Object.keys(categories).length} categories</small>`;
    
    container.innerHTML = html;
}

// Filter limits by category
function filterLimits() {
    const selectedCategory = document.getElementById('limitFilter').value;
    const availableLimits = document.querySelectorAll('.available-limit');
    
    availableLimits.forEach(limit => {
        const limitCategory = limit.dataset.category;
        if (selectedCategory === 'all' || limitCategory === selectedCategory) {
            limit.style.display = 'block';
        } else {
            limit.style.display = 'none';
        }
    });
}

// Generate feature ID from name
function generateFeatureId(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
}

// Update feature icon preview
function updateIconPreview() {
    const iconClass = document.getElementById('featureIcon').value;
    const preview = document.getElementById('featureIconPreview');
    preview.className = iconClass || 'fas fa-puzzle-piece';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateConfigurationSummary();
    
    // Add event listeners for basic info
    document.getElementById('featureName').addEventListener('input', function() {
        currentFeature.name = this.value;
        currentFeature.id = generateFeatureId(this.value);
        document.getElementById('featureId').value = currentFeature.id;
    });
    
    document.getElementById('featureDescription').addEventListener('input', function() {
        currentFeature.description = this.value;
    });
    
    document.getElementById('featureCategory').addEventListener('change', function() {
        currentFeature.category = this.value;
    });
    
    document.getElementById('featureComplexity').addEventListener('change', function() {
        currentFeature.complexity = this.value;
    });
    
    document.getElementById('featureIcon').addEventListener('input', function() {
        currentFeature.icon = this.value;
        updateIconPreview();
    });
});

// Feature Management Functions
function saveFeature() {
    if (!currentFeature.name.trim()) {
        alert('Please enter a feature name.');
        return;
    }
    
    if (!currentFeature.id.trim()) {
        alert('Feature ID is required (auto-generated from name).');
        return;
    }
    
    if (currentFeature.required_limits.length === 0) {
        if (!confirm('This feature has no required limits. Are you sure you want to save it?')) {
            return;
        }
    }
    
    const featureData = {
        id: currentFeature.id,
        name: currentFeature.name,
        description: currentFeature.description,
        category: currentFeature.category,
        complexity: currentFeature.complexity,
        icon: currentFeature.icon,
        required_limits: currentFeature.required_limits,
        optional_limits: currentFeature.optional_limits,
        created: new Date().toISOString()
    };
    
    alert(`Feature "${currentFeature.name}" saved successfully!\\n\\nRequired Limits: ${currentFeature.required_limits.length}\\nOptional Limits: ${currentFeature.optional_limits.length}\\n\\nThis would normally update the configuration and make it available for use in plans.`);
    console.log('Feature saved:', featureData);
}

function resetBuilder() {
    currentFeature = {
        id: '',
        name: '',
        description: '',
        category: 'core',
        complexity: 'simple',
        icon: 'fas fa-puzzle-piece',
        required_limits: [],
        optional_limits: []
    };
    
    document.getElementById('featureName').value = '';
    document.getElementById('featureDescription').value = '';
    document.getElementById('featureId').value = '';
    document.getElementById('featureCategory').value = 'core';
    document.getElementById('featureComplexity').value = 'simple';
    document.getElementById('featureIcon').value = 'fas fa-puzzle-piece';
    
    updateLimitDisplay();
    updateConfigurationSummary();
    updateImpactAnalysis();
    updateIconPreview();
}

function loadFeature(featureId) {
    const feature = limitsConfig.individual_features[featureId];
    if (!feature) return;
    
    currentFeature = {
        id: featureId,
        name: feature.name,
        description: feature.description,
        category: feature.category,
        complexity: 'moderate',
        icon: 'fas fa-puzzle-piece',
        required_limits: [...feature.required_limits],
        optional_limits: [...feature.optional_limits]
    };
    
    document.getElementById('featureName').value = currentFeature.name;
    document.getElementById('featureDescription').value = currentFeature.description;
    document.getElementById('featureId').value = currentFeature.id;
    document.getElementById('featureCategory').value = currentFeature.category;
    document.getElementById('featureIcon').value = currentFeature.icon;
    
    updateLimitDisplay();
    updateConfigurationSummary();
    updateImpactAnalysis();
    updateIconPreview();
}

function cloneFeature(featureId) {
    loadFeature(featureId);
    currentFeature.name = currentFeature.name + ' (Copy)';
    currentFeature.id = generateFeatureId(currentFeature.name);
    document.getElementById('featureName').value = currentFeature.name;
    document.getElementById('featureId').value = currentFeature.id;
}

function deleteFeature(featureId) {
    const feature = limitsConfig.individual_features[featureId];
    if (confirm(`Are you sure you want to delete the feature "${feature.name}"?\\n\\nThis action cannot be undone and may affect existing plans.`)) {
        alert(`Feature "${feature.name}" deleted successfully.`);
    }
}

function createTemplate(type) {
    const templates = {
        basic: {
            name: 'Basic Feature',
            description: 'A simple feature with minimal resource requirements',
            category: 'core',
            required_limits: ['users'],
            optional_limits: ['storage']
        },
        storage: {
            name: 'Storage Feature',
            description: 'Feature that manages files and media storage',
            category: 'professional',
            required_limits: ['storage', 'media_files'],
            optional_limits: ['bandwidth']
        },
        api: {
            name: 'API Feature',
            description: 'Feature that provides API access and integration capabilities',
            category: 'enterprise',
            required_limits: ['api_calls', 'integrations'],
            optional_limits: ['bandwidth']
        },
        enterprise: {
            name: 'Enterprise Feature',
            description: 'Advanced feature for enterprise customers with comprehensive limits',
            category: 'enterprise',
            required_limits: ['users', 'seats', 'accounts', 'api_calls'],
            optional_limits: ['storage', 'custom_fields', 'integrations']
        }
    };
    
    const template = templates[type];
    if (!template) return;
    
    currentFeature = {
        id: generateFeatureId(template.name),
        name: template.name,
        description: template.description,
        category: template.category,
        complexity: 'moderate',
        icon: 'fas fa-puzzle-piece',
        required_limits: [...template.required_limits],
        optional_limits: [...template.optional_limits]
    };
    
    document.getElementById('featureName').value = currentFeature.name;
    document.getElementById('featureDescription').value = currentFeature.description;
    document.getElementById('featureId').value = currentFeature.id;
    document.getElementById('featureCategory').value = currentFeature.category;
    
    updateLimitDisplay();
    updateConfigurationSummary();
    updateImpactAnalysis();
}

function previewFeature() {
    if (!currentFeature.name.trim()) {
        alert('Please enter a feature name to preview.');
        return;
    }
    
    const requiredLimitNames = currentFeature.required_limits.map(limitId => 
        limitsConfig.limit_types[limitId].name
    ).join('\\n• ');
    
    const optionalLimitNames = currentFeature.optional_limits.map(limitId => 
        limitsConfig.limit_types[limitId].name
    ).join('\\n• ');
    
    let preview = `Feature Preview: "${currentFeature.name}"\\n\\n${currentFeature.description}\\n\\nCategory: ${currentFeature.category}`;
    
    if (currentFeature.required_limits.length > 0) {
        preview += `\\n\\nRequired Limits:\\n• ${requiredLimitNames}`;
    }
    
    if (currentFeature.optional_limits.length > 0) {
        preview += `\\n\\nOptional Limits:\\n• ${optionalLimitNames}`;
    }
    
    alert(preview);
}

function validateFeature() {
    const errors = [];
    const warnings = [];
    
    if (!currentFeature.name.trim()) {
        errors.push('Feature name is required');
    }
    
    if (!currentFeature.description.trim()) {
        warnings.push('Feature description is recommended for better understanding');
    }
    
    if (currentFeature.required_limits.length === 0) {
        warnings.push('No required limits - feature will have no resource constraints');
    }
    
    if (currentFeature.required_limits.length > 8) {
        warnings.push('Many required limits may make the feature expensive to provide');
    }
    
    let message = 'Feature Validation Results:\\n\\n';
    
    if (errors.length > 0) {
        message += '❌ ERRORS:\\n' + errors.map(e => `• ${e}`).join('\\n') + '\\n\\n';
    }
    
    if (warnings.length > 0) {
        message += '⚠️ WARNINGS:\\n' + warnings.map(w => `• ${w}`).join('\\n') + '\\n\\n';
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        message += '✅ Feature configuration is valid!\\n\\nReady for production use.';
    } else if (errors.length === 0) {
        message += '✅ Feature configuration is valid with minor warnings.';
    }
    
    alert(message);
}

function exportFeature() {
    if (!currentFeature.name.trim()) {
        alert('Please enter a feature name before exporting.');
        return;
    }
    
    const exportData = {
        ...currentFeature,
        exported: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${currentFeature.id}-feature.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}
</script>

<?php echo renderFooter(); ?>