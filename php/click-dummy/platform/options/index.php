<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Option Sets - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'options/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Option Sets']
        ]);
        
        echo createHeroSection(
            "Option Sets & Values Management",
            "Manage reusable option sets for dynamic forms, regional conversions, and industry-specific data",
            "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Option Set', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Regional Mapping', 'icon' => 'fas fa-globe', 'style' => 'info'],
                ['label' => 'Import/Export', 'icon' => 'fas fa-exchange-alt', 'style' => 'success']
            ]
        );
        ?>
        
        <!-- Option Sets Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Option Sets', '45', 'fas fa-list-ul', 'primary');
            echo createStatCard('Option Values', '1,247', 'fas fa-tags', 'success');
            echo createStatCard('Regional Mappings', '15', 'fas fa-globe', 'info');
            echo createStatCard('Active Templates', '8', 'fas fa-layer-group', 'warning');
            ?>
        </div>
        
        <div class="row mb-4">
            <!-- Option Sets Categories -->
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Option Sets by Category</h5>
                        <div class="btn-group">
                            <button class="btn btn-outline-secondary btn-sm active" onclick="showCategory('all')">
                                All Categories
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="showCategory('demographics')">
                                Demographics
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="showCategory('measurements')">
                                Measurements
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="showCategory('skills')">
                                Skills
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Demographics Option Sets -->
                        <div class="option-category mb-4" id="demographics-options">
                            <h6 class="fw-bold mb-3">
                                <i class="fas fa-users text-primary me-2"></i> Demographics & Personal
                            </h6>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="card border-start border-primary border-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Age Ranges</h6>
                                                <span class="badge bg-primary">12 values</span>
                                            </div>
                                            <p class="text-muted small mb-3">Age categories for different modeling types and industry standards</p>
                                            <div class="mb-3">
                                                <div class="d-flex flex-wrap gap-1">
                                                    <span class="badge bg-light text-dark">Baby (0-2)</span>
                                                    <span class="badge bg-light text-dark">Child (3-12)</span>
                                                    <span class="badge bg-light text-dark">Teen (13-17)</span>
                                                    <span class="badge bg-light text-dark">Young Adult (18-25)</span>
                                                    <span class="badge bg-light text-dark">Adult (26-40)</span>
                                                    <span class="badge bg-light text-dark">Mature (40+)</span>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="editOptionSet('age-ranges')">
                                                    <i class="fas fa-edit me-1"></i> Edit
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewValues('age-ranges')">
                                                    <i class="fas fa-list me-1"></i> Values
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="mapRegions('age-ranges')">
                                                    <i class="fas fa-globe me-1"></i> Regions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card border-start border-success border-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Gender Identity</h6>
                                                <span class="badge bg-success">8 values</span>
                                            </div>
                                            <p class="text-muted small mb-3">Inclusive gender identity options for modern modeling industry</p>
                                            <div class="mb-3">
                                                <div class="d-flex flex-wrap gap-1">
                                                    <span class="badge bg-light text-dark">Female</span>
                                                    <span class="badge bg-light text-dark">Male</span>
                                                    <span class="badge bg-light text-dark">Non-binary</span>
                                                    <span class="badge bg-light text-dark">Gender Fluid</span>
                                                    <span class="badge bg-light text-dark">Prefer not to say</span>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="editOptionSet('gender-identity')">
                                                    <i class="fas fa-edit me-1"></i> Edit
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewValues('gender-identity')">
                                                    <i class="fas fa-list me-1"></i> Values
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="mapRegions('gender-identity')">
                                                    <i class="fas fa-globe me-1"></i> Regions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card border-start border-info border-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Ethnicity</h6>
                                                <span class="badge bg-info">25 values</span>
                                            </div>
                                            <p class="text-muted small mb-3">Comprehensive ethnicity options for diversity and representation</p>
                                            <div class="mb-3">
                                                <div class="d-flex flex-wrap gap-1">
                                                    <span class="badge bg-light text-dark">Asian</span>
                                                    <span class="badge bg-light text-dark">Black/African</span>
                                                    <span class="badge bg-light text-dark">Caucasian</span>
                                                    <span class="badge bg-light text-dark">Hispanic/Latino</span>
                                                    <span class="badge bg-light text-dark">Mixed Race</span>
                                                    <small class="text-muted">+20 more...</small>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="editOptionSet('ethnicity')">
                                                    <i class="fas fa-edit me-1"></i> Edit
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewValues('ethnicity')">
                                                    <i class="fas fa-list me-1"></i> Values
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="mapRegions('ethnicity')">
                                                    <i class="fas fa-globe me-1"></i> Regions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card border-start border-warning border-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Languages</h6>
                                                <span class="badge bg-warning">45 values</span>
                                            </div>
                                            <p class="text-muted small mb-3">Supported languages with proficiency levels for voice talent</p>
                                            <div class="mb-3">
                                                <div class="d-flex flex-wrap gap-1">
                                                    <span class="badge bg-light text-dark">English (Native)</span>
                                                    <span class="badge bg-light text-dark">Spanish (Fluent)</span>
                                                    <span class="badge bg-light text-dark">French (Basic)</span>
                                                    <span class="badge bg-light text-dark">German (Intermediate)</span>
                                                    <small class="text-muted">+41 more...</small>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="editOptionSet('languages')">
                                                    <i class="fas fa-edit me-1"></i> Edit
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewValues('languages')">
                                                    <i class="fas fa-list me-1"></i> Values
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="mapRegions('languages')">
                                                    <i class="fas fa-globe me-1"></i> Regions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Measurements Option Sets -->
                        <div class="option-category mb-4" id="measurements-options">
                            <h6 class="fw-bold mb-3">
                                <i class="fas fa-ruler text-success me-2"></i> Measurements & Physical
                            </h6>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="card border-start border-success border-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Height Ranges</h6>
                                                <span class="badge bg-success">Regional Mapping</span>
                                            </div>
                                            <p class="text-muted small mb-3">Height ranges with automatic cm/feet conversion</p>
                                            <div class="mb-3">
                                                <div class="small">
                                                    <strong>US/Imperial:</strong> 4'10" - 6'8"<br>
                                                    <strong>EU/Metric:</strong> 147cm - 203cm<br>
                                                    <strong>Asia:</strong> Custom ranges per region
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="editOptionSet('height-ranges')">
                                                    <i class="fas fa-edit me-1"></i> Edit
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewValues('height-ranges')">
                                                    <i class="fas fa-list me-1"></i> Values
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="mapRegions('height-ranges')">
                                                    <i class="fas fa-globe me-1"></i> Regions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card border-start border-danger border-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Clothing Sizes</h6>
                                                <span class="badge bg-danger">Multi-Regional</span>
                                            </div>
                                            <p class="text-muted small mb-3">Clothing sizes with US/EU/UK/Asia conversions</p>
                                            <div class="mb-3">
                                                <div class="small">
                                                    <strong>Women:</strong> XS-5XL, 0-32, EU 32-68<br>
                                                    <strong>Men:</strong> XS-5XL, 28-58, EU 44-74<br>
                                                    <strong>Children:</strong> Age-based sizes
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="editOptionSet('clothing-sizes')">
                                                    <i class="fas fa-edit me-1"></i> Edit
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewValues('clothing-sizes')">
                                                    <i class="fas fa-list me-1"></i> Values
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="mapRegions('clothing-sizes')">
                                                    <i class="fas fa-globe me-1"></i> Regions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card border-start border-info border-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Shoe Sizes</h6>
                                                <span class="badge bg-info">Auto-Convert</span>
                                            </div>
                                            <p class="text-muted small mb-3">Shoe sizes with automatic regional conversion</p>
                                            <div class="mb-3">
                                                <div class="small">
                                                    <strong>US Women:</strong> 4-15<br>
                                                    <strong>US Men:</strong> 6-17<br>
                                                    <strong>EU:</strong> Auto-converted<br>
                                                    <strong>UK:</strong> Auto-converted
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="editOptionSet('shoe-sizes')">
                                                    <i class="fas fa-edit me-1"></i> Edit
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewValues('shoe-sizes')">
                                                    <i class="fas fa-list me-1"></i> Values
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="mapRegions('shoe-sizes')">
                                                    <i class="fas fa-globe me-1"></i> Regions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card border-start border-secondary border-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Body Types</h6>
                                                <span class="badge bg-secondary">18 values</span>
                                            </div>
                                            <p class="text-muted small mb-3">Professional body type classifications for fitting</p>
                                            <div class="mb-3">
                                                <div class="d-flex flex-wrap gap-1">
                                                    <span class="badge bg-light text-dark">Athletic</span>
                                                    <span class="badge bg-light text-dark">Curvy</span>
                                                    <span class="badge bg-light text-dark">Lean</span>
                                                    <span class="badge bg-light text-dark">Plus Size</span>
                                                    <span class="badge bg-light text-dark">Muscular</span>
                                                    <small class="text-muted">+13 more...</small>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="editOptionSet('body-types')">
                                                    <i class="fas fa-edit me-1"></i> Edit
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewValues('body-types')">
                                                    <i class="fas fa-list me-1"></i> Values
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="mapRegions('body-types')">
                                                    <i class="fas fa-globe me-1"></i> Regions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Skills Option Sets -->
                        <div class="option-category mb-4" id="skills-options">
                            <h6 class="fw-bold mb-3">
                                <i class="fas fa-star text-warning me-2"></i> Skills & Specializations
                            </h6>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="card border-start border-warning border-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Modeling Skills</h6>
                                                <span class="badge bg-warning">35 values</span>
                                            </div>
                                            <p class="text-muted small mb-3">Professional modeling skills and specializations</p>
                                            <div class="mb-3">
                                                <div class="d-flex flex-wrap gap-1">
                                                    <span class="badge bg-light text-dark">Runway Walking</span>
                                                    <span class="badge bg-light text-dark">Product Modeling</span>
                                                    <span class="badge bg-light text-dark">Commercial Acting</span>
                                                    <span class="badge bg-light text-dark">Fashion Editorial</span>
                                                    <small class="text-muted">+31 more...</small>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="editOptionSet('modeling-skills')">
                                                    <i class="fas fa-edit me-1"></i> Edit
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewValues('modeling-skills')">
                                                    <i class="fas fa-list me-1"></i> Values
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="mapRegions('modeling-skills')">
                                                    <i class="fas fa-globe me-1"></i> Regions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <div class="card border-start border-primary border-3">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <h6 class="card-title mb-0">Voice Talent</h6>
                                                <span class="badge bg-primary">28 values</span>
                                            </div>
                                            <p class="text-muted small mb-3">Voice acting skills and vocal characteristics</p>
                                            <div class="mb-3">
                                                <div class="d-flex flex-wrap gap-1">
                                                    <span class="badge bg-light text-dark">Commercial Voiceover</span>
                                                    <span class="badge bg-light text-dark">Character Voices</span>
                                                    <span class="badge bg-light text-dark">Audiobook Narration</span>
                                                    <span class="badge bg-light text-dark">Corporate Training</span>
                                                    <small class="text-muted">+24 more...</small>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="editOptionSet('voice-talent')">
                                                    <i class="fas fa-edit me-1"></i> Edit
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewValues('voice-talent')">
                                                    <i class="fas fa-list me-1"></i> Values
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="mapRegions('voice-talent')">
                                                    <i class="fas fa-globe me-1"></i> Regions
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Option Set Management -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Management Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2 mb-3">
                            <button class="btn btn-primary" onclick="createOptionSet()">
                                <i class="fas fa-plus me-2"></i> Create Option Set
                            </button>
                            <button class="btn btn-outline-secondary" onclick="importOptionSets()">
                                <i class="fas fa-upload me-2"></i> Import Option Sets
                            </button>
                            <button class="btn btn-outline-info" onclick="exportOptionSets()">
                                <i class="fas fa-download me-2"></i> Export All Sets
                            </button>
                            <button class="btn btn-outline-warning" onclick="regionalMappings()">
                                <i class="fas fa-globe me-2"></i> Regional Mappings
                            </button>
                        </div>
                        
                        <hr>
                        
                        <h6>Regional Coverage</h6>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>United States</small>
                                <small class="fw-bold">100%</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-primary" style="width: 100%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>European Union</small>
                                <small class="fw-bold">95%</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-success" style="width: 95%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Asia Pacific</small>
                                <small class="fw-bold">78%</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-warning" style="width: 78%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Latin America</small>
                                <small class="fw-bold">65%</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-info" style="width: 65%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5 class="mb-0">Usage Statistics</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3 text-center">
                            <h4 class="text-primary">1,247</h4>
                            <small class="text-muted">Total Option Values</small>
                        </div>
                        
                        <div class="mb-3">
                            <strong class="d-block small">Most Used Sets</strong>
                            <div class="mt-2">
                                <div class="d-flex justify-content-between mb-1">
                                    <small>Height Ranges</small>
                                    <small class="fw-bold">89%</small>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <small>Age Ranges</small>
                                    <small class="fw-bold">87%</small>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <small>Clothing Sizes</small>
                                    <small class="fw-bold">76%</small>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <small>Languages</small>
                                    <small class="fw-bold">72%</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5 class="mb-0">Recent Changes</h5>
                    </div>
                    <div class="card-body">
                        <div class="timeline">
                            <div class="d-flex mb-3">
                                <div class="bg-success rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Added Voice Talent Options</small><br>
                                    <small class="text-muted">15 new voice specializations</small><br>
                                    <small class="text-muted">2 hours ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-info rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Updated Regional Mapping</small><br>
                                    <small class="text-muted">Asia Pacific clothing sizes</small><br>
                                    <small class="text-muted">1 day ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-warning rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Import: Industry Standards</small><br>
                                    <small class="text-muted">EU modeling requirements</small><br>
                                    <small class="text-muted">3 days ago</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Option Sets Management Table -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">All Option Sets</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Option Set Name</th>
                                <th>Category</th>
                                <th>Values Count</th>
                                <th>Regional Mapping</th>
                                <th>Usage</th>
                                <th>Last Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-ruler text-primary me-2"></i>
                                        <strong>Height Ranges</strong>
                                    </div>
                                </td>
                                <td><span class="badge bg-success">Measurements</span></td>
                                <td><strong>45</strong> values</td>
                                <td><span class="badge bg-info">US/EU/Asia</span></td>
                                <td><span class="text-success">89%</span></td>
                                <td>2 days ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('height-ranges')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewValues('height-ranges')">
                                            <i class="fas fa-list"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateSet('height-ranges')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-users text-primary me-2"></i>
                                        <strong>Age Ranges</strong>
                                    </div>
                                </td>
                                <td><span class="badge bg-primary">Demographics</span></td>
                                <td><strong>12</strong> values</td>
                                <td><span class="badge bg-secondary">Standard</span></td>
                                <td><span class="text-success">87%</span></td>
                                <td>1 week ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('age-ranges')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewValues('age-ranges')">
                                            <i class="fas fa-list"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateSet('age-ranges')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-tshirt text-danger me-2"></i>
                                        <strong>Clothing Sizes</strong>
                                    </div>
                                </td>
                                <td><span class="badge bg-success">Measurements</span></td>
                                <td><strong>78</strong> values</td>
                                <td><span class="badge bg-info">US/EU/UK/Asia</span></td>
                                <td><span class="text-success">76%</span></td>
                                <td>3 days ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('clothing-sizes')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewValues('clothing-sizes')">
                                            <i class="fas fa-list"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateSet('clothing-sizes')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-globe text-info me-2"></i>
                                        <strong>Languages</strong>
                                    </div>
                                </td>
                                <td><span class="badge bg-primary">Demographics</span></td>
                                <td><strong>45</strong> values</td>
                                <td><span class="badge bg-secondary">Standard</span></td>
                                <td><span class="text-success">72%</span></td>
                                <td>5 days ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('languages')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewValues('languages')">
                                            <i class="fas fa-list"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateSet('languages')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-microphone text-warning me-2"></i>
                                        <strong>Voice Talent</strong>
                                    </div>
                                </td>
                                <td><span class="badge bg-warning">Skills</span></td>
                                <td><strong>28</strong> values</td>
                                <td><span class="badge bg-secondary">Standard</span></td>
                                <td><span class="text-warning">45%</span></td>
                                <td>2 hours ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('voice-talent')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewValues('voice-talent')">
                                            <i class="fas fa-list"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateSet('voice-talent')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Option Set Management Modals -->
<div class="modal fade" id="createOptionSetModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create New Option Set</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="createOptionSetForm">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Option Set Name</label>
                                <input type="text" class="form-control" placeholder="e.g., Hair Colors">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-select">
                                    <option value="demographics">Demographics</option>
                                    <option value="measurements">Measurements</option>
                                    <option value="skills">Skills & Specializations</option>
                                    <option value="appearance">Physical Appearance</option>
                                    <option value="experience">Experience Levels</option>
                                    <option value="equipment">Equipment & Tools</option>
                                    <option value="availability">Availability</option>
                                    <option value="custom">Custom Category</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" rows="3" placeholder="Describe the purpose and usage of this option set..."></textarea>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Data Type</label>
                                <select class="form-select">
                                    <option value="single">Single Selection</option>
                                    <option value="multiple">Multiple Selection</option>
                                    <option value="range">Range Values</option>
                                    <option value="hierarchical">Hierarchical</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Regional Mapping</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="enableRegional">
                                    <label class="form-check-label" for="enableRegional">
                                        Enable regional conversions and mappings
                                    </label>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Usage Context</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="profileForm" checked>
                                    <label class="form-check-label" for="profileForm">Profile Forms</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="searchFilters">
                                    <label class="form-check-label" for="searchFilters">Search Filters</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="castingRequirements">
                                    <label class="form-check-label" for="castingRequirements">Casting Requirements</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <hr>
                    
                    <h6 class="mb-3">Option Values</h6>
                    <div id="optionValues">
                        <div class="row mb-2">
                            <div class="col-md-4">
                                <input type="text" class="form-control" placeholder="Value">
                            </div>
                            <div class="col-md-4">
                                <input type="text" class="form-control" placeholder="Display Label">
                            </div>
                            <div class="col-md-3">
                                <input type="text" class="form-control" placeholder="Sort Order">
                            </div>
                            <div class="col-md-1">
                                <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeValue(this)">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="addOptionValue()">
                        <i class="fas fa-plus me-1"></i> Add Value
                    </button>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">Create Option Set</button>
            </div>
        </div>
    </div>
</div>

<script>
function createOptionSet() {
    new bootstrap.Modal(document.getElementById('createOptionSetModal')).show();
}

function editOptionSet(setId) {
    alert('Edit Option Set: ' + setId + '\n\nThis would open a comprehensive editor with:\n- Option value management\n- Regional mapping configuration\n- Usage context settings\n- Validation rules\n- Import/export capabilities');
}

function viewValues(setId) {
    alert('View Values: ' + setId + '\n\nThis would show all option values with:\n- Value and display label\n- Regional mappings\n- Usage statistics\n- Sort order and grouping\n- Bulk edit capabilities');
}

function mapRegions(setId) {
    alert('Regional Mapping: ' + setId + '\n\nRegional mapping interface would include:\n- US/Imperial to EU/Metric conversions\n- Asia Pacific regional variations\n- Custom mapping rules\n- Validation and testing tools\n- Mapping history and changes');
}

function duplicateSet(setId) {
    alert('Duplicate Option Set: ' + setId + '\n\nThis would create a copy for customization:\n- Copy all values and mappings\n- Allow name and category changes\n- Maintain regional mappings\n- Reset usage statistics');
}

function importOptionSets() {
    alert('Import Option Sets\n\nBulk import capabilities:\n- CSV/Excel file upload\n- Industry standard templates\n- Validation and conflict detection\n- Preview before import\n- Rollback capabilities');
}

function exportOptionSets() {
    alert('Export Option Sets\n\nGenerate comprehensive export:\n- All option sets and values\n- Regional mapping data\n- Usage statistics\n- Excel/CSV formats\n- API documentation format');
}

function regionalMappings() {
    alert('Regional Mappings Management\n\nComprehensive regional tools:\n- Manage US/EU/UK/Asia conversions\n- Height: cm ↔ feet/inches\n- Clothing: US ↔ EU ↔ UK ↔ Asia sizes\n- Shoe: automatic conversions\n- Custom regional rules');
}

function showCategory(category) {
    // Update active button
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide option categories
    const categories = document.querySelectorAll('.option-category');
    if (category === 'all') {
        categories.forEach(cat => cat.style.display = 'block');
    } else {
        categories.forEach(cat => {
            cat.style.display = cat.id.includes(category) ? 'block' : 'none';
        });
    }
}

function addOptionValue() {
    const container = document.getElementById('optionValues');
    const newRow = document.createElement('div');
    newRow.className = 'row mb-2';
    newRow.innerHTML = `
        <div class="col-md-4">
            <input type="text" class="form-control" placeholder="Value">
        </div>
        <div class="col-md-4">
            <input type="text" class="form-control" placeholder="Display Label">
        </div>
        <div class="col-md-3">
            <input type="text" class="form-control" placeholder="Sort Order">
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="removeValue(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    container.appendChild(newRow);
}

function removeValue(button) {
    button.closest('.row').remove();
}
</script>

<?php echo renderFooter(); ?>