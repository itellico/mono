<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Features Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'resources/features.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Features & Limits', 'href' => '#'],
            ['label' => 'Features']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Features Management</h2>
                <p class="text-muted mb-0">Create and manage features that can be used in subscription plans</p>
            </div>
            <button class="btn btn-primary" onclick="createNewFeature()">
                <i class="fas fa-plus me-2"></i> Create Feature
            </button>
        </div>

        <!-- Important Notice -->
        <div class="alert alert-info mb-4">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Global Resource:</strong> Features are reusable components that can be assigned to multiple subscription plans.
            Each feature can have associated permissions and limits. This replaces the old Feature Builder interface.
        </div>

        <!-- Feature Statistics -->
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
                        <h6 class="text-muted mb-2">Active in Plans</h6>
                        <h3 class="mb-0">41</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Unused</h6>
                        <h3 class="mb-0 text-warning">6</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Categories</h6>
                        <h3 class="mb-0">8</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- Feature List -->
        <div class="card">
            <div class="card-header">
                <ul class="nav nav-tabs card-header-tabs">
                    <li class="nav-item">
                        <a class="nav-link active" href="#" data-category="all">All Features</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" data-category="profile">Profile Management</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" data-category="content">Content & Media</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" data-category="business">Business Tools</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" data-category="special">Special Features</a>
                    </li>
                </ul>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <!-- User Profile Feature -->
                    <div class="col-md-6">
                        <div class="feature-card card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 class="mb-1">User Profile</h5>
                                        <code class="small text-muted">feature.profile.basic</code>
                                    </div>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-link" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="editFeature('profile.basic')">Edit</a></li>
                                            <li><a class="dropdown-item" href="#" onclick="viewUsage('profile.basic')">View Usage</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteFeature('profile.basic')">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                                <p class="text-muted small mb-3">Basic profile creation and management capabilities</p>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Permissions:</h6>
                                    <div>
                                        <span class="badge bg-success me-1">user.profile.view</span>
                                        <span class="badge bg-success me-1">user.profile.edit</span>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Limits:</h6>
                                    <div>
                                        <span class="badge bg-info me-1">profile_images_max</span>
                                        <span class="badge bg-info me-1">profile_storage_mb</span>
                                    </div>
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">Used in 4 plans</small>
                                    <span class="badge bg-primary">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Comp Card Feature -->
                    <div class="col-md-6">
                        <div class="feature-card card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 class="mb-1">Digital Comp Cards</h5>
                                        <code class="small text-muted">feature.comp_card</code>
                                    </div>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-link" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="editFeature('comp_card')">Edit</a></li>
                                            <li><a class="dropdown-item" href="#" onclick="viewUsage('comp_card')">View Usage</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteFeature('comp_card')">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                                <p class="text-muted small mb-3">Professional digital comp card creation and management</p>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Permissions:</h6>
                                    <div>
                                        <span class="badge bg-success me-1">content.comp_card.create</span>
                                        <span class="badge bg-success me-1">content.comp_card.edit</span>
                                        <span class="badge bg-success me-1">content.comp_card.delete</span>
                                        <span class="badge bg-success me-1">content.comp_card.share</span>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Limits:</h6>
                                    <div>
                                        <span class="badge bg-info me-1">comp_cards_max</span>
                                        <span class="badge bg-info me-1">comp_card_images_max</span>
                                        <span class="badge bg-info me-1">comp_card_versions_max</span>
                                    </div>
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">Used in 3 plans</small>
                                    <span class="badge bg-primary">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Portfolio Feature -->
                    <div class="col-md-6">
                        <div class="feature-card card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 class="mb-1">Portfolio Builder</h5>
                                        <code class="small text-muted">feature.portfolio</code>
                                    </div>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-link" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="editFeature('portfolio')">Edit</a></li>
                                            <li><a class="dropdown-item" href="#" onclick="viewUsage('portfolio')">View Usage</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteFeature('portfolio')">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                                <p class="text-muted small mb-3">Create and showcase professional portfolios with galleries</p>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Permissions:</h6>
                                    <div>
                                        <span class="badge bg-success me-1">content.portfolio.create</span>
                                        <span class="badge bg-success me-1">content.portfolio.edit</span>
                                        <span class="badge bg-success me-1">content.gallery.manage</span>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Limits:</h6>
                                    <div>
                                        <span class="badge bg-info me-1">portfolios_max</span>
                                        <span class="badge bg-info me-1">galleries_per_portfolio</span>
                                        <span class="badge bg-info me-1">images_per_gallery</span>
                                        <span class="badge bg-info me-1">portfolio_storage_gb</span>
                                    </div>
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">Used in 3 plans</small>
                                    <span class="badge bg-primary">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Team Management Feature -->
                    <div class="col-md-6">
                        <div class="feature-card card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 class="mb-1">Team Management</h5>
                                        <code class="small text-muted">feature.team</code>
                                    </div>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-link" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="editFeature('team')">Edit</a></li>
                                            <li><a class="dropdown-item" href="#" onclick="viewUsage('team')">View Usage</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteFeature('team')">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                                <p class="text-muted small mb-3">Add team members and manage their roles and permissions</p>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Permissions:</h6>
                                    <div>
                                        <span class="badge bg-success me-1">team.members.invite</span>
                                        <span class="badge bg-success me-1">team.members.manage</span>
                                        <span class="badge bg-success me-1">team.roles.assign</span>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Limits:</h6>
                                    <div>
                                        <span class="badge bg-info me-1">team_members_max</span>
                                        <span class="badge bg-info me-1">custom_roles_max</span>
                                    </div>
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">Used in 2 plans</small>
                                    <span class="badge bg-primary">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Multiple Profiles Feature -->
                    <div class="col-md-6">
                        <div class="feature-card card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 class="mb-1">Multiple Profiles</h5>
                                        <code class="small text-muted">feature.profiles.multiple</code>
                                    </div>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-link" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="editFeature('profiles.multiple')">Edit</a></li>
                                            <li><a class="dropdown-item" href="#" onclick="viewUsage('profiles.multiple')">View Usage</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteFeature('profiles.multiple')">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                                <p class="text-muted small mb-3">Create multiple professional profiles (model, photographer, etc)</p>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Permissions:</h6>
                                    <div>
                                        <span class="badge bg-success me-1">user.profiles.create_multiple</span>
                                        <span class="badge bg-success me-1">user.profiles.switch</span>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Limits:</h6>
                                    <div>
                                        <span class="badge bg-info me-1">profiles_max</span>
                                    </div>
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">Used in 2 plans</small>
                                    <span class="badge bg-primary">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Minor Management Feature -->
                    <div class="col-md-6">
                        <div class="feature-card card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 class="mb-1">Minor Management</h5>
                                        <code class="small text-muted">feature.management.minors</code>
                                    </div>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-link" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick="editFeature('management.minors')">Edit</a></li>
                                            <li><a class="dropdown-item" href="#" onclick="viewUsage('management.minors')">View Usage</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteFeature('management.minors')">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                                <p class="text-muted small mb-3">Special features for managing minor profiles with protections</p>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Permissions:</h6>
                                    <div>
                                        <span class="badge bg-success me-1">management.minors.create</span>
                                        <span class="badge bg-success me-1">management.minors.approve</span>
                                        <span class="badge bg-success me-1">management.trust_fund.access</span>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <h6 class="small text-muted mb-2">Associated Limits:</h6>
                                    <div>
                                        <span class="badge bg-info me-1">managed_minors_max</span>
                                    </div>
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">Used in 1 plan</small>
                                    <span class="badge bg-primary">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.feature-card {
    transition: all 0.2s;
    border: 1px solid #dee2e6;
}

.feature-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: #0d6efd;
}

.feature-card .badge {
    font-weight: normal;
    font-size: 0.75rem;
}
</style>

<script>
function createNewFeature() {
    alert('Create new feature dialog would open here with:\n- Feature name\n- Description\n- Category selection\n- Permission assignment\n- Limit configuration');
}

function editFeature(featureId) {
    alert('Edit feature: ' + featureId);
}

function viewUsage(featureId) {
    alert('View usage for feature: ' + featureId + '\n\nShowing which plans use this feature');
}

function deleteFeature(featureId) {
    if (confirm('Delete feature: ' + featureId + '?\n\nThis will remove it from all plans.')) {
        alert('Feature deleted');
    }
}
</script>

<?php echo renderFooter(); ?>