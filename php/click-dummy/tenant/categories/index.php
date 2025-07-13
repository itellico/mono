<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Categories Management - Go Models NYC", "Admin User", "Marketplace Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'categories/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Categories']
        ]);
        
        echo createHeroSection(
            "Categories & Tags Management",
            "Organize and manage talent categories and specialized tags for your marketplace",
            "https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=1200&h=300&fit=crop",
            [
                ['label' => 'Add Category', 'icon' => 'fas fa-plus', 'style' => 'success'],
                ['label' => 'Manage Tags', 'icon' => 'fas fa-tags', 'style' => 'info'],
                ['label' => 'Import Data', 'icon' => 'fas fa-upload', 'style' => 'secondary']
            ]
        );
        ?>
        
        <!-- Category Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Categories', '12', 'fas fa-layer-group', 'primary');
            echo createStatCard('Active Tags', '847', 'fas fa-tags', 'success');
            echo createStatCard('Talent Assigned', '2,450', 'fas fa-users', 'info');
            echo createStatCard('Specializations', '156', 'fas fa-star', 'warning');
            ?>
        </div>
        
        <!-- Main Categories -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Main Categories</h5>
                        <div class="btn-group">
                            <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#addCategoryModal">
                                <i class="fas fa-plus me-2"></i> Add Category
                            </button>
                            <button class="btn btn-info btn-sm" data-bs-toggle="modal" data-bs-target="#bulkManageModal">
                                <i class="fas fa-tasks me-2"></i> Bulk Actions
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="exportCategories()">
                                <i class="fas fa-download me-2"></i> Export
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="row g-4">
                            <!-- Fashion Model Category -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card border-primary h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-female fa-3x text-primary mb-3"></i>
                                        <h5 class="card-title text-primary">Fashion Model</h5>
                                        <p class="text-muted small">High-fashion and runway modeling</p>
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-around">
                                                <div>
                                                    <strong>1,247</strong><br>
                                                    <small class="text-muted">Talent</small>
                                                </div>
                                                <div>
                                                    <strong>89</strong><br>
                                                    <small class="text-muted">Active</small>
                                                </div>
                                                <div>
                                                    <strong>15</strong><br>
                                                    <small class="text-muted">Tags</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="btn-group btn-group-sm w-100">
                                            <button class="btn btn-outline-primary">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-outline-warning">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-outline-danger">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Commercial Model Category -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card border-success h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-video fa-3x text-success mb-3"></i>
                                        <h5 class="card-title text-success">Commercial Model</h5>
                                        <p class="text-muted small">TV commercials and advertising</p>
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-around">
                                                <div>
                                                    <strong>892</strong><br>
                                                    <small class="text-muted">Talent</small>
                                                </div>
                                                <div>
                                                    <strong>67</strong><br>
                                                    <small class="text-muted">Active</small>
                                                </div>
                                                <div>
                                                    <strong>12</strong><br>
                                                    <small class="text-muted">Tags</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="btn-group btn-group-sm w-100">
                                            <button class="btn btn-outline-primary">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-outline-warning">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-outline-danger">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Editorial Model Category -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card border-info h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-camera fa-3x text-info mb-3"></i>
                                        <h5 class="card-title text-info">Editorial Model</h5>
                                        <p class="text-muted small">Magazine and artistic photography</p>
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-around">
                                                <div>
                                                    <strong>456</strong><br>
                                                    <small class="text-muted">Talent</small>
                                                </div>
                                                <div>
                                                    <strong>34</strong><br>
                                                    <small class="text-muted">Active</small>
                                                </div>
                                                <div>
                                                    <strong>18</strong><br>
                                                    <small class="text-muted">Tags</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="btn-group btn-group-sm w-100">
                                            <button class="btn btn-outline-primary">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-outline-warning">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-outline-danger">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Plus Size Model Category -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card border-warning h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-heart fa-3x text-warning mb-3"></i>
                                        <h5 class="card-title text-warning">Plus Size Model</h5>
                                        <p class="text-muted small">Inclusive and diverse modeling</p>
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-around">
                                                <div>
                                                    <strong>234</strong><br>
                                                    <small class="text-muted">Talent</small>
                                                </div>
                                                <div>
                                                    <strong>28</strong><br>
                                                    <small class="text-muted">Active</small>
                                                </div>
                                                <div>
                                                    <strong>9</strong><br>
                                                    <small class="text-muted">Tags</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="btn-group btn-group-sm w-100">
                                            <button class="btn btn-outline-primary">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-outline-warning">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-outline-danger">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Runway Model Category -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card border-secondary h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-walking fa-3x text-secondary mb-3"></i>
                                        <h5 class="card-title text-secondary">Runway Model</h5>
                                        <p class="text-muted small">Fashion week and runway shows</p>
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-around">
                                                <div>
                                                    <strong>167</strong><br>
                                                    <small class="text-muted">Talent</small>
                                                </div>
                                                <div>
                                                    <strong>23</strong><br>
                                                    <small class="text-muted">Active</small>
                                                </div>
                                                <div>
                                                    <strong>7</strong><br>
                                                    <small class="text-muted">Tags</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="btn-group btn-group-sm w-100">
                                            <button class="btn btn-outline-primary">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-outline-warning">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-outline-danger">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Fitness Model Category -->
                            <div class="col-md-6 col-lg-4">
                                <div class="card border-danger h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-dumbbell fa-3x text-danger mb-3"></i>
                                        <h5 class="card-title text-danger">Fitness Model</h5>
                                        <p class="text-muted small">Athletic and fitness modeling</p>
                                        <div class="mb-3">
                                            <div class="d-flex justify-content-around">
                                                <div>
                                                    <strong>312</strong><br>
                                                    <small class="text-muted">Talent</small>
                                                </div>
                                                <div>
                                                    <strong>45</strong><br>
                                                    <small class="text-muted">Active</small>
                                                </div>
                                                <div>
                                                    <strong>11</strong><br>
                                                    <small class="text-muted">Tags</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="btn-group btn-group-sm w-100">
                                            <button class="btn btn-outline-primary">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-outline-warning">
                                                <i class="fas fa-edit"></i> Edit
                                            </button>
                                            <button class="btn btn-outline-danger">
                                                <i class="fas fa-trash"></i> Delete
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
        
        <!-- Popular Tags -->
        <div class="row">
            <div class="col-lg-8">
                <?php echo createCard(
                    "Popular Tags",
                    '
                    <div class="mb-3">
                        <input type="text" class="form-control" placeholder="Search tags or add new tag...">
                    </div>
                    <div class="mb-4">
                        <span class="badge bg-primary me-2 mb-2">High Fashion</span>
                        <span class="badge bg-success me-2 mb-2">Runway</span>
                        <span class="badge bg-info me-2 mb-2">Editorial</span>
                        <span class="badge bg-warning me-2 mb-2">Commercial</span>
                        <span class="badge bg-danger me-2 mb-2">Beauty</span>
                        <span class="badge bg-secondary me-2 mb-2">Lifestyle</span>
                        <span class="badge bg-primary me-2 mb-2">Sports</span>
                        <span class="badge bg-success me-2 mb-2">Fitness</span>
                        <span class="badge bg-info me-2 mb-2">Lingerie</span>
                        <span class="badge bg-warning me-2 mb-2">Plus Size</span>
                        <span class="badge bg-danger me-2 mb-2">Mature</span>
                        <span class="badge bg-secondary me-2 mb-2">Petite</span>
                        <span class="badge bg-primary me-2 mb-2">Swimwear</span>
                        <span class="badge bg-success me-2 mb-2">Bridal</span>
                        <span class="badge bg-info me-2 mb-2">Avant Garde</span>
                        <span class="badge bg-warning me-2 mb-2">Street Style</span>
                        <span class="badge bg-danger me-2 mb-2">Catalog</span>
                        <span class="badge bg-secondary me-2 mb-2">Print Ad</span>
                        <span class="badge bg-primary me-2 mb-2">TV Commercial</span>
                        <span class="badge bg-success me-2 mb-2">E-commerce</span>
                    </div>
                    <button class="btn btn-outline-primary btn-sm me-2">
                        <i class="fas fa-plus me-1"></i> Add Tag
                    </button>
                    <button class="btn btn-outline-info btn-sm me-2">
                        <i class="fas fa-tags me-1"></i> Bulk Manage
                    </button>
                    <button class="btn btn-outline-success btn-sm">
                        <i class="fas fa-download me-1"></i> Export
                    </button>
                    '
                ); ?>
            </div>
            <div class="col-lg-4">
                <?php echo createCard(
                    "Category Analytics",
                    '
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Fashion Model Usage</span>
                            <span class="fw-bold">51%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-primary" style="width: 51%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Commercial Model</span>
                            <span class="fw-bold">36%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-success" style="width: 36%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Editorial Model</span>
                            <span class="fw-bold">19%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-info" style="width: 19%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Fitness Model</span>
                            <span class="fw-bold">13%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-danger" style="width: 13%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Plus Size Model</span>
                            <span class="fw-bold">10%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-warning" style="width: 10%"></div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="d-flex justify-content-between">
                            <span class="small">Runway Model</span>
                            <span class="fw-bold">7%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar bg-secondary" style="width: 7%"></div>
                        </div>
                    </div>
                    <hr>
                    <div class="text-center">
                        <small class="text-muted">Total: 2,450 talent profiles</small>
                    </div>
                    '
                ); ?>
            </div>
        </div>
    </div>
</div>

<!-- Add Category Modal -->
<div class="modal fade" id="addCategoryModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Add New Category</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="addCategoryForm">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Category Name *</label>
                                <input type="text" class="form-control" id="categoryName" required placeholder="e.g., Fashion Model">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Category Icon</label>
                                <select class="form-select" id="categoryIcon">
                                    <option value="fas fa-female">👩 Female</option>
                                    <option value="fas fa-male">👨 Male</option>
                                    <option value="fas fa-camera">📷 Camera</option>
                                    <option value="fas fa-video">🎥 Video</option>
                                    <option value="fas fa-dumbbell">💪 Fitness</option>
                                    <option value="fas fa-heart">❤️ Heart</option>
                                    <option value="fas fa-walking">🚶 Walking</option>
                                    <option value="fas fa-star">⭐ Star</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="categoryDescription" rows="3" placeholder="Brief description of this category..."></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Color Theme</label>
                                <select class="form-select" id="categoryColor">
                                    <option value="primary">Primary Blue</option>
                                    <option value="success">Success Green</option>
                                    <option value="info">Info Cyan</option>
                                    <option value="warning">Warning Yellow</option>
                                    <option value="danger">Danger Red</option>
                                    <option value="secondary">Secondary Gray</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="categoryStatus">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Tags (comma separated)</label>
                        <input type="text" class="form-control" id="categoryTags" placeholder="e.g., runway, editorial, commercial">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success" onclick="addCategory()">Add Category</button>
            </div>
        </div>
    </div>
</div>

<!-- Edit Category Modal -->
<div class="modal fade" id="editCategoryModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Category</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="editCategoryForm">
                    <input type="hidden" id="editCategoryId">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Category Name *</label>
                                <input type="text" class="form-control" id="editCategoryName" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Category Icon</label>
                                <select class="form-select" id="editCategoryIcon">
                                    <option value="fas fa-female">👩 Female</option>
                                    <option value="fas fa-male">👨 Male</option>
                                    <option value="fas fa-camera">📷 Camera</option>
                                    <option value="fas fa-video">🎥 Video</option>
                                    <option value="fas fa-dumbbell">💪 Fitness</option>
                                    <option value="fas fa-heart">❤️ Heart</option>
                                    <option value="fas fa-walking">🚶 Walking</option>
                                    <option value="fas fa-star">⭐ Star</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="editCategoryDescription" rows="3"></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Color Theme</label>
                                <select class="form-select" id="editCategoryColor">
                                    <option value="primary">Primary Blue</option>
                                    <option value="success">Success Green</option>
                                    <option value="info">Info Cyan</option>
                                    <option value="warning">Warning Yellow</option>
                                    <option value="danger">Danger Red</option>
                                    <option value="secondary">Secondary Gray</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Status</label>
                                <select class="form-select" id="editCategoryStatus">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-warning" onclick="updateCategory()">Update Category</button>
            </div>
        </div>
    </div>
</div>

<!-- View Category Modal -->
<div class="modal fade" id="viewCategoryModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="viewCategoryTitle">Category Analytics</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-8">
                        <div id="categoryAnalyticsChart" style="height: 300px; background: #f8f9fa; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <div class="text-center">
                                <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                                <h5 class="text-muted">Category Performance Analytics</h5>
                                <p class="text-muted">Interactive charts showing talent growth, booking rates, and revenue trends</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">Quick Stats</h6>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Total Talent:</span>
                                        <strong id="viewTotalTalent">0</strong>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Active This Month:</span>
                                        <strong id="viewActiveTalent">0</strong>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Bookings (MTD):</span>
                                        <strong id="viewBookings">0</strong>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Revenue (MTD):</span>
                                        <strong id="viewRevenue">$0</strong>
                                    </div>
                                </div>
                                <hr>
                                <h6>Top Tags</h6>
                                <div id="viewTopTags">
                                    <span class="badge bg-primary me-1 mb-1">High Fashion</span>
                                    <span class="badge bg-success me-1 mb-1">Runway</span>
                                    <span class="badge bg-info me-1 mb-1">Editorial</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-primary" onclick="exportCategoryData()">
                    <i class="fas fa-download me-2"></i>Export Data
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<!-- Bulk Manage Modal -->
<div class="modal fade" id="bulkManageModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Bulk Category Actions</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label class="form-label">Select Action</label>
                    <select class="form-select" id="bulkAction">
                        <option value="">Choose action...</option>
                        <option value="activate">Activate Categories</option>
                        <option value="deactivate">Deactivate Categories</option>
                        <option value="delete">Delete Categories</option>
                        <option value="export">Export Categories</option>
                        <option value="merge">Merge Categories</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Select Categories</label>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="selectAll">
                        <label class="form-check-label" for="selectAll">
                            <strong>Select All</strong>
                        </label>
                    </div>
                    <hr>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="fashion-model">
                        <label class="form-check-label">Fashion Model</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="commercial-model">
                        <label class="form-check-label">Commercial Model</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="editorial-model">
                        <label class="form-check-label">Editorial Model</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="plus-size-model">
                        <label class="form-check-label">Plus Size Model</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="runway-model">
                        <label class="form-check-label">Runway Model</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" value="fitness-model">
                        <label class="form-check-label">Fitness Model</label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="executeBulkAction()">Execute Action</button>
            </div>
        </div>
    </div>
</div>

<script>
// Category Management JavaScript
let categories = {
    'fashion-model': { name: 'Fashion Model', description: 'High-fashion and runway modeling', talent: 1247, active: 89, tags: 15, color: 'primary' },
    'commercial-model': { name: 'Commercial Model', description: 'TV commercials and advertising', talent: 892, active: 67, tags: 12, color: 'success' },
    'editorial-model': { name: 'Editorial Model', description: 'Magazine and artistic photography', talent: 456, active: 34, tags: 18, color: 'info' },
    'plus-size-model': { name: 'Plus Size Model', description: 'Inclusive and diverse modeling', talent: 234, active: 28, tags: 9, color: 'warning' },
    'runway-model': { name: 'Runway Model', description: 'Fashion week and runway shows', talent: 167, active: 23, tags: 7, color: 'secondary' },
    'fitness-model': { name: 'Fitness Model', description: 'Athletic and fitness modeling', talent: 312, active: 45, tags: 11, color: 'danger' }
};

// View Category Function
function viewCategory(categoryId) {
    const category = categories[categoryId];
    if (!category) return;
    
    document.getElementById('viewCategoryTitle').textContent = category.name + ' - Analytics';
    document.getElementById('viewTotalTalent').textContent = category.talent.toLocaleString();
    document.getElementById('viewActiveTalent').textContent = category.active;
    document.getElementById('viewBookings').textContent = Math.floor(category.active * 2.3);
    document.getElementById('viewRevenue').textContent = '$' + (category.active * 1250).toLocaleString();
    
    const modal = new bootstrap.Modal(document.getElementById('viewCategoryModal'));
    modal.show();
    
    showToast('success', 'Loading ' + category.name + ' analytics...');
}

// Edit Category Function
function editCategory(categoryId, name, description) {
    const category = categories[categoryId];
    if (!category) return;
    
    document.getElementById('editCategoryId').value = categoryId;
    document.getElementById('editCategoryName').value = name;
    document.getElementById('editCategoryDescription').value = description;
    document.getElementById('editCategoryColor').value = category.color;
    
    const modal = new bootstrap.Modal(document.getElementById('editCategoryModal'));
    modal.show();
}

// Update Category Function
function updateCategory() {
    const categoryId = document.getElementById('editCategoryId').value;
    const name = document.getElementById('editCategoryName').value;
    const description = document.getElementById('editCategoryDescription').value;
    const color = document.getElementById('editCategoryColor').value;
    
    if (!name.trim()) {
        showToast('error', 'Category name is required');
        return;
    }
    
    // Update category data
    categories[categoryId].name = name;
    categories[categoryId].description = description;
    categories[categoryId].color = color;
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
    
    showToast('success', 'Category "' + name + '" updated successfully!');
    
    // Simulate updating the UI (in real app, this would refresh the data)
    setTimeout(() => {
        location.reload();
    }, 1500);
}

// Delete Category Function
function deleteCategory(categoryId, categoryName) {
    if (confirm('Are you sure you want to delete "' + categoryName + '"? This action cannot be undone.')) {
        delete categories[categoryId];
        
        // Remove the category card
        const categoryCard = document.getElementById('category-' + categoryId);
        if (categoryCard) {
            categoryCard.style.transition = 'all 0.3s ease';
            categoryCard.style.opacity = '0';
            categoryCard.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                categoryCard.remove();
                showToast('success', 'Category "' + categoryName + '" deleted successfully!');
                updateStats();
            }, 300);
        }
    }
}

// Add Category Function
function addCategory() {
    const name = document.getElementById('categoryName').value;
    const description = document.getElementById('categoryDescription').value;
    const icon = document.getElementById('categoryIcon').value;
    const color = document.getElementById('categoryColor').value;
    const status = document.getElementById('categoryStatus').value;
    
    if (!name.trim()) {
        showToast('error', 'Category name is required');
        return;
    }
    
    const categoryId = name.toLowerCase().replace(/\s+/g, '-');
    
    // Add to categories object
    categories[categoryId] = {
        name: name,
        description: description,
        talent: 0,
        active: 0,
        tags: 0,
        color: color,
        icon: icon,
        status: status
    };
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
    
    // Clear form
    document.getElementById('addCategoryForm').reset();
    
    showToast('success', 'Category "' + name + '" created successfully!');
    
    // Simulate adding to UI (in real app, this would refresh the data)
    setTimeout(() => {
        location.reload();
    }, 1500);
}

// Export Categories Function
function exportCategories() {
    const csvData = [
        ['Category Name', 'Description', 'Total Talent', 'Active Talent', 'Tags', 'Color'],
        ...Object.entries(categories).map(([id, cat]) => [
            cat.name, cat.description, cat.talent, cat.active, cat.tags, cat.color
        ])
    ];
    
    const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clickdami-categories-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('success', 'Categories exported successfully!');
}

// Bulk Actions Function
function executeBulkAction() {
    const action = document.getElementById('bulkAction').value;
    const selectedCategories = Array.from(document.querySelectorAll('#bulkManageModal input[type="checkbox"]:checked'))
        .filter(cb => cb.value) // Exclude "Select All" checkbox
        .map(cb => cb.value);
    
    if (!action) {
        showToast('error', 'Please select an action');
        return;
    }
    
    if (selectedCategories.length === 0) {
        showToast('error', 'Please select at least one category');
        return;
    }
    
    let message = '';
    
    switch(action) {
        case 'activate':
            selectedCategories.forEach(catId => {
                if (categories[catId]) categories[catId].status = 'active';
            });
            message = selectedCategories.length + ' categories activated';
            break;
        case 'deactivate':
            selectedCategories.forEach(catId => {
                if (categories[catId]) categories[catId].status = 'inactive';
            });
            message = selectedCategories.length + ' categories deactivated';
            break;
        case 'delete':
            if (confirm('Are you sure you want to delete ' + selectedCategories.length + ' categories? This action cannot be undone.')) {
                selectedCategories.forEach(catId => delete categories[catId]);
                message = selectedCategories.length + ' categories deleted';
            }
            break;
        case 'export':
            exportCategories();
            message = 'Categories exported successfully';
            break;
    }
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('bulkManageModal')).hide();
    
    if (message) {
        showToast('success', message);
        setTimeout(() => location.reload(), 1500);
    }
}

// Update Stats Function
function updateStats() {
    const totalCategories = Object.keys(categories).length;
    const totalTalent = Object.values(categories).reduce((sum, cat) => sum + cat.talent, 0);
    const totalTags = Object.values(categories).reduce((sum, cat) => sum + cat.tags, 0);
    
    // Update stat cards (if they exist)
    const statCards = document.querySelectorAll('.card .fw-bold');
    if (statCards[0]) statCards[0].textContent = totalCategories;
    if (statCards[2]) statCards[2].textContent = totalTalent.toLocaleString();
    if (statCards[3]) statCards[3].textContent = totalTags;
}

// Toast Notification Function
function showToast(type, message) {
    // Create toast element
    const toastHtml = `
        <div class="toast align-items-center text-bg-${type === 'error' ? 'danger' : 'success'} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    // Add to toast container (create if doesn't exist)
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1090';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.innerHTML = toastHtml;
    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove after hiding
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Select All functionality
    document.getElementById('selectAll')?.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#bulkManageModal input[type="checkbox"]:not(#selectAll)');
        checkboxes.forEach(cb => cb.checked = this.checked);
    });
    
    console.log('ClickDami Categories Management - Fully Interactive Version Loaded');
});
</script>

<?php echo renderFooter(); ?>