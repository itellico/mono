<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Account Features Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'accounts/account-features.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Account Management', 'href' => 'index.php'],
            ['label' => 'Feature Configuration']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Account Features Configuration</h2>
                <p class="text-muted mb-0">Define available features for all accounts across the platform</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="exportFeatures()">
                    <i class="fas fa-download me-2"></i> Export
                </button>
                <button class="btn btn-primary" onclick="saveFeatureConfig()">
                    <i class="fas fa-save me-2"></i> Save Changes
                </button>
            </div>
        </div>

        <!-- Important Notice -->
        <div class="alert alert-info mb-4">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Unified Account Model:</strong> All accounts use the same base type. Features determine capabilities.
            No more "Agency Account" vs "Professional Account" - just accounts with different features enabled.
        </div>

        <!-- Feature Categories -->
        <div class="row g-4">
            <!-- Profile Management Features -->
            <div class="col-lg-6">
                <div class="card h-100">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-user-circle me-2"></i> Profile Management
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Multiple Profiles</h6>
                                    <code class="small">feature.profiles.multiple</code>
                                    <p class="text-muted small mb-1">Create multiple professional profiles (model, photographer, etc.)</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Profile Types Allowed</h6>
                                    <code class="small">feature.profiles.types</code>
                                    <p class="text-muted small mb-1">Which profile types can be created</p>
                                    <div class="mt-2">
                                        <label class="form-check form-check-inline">
                                            <input type="checkbox" class="form-check-input" checked>
                                            <span class="form-check-label small">Model</span>
                                        </label>
                                        <label class="form-check form-check-inline">
                                            <input type="checkbox" class="form-check-input" checked>
                                            <span class="form-check-label small">Photographer</span>
                                        </label>
                                        <label class="form-check form-check-inline">
                                            <input type="checkbox" class="form-check-input" checked>
                                            <span class="form-check-label small">Stylist</span>
                                        </label>
                                        <label class="form-check form-check-inline">
                                            <input type="checkbox" class="form-check-input" checked>
                                            <span class="form-check-label small">MUA</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Profile Limit</h6>
                                    <code class="small">feature.profiles.max_count</code>
                                    <p class="text-muted small mb-1">Maximum number of profiles per account</p>
                                    <input type="number" class="form-control form-control-sm mt-1" style="width: 100px" value="10">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Management Features -->
            <div class="col-lg-6">
                <div class="card h-100">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-users-cog me-2"></i> Management Capabilities
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Manage Other Profiles</h6>
                                    <code class="small">feature.management.others</code>
                                    <p class="text-muted small mb-1">Can create and manage profiles for other people</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Minor Management</h6>
                                    <code class="small">feature.management.minors</code>
                                    <p class="text-muted small mb-1">Special features for managing minors (trust fund, work permits)</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Team Members</h6>
                                    <code class="small">feature.management.team_size</code>
                                    <p class="text-muted small mb-1">Number of team members/staff allowed</p>
                                    <input type="number" class="form-control form-control-sm mt-1" style="width: 100px" value="50">
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Approval Workflows</h6>
                                    <code class="small">feature.management.approvals</code>
                                    <p class="text-muted small mb-1">Require approvals for managed profile actions</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Business Features -->
            <div class="col-lg-6">
                <div class="card h-100">
                    <div class="card-header bg-warning">
                        <h5 class="mb-0">
                            <i class="fas fa-briefcase me-2"></i> Business Features
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Custom Branding</h6>
                                    <code class="small">feature.business.branding</code>
                                    <p class="text-muted small mb-1">White-label with custom domain and branding</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox">
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Invoicing System</h6>
                                    <code class="small">feature.business.invoicing</code>
                                    <p class="text-muted small mb-1">Create and manage invoices</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Commission Management</h6>
                                    <code class="small">feature.business.commissions</code>
                                    <p class="text-muted small mb-1">Set commission rates for managed profiles</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>API Access</h6>
                                    <code class="small">feature.business.api</code>
                                    <p class="text-muted small mb-1">API integration capabilities</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Special Features -->
            <div class="col-lg-6">
                <div class="card h-100">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0">
                            <i class="fas fa-star me-2"></i> Special Features
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Trust Fund Management</h6>
                                    <code class="small">feature.special.trust_fund</code>
                                    <p class="text-muted small mb-1">Manage earnings for minors in trust funds</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox">
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Advanced Calendar</h6>
                                    <code class="small">feature.special.calendar</code>
                                    <p class="text-muted small mb-1">Consolidated calendar for all managed profiles</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" checked>
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Priority Support</h6>
                                    <code class="small">feature.special.priority_support</code>
                                    <p class="text-muted small mb-1">24/7 priority customer support</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox">
                                </div>
                            </div>
                        </div>

                        <div class="feature-item mb-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6>Advanced Analytics</h6>
                                    <code class="small">feature.special.analytics</code>
                                    <p class="text-muted small mb-1">Detailed analytics and reporting</p>
                                </div>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Feature Bundles -->
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">Predefined Feature Bundles</h5>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-3">
                        <div class="feature-bundle">
                            <h6>Solo Professional</h6>
                            <p class="text-muted small">Individual working alone</p>
                            <ul class="small">
                                <li>Single profile</li>
                                <li>Basic features</li>
                                <li>No management</li>
                            </ul>
                            <button class="btn btn-sm btn-outline-primary w-100">Apply Bundle</button>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="feature-bundle">
                            <h6>Small Agency</h6>
                            <p class="text-muted small">Professional agency</p>
                            <ul class="small">
                                <li>Manage others</li>
                                <li>Team features</li>
                                <li>Invoicing</li>
                            </ul>
                            <button class="btn btn-sm btn-outline-primary w-100">Apply Bundle</button>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="feature-bundle">
                            <h6>Family Business</h6>
                            <p class="text-muted small">Parent + children</p>
                            <ul class="small">
                                <li>Multiple profiles</li>
                                <li>Minor management</li>
                                <li>Trust fund</li>
                            </ul>
                            <button class="btn btn-sm btn-outline-primary w-100">Apply Bundle</button>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="feature-bundle">
                            <h6>Enterprise</h6>
                            <p class="text-muted small">Large organization</p>
                            <ul class="small">
                                <li>All features</li>
                                <li>White label</li>
                                <li>API access</li>
                            </ul>
                            <button class="btn btn-sm btn-outline-primary w-100">Apply Bundle</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.feature-item {
    padding: 1rem;
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    transition: all 0.2s;
}

.feature-item:hover {
    background-color: #f8f9fa;
    border-color: #dee2e6;
}

.feature-item code {
    background-color: #e9ecef;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
}

.feature-bundle {
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    height: 100%;
}

.feature-bundle ul {
    padding-left: 1.2rem;
    margin-bottom: 1rem;
}
</style>

<script>
function saveFeatureConfig() {
    alert('Feature configuration saved!\n\nThis would update the available features for all accounts in the system.');
}

function exportFeatures() {
    alert('Export feature configuration as JSON for backup or migration.');
}
</script>

<?php echo renderFooter(); ?>