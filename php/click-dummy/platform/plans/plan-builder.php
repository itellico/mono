<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

// Load limits configuration
$limitsConfig = json_decode(file_get_contents('../config/limits-config.json'), true);

echo renderHeader("Plan Builder - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'plans/plan-builder.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Subscription Plans', 'href' => 'index.php'],
            ['label' => 'Plan Builder']
        ]);
        
        echo createHeroSection(
            "Advanced Plan Builder",
            "Create compelling subscription plans with drag-and-drop features, configurable limits, and reusable feature sets",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=300&fit=crop",
            [
                ['label' => 'New Plan', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Load Template', 'icon' => 'fas fa-layer-group', 'style' => 'info'],
                ['label' => 'Preview Plans', 'icon' => 'fas fa-eye', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Plan Builder Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Plan Templates', '4', 'fas fa-layer-group', 'primary');
            echo createStatCard('Individual Features', '32', 'fas fa-puzzle-piece', 'success');
            echo createStatCard('Limit Types', '12', 'fas fa-sliders-h', 'info');
            echo createStatCard('Active Plans', '5', 'fas fa-tags', 'warning');
            ?>
        </div>
        
        <div class="row">
            <!-- Plan Builder Interface -->
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Plan Builder Interface</h5>
                        <div class="btn-group">
                            <button class="btn btn-primary" onclick="savePlan()">
                                <i class="fas fa-save me-2"></i> Save Plan
                            </button>
                            <button class="btn btn-outline-secondary" onclick="previewPlan()">
                                <i class="fas fa-eye me-2"></i> Preview
                            </button>
                            <button class="btn btn-outline-info" onclick="loadTemplate()">
                                <i class="fas fa-layer-group me-2"></i> Load Template
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Plan Basic Info -->
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Plan Name</label>
                                    <input type="text" class="form-control" id="planName" placeholder="e.g., Professional Model">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Plan Description</label>
                                    <textarea class="form-control" id="planDescription" rows="3" placeholder="Perfect for professional models and talent..."></textarea>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Monthly Price (€)</label>
                                    <input type="number" class="form-control" id="planPrice" placeholder="29.00">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Plan Color</label>
                                    <div class="d-flex gap-2">
                                        <input type="color" class="form-control form-control-color" id="planColor" value="#0066cc">
                                        <select class="form-select" id="planTier">
                                            <option value="starter">Starter Tier</option>
                                            <option value="professional">Professional Tier</option>
                                            <option value="agency">Agency Tier</option>
                                            <option value="enterprise">Enterprise Tier</option>
                                            <option value="platform">Platform Tier</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Features with Embedded Limits -->
                        <div class="mb-4">
                            <h6 class="fw-bold mb-3">
                                <i class="fas fa-puzzle-piece text-primary me-2"></i> Features & Limits Configuration
                                <small class="text-muted ms-2">(Select features to automatically configure their required limits)</small>
                            </h6>
                            
                            <!-- Feature Categories Tabs -->
                            <ul class="nav nav-pills mb-3" id="featureCategoryTabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="core-tab" data-bs-toggle="pill" data-bs-target="#core-features" type="button">
                                        Core
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="professional-tab" data-bs-toggle="pill" data-bs-target="#professional-features" type="button">
                                        Professional
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="agency-tab" data-bs-toggle="pill" data-bs-target="#agency-features" type="button">
                                        Agency
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="enterprise-tab" data-bs-toggle="pill" data-bs-target="#enterprise-features" type="button">
                                        Enterprise
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="marketplace-tab" data-bs-toggle="pill" data-bs-target="#marketplace-features" type="button">
                                        Marketplace
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="communication-tab" data-bs-toggle="pill" data-bs-target="#communication-features" type="button">
                                        Communication
                                    </button>
                                </li>
                            </ul>
                            
                            <!-- Feature Categories Content -->
                            <div class="tab-content" id="featureCategoryContent">
                                <?php 
                                $categories = ['core', 'professional', 'agency', 'enterprise', 'marketplace', 'communication'];
                                foreach ($categories as $index => $category): 
                                ?>
                                <div class="tab-pane fade <?= $index === 0 ? 'show active' : '' ?>" id="<?= $category ?>-features" role="tabpanel">
                                    <div class="row g-3">
                                        <?php foreach ($limitsConfig['individual_features'] as $featureId => $feature): ?>
                                            <?php if ($feature['category'] === $category): ?>
                                            <div class="col-12">
                                                <div class="card border feature-card" data-feature-id="<?= $featureId ?>">
                                                    <div class="card-body">
                                                        <!-- Feature Header -->
                                                        <div class="d-flex justify-content-between align-items-center mb-3">
                                                            <div class="d-flex align-items-center">
                                                                <div class="form-check form-switch me-3">
                                                                    <input class="form-check-input" type="checkbox" id="feature-<?= $featureId ?>" onchange="toggleFeature('<?= $featureId ?>')">
                                                                    <label class="form-check-label fw-bold" for="feature-<?= $featureId ?>">
                                                                        <?= htmlspecialchars($feature['name']) ?>
                                                                    </label>
                                                                </div>
                                                                <span class="badge bg-secondary"><?= ucfirst($feature['category']) ?></span>
                                                            </div>
                                                            <div class="text-end">
                                                                <small class="text-muted">
                                                                    <?= count($feature['required_limits']) ?> required + <?= count($feature['optional_limits']) ?> optional limits
                                                                </small>
                                                            </div>
                                                        </div>
                                                        
                                                        <!-- Feature Description -->
                                                        <p class="text-muted mb-3"><?= htmlspecialchars($feature['description']) ?></p>
                                                        
                                                        <!-- Embedded Limits Configuration -->
                                                        <div class="feature-limits" id="limits-<?= $featureId ?>" style="display: none;">
                                                            <div class="border-top pt-3">
                                                                <h6 class="text-primary mb-3">
                                                                    <i class="fas fa-sliders-h me-2"></i>
                                                                    Limits for this Feature
                                                                </h6>
                                                                
                                                                <div class="row g-3">
                                                                    <!-- Required Limits -->
                                                                    <?php if (!empty($feature['required_limits'])): ?>
                                                                    <div class="col-md-6">
                                                                        <h6 class="text-danger mb-2">🔴 Required Limits</h6>
                                                                        <?php foreach ($feature['required_limits'] as $limitId): ?>
                                                                            <?php $limitType = $limitsConfig['limit_types'][$limitId]; ?>
                                                                            <div class="card bg-light mb-2">
                                                                                <div class="card-body p-2">
                                                                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                                                                        <small class="fw-bold"><?= htmlspecialchars($limitType['name']) ?></small>
                                                                                        <span class="badge bg-danger">Required</span>
                                                                                    </div>
                                                                                    <p class="small text-muted mb-2"><?= htmlspecialchars($limitType['description']) ?></p>
                                                                                    <div class="input-group input-group-sm">
                                                                                        <input type="number" 
                                                                                               class="form-control" 
                                                                                               id="limit-<?= $featureId ?>-<?= $limitId ?>" 
                                                                                               placeholder="Value"
                                                                                               onchange="updateFeatureLimit('<?= $featureId ?>', '<?= $limitId ?>')">
                                                                                        <select class="form-select" id="unit-<?= $featureId ?>-<?= $limitId ?>" onchange="updateFeatureLimit('<?= $featureId ?>', '<?= $limitId ?>')">
                                                                                            <?php foreach ($limitType['units'] as $unit): ?>
                                                                                                <option value="<?= $unit ?>" <?= $unit === $limitType['default_unit'] ? 'selected' : '' ?>><?= $unit ?></option>
                                                                                            <?php endforeach; ?>
                                                                                        </select>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        <?php endforeach; ?>
                                                                    </div>
                                                                    <?php endif; ?>
                                                                    
                                                                    <!-- Optional Limits -->
                                                                    <?php if (!empty($feature['optional_limits'])): ?>
                                                                    <div class="col-md-6">
                                                                        <h6 class="text-info mb-2">🔵 Optional Limits</h6>
                                                                        <?php foreach ($feature['optional_limits'] as $limitId): ?>
                                                                            <?php $limitType = $limitsConfig['limit_types'][$limitId]; ?>
                                                                            <div class="card mb-2">
                                                                                <div class="card-body p-2">
                                                                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                                                                        <small class="fw-bold"><?= htmlspecialchars($limitType['name']) ?></small>
                                                                                        <div class="form-check form-switch">
                                                                                            <input class="form-check-input" type="checkbox" id="optional-<?= $featureId ?>-<?= $limitId ?>" onchange="toggleOptionalLimit('<?= $featureId ?>', '<?= $limitId ?>')">
                                                                                        </div>
                                                                                    </div>
                                                                                    <p class="small text-muted mb-2"><?= htmlspecialchars($limitType['description']) ?></p>
                                                                                    <div class="input-group input-group-sm" id="optional-controls-<?= $featureId ?>-<?= $limitId ?>" style="display: none;">
                                                                                        <input type="number" 
                                                                                               class="form-control" 
                                                                                               id="optional-limit-<?= $featureId ?>-<?= $limitId ?>" 
                                                                                               placeholder="Value"
                                                                                               onchange="updateOptionalLimit('<?= $featureId ?>', '<?= $limitId ?>')">
                                                                                        <select class="form-select" id="optional-unit-<?= $featureId ?>-<?= $limitId ?>" onchange="updateOptionalLimit('<?= $featureId ?>', '<?= $limitId ?>')">
                                                                                            <?php foreach ($limitType['units'] as $unit): ?>
                                                                                                <option value="<?= $unit ?>" <?= $unit === $limitType['default_unit'] ? 'selected' : '' ?>><?= $unit ?></option>
                                                                                            <?php endforeach; ?>
                                                                                        </select>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        <?php endforeach; ?>
                                                                    </div>
                                                                    <?php endif; ?>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        
                        <!-- Access Control Clarification -->
                        <div class="alert alert-info mb-4">
                            <h6 class="alert-heading"><i class="fas fa-info-circle me-2"></i>Access Control Limits</h6>
                            <div class="row g-3 small">
                                <div class="col-md-4">
                                    <strong>👥 Users:</strong> Total individual people who can have accounts (e.g., 25 users)
                                </div>
                                <div class="col-md-4">
                                    <strong>💺 Seats:</strong> Concurrent active/licensed users (e.g., 15 seats for 25 users)
                                </div>
                                <div class="col-md-4">
                                    <strong>🏢 Accounts:</strong> Separate business entities (e.g., 3 agency accounts)
                                </div>
                            </div>
                            <hr class="my-2">
                            <small class="text-muted">
                                <strong>Example:</strong> An "Agency Plan" might allow 100 total users, 50 concurrent seats, across 10 different agency accounts.
                            </small>
                        </div>
                        
                    </div>
                </div>
            </div>
            
            <!-- Live Preview & Tools -->
            <div class="col-lg-4">
                <!-- Live Plan Preview -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-eye text-primary me-2"></i> Live Preview
                        </h6>
                    </div>
                    <div class="card-body text-center" id="planPreview">
                        <div class="plan-preview-card" style="border: 2px solid #0066cc; border-radius: 8px; padding: 20px;">
                            <div class="plan-header mb-3">
                                <h5 id="previewName" class="fw-bold">Professional Model</h5>
                                <div class="plan-price mb-2">
                                    <span class="h2" id="previewPrice">€29</span>
                                    <small class="text-muted">/month</small>
                                </div>
                                <p class="text-muted small" id="previewDescription">Perfect for professional models and talent</p>
                            </div>
                            <div class="plan-features text-start">
                                <div id="previewFeatures">
                                    <div class="mb-2"><i class="fas fa-check text-success me-2"></i> Core Features</div>
                                </div>
                            </div>
                            <div class="plan-limits text-start">
                                <div id="previewLimits">
                                    <hr class="my-3">
                                    <small class="text-muted">Limits will appear here...</small>
                                </div>
                            </div>
                            <button class="btn btn-primary w-100 mt-3" disabled>
                                Choose Plan
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Configuration Summary -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-list text-success me-2"></i> Configuration Summary
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="config-summary">
                            <div class="mb-3">
                                <strong>Selected Features:</strong>
                                <div id="summaryFeatures" class="mt-1">
                                    <small class="text-muted">No features selected</small>
                                </div>
                            </div>
                            <div class="mb-3">
                                <strong>Active Limits:</strong>
                                <div id="summaryLimits" class="mt-1">
                                    <small class="text-muted">No limits configured</small>
                                </div>
                            </div>
                            <div class="mb-3">
                                <strong>Auto-Enabled Limits:</strong>
                                <div id="summaryAutoLimits" class="mt-1">
                                    <small class="text-muted">No auto-enabled limits</small>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-6">
                                    <strong>Total Features:</strong>
                                    <span id="totalFeatures" class="badge bg-primary">0</span>
                                </div>
                                <div class="col-6">
                                    <strong>Total Limits:</strong>
                                    <span id="totalLimits" class="badge bg-success">0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Plan Actions -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-tools text-warning me-2"></i> Plan Actions
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" onclick="savePlan()">
                                <i class="fas fa-save me-2"></i> Save Plan
                            </button>
                            <button class="btn btn-outline-secondary" onclick="exportPlanJSON()">
                                <i class="fas fa-download me-2"></i> Export JSON
                            </button>
                            <button class="btn btn-outline-info" onclick="validatePlan()">
                                <i class="fas fa-check-circle me-2"></i> Validate Plan
                            </button>
                            <button class="btn btn-outline-success" onclick="testPlanLimits()">
                                <i class="fas fa-vial me-2"></i> Test Limits
                            </button>
                            <button class="btn btn-outline-danger" onclick="resetBuilder()">
                                <i class="fas fa-undo me-2"></i> Reset Builder
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Load the limits configuration
const limitsConfig = <?= json_encode($limitsConfig) ?>;

// Current plan configuration
let currentPlan = {
    name: '',
    description: '',
    price: 0,
    color: '#0066cc',
    tier: 'professional',
    individual_features: [],  // Individual features selected
    limits: {},
    auto_enabled_limits: []   // Limits that were auto-enabled by features
};

// Initialize the plan builder
document.addEventListener('DOMContentLoaded', function() {
    updatePreview();
    
    // Add event listeners
    document.getElementById('planName').addEventListener('input', updatePreview);
    document.getElementById('planDescription').addEventListener('input', updatePreview);
    document.getElementById('planPrice').addEventListener('input', updatePreview);
    document.getElementById('planColor').addEventListener('change', updatePreview);
    document.getElementById('planTier').addEventListener('change', updatePreview);
});

// Auto-enable a limit with default values for embedded limits
function autoEnableEmbeddedLimit(featureId, limitId) {
    // Set default values from predefined limits
    const tier = document.getElementById('planTier').value;
    const defaultLimits = limitsConfig.predefined_limits[tier];
    if (defaultLimits && defaultLimits[limitId]) {
        const valueInput = document.getElementById(`limit-${featureId}-${limitId}`);
        const unitSelect = document.getElementById(`unit-${featureId}-${limitId}`);
        if (valueInput && unitSelect) {
            valueInput.value = defaultLimits[limitId].value;
            unitSelect.value = defaultLimits[limitId].unit;
        }
    }
    
    // Update current plan
    if (!currentPlan.limits[limitId]) {
        currentPlan.limits[limitId] = {
            value: document.getElementById(`limit-${featureId}-${limitId}`)?.value || 0,
            unit: document.getElementById(`unit-${featureId}-${limitId}`)?.value || 'units'
        };
    }
    
    // Track that this limit was auto-enabled
    if (!currentPlan.auto_enabled_limits.includes(limitId)) {
        currentPlan.auto_enabled_limits.push(limitId);
    }
}

// Toggle individual feature selection
function toggleFeature(featureId) {
    const checkbox = document.getElementById(`feature-${featureId}`);
    const card = document.querySelector(`[data-feature-id="${featureId}"]`);
    const limitsContainer = document.getElementById(`limits-${featureId}`);
    const feature = limitsConfig.individual_features[featureId];
    
    if (checkbox.checked) {
        // Add feature to plan
        currentPlan.individual_features.push(featureId);
        card.classList.add('border-success', 'bg-light');
        limitsContainer.style.display = 'block';
        
        // Auto-enable required limits
        feature.required_limits.forEach(limitId => {
            autoEnableEmbeddedLimit(featureId, limitId);
        });
        
        // Show success message
        showFeatureLimitConnection(featureId, feature.required_limits);
        
    } else {
        // Remove feature from plan
        currentPlan.individual_features = currentPlan.individual_features.filter(id => id !== featureId);
        card.classList.remove('border-success', 'bg-light');
        limitsContainer.style.display = 'none';
        
        // Check if any required limits are no longer needed
        feature.required_limits.forEach(limitId => {
            const stillNeeded = currentPlan.individual_features.some(otherFeatureId => {
                const otherFeature = limitsConfig.individual_features[otherFeatureId];
                return otherFeature.required_limits.includes(limitId);
            });
            
            if (!stillNeeded && currentPlan.auto_enabled_limits.includes(limitId)) {
                // Remove from plan
                delete currentPlan.limits[limitId];
                currentPlan.auto_enabled_limits = currentPlan.auto_enabled_limits.filter(id => id !== limitId);
            }
        });
    }
    
    updatePreview();
    updateSummary();
}

// Update feature limit value
function updateFeatureLimit(featureId, limitId) {
    const valueInput = document.getElementById(`limit-${featureId}-${limitId}`);
    const unitSelect = document.getElementById(`unit-${featureId}-${limitId}`);
    
    if (valueInput && unitSelect) {
        currentPlan.limits[limitId] = {
            value: parseInt(valueInput.value) || 0,
            unit: unitSelect.value
        };
        
        updatePreview();
        updateSummary();
    }
}

// Toggle optional limit
function toggleOptionalLimit(featureId, limitId) {
    const checkbox = document.getElementById(`optional-${featureId}-${limitId}`);
    const controls = document.getElementById(`optional-controls-${featureId}-${limitId}`);
    
    if (checkbox.checked) {
        controls.style.display = 'block';
        // Set default values
        autoEnableEmbeddedLimit(featureId, limitId);
    } else {
        controls.style.display = 'none';
        // Remove from plan if it was optional
        if (currentPlan.limits[limitId]) {
            delete currentPlan.limits[limitId];
        }
    }
    
    updatePreview();
    updateSummary();
}

// Update optional limit value
function updateOptionalLimit(featureId, limitId) {
    const valueInput = document.getElementById(`optional-limit-${featureId}-${limitId}`);
    const unitSelect = document.getElementById(`optional-unit-${featureId}-${limitId}`);
    
    if (valueInput && unitSelect) {
        currentPlan.limits[limitId] = {
            value: parseInt(valueInput.value) || 0,
            unit: unitSelect.value
        };
        
        updatePreview();
        updateSummary();
    }
}

// Select entire feature set (quick action)
function selectFeatureSet(setId) {
    const featureSet = limitsConfig.feature_sets[setId];
    if (!featureSet) return;
    
    let enabledCount = 0;
    
    // Enable all features in the set
    featureSet.features.forEach(featureId => {
        const checkbox = document.getElementById(`feature-${featureId}`);
        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            toggleFeature(featureId);
            enabledCount++;
        }
    });
    
    // Show feedback
    if (enabledCount > 0) {
        alert(`Enabled ${enabledCount} features from "${featureSet.name}" feature set!\n\nRequired limits have been automatically configured.`);
    } else {
        alert(`All features from "${featureSet.name}" are already enabled.`);
    }
}

// Highlight connection between feature and required limit
function highlightRequiredLimit(limitId, featureId) {
    const limitCard = document.querySelector(`[data-limit-id="${limitId}"]`);
    if (limitCard) {
        limitCard.style.boxShadow = '0 0 10px rgba(220, 53, 69, 0.5)';
        setTimeout(() => {
            limitCard.style.boxShadow = '';
        }, 2000);
    }
}

// Show feature-limit connection feedback
function showFeatureLimitConnection(featureId, requiredLimits) {
    const feature = limitsConfig.individual_features[featureId];
    if (requiredLimits.length > 0) {
        const limitNames = requiredLimits.map(id => limitsConfig.limit_types[id]?.name || id).join(', ');
        
        // Show a brief notification
        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 300px;';
        notification.innerHTML = `
            <small><strong>${feature.name}</strong> enabled!<br>
            Auto-configured: ${limitNames}</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }
}


// Update live preview
function updatePreview() {
    // Update basic info
    currentPlan.name = document.getElementById('planName').value || 'New Plan';
    currentPlan.description = document.getElementById('planDescription').value || 'Plan description';
    currentPlan.price = document.getElementById('planPrice').value || 0;
    currentPlan.color = document.getElementById('planColor').value;
    currentPlan.tier = document.getElementById('planTier').value;
    
    // Update preview elements
    document.getElementById('previewName').textContent = currentPlan.name;
    document.getElementById('previewPrice').textContent = `€${currentPlan.price}`;
    document.getElementById('previewDescription').textContent = currentPlan.description;
    
    // Update preview card border color
    document.querySelector('.plan-preview-card').style.borderColor = currentPlan.color;
    
    // Update features in preview
    const featuresContainer = document.getElementById('previewFeatures');
    featuresContainer.innerHTML = '';
    
    if (currentPlan.individual_features.length > 0) {
        // Group features by category for better display
        const featuresByCategory = {};
        currentPlan.individual_features.forEach(featureId => {
            const feature = limitsConfig.individual_features[featureId];
            if (!featuresByCategory[feature.category]) {
                featuresByCategory[feature.category] = [];
            }
            featuresByCategory[feature.category].push(feature);
        });
        
        // Display features grouped by category
        Object.entries(featuresByCategory).forEach(([category, features]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'mb-2';
            categoryDiv.innerHTML = `<small class="text-muted fw-bold text-uppercase">${category}</small>`;
            featuresContainer.appendChild(categoryDiv);
            
            features.forEach(feature => {
                const featureDiv = document.createElement('div');
                featureDiv.className = 'mb-1 small';
                featureDiv.innerHTML = `<i class="fas fa-check text-success me-2"></i> ${feature.name}`;
                featuresContainer.appendChild(featureDiv);
            });
        });
    } else {
        featuresContainer.innerHTML = '<small class="text-muted">No features selected</small>';
    }
    
    // Update limits in preview
    const limitsContainer = document.getElementById('previewLimits');
    limitsContainer.innerHTML = '<hr class="my-3">';
    
    if (Object.keys(currentPlan.limits).length > 0) {
        Object.entries(currentPlan.limits).forEach(([limitId, config]) => {
            const limitType = limitsConfig.limit_types[limitId];
            const limitDiv = document.createElement('div');
            limitDiv.className = 'mb-1 small';
            limitDiv.innerHTML = `<i class="fas fa-info-circle text-primary me-2"></i> ${limitType.name}: ${config.value} ${config.unit}`;
            limitsContainer.appendChild(limitDiv);
        });
    } else {
        const noLimitsDiv = document.createElement('div');
        noLimitsDiv.innerHTML = '<small class="text-muted">No limits configured</small>';
        limitsContainer.appendChild(noLimitsDiv);
    }
}

// Update configuration summary
function updateSummary() {
    // Update individual features summary
    const featuresContainer = document.getElementById('summaryFeatures');
    if (currentPlan.individual_features.length > 0) {
        featuresContainer.innerHTML = currentPlan.individual_features.map(featureId => {
            const feature = limitsConfig.individual_features[featureId];
            const categoryColors = {
                'core': 'primary',
                'professional': 'info', 
                'agency': 'warning',
                'enterprise': 'danger',
                'marketplace': 'success',
                'communication': 'secondary'
            };
            const color = categoryColors[feature.category] || 'primary';
            return `<span class="badge bg-${color} me-1 mb-1" title="${feature.description}">${feature.name}</span>`;
        }).join('');
    } else {
        featuresContainer.innerHTML = '<small class="text-muted">No features selected</small>';
    }
    
    // Update active limits summary
    const limitsContainer = document.getElementById('summaryLimits');
    const manualLimits = Object.keys(currentPlan.limits).filter(limitId => 
        !currentPlan.auto_enabled_limits.includes(limitId)
    );
    
    if (manualLimits.length > 0) {
        limitsContainer.innerHTML = manualLimits.map(limitId => 
            `<span class="badge bg-success me-1 mb-1">${limitsConfig.limit_types[limitId].name}</span>`
        ).join('');
    } else {
        limitsContainer.innerHTML = '<small class="text-muted">No manual limits configured</small>';
    }
    
    // Update auto-enabled limits summary
    const autoLimitsContainer = document.getElementById('summaryAutoLimits');
    if (currentPlan.auto_enabled_limits.length > 0) {
        autoLimitsContainer.innerHTML = currentPlan.auto_enabled_limits.map(limitId => 
            `<span class="badge bg-danger me-1 mb-1" title="Auto-enabled by feature requirements">${limitsConfig.limit_types[limitId].name}</span>`
        ).join('');
    } else {
        autoLimitsContainer.innerHTML = '<small class="text-muted">No auto-enabled limits</small>';
    }
    
    // Update total counts
    document.getElementById('totalFeatures').textContent = currentPlan.individual_features.length;
    document.getElementById('totalLimits').textContent = Object.keys(currentPlan.limits).length;
}

// Load plan template
function loadPlanTemplate(templateId) {
    const template = limitsConfig.plan_templates[templateId];
    if (!template) return;
    
    // Clear current selection
    resetBuilder();
    
    // Load feature sets and auto-enable their individual features
    template.feature_sets.forEach(setId => {
        const featureSet = limitsConfig.feature_sets[setId];
        if (featureSet) {
            // Enable all individual features from this set
            featureSet.features.forEach(featureId => {
                const checkbox = document.getElementById(`feature-${featureId}`);
                if (checkbox) {
                    checkbox.checked = true;
                    toggleFeature(featureId);
                }
            });
        }
    });
    
    // Update plan name
    document.getElementById('planName').value = template.name;
    
    updatePreview();
    updateSummary();
    
    alert(`Template "${template.name}" loaded successfully!`);
}

// Plan actions
function savePlan() {
    if (!currentPlan.name) {
        alert('Please enter a plan name');
        return;
    }
    
    alert(`Plan "${currentPlan.name}" saved successfully!\n\nFeature Sets: ${currentPlan.feature_sets.length}\nLimits: ${Object.keys(currentPlan.limits).length}\nTotal Features: ${currentPlan.features.length}`);
}

function exportPlanJSON() {
    const planJSON = JSON.stringify(currentPlan, null, 2);
    const blob = new Blob([planJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPlan.name || 'plan'}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function validatePlan() {
    const errors = [];
    
    if (!currentPlan.name) errors.push('Plan name is required');
    if (!currentPlan.description) errors.push('Plan description is required');
    if (!currentPlan.price || currentPlan.price <= 0) errors.push('Valid price is required');
    if (currentPlan.feature_sets.length === 0) errors.push('At least one feature set must be selected');
    
    if (errors.length > 0) {
        alert('Validation Errors:\n' + errors.join('\n'));
    } else {
        alert('Plan validation passed! ✅');
    }
}

function testPlanLimits() {
    if (Object.keys(currentPlan.limits).length === 0) {
        alert('No limits configured to test');
        return;
    }
    
    let testResults = 'Limit Test Results:\n\n';
    Object.entries(currentPlan.limits).forEach(([limitId, config]) => {
        const limitType = limitsConfig.limit_types[limitId];
        testResults += `${limitType.name}: ${config.value} ${config.unit} (${limitType.enforcement})\n`;
    });
    
    alert(testResults);
}

function resetBuilder() {
    // Reset form
    document.getElementById('planName').value = '';
    document.getElementById('planDescription').value = '';
    document.getElementById('planPrice').value = '';
    document.getElementById('planColor').value = '#0066cc';
    document.getElementById('planTier').value = 'professional';
    
    // Reset feature sets
    document.querySelectorAll('[data-set-id]').forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        checkbox.checked = false;
        card.classList.remove('border-success', 'bg-light');
    });
    
    // Reset limits
    document.querySelectorAll('[data-limit-id]').forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        const controls = card.querySelector('.limit-controls');
        checkbox.checked = false;
        controls.style.display = 'none';
        card.classList.remove('border-success', 'bg-light');
    });
    
    // Reset current plan
    currentPlan = {
        name: '',
        description: '',
        price: 0,
        color: '#0066cc',
        tier: 'professional',
        feature_sets: [],
        limits: {},
        features: []
    };
    
    updatePreview();
    updateSummary();
}

// Select entire feature set (quick action)
function selectFeatureSet(setId) {
    const featureSet = limitsConfig.feature_sets[setId];
    if (!featureSet) return;
    
    let enabledCount = 0;
    
    // Enable all features in the set
    featureSet.features.forEach(featureId => {
        const checkbox = document.getElementById(`feature-${featureId}`);
        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            toggleFeature(featureId);
            enabledCount++;
        }
    });
    
    // Show feedback
    if (enabledCount > 0) {
        alert(`Enabled ${enabledCount} features from "${featureSet.name}" feature set!\n\nRequired limits have been automatically configured.`);
    } else {
        alert(`All features from "${featureSet.name}" are already enabled.`);
    }
}

// Highlight connection between feature and required limit (visual feedback)
function highlightRequiredLimit(limitId, featureId) {
    // Since limits are now embedded in features, highlight the feature card instead
    const featureCard = document.querySelector(`[data-feature-id="${featureId}"]`);
    if (featureCard) {
        featureCard.style.boxShadow = '0 0 10px rgba(0, 102, 204, 0.5)';
        setTimeout(() => {
            featureCard.style.boxShadow = '';
        }, 2000);
    }
}

// Reset the plan builder
function resetBuilder() {
    // Clear plan data
    currentPlan = {
        name: '',
        description: '',
        price: 0,
        color: '#0066cc',
        tier: 'professional',
        individual_features: [],
        limits: {},
        auto_enabled_limits: []
    };
    
    // Clear form inputs
    document.getElementById('planName').value = '';
    document.getElementById('planDescription').value = '';
    document.getElementById('planPrice').value = '';
    document.getElementById('planColor').value = '#0066cc';
    document.getElementById('planTier').value = 'professional';
    
    // Uncheck all feature checkboxes
    document.querySelectorAll('input[id^="feature-"]').forEach(checkbox => {
        checkbox.checked = false;
        const featureId = checkbox.id.replace('feature-', '');
        const card = document.querySelector(`[data-feature-id="${featureId}"]`);
        const limitsContainer = document.getElementById(`limits-${featureId}`);
        if (card) card.classList.remove('border-success', 'bg-light');
        if (limitsContainer) limitsContainer.style.display = 'none';
    });
    
    // Clear all embedded limit inputs
    document.querySelectorAll('input[id^="limit-"]').forEach(input => {
        if (input.type === 'number') input.value = '';
    });
    
    // Reset optional limit checkboxes
    document.querySelectorAll('input[id^="optional-"]').forEach(checkbox => {
        checkbox.checked = false;
        const parts = checkbox.id.split('-');
        if (parts.length >= 3) {
            const featureId = parts[1];
            const limitId = parts[2];
            const controls = document.getElementById(`optional-controls-${featureId}-${limitId}`);
            if (controls) controls.style.display = 'none';
        }
    });
    
    updatePreview();
    updateSummary();
}

// Save plan configuration
function savePlan() {
    const planName = document.getElementById('planName').value.trim();
    if (!planName) {
        alert('Please enter a plan name before saving.');
        return;
    }
    
    if (currentPlan.individual_features.length === 0) {
        alert('Please select at least one feature before saving.');
        return;
    }
    
    // Create save data
    const saveData = {
        ...currentPlan,
        name: planName,
        description: document.getElementById('planDescription').value.trim(),
        price: parseFloat(document.getElementById('planPrice').value) || 0,
        color: document.getElementById('planColor').value,
        tier: document.getElementById('planTier').value,
        created: new Date().toISOString(),
        version: '1.0'
    };
    
    // Simulate saving
    alert(`Plan "${planName}" saved successfully!\n\nFeatures: ${currentPlan.individual_features.length}\nLimits: ${Object.keys(currentPlan.limits).length}\n\nThis would normally save to the database and make it available for subscription.`);
    
    console.log('Plan saved:', saveData);
}

// Export plan as JSON
function exportPlanJSON() {
    const planName = document.getElementById('planName').value.trim() || 'new-plan';
    
    const exportData = {
        ...currentPlan,
        name: document.getElementById('planName').value.trim(),
        description: document.getElementById('planDescription').value.trim(),
        price: parseFloat(document.getElementById('planPrice').value) || 0,
        color: document.getElementById('planColor').value,
        tier: document.getElementById('planTier').value,
        exported: new Date().toISOString(),
        version: '1.0'
    };
    
    // Create download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${planName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-plan.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
}

// Validate plan configuration
function validatePlan() {
    const errors = [];
    const warnings = [];
    
    // Check basic info
    if (!document.getElementById('planName').value.trim()) {
        errors.push('Plan name is required');
    }
    
    if (!document.getElementById('planDescription').value.trim()) {
        warnings.push('Plan description is recommended for better user understanding');
    }
    
    const price = parseFloat(document.getElementById('planPrice').value);
    if (isNaN(price) || price < 0) {
        errors.push('Valid price is required');
    }
    
    // Check features
    if (currentPlan.individual_features.length === 0) {
        errors.push('At least one feature must be selected');
    }
    
    // Check limits
    if (Object.keys(currentPlan.limits).length === 0) {
        warnings.push('No limits configured - plan will have unlimited access');
    }
    
    // Check for missing required limits
    currentPlan.individual_features.forEach(featureId => {
        const feature = limitsConfig.individual_features[featureId];
        feature.required_limits.forEach(limitId => {
            if (!currentPlan.limits[limitId]) {
                errors.push(`Feature "${feature.name}" requires "${limitsConfig.limit_types[limitId].name}" limit`);
            }
        });
    });
    
    // Show validation results
    let message = 'Plan Validation Results:\n\n';
    
    if (errors.length > 0) {
        message += '❌ ERRORS:\n' + errors.map(e => `• ${e}`).join('\n') + '\n\n';
    }
    
    if (warnings.length > 0) {
        message += '⚠️ WARNINGS:\n' + warnings.map(w => `• ${w}`).join('\n') + '\n\n';
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        message += '✅ Plan configuration is valid!\n\nReady for production use.';
    } else if (errors.length === 0) {
        message += '✅ Plan configuration is valid with minor warnings.';
    }
    
    alert(message);
}

// Test plan limits
function testPlanLimits() {
    const testScenarios = [
        { users: 1, description: 'Single user scenario' },
        { users: Math.ceil(Object.keys(currentPlan.limits).length / 2), description: 'Medium usage scenario' },
        { users: Object.keys(currentPlan.limits).length || 10, description: 'High usage scenario' }
    ];
    
    let testResults = 'Plan Limits Test Results:\n\n';
    
    testScenarios.forEach(scenario => {
        testResults += `📊 ${scenario.description} (${scenario.users} users):\n`;
        
        Object.entries(currentPlan.limits).forEach(([limitId, config]) => {
            const limitType = limitsConfig.limit_types[limitId];
            const usage = scenario.users * (limitType.category === 'access' ? 1 : Math.random() * 0.8);
            const percentage = ((usage / config.value) * 100).toFixed(1);
            const status = percentage > 90 ? '🔴' : percentage > 70 ? '🟡' : '🟢';
            
            testResults += `  ${status} ${limitType.name}: ${usage.toFixed(1)}/${config.value} ${config.unit} (${percentage}%)\n`;
        });
        
        testResults += '\n';
    });
    
    testResults += 'Legend: 🟢 Good 🟡 Warning 🔴 Near limit';
    
    alert(testResults);
}

function previewPlan() {
    alert('Preview Plan: Opening plan preview in customer view...');
}

function loadTemplate() {
    alert('Load Template: Choose from pre-built plan templates or import from JSON file.');
}
</script>

<?php echo renderFooter(); ?>