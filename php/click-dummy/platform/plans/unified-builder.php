<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

// Load configurations
$limitsConfig = json_decode(file_get_contents('../config/limits-config.json'), true);

echo renderHeader("Subscription Builder - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'plans/unified-builder.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Subscription Builder']
        ]);
        ?>
        
        <!-- Simplified Hero -->
        <div class="hero-section bg-gradient-primary text-white p-4 rounded mb-4">
            <div class="row align-items-center">
                <div class="col-lg-8">
                    <h1 class="h3 mb-2">Subscription Builder</h1>
                    <p class="mb-0 opacity-90">Create and manage subscription plans with a visual, intuitive interface</p>
                </div>
                <div class="col-lg-4 text-lg-end">
                    <button class="btn btn-light btn-lg" onclick="startGuidedSetup()">
                        <i class="fas fa-magic me-2"></i> Guided Setup
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Main Builder Interface -->
        <div class="row">
            <!-- Left Panel: Builder -->
            <div class="col-lg-8">
                <!-- Simplified Tab Navigation -->
                <div class="card">
                    <div class="card-header bg-white border-bottom-0">
                        <ul class="nav nav-pills nav-fill" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active d-flex align-items-center justify-content-center" 
                                        id="plans-tab" 
                                        data-bs-toggle="tab" 
                                        data-bs-target="#plans-content" 
                                        type="button">
                                    <i class="fas fa-tags fs-4 mb-1"></i>
                                    <div class="ms-2">
                                        <div class="fw-bold">Plans</div>
                                        <small class="text-muted">What you sell</small>
                                    </div>
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link d-flex align-items-center justify-content-center" 
                                        id="features-tab" 
                                        data-bs-toggle="tab" 
                                        data-bs-target="#features-content" 
                                        type="button">
                                    <i class="fas fa-puzzle-piece fs-4 mb-1"></i>
                                    <div class="ms-2">
                                        <div class="fw-bold">Features</div>
                                        <small class="text-muted">What they get</small>
                                    </div>
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link d-flex align-items-center justify-content-center" 
                                        id="limits-tab" 
                                        data-bs-toggle="tab" 
                                        data-bs-target="#limits-content" 
                                        type="button">
                                    <i class="fas fa-sliders-h fs-4 mb-1"></i>
                                    <div class="ms-2">
                                        <div class="fw-bold">Limits</div>
                                        <small class="text-muted">How much they use</small>
                                    </div>
                                </button>
                            </li>
                        </ul>
                    </div>
                    
                    <div class="card-body p-0">
                        <div class="tab-content">
                            <!-- Plans Tab -->
                            <div class="tab-pane fade show active" id="plans-content" role="tabpanel">
                                <div class="p-4">
                                    <!-- Quick Actions -->
                                    <div class="d-flex justify-content-between align-items-center mb-4">
                                        <h5 class="mb-0">Your Subscription Plans</h5>
                                        <div>
                                            <button class="btn btn-primary" onclick="createNewPlan()">
                                                <i class="fas fa-plus me-2"></i> New Plan
                                            </button>
                                            <button class="btn btn-outline-secondary ms-2" onclick="importPlan()">
                                                <i class="fas fa-upload me-2"></i> Import
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- Visual Plan Cards -->
                                    <div class="row g-3">
                                        <!-- Starter Plan -->
                                        <div class="col-md-6">
                                            <div class="plan-card card h-100 border-2" style="border-color: #6c757d;">
                                                <div class="card-header bg-secondary text-white">
                                                    <div class="d-flex justify-content-between align-items-center">
                                                        <h6 class="mb-0">Starter</h6>
                                                        <span class="badge bg-white text-dark">€0/mo</span>
                                                    </div>
                                                </div>
                                                <div class="card-body">
                                                    <div class="mb-3">
                                                        <small class="text-muted">FEATURES</small>
                                                        <div class="mt-1">
                                                            <span class="badge bg-light text-dark me-1 mb-1">
                                                                <i class="fas fa-check text-success me-1"></i> Basic Profile
                                                            </span>
                                                            <span class="badge bg-light text-dark me-1 mb-1">
                                                                <i class="fas fa-check text-success me-1"></i> Search
                                                            </span>
                                                            <span class="badge bg-light text-dark me-1 mb-1">
                                                                <i class="fas fa-check text-success me-1"></i> Messaging
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div class="mb-3">
                                                        <small class="text-muted">KEY LIMITS</small>
                                                        <div class="mt-1">
                                                            <div class="d-flex justify-content-between small">
                                                                <span>Storage</span>
                                                                <strong>100 MB</strong>
                                                            </div>
                                                            <div class="d-flex justify-content-between small">
                                                                <span>Comp Cards</span>
                                                                <strong>1</strong>
                                                            </div>
                                                            <div class="d-flex justify-content-between small">
                                                                <span>Images</span>
                                                                <strong>5</strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="d-grid">
                                                        <button class="btn btn-outline-secondary btn-sm" onclick="editPlan('starter')">
                                                            <i class="fas fa-edit me-1"></i> Edit Plan
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Professional Plan -->
                                        <div class="col-md-6">
                                            <div class="plan-card card h-100 border-2" style="border-color: #0d6efd;">
                                                <div class="card-header bg-primary text-white">
                                                    <div class="d-flex justify-content-between align-items-center">
                                                        <h6 class="mb-0">Professional</h6>
                                                        <span class="badge bg-white text-dark">€29/mo</span>
                                                    </div>
                                                </div>
                                                <div class="card-body">
                                                    <div class="mb-3">
                                                        <small class="text-muted">FEATURES</small>
                                                        <div class="mt-1">
                                                            <span class="badge bg-light text-dark me-1 mb-1">
                                                                <i class="fas fa-check text-success me-1"></i> Everything in Starter
                                                            </span>
                                                            <span class="badge bg-light text-dark me-1 mb-1">
                                                                <i class="fas fa-check text-success me-1"></i> Portfolio
                                                            </span>
                                                            <span class="badge bg-light text-dark me-1 mb-1">
                                                                <i class="fas fa-check text-success me-1"></i> Analytics
                                                            </span>
                                                            <span class="badge bg-light text-dark me-1 mb-1">
                                                                <i class="fas fa-check text-success me-1"></i> Calendar
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div class="mb-3">
                                                        <small class="text-muted">KEY LIMITS</small>
                                                        <div class="mt-1">
                                                            <div class="d-flex justify-content-between small">
                                                                <span>Storage</span>
                                                                <strong>50 GB</strong>
                                                            </div>
                                                            <div class="d-flex justify-content-between small">
                                                                <span>Comp Cards</span>
                                                                <strong>5</strong>
                                                            </div>
                                                            <div class="d-flex justify-content-between small">
                                                                <span>Images</span>
                                                                <strong>500</strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="d-grid">
                                                        <button class="btn btn-outline-primary btn-sm" onclick="editPlan('professional')">
                                                            <i class="fas fa-edit me-1"></i> Edit Plan
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Plan Comparison -->
                                    <div class="mt-4 text-center">
                                        <button class="btn btn-link" onclick="showPlanComparison()">
                                            <i class="fas fa-table me-2"></i> View Full Comparison Table
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Features Tab -->
                            <div class="tab-pane fade" id="features-content" role="tabpanel">
                                <div class="p-4">
                                    <!-- Feature Categories -->
                                    <div class="row g-3">
                                        <div class="col-12">
                                            <div class="d-flex justify-content-between align-items-center mb-3">
                                                <h5 class="mb-0">Feature Library</h5>
                                                <button class="btn btn-sm btn-primary" onclick="createNewFeature()">
                                                    <i class="fas fa-plus me-1"></i> New Feature
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <!-- Core Features -->
                                        <div class="col-12">
                                            <h6 class="text-muted mb-3">
                                                <i class="fas fa-cube me-2"></i> Core Features
                                            </h6>
                                            <div class="row g-2">
                                                <div class="col-md-6">
                                                    <div class="feature-card card">
                                                        <div class="card-body p-3">
                                                            <div class="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <h6 class="mb-1">User Profile</h6>
                                                                    <p class="text-muted small mb-2">Basic profile creation and management</p>
                                                                    <div>
                                                                        <span class="badge bg-success me-1">
                                                                            <i class="fas fa-key me-1"></i> 2 permissions
                                                                        </span>
                                                                        <span class="badge bg-info">
                                                                            <i class="fas fa-sliders-h me-1"></i> 3 limits
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div class="form-check form-switch">
                                                                    <input class="form-check-input" type="checkbox" checked>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="feature-card card">
                                                        <div class="card-body p-3">
                                                            <div class="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <h6 class="mb-1">Search & Discovery</h6>
                                                                    <p class="text-muted small mb-2">Find talent and opportunities</p>
                                                                    <div>
                                                                        <span class="badge bg-success me-1">
                                                                            <i class="fas fa-key me-1"></i> 1 permission
                                                                        </span>
                                                                        <span class="badge bg-info">
                                                                            <i class="fas fa-sliders-h me-1"></i> 1 limit
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div class="form-check form-switch">
                                                                    <input class="form-check-input" type="checkbox" checked>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Professional Features -->
                                        <div class="col-12 mt-4">
                                            <h6 class="text-muted mb-3">
                                                <i class="fas fa-star me-2"></i> Professional Features
                                            </h6>
                                            <div class="row g-2">
                                                <div class="col-md-6">
                                                    <div class="feature-card card">
                                                        <div class="card-body p-3">
                                                            <div class="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <h6 class="mb-1">Comp Cards</h6>
                                                                    <p class="text-muted small mb-2">Digital comp card management</p>
                                                                    <div>
                                                                        <span class="badge bg-success me-1">
                                                                            <i class="fas fa-key me-1"></i> 4 permissions
                                                                        </span>
                                                                        <span class="badge bg-info">
                                                                            <i class="fas fa-sliders-h me-1"></i> 3 limits
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div class="form-check form-switch">
                                                                    <input class="form-check-input" type="checkbox">
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="feature-card card">
                                                        <div class="card-body p-3">
                                                            <div class="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <h6 class="mb-1">Portfolio Builder</h6>
                                                                    <p class="text-muted small mb-2">Showcase work with galleries</p>
                                                                    <div>
                                                                        <span class="badge bg-success me-1">
                                                                            <i class="fas fa-key me-1"></i> 3 permissions
                                                                        </span>
                                                                        <span class="badge bg-info">
                                                                            <i class="fas fa-sliders-h me-1"></i> 4 limits
                                                                        </span>
                                                                    </div>
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
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Limits Tab -->
                            <div class="tab-pane fade" id="limits-content" role="tabpanel">
                                <div class="p-4">
                                    <div class="d-flex justify-content-between align-items-center mb-4">
                                        <h5 class="mb-0">Resource Limits</h5>
                                        <button class="btn btn-sm btn-outline-secondary" onclick="loadLimitPresets()">
                                            <i class="fas fa-magic me-1"></i> Load Presets
                                        </button>
                                    </div>
                                    
                                    <!-- Visual Limit Editor -->
                                    <div class="row g-3">
                                        <!-- Storage Limits -->
                                        <div class="col-12">
                                            <div class="card">
                                                <div class="card-header bg-light">
                                                    <h6 class="mb-0">
                                                        <i class="fas fa-database text-primary me-2"></i> Storage Limits
                                                    </h6>
                                                </div>
                                                <div class="card-body">
                                                    <div class="row align-items-center">
                                                        <div class="col-md-3">
                                                            <strong>Total Storage</strong>
                                                            <p class="text-muted small mb-0">File uploads & media</p>
                                                        </div>
                                                        <div class="col-md-9">
                                                            <div class="row g-2">
                                                                <div class="col">
                                                                    <label class="small text-muted">Starter</label>
                                                                    <div class="input-group input-group-sm">
                                                                        <input type="number" class="form-control" value="100">
                                                                        <span class="input-group-text">MB</span>
                                                                    </div>
                                                                </div>
                                                                <div class="col">
                                                                    <label class="small text-muted">Professional</label>
                                                                    <div class="input-group input-group-sm">
                                                                        <input type="number" class="form-control" value="50">
                                                                        <span class="input-group-text">GB</span>
                                                                    </div>
                                                                </div>
                                                                <div class="col">
                                                                    <label class="small text-muted">Agency</label>
                                                                    <div class="input-group input-group-sm">
                                                                        <input type="number" class="form-control" value="500">
                                                                        <span class="input-group-text">GB</span>
                                                                    </div>
                                                                </div>
                                                                <div class="col">
                                                                    <label class="small text-muted">Enterprise</label>
                                                                    <div class="input-group input-group-sm">
                                                                        <input type="number" class="form-control" value="1">
                                                                        <span class="input-group-text">TB</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Content Limits -->
                                        <div class="col-12">
                                            <div class="card">
                                                <div class="card-header bg-light">
                                                    <h6 class="mb-0">
                                                        <i class="fas fa-images text-success me-2"></i> Content Limits
                                                    </h6>
                                                </div>
                                                <div class="card-body">
                                                    <div class="row g-3">
                                                        <div class="col-md-6">
                                                            <div class="row align-items-center">
                                                                <div class="col-5">
                                                                    <strong>Comp Cards</strong>
                                                                </div>
                                                                <div class="col-7">
                                                                    <div class="d-flex gap-2">
                                                                        <input type="number" class="form-control form-control-sm" value="1" style="width: 60px;">
                                                                        <input type="number" class="form-control form-control-sm" value="5" style="width: 60px;">
                                                                        <input type="number" class="form-control form-control-sm" value="10" style="width: 60px;">
                                                                        <input type="number" class="form-control form-control-sm" value="-1" style="width: 60px;" title="Unlimited">
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md-6">
                                                            <div class="row align-items-center">
                                                                <div class="col-5">
                                                                    <strong>Portfolios</strong>
                                                                </div>
                                                                <div class="col-7">
                                                                    <div class="d-flex gap-2">
                                                                        <input type="number" class="form-control form-control-sm" value="1" style="width: 60px;">
                                                                        <input type="number" class="form-control form-control-sm" value="10" style="width: 60px;">
                                                                        <input type="number" class="form-control form-control-sm" value="50" style="width: 60px;">
                                                                        <input type="number" class="form-control form-control-sm" value="-1" style="width: 60px;" title="Unlimited">
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Right Panel: Live Preview & Help -->
            <div class="col-lg-4">
                <!-- Context-Sensitive Preview -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-eye text-primary me-2"></i> Live Preview
                        </h6>
                    </div>
                    <div class="card-body" id="livePreview">
                        <!-- Dynamic preview content based on active tab -->
                        <div class="text-center p-4">
                            <i class="fas fa-tags fa-3x text-muted mb-3"></i>
                            <p class="text-muted">Select a plan to preview how it appears to customers</p>
                        </div>
                    </div>
                </div>
                
                <!-- Contextual Help -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-lightbulb text-warning me-2"></i> Quick Tips
                        </h6>
                    </div>
                    <div class="card-body">
                        <div id="contextualHelp">
                            <h6 class="small">Building Great Plans</h6>
                            <ul class="small ps-3 mb-0">
                                <li>Start with 3-4 clear tiers</li>
                                <li>Each tier should be 2-3x more valuable</li>
                                <li>Focus on outcomes, not features</li>
                                <li>Use psychological pricing (29, 99)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Simplified Plan Editor Modal -->
<div class="modal fade" id="planEditorModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Plan</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <!-- Left: Form -->
                    <div class="col-lg-8">
                        <div class="mb-4">
                            <h6>Basic Information</h6>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Plan Name</label>
                                    <input type="text" class="form-control" id="planName" placeholder="e.g., Professional">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Monthly Price</label>
                                    <div class="input-group">
                                        <span class="input-group-text">€</span>
                                        <input type="number" class="form-control" id="planPrice" placeholder="29">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Color</label>
                                    <input type="color" class="form-control form-control-color" id="planColor" value="#0d6efd">
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <h6>Select Features</h6>
                            <div class="feature-selector">
                                <!-- Feature checkboxes with visual grouping -->
                                <div class="row g-2">
                                    <div class="col-12">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="feature-profile" checked>
                                            <label class="form-check-label" for="feature-profile">
                                                <strong>User Profile</strong>
                                                <small class="text-muted d-block">Basic profile with photo and bio</small>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="feature-compcard">
                                            <label class="form-check-label" for="feature-compcard">
                                                <strong>Comp Cards</strong>
                                                <small class="text-muted d-block">Professional digital comp cards</small>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <h6>Configure Limits</h6>
                            <div class="limits-config">
                                <!-- Simplified limit inputs -->
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Storage</label>
                                        <div class="input-group">
                                            <input type="number" class="form-control" value="50">
                                            <select class="form-select" style="max-width: 80px;">
                                                <option>MB</option>
                                                <option selected>GB</option>
                                                <option>TB</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Comp Cards</label>
                                        <input type="number" class="form-control" value="5">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Users</label>
                                        <input type="number" class="form-control" value="25">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right: Live Preview -->
                    <div class="col-lg-4">
                        <div class="sticky-top" style="top: 1rem;">
                            <h6>Preview</h6>
                            <div class="card border-primary">
                                <div class="card-header bg-primary text-white text-center">
                                    <h5 class="mb-0">Professional</h5>
                                    <div class="h3 mb-0">€29<small>/month</small></div>
                                </div>
                                <div class="card-body">
                                    <ul class="list-unstyled">
                                        <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Everything in Starter</li>
                                        <li class="mb-2"><i class="fas fa-check text-success me-2"></i> 5 Comp Cards</li>
                                        <li class="mb-2"><i class="fas fa-check text-success me-2"></i> 50 GB Storage</li>
                                        <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Portfolio Builder</li>
                                        <li class="mb-2"><i class="fas fa-check text-success me-2"></i> Analytics Dashboard</li>
                                    </ul>
                                    <button class="btn btn-primary w-100">Choose Plan</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">Save Changes</button>
            </div>
        </div>
    </div>
</div>

<style>
/* Clean, modern styling */
.plan-card {
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
}
.plan-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.feature-card {
    transition: all 0.2s;
    border: 2px solid transparent;
}
.feature-card:hover {
    border-color: #e9ecef;
    background-color: #f8f9fa;
}

.nav-pills .nav-link {
    color: #6c757d;
    border: 0;
    padding: 1rem;
}
.nav-pills .nav-link.active {
    background-color: #0d6efd;
}
.nav-pills .nav-link:not(.active):hover {
    background-color: #f8f9fa;
}

/* Simplified form controls */
.form-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: #495057;
}

/* Better visual hierarchy */
h6 {
    font-size: 0.9rem;
    font-weight: 600;
    color: #2c3e50;
}

.bg-gradient-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>

<script>
// Simplified JavaScript - focus on core functionality
function editPlan(planId) {
    // Load plan data
    document.getElementById('planName').value = planId.charAt(0).toUpperCase() + planId.slice(1);
    
    // Show modal
    new bootstrap.Modal(document.getElementById('planEditorModal')).show();
}

function createNewPlan() {
    // Clear form
    document.getElementById('planEditorModal').querySelectorAll('input').forEach(input => {
        if (input.type !== 'color') input.value = '';
    });
    
    // Show modal
    new bootstrap.Modal(document.getElementById('planEditorModal')).show();
}

// Context-sensitive help
document.querySelectorAll('.nav-link').forEach(tab => {
    tab.addEventListener('click', function() {
        updateContextualHelp(this.id);
    });
});

function updateContextualHelp(tabId) {
    const helpContent = {
        'plans-tab': `
            <h6 class="small">Building Great Plans</h6>
            <ul class="small ps-3 mb-0">
                <li>Start with 3-4 clear tiers</li>
                <li>Each tier should be 2-3x more valuable</li>
                <li>Focus on outcomes, not features</li>
                <li>Use psychological pricing (29, 99)</li>
            </ul>
        `,
        'features-tab': `
            <h6 class="small">Feature Best Practices</h6>
            <ul class="small ps-3 mb-0">
                <li>Group related features together</li>
                <li>Use clear, benefit-focused names</li>
                <li>Show value progression between tiers</li>
                <li>Consider feature dependencies</li>
            </ul>
        `,
        'limits-tab': `
            <h6 class="small">Setting Effective Limits</h6>
            <ul class="small ps-3 mb-0">
                <li>Start conservative, increase based on usage</li>
                <li>Use round numbers (5, 10, 50, 100)</li>
                <li>Ensure each tier is noticeably better</li>
                <li>Consider cost implications</li>
            </ul>
        `
    };
    
    document.getElementById('contextualHelp').innerHTML = helpContent[tabId] || helpContent['plans-tab'];
}

// Guided setup wizard
function startGuidedSetup() {
    alert('Guided Setup Wizard\n\nThis would walk you through:\n1. Choosing your business model\n2. Selecting core features\n3. Setting competitive prices\n4. Configuring limits\n5. Preview and launch');
}

// Show plan comparison
function showPlanComparison() {
    alert('Plan Comparison Table\n\nThis would show a full feature/limit comparison matrix across all plans');
}

// Feature management
function createNewFeature() {
    alert('Create New Feature\n\nSimplified form to add a new feature with:\n• Name and description\n• Required permissions\n• Associated limits\n• Plan availability');
}

// Load limit presets
function loadLimitPresets() {
    alert('Load Preset Limits\n\nChoose from templates:\n• SaaS Starter\n• Professional Services\n• Enterprise Platform\n• Custom Marketplace');
}
</script>

<?php echo renderFooter(); ?>