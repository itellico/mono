<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Option Sets Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'resources/option-sets.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Global Resources', 'href' => 'index.php'],
            ['label' => 'Option Sets']
        ]);
        ?>
        
        <!-- Option Sets Header -->
        <div class="bg-success text-white p-4 rounded mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="mb-2">Option Sets Management</h2>
                    <p class="mb-0 opacity-75">Manage dropdown values with regional conversions and multi-language support</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group">
                        <button class="btn btn-light" onclick="createOptionSet()">
                            <i class="fas fa-plus me-2"></i> New Option Set
                        </button>
                        <button class="btn btn-warning" onclick="importOptionSets()">
                            <i class="fas fa-upload me-2"></i> Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Statistics Cards -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-success">24</h3>
                        <p class="mb-0">Option Sets</p>
                        <small class="text-muted">Active configurations</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-info">847</h3>
                        <p class="mb-0">Total Options</p>
                        <small class="text-muted">All option values</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-warning">8</h3>
                        <p class="mb-0">Languages</p>
                        <small class="text-muted">Supported locales</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-purple" style="color: #6f42c1;">23</h3>
                        <p class="mb-0">Templates Using</p>
                        <small class="text-muted">Active assignments</small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filter and Search -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <input type="text" class="form-control" placeholder="Search option sets..." id="searchInput">
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="categoryFilter">
                            <option value="">All Categories</option>
                            <option value="physical">Physical Measurements</option>
                            <option value="appearance">Appearance</option>
                            <option value="skills">Skills & Abilities</option>
                            <option value="clothing">Clothing & Sizes</option>
                            <option value="location">Location & Language</option>
                            <option value="industry">Industry Specific</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="statusFilter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-outline-secondary w-100" onclick="resetFilters()">
                            <i class="fas fa-undo me-2"></i> Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Option Sets List -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="fas fa-list-ul me-2"></i>
                    Option Sets Library
                </h5>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Options</th>
                                <th>Languages</th>
                                <th>Regional Conversion</th>
                                <th>Usage</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Physical Measurements -->
                            <tr>
                                <td>
                                    <strong>Height - Adult (18+ years)</strong>
                                    <br><small class="text-muted">height_adult</small>
                                </td>
                                <td><span class="badge bg-primary">Physical</span></td>
                                <td><span class="badge bg-info">81 options</span></td>
                                <td><span class="badge bg-success">8 languages</span></td>
                                <td><i class="fas fa-check text-success" title="cm ↔ feet/inches"></i></td>
                                <td>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-success" style="width: 95%"></div>
                                    </div>
                                    <small class="text-muted">95% (23 templates)</small>
                                </td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('height_adult')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewUsage('height_adult')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="exportOptionSet('height_adult')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr>
                                <td>
                                    <strong>Weight - Adult</strong>
                                    <br><small class="text-muted">weight_adult</small>
                                </td>
                                <td><span class="badge bg-primary">Physical</span></td>
                                <td><span class="badge bg-info">45 options</span></td>
                                <td><span class="badge bg-success">8 languages</span></td>
                                <td><i class="fas fa-check text-success" title="kg ↔ lbs"></i></td>
                                <td>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-success" style="width: 87%"></div>
                                    </div>
                                    <small class="text-muted">87% (21 templates)</small>
                                </td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('weight_adult')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewUsage('weight_adult')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="exportOptionSet('weight_adult')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Appearance -->
                            <tr>
                                <td>
                                    <strong>Eye Colors</strong>
                                    <br><small class="text-muted">eye_colors</small>
                                </td>
                                <td><span class="badge bg-warning">Appearance</span></td>
                                <td><span class="badge bg-info">24 options</span></td>
                                <td><span class="badge bg-success">8 languages</span></td>
                                <td><i class="fas fa-times text-muted" title="No conversion needed"></i></td>
                                <td>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-success" style="width: 100%"></div>
                                    </div>
                                    <small class="text-muted">100% (24 templates)</small>
                                </td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('eye_colors')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewUsage('eye_colors')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="exportOptionSet('eye_colors')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr>
                                <td>
                                    <strong>Hair Colors</strong>
                                    <br><small class="text-muted">hair_colors</small>
                                </td>
                                <td><span class="badge bg-warning">Appearance</span></td>
                                <td><span class="badge bg-info">32 options</span></td>
                                <td><span class="badge bg-success">8 languages</span></td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-success" style="width: 96%"></div>
                                    </div>
                                    <small class="text-muted">96% (23 templates)</small>
                                </td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('hair_colors')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewUsage('hair_colors')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="exportOptionSet('hair_colors')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Clothing Sizes -->
                            <tr>
                                <td>
                                    <strong>Clothing Sizes - Adult</strong>
                                    <br><small class="text-muted">clothing_sizes_adult</small>
                                </td>
                                <td><span class="badge bg-info">Clothing</span></td>
                                <td><span class="badge bg-info">18 options</span></td>
                                <td><span class="badge bg-success">8 languages</span></td>
                                <td><i class="fas fa-check text-success" title="US/UK/EU sizing"></i></td>
                                <td>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-warning" style="width: 78%"></div>
                                    </div>
                                    <small class="text-muted">78% (19 templates)</small>
                                </td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('clothing_sizes_adult')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewUsage('clothing_sizes_adult')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="exportOptionSet('clothing_sizes_adult')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Skills & Abilities -->
                            <tr>
                                <td>
                                    <strong>Acting Experience Levels</strong>
                                    <br><small class="text-muted">acting_experience</small>
                                </td>
                                <td><span class="badge bg-purple text-white" style="background-color: #6f42c1 !important;">Skills</span></td>
                                <td><span class="badge bg-info">8 options</span></td>
                                <td><span class="badge bg-success">8 languages</span></td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-success" style="width: 92%"></div>
                                    </div>
                                    <small class="text-muted">92% (22 templates)</small>
                                </td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('acting_experience')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewUsage('acting_experience')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="exportOptionSet('acting_experience')">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Draft/Inactive Example -->
                            <tr class="table-secondary">
                                <td>
                                    <strong>Voice Types - Extended</strong>
                                    <br><small class="text-muted">voice_types_extended</small>
                                </td>
                                <td><span class="badge bg-secondary">Skills</span></td>
                                <td><span class="badge bg-secondary">15 options</span></td>
                                <td><span class="badge bg-warning">3 languages</span></td>
                                <td><i class="fas fa-times text-muted"></i></td>
                                <td>
                                    <div class="progress" style="height: 8px;">
                                        <div class="progress-bar bg-secondary" style="width: 0%"></div>
                                    </div>
                                    <small class="text-muted">0% (0 templates)</small>
                                </td>
                                <td><span class="badge bg-secondary">Draft</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editOptionSet('voice_types_extended')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="activateOptionSet('voice_types_extended')">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deleteOptionSet('voice_types_extended')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Bulk Actions -->
        <div class="card mt-4">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <h6>Bulk Actions</h6>
                        <div class="btn-group">
                            <button class="btn btn-outline-primary" onclick="bulkExport()">
                                <i class="fas fa-download me-2"></i> Export Selected
                            </button>
                            <button class="btn btn-outline-warning" onclick="bulkActivate()">
                                <i class="fas fa-check me-2"></i> Activate Selected
                            </button>
                            <button class="btn btn-outline-secondary" onclick="bulkDeactivate()">
                                <i class="fas fa-pause me-2"></i> Deactivate Selected
                            </button>
                        </div>
                    </div>
                    <div class="col-md-6 text-end">
                        <h6>Quick Actions</h6>
                        <div class="btn-group">
                            <button class="btn btn-outline-info" onclick="syncWithTemplates()">
                                <i class="fas fa-sync me-2"></i> Sync with Templates
                            </button>
                            <button class="btn btn-outline-success" onclick="validateAllSets()">
                                <i class="fas fa-check-circle me-2"></i> Validate All
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Edit Option Set Modal -->
<div class="modal fade" id="editOptionSetModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Option Set</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="editOptionSetForm">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Option Set Name</label>
                                <input type="text" class="form-control" id="optionSetName" value="">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Slug</label>
                                <input type="text" class="form-control" id="optionSetSlug" readonly>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="optionSetStatus">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-select" id="optionSetCategory">
                                    <option value="physical">Physical Measurements</option>
                                    <option value="appearance">Appearance</option>
                                    <option value="skills">Skills & Abilities</option>
                                    <option value="clothing">Clothing & Sizes</option>
                                    <option value="location">Location & Language</option>
                                    <option value="industry">Industry Specific</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Regional Conversion</label>
                                <select class="form-select" id="regionalConversion">
                                    <option value="none">None Required</option>
                                    <option value="metric-imperial">Metric ↔ Imperial</option>
                                    <option value="sizing">International Sizing</option>
                                    <option value="custom">Custom Conversion</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Supported Languages</label>
                                <select class="form-select" multiple id="supportedLanguages" style="height: 38px;">
                                    <option value="en" selected>English</option>
                                    <option value="es" selected>Spanish</option>
                                    <option value="fr" selected>French</option>
                                    <option value="de" selected>German</option>
                                    <option value="it" selected>Italian</option>
                                    <option value="pt" selected>Portuguese</option>
                                    <option value="ja" selected>Japanese</option>
                                    <option value="zh" selected>Chinese</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="optionSetDescription" rows="2"></textarea>
                    </div>
                    
                    <!-- Options Editor -->
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">Option Values</h6>
                            <button type="button" class="btn btn-sm btn-success" onclick="addOption()">
                                <i class="fas fa-plus me-1"></i> Add Option
                            </button>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-sm mb-0" id="optionsTable">
                                    <thead class="table-light">
                                        <tr>
                                            <th width="50">#</th>
                                            <th>Value</th>
                                            <th>Display Name (EN)</th>
                                            <th>Display Name (ES)</th>
                                            <th>Display Name (FR)</th>
                                            <th>Conversion</th>
                                            <th width="100">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="optionsTableBody">
                                        <!-- Options will be populated here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="allowCustomValues">
                            <label class="form-check-label" for="allowCustomValues">
                                Allow custom values (users can add their own options)
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="sortAlphabetically">
                            <label class="form-check-label" for="sortAlphabetically">
                                Sort options alphabetically
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="saveOptionSet()">Save Changes</button>
            </div>
        </div>
    </div>
</div>

<!-- View Usage Modal -->
<div class="modal fade" id="viewUsageModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Option Set Usage</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title" id="usageOptionSetName">Height - Adult (18+ years)</h6>
                                <p class="text-muted mb-0" id="usageOptionSetSlug">height_adult</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <div class="row text-center">
                                    <div class="col-4">
                                        <h4 class="mb-0" id="usageTemplateCount">23</h4>
                                        <small class="text-muted">Templates</small>
                                    </div>
                                    <div class="col-4">
                                        <h4 class="mb-0" id="usageFieldCount">35</h4>
                                        <small class="text-muted">Fields</small>
                                    </div>
                                    <div class="col-4">
                                        <h4 class="mb-0" id="usageUserCount">1,245</h4>
                                        <small class="text-muted">Users</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Usage by Templates -->
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">Used in Templates</h6>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-sm table-hover mb-0">
                                <thead>
                                    <tr>
                                        <th>Template Name</th>
                                        <th>Industry</th>
                                        <th>Field Name</th>
                                        <th>Required</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="templateUsageBody">
                                    <tr>
                                        <td>Fashion Model Profile</td>
                                        <td><span class="badge bg-primary">Fashion</span></td>
                                        <td>model_height</td>
                                        <td><i class="fas fa-check text-success"></i></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-info">
                                                <i class="fas fa-external-link-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Actor Profile</td>
                                        <td><span class="badge bg-warning">Entertainment</span></td>
                                        <td>physical_height</td>
                                        <td><i class="fas fa-check text-success"></i></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-info">
                                                <i class="fas fa-external-link-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Commercial Talent</td>
                                        <td><span class="badge bg-info">Advertising</span></td>
                                        <td>talent_height</td>
                                        <td><i class="fas fa-times text-muted"></i></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-info">
                                                <i class="fas fa-external-link-alt"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- Usage Statistics -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Usage Statistics</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Most Used Values</h6>
                                <div class="list-group list-group-flush">
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <span>5'8" (173 cm)</span>
                                        <span class="badge bg-primary">234 users</span>
                                    </div>
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <span>5'10" (178 cm)</span>
                                        <span class="badge bg-primary">189 users</span>
                                    </div>
                                    <div class="list-group-item d-flex justify-content-between align-items-center">
                                        <span>5'6" (168 cm)</span>
                                        <span class="badge bg-primary">156 users</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6>Recent Activity</h6>
                                <div class="list-group list-group-flush">
                                    <div class="list-group-item">
                                        <div class="d-flex justify-content-between">
                                            <span>Last updated</span>
                                            <small class="text-muted">3 days ago</small>
                                        </div>
                                    </div>
                                    <div class="list-group-item">
                                        <div class="d-flex justify-content-between">
                                            <span>Created</span>
                                            <small class="text-muted">Jan 15, 2024</small>
                                        </div>
                                    </div>
                                    <div class="list-group-item">
                                        <div class="d-flex justify-content-between">
                                            <span>Version</span>
                                            <small class="text-muted">2.3</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" onclick="editFromUsage()">Edit Option Set</button>
            </div>
        </div>
    </div>
</div>

<script>
// Sample data for option sets
const optionSets = {
    'height_adult': {
        name: 'Height - Adult (18+ years)',
        slug: 'height_adult',
        category: 'physical',
        status: 'active',
        description: 'Height measurements for adults 18 years and older',
        regionalConversion: 'metric-imperial',
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh'],
        allowCustom: false,
        sortAlpha: false,
        options: [
            { value: '147', display_en: '4\'10" (147 cm)', display_es: '147 cm (4\'10")', display_fr: '147 cm (4\'10")', conversion: '4\'10"' },
            { value: '150', display_en: '4\'11" (150 cm)', display_es: '150 cm (4\'11")', display_fr: '150 cm (4\'11")', conversion: '4\'11"' },
            { value: '152', display_en: '5\'0" (152 cm)', display_es: '152 cm (5\'0")', display_fr: '152 cm (5\'0")', conversion: '5\'0"' },
            { value: '155', display_en: '5\'1" (155 cm)', display_es: '155 cm (5\'1")', display_fr: '155 cm (5\'1")', conversion: '5\'1"' },
            { value: '157', display_en: '5\'2" (157 cm)', display_es: '157 cm (5\'2")', display_fr: '157 cm (5\'2")', conversion: '5\'2"' },
            { value: '160', display_en: '5\'3" (160 cm)', display_es: '160 cm (5\'3")', display_fr: '160 cm (5\'3")', conversion: '5\'3"' }
        ]
    },
    'eye_colors': {
        name: 'Eye Colors',
        slug: 'eye_colors',
        category: 'appearance',
        status: 'active',
        description: 'Standard eye color options with variations',
        regionalConversion: 'none',
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh'],
        allowCustom: true,
        sortAlpha: true,
        options: [
            { value: 'blue', display_en: 'Blue', display_es: 'Azul', display_fr: 'Bleu', conversion: '' },
            { value: 'green', display_en: 'Green', display_es: 'Verde', display_fr: 'Vert', conversion: '' },
            { value: 'brown', display_en: 'Brown', display_es: 'Marrón', display_fr: 'Marron', conversion: '' },
            { value: 'hazel', display_en: 'Hazel', display_es: 'Avellana', display_fr: 'Noisette', conversion: '' },
            { value: 'gray', display_en: 'Gray', display_es: 'Gris', display_fr: 'Gris', conversion: '' },
            { value: 'amber', display_en: 'Amber', display_es: 'Ámbar', display_fr: 'Ambre', conversion: '' }
        ]
    },
    'clothing_sizes_adult': {
        name: 'Clothing Sizes - Adult',
        slug: 'clothing_sizes_adult',
        category: 'clothing',
        status: 'active',
        description: 'International clothing sizes for adults',
        regionalConversion: 'sizing',
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh'],
        allowCustom: false,
        sortAlpha: false,
        options: [
            { value: 'xs', display_en: 'XS (US 0-2)', display_es: 'XS (EU 32-34)', display_fr: 'XS (FR 34-36)', conversion: 'US 0-2, EU 32-34' },
            { value: 's', display_en: 'S (US 4-6)', display_es: 'S (EU 36-38)', display_fr: 'S (FR 38-40)', conversion: 'US 4-6, EU 36-38' },
            { value: 'm', display_en: 'M (US 8-10)', display_es: 'M (EU 40-42)', display_fr: 'M (FR 42-44)', conversion: 'US 8-10, EU 40-42' },
            { value: 'l', display_en: 'L (US 12-14)', display_es: 'L (EU 44-46)', display_fr: 'L (FR 46-48)', conversion: 'US 12-14, EU 44-46' },
            { value: 'xl', display_en: 'XL (US 16-18)', display_es: 'XL (EU 48-50)', display_fr: 'XL (FR 50-52)', conversion: 'US 16-18, EU 48-50' }
        ]
    }
};

let currentEditingSet = null;
let optionCounter = 0;

// Create New Option Set
function createOptionSet() {
    currentEditingSet = null;
    document.getElementById('optionSetName').value = '';
    document.getElementById('optionSetSlug').value = '';
    document.getElementById('optionSetStatus').value = 'draft';
    document.getElementById('optionSetCategory').value = 'physical';
    document.getElementById('regionalConversion').value = 'none';
    document.getElementById('optionSetDescription').value = '';
    document.getElementById('allowCustomValues').checked = false;
    document.getElementById('sortAlphabetically').checked = false;
    
    // Clear options table
    document.getElementById('optionsTableBody').innerHTML = '';
    optionCounter = 0;
    
    // Add a few empty rows
    for (let i = 0; i < 3; i++) {
        addOption();
    }
    
    // Update modal title
    document.querySelector('#editOptionSetModal .modal-title').textContent = 'Create New Option Set';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editOptionSetModal'));
    modal.show();
    
    // Auto-generate slug as user types
    document.getElementById('optionSetName').addEventListener('input', function() {
        const slug = this.value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
        document.getElementById('optionSetSlug').value = slug;
    });
}

// Import Option Sets
function importOptionSets() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            showToast('success', `Importing option sets from ${file.name}...`);
            setTimeout(() => {
                showToast('success', 'Successfully imported 5 option sets!');
            }, 2000);
        }
    };
    input.click();
}

// Edit Option Set
function editOptionSet(slug) {
    const optionSet = optionSets[slug];
    if (!optionSet) return;
    
    currentEditingSet = slug;
    
    // Populate form fields
    document.getElementById('optionSetName').value = optionSet.name;
    document.getElementById('optionSetSlug').value = optionSet.slug;
    document.getElementById('optionSetStatus').value = optionSet.status;
    document.getElementById('optionSetCategory').value = optionSet.category;
    document.getElementById('regionalConversion').value = optionSet.regionalConversion;
    document.getElementById('optionSetDescription').value = optionSet.description;
    document.getElementById('allowCustomValues').checked = optionSet.allowCustom;
    document.getElementById('sortAlphabetically').checked = optionSet.sortAlpha;
    
    // Populate options table
    const tbody = document.getElementById('optionsTableBody');
    tbody.innerHTML = '';
    optionCounter = 0;
    
    optionSet.options.forEach((option, index) => {
        optionCounter++;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${optionCounter}</td>
            <td><input type="text" class="form-control form-control-sm" value="${option.value}"></td>
            <td><input type="text" class="form-control form-control-sm" value="${option.display_en}"></td>
            <td><input type="text" class="form-control form-control-sm" value="${option.display_es}"></td>
            <td><input type="text" class="form-control form-control-sm" value="${option.display_fr}"></td>
            <td><input type="text" class="form-control form-control-sm" value="${option.conversion || ''}"></td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="removeOption(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update modal title
    document.querySelector('#editOptionSetModal .modal-title').textContent = 'Edit Option Set';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editOptionSetModal'));
    modal.show();
}

// View Usage
function viewUsage(slug) {
    const optionSet = optionSets[slug];
    if (!optionSet) return;
    
    // Populate usage details
    document.getElementById('usageOptionSetName').textContent = optionSet.name;
    document.getElementById('usageOptionSetSlug').textContent = optionSet.slug;
    
    // Simulate random usage data
    document.getElementById('usageTemplateCount').textContent = Math.floor(Math.random() * 30) + 10;
    document.getElementById('usageFieldCount').textContent = Math.floor(Math.random() * 50) + 20;
    document.getElementById('usageUserCount').textContent = Math.floor(Math.random() * 2000) + 500;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewUsageModal'));
    modal.show();
}

// Add Option Row
function addOption() {
    optionCounter++;
    const tbody = document.getElementById('optionsTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${optionCounter}</td>
        <td><input type="text" class="form-control form-control-sm" placeholder="Value"></td>
        <td><input type="text" class="form-control form-control-sm" placeholder="English"></td>
        <td><input type="text" class="form-control form-control-sm" placeholder="Spanish"></td>
        <td><input type="text" class="form-control form-control-sm" placeholder="French"></td>
        <td><input type="text" class="form-control form-control-sm" placeholder="Conversion"></td>
        <td>
            <button class="btn btn-sm btn-outline-danger" onclick="removeOption(this)">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);
}

// Remove Option Row
function removeOption(button) {
    button.closest('tr').remove();
    // Renumber rows
    const rows = document.querySelectorAll('#optionsTableBody tr');
    rows.forEach((row, index) => {
        row.querySelector('td:first-child').textContent = index + 1;
    });
    optionCounter = rows.length;
}

// Save Option Set
function saveOptionSet() {
    const name = document.getElementById('optionSetName').value;
    const slug = document.getElementById('optionSetSlug').value;
    
    if (!name || !slug) {
        showToast('error', 'Please fill in all required fields');
        return;
    }
    
    // Collect all options
    const options = [];
    const rows = document.querySelectorAll('#optionsTableBody tr');
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs[0].value) {
            options.push({
                value: inputs[0].value,
                display_en: inputs[1].value,
                display_es: inputs[2].value,
                display_fr: inputs[3].value,
                conversion: inputs[4].value
            });
        }
    });
    
    if (options.length === 0) {
        showToast('error', 'Please add at least one option');
        return;
    }
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('editOptionSetModal')).hide();
    
    // Show success message
    if (currentEditingSet) {
        showToast('success', `Option set "${name}" updated successfully!`);
    } else {
        showToast('success', `Option set "${name}" created successfully!`);
    }
}

// Edit from Usage Modal
function editFromUsage() {
    const slug = document.getElementById('usageOptionSetSlug').textContent;
    bootstrap.Modal.getInstance(document.getElementById('viewUsageModal')).hide();
    setTimeout(() => {
        editOptionSet(slug);
    }, 300);
}

// Export Option Set
function exportOptionSet(slug) {
    const optionSet = optionSets[slug];
    if (!optionSet) return;
    
    // Create JSON data
    const dataStr = JSON.stringify(optionSet, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Create download link
    const exportFileDefaultName = `${slug}_export.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('success', `Exported ${optionSet.name} successfully!`);
}

// Other functions
function activateOptionSet(slug) {
    if (confirm(`Activate option set: ${slug}?`)) {
        showToast('success', `Option set ${slug} activated successfully!`);
        // Update UI
        const row = document.querySelector(`tr:has(small:contains("${slug}"))`);
        if (row) {
            const statusBadge = row.querySelector('.badge');
            statusBadge.textContent = 'Active';
            statusBadge.className = 'badge bg-success';
        }
    }
}

function deleteOptionSet(slug) {
    if (confirm(`Delete option set: ${slug}? This action cannot be undone.`)) {
        showToast('success', `Option set ${slug} deleted successfully!`);
        // Remove from table
        const row = document.querySelector(`tr:has(small:contains("${slug}"))`);
        if (row) {
            row.style.transition = 'opacity 0.3s';
            row.style.opacity = '0';
            setTimeout(() => row.remove(), 300);
        }
    }
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    showToast('info', 'Filters reset successfully');
}

function bulkExport() {
    showToast('info', 'Preparing bulk export...');
    setTimeout(() => {
        showToast('success', 'Exported 6 option sets successfully!');
    }, 1500);
}

function bulkActivate() {
    showToast('info', 'Activating selected option sets...');
    setTimeout(() => {
        showToast('success', 'Activated 3 option sets successfully!');
    }, 1000);
}

function bulkDeactivate() {
    showToast('info', 'Deactivating selected option sets...');
    setTimeout(() => {
        showToast('success', 'Deactivated 2 option sets successfully!');
    }, 1000);
}

function syncWithTemplates() {
    showToast('info', 'Syncing with templates...');
    setTimeout(() => {
        showToast('success', 'Synchronized 24 option sets with templates!');
    }, 2000);
}

function validateAllSets() {
    showToast('info', 'Validating all option sets...');
    setTimeout(() => {
        showToast('success', 'All option sets validated successfully! No issues found.');
    }, 1500);
}

// Toast notification function
function showToast(type, message) {
    const toastHtml = `
        <div class="toast align-items-center text-bg-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'info' ? 'info-circle' : 'check-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1090';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Option Sets Management page initialized');
    
    // Set up search functionality
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    // Set up category filter
    document.getElementById('categoryFilter').addEventListener('change', function(e) {
        const category = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            if (!category) {
                row.style.display = '';
                return;
            }
            
            const categoryBadge = row.querySelector('.badge');
            if (categoryBadge) {
                const rowCategory = categoryBadge.textContent.toLowerCase();
                row.style.display = rowCategory.includes(category) ? '' : 'none';
            }
        });
    });
});
</script>

<?php echo renderFooter(); ?>