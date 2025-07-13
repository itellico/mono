<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Feature Dependency Manager - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'features/dependency-manager.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Features & Limits', 'href' => '#'],
            ['label' => 'Dependency Manager']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Feature Dependency Manager</h2>
                <p class="text-muted mb-0">Configure feature requirements, conflicts, and relationships</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="validateAllDependencies()">
                    <i class="fas fa-check-circle me-2"></i> Validate All
                </button>
                <button class="btn btn-primary" onclick="saveDependencies()">
                    <i class="fas fa-save me-2"></i> Save Changes
                </button>
            </div>
        </div>

        <!-- Dependency Warnings -->
        <div class="alert alert-warning alert-dismissible fade show mb-4">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Important:</strong> Modifying dependencies can affect existing tenant configurations. Always validate changes before saving.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>

        <!-- Quick Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Total Features</h6>
                        <h3 class="mb-0">47</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">With Dependencies</h6>
                        <h3 class="mb-0 text-primary">23</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Conflicts Defined</h6>
                        <h3 class="mb-0 text-warning">8</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Validation Errors</h6>
                        <h3 class="mb-0 text-danger">2</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Dependency Configuration -->
        <div class="row">
            <div class="col-lg-8">
                <!-- Features List -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Feature Dependencies Configuration</h5>
                    </div>
                    <div class="card-body">
                        <!-- Commission Tracking Feature -->
                        <div class="dependency-item mb-4">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">
                                        <i class="fas fa-percentage text-success me-2"></i>
                                        Commission Tracking
                                    </h6>
                                    <code class="small">feature.business.commissions</code>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" onclick="testFeature('commission-tracking')">
                                    <i class="fas fa-flask"></i> Test
                                </button>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <label class="form-label">Required Dependencies</label>
                                    <select class="form-select select2-multiple" multiple>
                                        <option value="manage-others" selected>Manage Others</option>
                                        <option value="invoicing" selected>Invoicing System</option>
                                        <option value="multiple-profiles" selected>Multiple Profiles</option>
                                        <option value="team-members">Team Members</option>
                                    </select>
                                    <small class="text-muted">Features that must be enabled first</small>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Conflicts With</label>
                                    <select class="form-select select2-multiple" multiple>
                                        <option value="simple-profile">Simple Profile Mode</option>
                                    </select>
                                    <small class="text-muted">Cannot be enabled together</small>
                                </div>
                            </div>
                            
                            <div class="mt-2">
                                <label class="form-label">Minimum Plan Required</label>
                                <select class="form-select">
                                    <option>Basic</option>
                                    <option>Professional</option>
                                    <option selected>Agency</option>
                                    <option>Enterprise</option>
                                </select>
                            </div>
                        </div>

                        <hr>

                        <!-- Guardian/Minor Management Feature -->
                        <div class="dependency-item mb-4">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">
                                        <i class="fas fa-child text-info me-2"></i>
                                        Minor Management
                                    </h6>
                                    <code class="small">feature.management.minors</code>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" onclick="testFeature('minor-management')">
                                    <i class="fas fa-flask"></i> Test
                                </button>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <label class="form-label">Required Dependencies</label>
                                    <select class="form-select select2-multiple" multiple>
                                        <option value="manage-others" selected>Manage Others</option>
                                        <option value="parental-controls" selected>Parental Controls</option>
                                        <option value="approval-workflows" selected>Approval Workflows</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Auto-Enables</label>
                                    <select class="form-select select2-multiple" multiple>
                                        <option value="trust-fund" selected>Trust Fund Management</option>
                                        <option value="age-verification" selected>Age Verification</option>
                                    </select>
                                    <small class="text-muted">Features enabled automatically</small>
                                </div>
                            </div>
                        </div>

                        <hr>

                        <!-- API Access Feature -->
                        <div class="dependency-item mb-4">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">
                                        <i class="fas fa-plug text-warning me-2"></i>
                                        API Access
                                    </h6>
                                    <code class="small">feature.business.api</code>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" onclick="testFeature('api-access')">
                                    <i class="fas fa-flask"></i> Test
                                </button>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <label class="form-label">Required Dependencies</label>
                                    <select class="form-select select2-multiple" multiple>
                                        <option value="advanced-security" selected>Advanced Security</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Optional Enhancements</label>
                                    <select class="form-select select2-multiple" multiple>
                                        <option value="webhooks">Webhooks</option>
                                        <option value="rate-limiting" selected>Rate Limiting</option>
                                    </select>
                                    <small class="text-muted">Recommended but not required</small>
                                </div>
                            </div>
                        </div>

                        <hr>

                        <!-- Multiple Profiles Feature -->
                        <div class="dependency-item mb-4">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">
                                        <i class="fas fa-users text-primary me-2"></i>
                                        Multiple Profiles
                                    </h6>
                                    <code class="small">feature.profiles.multiple</code>
                                    <span class="badge bg-danger ms-2">Validation Error</span>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" onclick="testFeature('multiple-profiles')">
                                    <i class="fas fa-flask"></i> Test
                                </button>
                            </div>
                            
                            <div class="alert alert-danger mt-2">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                <strong>Circular Dependency Detected:</strong> "Profile Switching" requires "Multiple Profiles" which requires "Profile Switching"
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <label class="form-label">Required Dependencies</label>
                                    <select class="form-select select2-multiple" multiple>
                                        <option value="basic-profile" selected>Basic Profile</option>
                                        <option value="profile-switching" selected class="text-danger">Profile Switching</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Conflicts With</label>
                                    <select class="form-select select2-multiple" multiple>
                                        <option value="single-profile-mode" selected>Single Profile Mode</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <!-- Dependency Visualizer -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Dependency Graph</h5>
                    </div>
                    <div class="card-body">
                        <div class="dependency-graph">
                            <div class="graph-node root">
                                <i class="fas fa-percentage"></i>
                                Commission Tracking
                            </div>
                            <div class="graph-connector"></div>
                            <div class="graph-level">
                                <div class="graph-node required">
                                    <i class="fas fa-users"></i>
                                    Manage Others
                                </div>
                                <div class="graph-node required">
                                    <i class="fas fa-file-invoice"></i>
                                    Invoicing
                                </div>
                                <div class="graph-node required">
                                    <i class="fas fa-user-circle"></i>
                                    Multiple Profiles
                                </div>
                            </div>
                            <div class="graph-connector"></div>
                            <div class="graph-level">
                                <div class="graph-node secondary">
                                    <i class="fas fa-user"></i>
                                    Basic Profile
                                </div>
                                <div class="graph-node secondary">
                                    <i class="fas fa-calculator"></i>
                                    Financial Tools
                                </div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <small class="text-muted">
                                <i class="fas fa-info-circle me-1"></i>
                                Shows dependencies for selected feature
                            </small>
                        </div>
                    </div>
                </div>

                <!-- Validation Results -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Validation Results</h5>
                    </div>
                    <div class="card-body">
                        <div class="validation-item mb-3">
                            <div class="d-flex align-items-start">
                                <i class="fas fa-times-circle text-danger me-2 mt-1"></i>
                                <div>
                                    <h6 class="mb-1">Circular Dependency</h6>
                                    <p class="small text-muted mb-0">Multiple Profiles ↔ Profile Switching</p>
                                </div>
                            </div>
                        </div>
                        <div class="validation-item mb-3">
                            <div class="d-flex align-items-start">
                                <i class="fas fa-times-circle text-danger me-2 mt-1"></i>
                                <div>
                                    <h6 class="mb-1">Missing Dependency</h6>
                                    <p class="small text-muted mb-0">Team Reports requires Analytics (not defined)</p>
                                </div>
                            </div>
                        </div>
                        <div class="validation-item mb-3">
                            <div class="d-flex align-items-start">
                                <i class="fas fa-exclamation-triangle text-warning me-2 mt-1"></i>
                                <div>
                                    <h6 class="mb-1">Unused Feature</h6>
                                    <p class="small text-muted mb-0">Legacy Reporting has no dependents</p>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-primary w-100" onclick="runFullValidation()">
                            <i class="fas fa-sync me-2"></i> Run Full Validation
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Conflict Resolution Rules -->
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">Conflict Resolution Rules</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>When Dependencies Are Not Met:</h6>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="radio" name="dep-resolution" id="dep1" checked>
                            <label class="form-check-label" for="dep1">
                                <strong>Block Activation</strong> - Prevent feature from being enabled
                            </label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="radio" name="dep-resolution" id="dep2">
                            <label class="form-check-label" for="dep2">
                                <strong>Auto-Enable Dependencies</strong> - Automatically enable required features
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="dep-resolution" id="dep3">
                            <label class="form-check-label" for="dep3">
                                <strong>Warn & Proceed</strong> - Show warning but allow activation
                            </label>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>When Conflicts Are Detected:</h6>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="radio" name="conflict-resolution" id="conf1" checked>
                            <label class="form-check-label" for="conf1">
                                <strong>Block Both</strong> - Prevent conflicting features from coexisting
                            </label>
                        </div>
                        <div class="form-check mb-2">
                            <input class="form-check-input" type="radio" name="conflict-resolution" id="conf2">
                            <label class="form-check-label" for="conf2">
                                <strong>Disable Existing</strong> - Turn off conflicting feature automatically
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="conflict-resolution" id="conf3">
                            <label class="form-check-label" for="conf3">
                                <strong>User Choice</strong> - Let user decide which to keep
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.dependency-item {
    padding: 1.5rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    transition: all 0.2s;
}

.dependency-item:hover {
    background-color: #f8f9fa;
    border-color: #0d6efd;
}

.dependency-graph {
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 0.375rem;
}

.graph-node {
    display: inline-block;
    padding: 0.75rem 1rem;
    margin: 0.25rem;
    background: white;
    border: 2px solid #dee2e6;
    border-radius: 0.375rem;
    font-size: 0.875rem;
}

.graph-node.root {
    border-color: #0d6efd;
    background: #e7f3ff;
}

.graph-node.required {
    border-color: #dc3545;
}

.graph-node.secondary {
    border-color: #6c757d;
    opacity: 0.7;
}

.graph-connector {
    width: 2px;
    height: 20px;
    background: #6c757d;
    margin: 0 auto;
}

.graph-level {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.validation-item {
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 0.375rem;
}
</style>

<script>
function validateAllDependencies() {
    alert('Validating all feature dependencies...\n\nChecking for:\n- Circular dependencies\n- Missing features\n- Conflicting configurations\n- Plan requirement violations');
}

function saveDependencies() {
    alert('Saving dependency configuration...\n\nThis will:\n1. Update feature relationships\n2. Revalidate all tenant configurations\n3. Send notifications about changes');
}

function testFeature(featureId) {
    alert(`Testing feature: ${featureId}\n\nSimulating:\n- Dependency checks\n- Conflict detection\n- Plan eligibility\n- Auto-enable behavior`);
}

function runFullValidation() {
    alert('Running comprehensive validation...\n\nThis may take a few moments.');
}
</script>

<?php echo renderFooter(); ?>