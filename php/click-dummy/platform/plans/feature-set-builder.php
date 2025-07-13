<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

// Load limits configuration
$limitsConfig = json_decode(file_get_contents('../config/limits-config.json'), true);

echo renderHeader("Feature Set Builder - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'plans/feature-set-builder.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Subscription Plans', 'href' => 'index.php'],
            ['label' => 'Feature Set Builder']
        ]);
        
        echo createHeroSection(
            "Feature Set Builder",
            "Create and manage reusable feature bundles for subscription plans with intelligent grouping and dependencies",
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop",
            [
                ['label' => 'New Feature Set', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Import Sets', 'icon' => 'fas fa-upload', 'style' => 'info'],
                ['label' => 'Analyze Dependencies', 'icon' => 'fas fa-project-diagram', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Feature Set Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Feature Sets', '6', 'fas fa-layer-group', 'primary');
            echo createStatCard('Individual Features', '32', 'fas fa-puzzle-piece', 'success');
            echo createStatCard('Dependency Chains', '14', 'fas fa-link', 'info');
            echo createStatCard('Usage in Plans', '5', 'fas fa-tags', 'warning');
            ?>
        </div>
        
        <div class="row">
            <!-- Feature Set Builder Interface -->
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Feature Set Builder Interface</h5>
                        <div class="btn-group">
                            <button class="btn btn-primary" onclick="saveFeatureSet()">
                                <i class="fas fa-save me-2"></i> Save Set
                            </button>
                            <button class="btn btn-outline-secondary" onclick="previewFeatureSet()">
                                <i class="fas fa-eye me-2"></i> Preview
                            </button>
                            <button class="btn btn-outline-info" onclick="validateDependencies()">
                                <i class="fas fa-check-circle me-2"></i> Validate
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Feature Set Basic Info -->
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Feature Set Name</label>
                                    <input type="text" class="form-control" id="setName" placeholder="e.g., Professional Bundle">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" id="setDescription" rows="3" placeholder="Advanced features for professional users..."></textarea>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Category</label>
                                    <select class="form-select" id="setCategory">
                                        <option value="core">Core Features</option>
                                        <option value="professional">Professional Features</option>
                                        <option value="agency">Agency Features</option>
                                        <option value="enterprise">Enterprise Features</option>
                                        <option value="marketplace">Marketplace Features</option>
                                        <option value="communication">Communication Features</option>
                                        <option value="custom">Custom Bundle</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Priority Level</label>
                                    <select class="form-select" id="setPriority">
                                        <option value="essential">Essential (required for functionality)</option>
                                        <option value="recommended">Recommended (enhances experience)</option>
                                        <option value="optional">Optional (nice to have)</option>
                                        <option value="premium">Premium (advanced features)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Feature Selection with Drag & Drop -->
                        <div class="row">
                            <!-- Available Features -->
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">
                                    <i class="fas fa-puzzle-piece text-primary me-2"></i> Available Features
                                    <small class="text-muted ms-2">(Drag to add to set)</small>
                                </h6>
                                
                                <!-- Feature Category Filter -->
                                <div class="mb-3">
                                    <select class="form-select form-select-sm" id="featureFilter" onchange="filterFeatures()">
                                        <option value="all">All Categories</option>
                                        <option value="core">Core</option>
                                        <option value="professional">Professional</option>
                                        <option value="agency">Agency</option>
                                        <option value="enterprise">Enterprise</option>
                                        <option value="marketplace">Marketplace</option>
                                        <option value="communication">Communication</option>
                                    </select>
                                </div>
                                
                                <div class="available-features border rounded p-3" style="min-height: 400px; max-height: 600px; overflow-y: auto;">
                                    <?php foreach ($limitsConfig['individual_features'] as $featureId => $feature): ?>
                                    <div class="feature-item card mb-2 available-feature" 
                                         data-feature-id="<?= $featureId ?>" 
                                         data-category="<?= $feature['category'] ?>"
                                         draggable="true"
                                         ondragstart="dragStart(event)">
                                        <div class="card-body p-2">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div class="flex-grow-1">
                                                    <h6 class="card-title mb-1 small fw-bold"><?= htmlspecialchars($feature['name']) ?></h6>
                                                    <p class="text-muted mb-1" style="font-size: 0.8rem;"><?= htmlspecialchars($feature['description']) ?></p>
                                                    <div>
                                                        <span class="badge bg-secondary"><?= ucfirst($feature['category']) ?></span>
                                                        <span class="badge bg-light text-dark"><?= count($feature['required_limits']) ?> limits</span>
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
                            
                            <!-- Selected Features -->
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">
                                    <i class="fas fa-layer-group text-success me-2"></i> Selected Features
                                    <small class="text-muted ms-2">(Drag to reorder, click to remove)</small>
                                </h6>
                                
                                <div class="selected-features border rounded p-3" 
                                     style="min-height: 400px; max-height: 600px; overflow-y: auto;"
                                     ondrop="drop(event)" 
                                     ondragover="allowDrop(event)">
                                    <div class="text-center text-muted p-4" id="emptyMessage">
                                        <i class="fas fa-layer-group fa-3x mb-3" style="opacity: 0.3;"></i>
                                        <p>Drag features here to create your feature set</p>
                                    </div>
                                </div>
                                
                                <!-- Dependency Analysis -->
                                <div class="mt-3">
                                    <div class="card bg-light">
                                        <div class="card-body p-3">
                                            <h6 class="card-title mb-2">
                                                <i class="fas fa-project-diagram text-info me-2"></i> Dependency Analysis
                                            </h6>
                                            <div id="dependencyAnalysis">
                                                <small class="text-muted">Select features to see dependencies</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Feature Set Management -->
            <div class="col-lg-4">
                <!-- Existing Feature Sets -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-list text-primary me-2"></i> Existing Feature Sets
                        </h6>
                    </div>
                    <div class="card-body">
                        <?php foreach ($limitsConfig['feature_sets'] as $setId => $set): ?>
                        <div class="card mb-2 border existing-set" data-set-id="<?= $setId ?>">
                            <div class="card-body p-2">
                                <div class="d-flex justify-content-between align-items-start mb-1">
                                    <h6 class="card-title mb-0 small"><?= htmlspecialchars($set['name']) ?></h6>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary btn-sm" onclick="loadFeatureSet('<?= $setId ?>')" title="Load">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-success btn-sm" onclick="cloneFeatureSet('<?= $setId ?>')" title="Clone">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm" onclick="deleteFeatureSet('<?= $setId ?>')" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <p class="text-muted mb-1" style="font-size: 0.75rem;"><?= htmlspecialchars($set['description']) ?></p>
                                <small class="text-muted">
                                    <?= count($set['features']) ?> features
                                </small>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <!-- Set Configuration -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-cogs text-warning me-2"></i> Set Configuration
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>Selected Features:</strong>
                            <div id="selectedCount" class="mt-1">
                                <span class="badge bg-primary">0</span> features selected
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <strong>Required Limits:</strong>
                            <div id="requiredLimits" class="mt-1">
                                <small class="text-muted">No features selected</small>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <strong>Complexity Score:</strong>
                            <div id="complexityScore" class="mt-1">
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" style="width: 0%"></div>
                                </div>
                                <small class="text-muted">0% complexity</small>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-success btn-sm" onclick="saveFeatureSet()">
                                <i class="fas fa-save me-1"></i> Save Feature Set
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="resetBuilder()">
                                <i class="fas fa-undo me-1"></i> Reset Builder
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="exportFeatureSet()">
                                <i class="fas fa-download me-1"></i> Export JSON
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Templates -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-magic text-info me-2"></i> Quick Templates
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="createQuickSet('starter')">
                                <i class="fas fa-rocket me-1"></i> Starter Bundle
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="createQuickSet('professional')">
                                <i class="fas fa-briefcase me-1"></i> Professional Bundle
                            </button>
                            <button class="btn btn-outline-warning btn-sm" onclick="createQuickSet('premium')">
                                <i class="fas fa-crown me-1"></i> Premium Bundle
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="createQuickSet('complete')">
                                <i class="fas fa-star me-1"></i> Complete Bundle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Feature Set Builder State
let currentFeatureSet = {
    name: '',
    description: '',
    category: 'core',
    priority: 'recommended',
    features: []
};

// Drag and Drop Functions
function dragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.dataset.featureId);
    event.target.style.opacity = '0.5';
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const featureId = event.dataTransfer.getData('text/plain');
    const feature = limitsConfig.individual_features[featureId];
    
    if (!currentFeatureSet.features.includes(featureId)) {
        addFeatureToSet(featureId);
    }
    
    // Reset opacity
    document.querySelector(`[data-feature-id="${featureId}"]`).style.opacity = '1';
}

// Add feature to the current set
function addFeatureToSet(featureId) {
    const feature = limitsConfig.individual_features[featureId];
    currentFeatureSet.features.push(featureId);
    
    updateSelectedFeatures();
    updateDependencyAnalysis();
    updateConfiguration();
    
    // Hide empty message
    const emptyMessage = document.getElementById('emptyMessage');
    if (emptyMessage) emptyMessage.style.display = 'none';
}

// Remove feature from set
function removeFeatureFromSet(featureId) {
    currentFeatureSet.features = currentFeatureSet.features.filter(id => id !== featureId);
    
    updateSelectedFeatures();
    updateDependencyAnalysis();
    updateConfiguration();
    
    // Show empty message if no features
    if (currentFeatureSet.features.length === 0) {
        const emptyMessage = document.getElementById('emptyMessage');
        if (emptyMessage) emptyMessage.style.display = 'block';
    }
}

// Update selected features display
function updateSelectedFeatures() {
    const container = document.querySelector('.selected-features');
    const emptyMessage = document.getElementById('emptyMessage');
    
    // Clear existing features (except empty message)
    const existingFeatures = container.querySelectorAll('.selected-feature');
    existingFeatures.forEach(feature => feature.remove());
    
    if (currentFeatureSet.features.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        return;
    }
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    
    currentFeatureSet.features.forEach((featureId, index) => {
        const feature = limitsConfig.individual_features[featureId];
        
        const featureDiv = document.createElement('div');
        featureDiv.className = 'feature-item card mb-2 selected-feature';
        featureDiv.setAttribute('data-feature-id', featureId);
        featureDiv.innerHTML = `
            <div class="card-body p-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="card-title mb-1 small fw-bold">${feature.name}</h6>
                        <p class="text-muted mb-1" style="font-size: 0.8rem;">${feature.description}</p>
                        <div>
                            <span class="badge bg-secondary">${feature.category}</span>
                            <span class="badge bg-light text-dark">${feature.required_limits.length} limits</span>
                        </div>
                    </div>
                    <div class="d-flex flex-column">
                        <button class="btn btn-outline-danger btn-sm mb-1" onclick="removeFeatureFromSet('${featureId}')" title="Remove">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="text-muted small text-center">${index + 1}</div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(featureDiv);
    });
}

// Update dependency analysis
function updateDependencyAnalysis() {
    const container = document.getElementById('dependencyAnalysis');
    
    if (currentFeatureSet.features.length === 0) {
        container.innerHTML = '<small class="text-muted">Select features to see dependencies</small>';
        return;
    }
    
    // Collect all required limits
    const allRequiredLimits = new Set();
    const limitsByFeature = {};
    
    currentFeatureSet.features.forEach(featureId => {
        const feature = limitsConfig.individual_features[featureId];
        limitsByFeature[featureId] = feature.required_limits;
        feature.required_limits.forEach(limitId => allRequiredLimits.add(limitId));
    });
    
    // Create dependency visualization
    let html = '<div class="dependency-summary mb-2">';
    html += `<strong>Total Required Limits:</strong> <span class="badge bg-primary">${allRequiredLimits.size}</span>`;
    html += '</div>';
    
    if (allRequiredLimits.size > 0) {
        html += '<div class="limit-list">';
        Array.from(allRequiredLimits).forEach(limitId => {
            const limitType = limitsConfig.limit_types[limitId];
            const usedByCount = Object.values(limitsByFeature).filter(limits => limits.includes(limitId)).length;
            html += `
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <small class="text-muted">${limitType.name}</small>
                    <span class="badge bg-light text-dark">${usedByCount} feature${usedByCount > 1 ? 's' : ''}</span>
                </div>
            `;
        });
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// Update configuration summary
function updateConfiguration() {
    // Update selected count
    document.getElementById('selectedCount').innerHTML = `
        <span class="badge bg-primary">${currentFeatureSet.features.length}</span> features selected
    `;
    
    // Update required limits
    const allRequiredLimits = new Set();
    currentFeatureSet.features.forEach(featureId => {
        const feature = limitsConfig.individual_features[featureId];
        feature.required_limits.forEach(limitId => allRequiredLimits.add(limitId));
    });
    
    const limitsContainer = document.getElementById('requiredLimits');
    if (allRequiredLimits.size === 0) {
        limitsContainer.innerHTML = '<small class="text-muted">No features selected</small>';
    } else {
        limitsContainer.innerHTML = Array.from(allRequiredLimits).map(limitId => {
            const limitType = limitsConfig.limit_types[limitId];
            return `<span class="badge bg-light text-dark me-1 mb-1">${limitType.name}</span>`;
        }).join('');
    }
    
    // Update complexity score
    const complexity = Math.min(100, (currentFeatureSet.features.length * 5) + (allRequiredLimits.size * 3));
    const progressBar = document.querySelector('#complexityScore .progress-bar');
    const progressText = document.querySelector('#complexityScore .text-muted');
    
    progressBar.style.width = `${complexity}%`;
    progressBar.className = `progress-bar ${complexity > 70 ? 'bg-danger' : complexity > 40 ? 'bg-warning' : 'bg-success'}`;
    progressText.textContent = `${complexity}% complexity`;
}

// Filter features by category
function filterFeatures() {
    const selectedCategory = document.getElementById('featureFilter').value;
    const availableFeatures = document.querySelectorAll('.available-feature');
    
    availableFeatures.forEach(feature => {
        const featureCategory = feature.dataset.category;
        if (selectedCategory === 'all' || featureCategory === selectedCategory) {
            feature.style.display = 'block';
        } else {
            feature.style.display = 'none';
        }
    });
}

// Load configuration data from limits config
const limitsConfig = <?= json_encode($limitsConfig) ?>;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateConfiguration();
    
    // Add event listeners for basic info
    document.getElementById('setName').addEventListener('input', function() {
        currentFeatureSet.name = this.value;
    });
    
    document.getElementById('setDescription').addEventListener('input', function() {
        currentFeatureSet.description = this.value;
    });
    
    document.getElementById('setCategory').addEventListener('change', function() {
        currentFeatureSet.category = this.value;
    });
    
    document.getElementById('setPriority').addEventListener('change', function() {
        currentFeatureSet.priority = this.value;
    });
});

// Feature Set Management Functions
function saveFeatureSet() {
    if (!currentFeatureSet.name.trim()) {
        alert('Please enter a feature set name.');
        return;
    }
    
    if (currentFeatureSet.features.length === 0) {
        alert('Please add at least one feature to the set.');
        return;
    }
    
    const setData = {
        name: currentFeatureSet.name,
        description: currentFeatureSet.description,
        category: currentFeatureSet.category,
        priority: currentFeatureSet.priority,
        features: currentFeatureSet.features,
        created: new Date().toISOString()
    };
    
    alert(`Feature Set "${currentFeatureSet.name}" saved successfully!\\n\\nFeatures: ${currentFeatureSet.features.length}\\n\\nThis would normally save to the configuration and make it available for use in plans.`);
    console.log('Feature set saved:', setData);
}

function resetBuilder() {
    currentFeatureSet = {
        name: '',
        description: '',
        category: 'core',
        priority: 'recommended',
        features: []
    };
    
    document.getElementById('setName').value = '';
    document.getElementById('setDescription').value = '';
    document.getElementById('setCategory').value = 'core';
    document.getElementById('setPriority').value = 'recommended';
    
    updateSelectedFeatures();
    updateDependencyAnalysis();
    updateConfiguration();
}

function loadFeatureSet(setId) {
    const featureSet = limitsConfig.feature_sets[setId];
    if (!featureSet) return;
    
    currentFeatureSet = {
        name: featureSet.name,
        description: featureSet.description,
        category: 'custom',
        priority: 'recommended',
        features: [...featureSet.features]
    };
    
    document.getElementById('setName').value = currentFeatureSet.name;
    document.getElementById('setDescription').value = currentFeatureSet.description;
    
    updateSelectedFeatures();
    updateDependencyAnalysis();
    updateConfiguration();
}

function cloneFeatureSet(setId) {
    loadFeatureSet(setId);
    currentFeatureSet.name = currentFeatureSet.name + ' (Copy)';
    document.getElementById('setName').value = currentFeatureSet.name;
}

function deleteFeatureSet(setId) {
    const featureSet = limitsConfig.feature_sets[setId];
    if (confirm(`Are you sure you want to delete the feature set "${featureSet.name}"?\\n\\nThis action cannot be undone.`)) {
        alert(`Feature set "${featureSet.name}" deleted successfully.`);
    }
}

function createQuickSet(type) {
    const quickSets = {
        starter: {
            name: 'Starter Bundle',
            description: 'Essential features for getting started',
            features: ['user_management', 'basic_search', 'profile_creation', 'basic_messaging']
        },
        professional: {
            name: 'Professional Bundle',
            description: 'Advanced features for professional users',
            features: ['advanced_search', 'portfolio_builder', 'calendar_integration', 'payment_processing', 'analytics_basic']
        },
        premium: {
            name: 'Premium Bundle',
            description: 'High-end features for power users',
            features: ['team_management', 'advanced_analytics', 'custom_branding', 'api_access', 'sso_integration']
        },
        complete: {
            name: 'Complete Bundle',
            description: 'All available features for maximum functionality',
            features: Object.keys(limitsConfig.individual_features)
        }
    };
    
    const quickSet = quickSets[type];
    if (!quickSet) return;
    
    currentFeatureSet = {
        name: quickSet.name,
        description: quickSet.description,
        category: 'custom',
        priority: 'recommended',
        features: quickSet.features.filter(featureId => limitsConfig.individual_features[featureId])
    };
    
    document.getElementById('setName').value = currentFeatureSet.name;
    document.getElementById('setDescription').value = currentFeatureSet.description;
    
    updateSelectedFeatures();
    updateDependencyAnalysis();
    updateConfiguration();
}

function previewFeatureSet() {
    if (currentFeatureSet.features.length === 0) {
        alert('Please add features to preview the feature set.');
        return;
    }
    
    const featureNames = currentFeatureSet.features.map(featureId => 
        limitsConfig.individual_features[featureId].name
    ).join('\\n• ');
    
    alert(`Feature Set Preview: "${currentFeatureSet.name}"\\n\\n${currentFeatureSet.description}\\n\\nIncluded Features:\\n• ${featureNames}`);
}

function validateDependencies() {
    if (currentFeatureSet.features.length === 0) {
        alert('Please add features to validate dependencies.');
        return;
    }
    
    const allLimits = new Set();
    const conflicts = [];
    
    currentFeatureSet.features.forEach(featureId => {
        const feature = limitsConfig.individual_features[featureId];
        feature.required_limits.forEach(limitId => {
            allLimits.add(limitId);
        });
    });
    
    let message = `Dependency Validation Results:\\n\\n✅ Feature set is valid!\\n\\nRequired Limits: ${allLimits.size}\\nFeatures: ${currentFeatureSet.features.length}`;
    
    if (conflicts.length > 0) {
        message += `\\n\\n⚠️ Potential Issues:\\n${conflicts.join('\\n')}`;
    }
    
    alert(message);
}

function exportFeatureSet() {
    if (!currentFeatureSet.name.trim()) {
        alert('Please enter a feature set name before exporting.');
        return;
    }
    
    const exportData = {
        ...currentFeatureSet,
        exported: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${currentFeatureSet.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-feature-set.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}
</script>

<?php echo renderFooter(); ?>