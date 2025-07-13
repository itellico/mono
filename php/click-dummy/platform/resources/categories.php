<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Base Categories Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'resources/categories.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Global Resources', 'href' => 'index.php'],
            ['label' => 'Base Categories']
        ]);
        ?>
        
        <!-- Categories Header -->
        <div class="bg-info text-white p-4 rounded mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="mb-2">Base Categories Management</h2>
                    <p class="mb-0 opacity-75">Manage hierarchical content organization structure for all industry templates</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group">
                        <button class="btn btn-light" onclick="createCategory()">
                            <i class="fas fa-plus me-2"></i> New Category
                        </button>
                        <button class="btn btn-warning" onclick="importCategories()">
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
                        <h3 class="text-info">156</h3>
                        <p class="mb-0">Total Categories</p>
                        <small class="text-muted">All levels combined</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-success">23</h3>
                        <p class="mb-0">Root Categories</p>
                        <small class="text-muted">Top-level categories</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-warning">5</h3>
                        <p class="mb-0">Max Depth</p>
                        <small class="text-muted">Hierarchy levels</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h3 class="text-purple" style="color: #6f42c1;">89%</h3>
                        <p class="mb-0">Usage Rate</p>
                        <small class="text-muted">Categories in use</small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filter and Search -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <input type="text" class="form-control" placeholder="Search categories..." id="searchInput">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="levelFilter">
                            <option value="">All Levels</option>
                            <option value="1">Level 1 (Root)</option>
                            <option value="2">Level 2</option>
                            <option value="3">Level 3</option>
                            <option value="4">Level 4</option>
                            <option value="5">Level 5</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="statusFilter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="viewMode">
                            <option value="tree">Tree View</option>
                            <option value="flat">Flat List</option>
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
        
        <!-- Categories Tree View -->
        <div class="card" id="treeView">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                    <i class="fas fa-folder-open me-2"></i>
                    Categories Hierarchy
                </h5>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="expandAll()">
                        <i class="fas fa-expand-alt me-1"></i> Expand All
                    </button>
                    <button class="btn btn-outline-secondary" onclick="collapseAll()">
                        <i class="fas fa-compress-alt me-1"></i> Collapse All
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="category-tree">
                    <!-- Root Categories -->
                    <div class="category-item" data-level="1">
                        <div class="d-flex align-items-center py-2">
                            <button class="btn btn-link btn-sm me-2 expand-btn" onclick="toggleCategory(this)">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                            <i class="fas fa-folder text-primary me-2"></i>
                            <strong>Creative Industries</strong>
                            <span class="badge bg-primary ms-2">15 subcategories</span>
                            <span class="badge bg-success ms-2">Active</span>
                            <div class="ms-auto">
                                <span class="text-muted me-3">Used in 23 templates</span>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="editCategory('creative-industries')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-info" onclick="viewUsage('creative-industries')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-outline-success" onclick="addSubcategory('creative-industries')">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="subcategories ms-4" style="display: none;">
                            <!-- Level 2 -->
                            <div class="category-item" data-level="2">
                                <div class="d-flex align-items-center py-2">
                                    <button class="btn btn-link btn-sm me-2 expand-btn" onclick="toggleCategory(this)">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                    <i class="fas fa-folder-open text-info me-2"></i>
                                    Modeling & Fashion
                                    <span class="badge bg-info ms-2">8 subcategories</span>
                                    <span class="badge bg-success ms-2">Active</span>
                                    <div class="ms-auto">
                                        <span class="text-muted me-3">Used in 18 templates</span>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-primary" onclick="editCategory('modeling-fashion')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-outline-info" onclick="viewUsage('modeling-fashion')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-outline-success" onclick="addSubcategory('modeling-fashion')">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="subcategories ms-4" style="display: none;">
                                    <!-- Level 3 -->
                                    <div class="category-item" data-level="3">
                                        <div class="d-flex align-items-center py-1">
                                            <i class="fas fa-file text-warning me-2"></i>
                                            Fashion Modeling
                                            <span class="badge bg-success ms-2">Active</span>
                                            <div class="ms-auto">
                                                <span class="text-muted me-3">15 templates</span>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="editCategory('fashion-modeling')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="viewUsage('fashion-modeling')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="category-item" data-level="3">
                                        <div class="d-flex align-items-center py-1">
                                            <i class="fas fa-file text-warning me-2"></i>
                                            Commercial Modeling
                                            <span class="badge bg-success ms-2">Active</span>
                                            <div class="ms-auto">
                                                <span class="text-muted me-3">12 templates</span>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="editCategory('commercial-modeling')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="viewUsage('commercial-modeling')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="category-item" data-level="3">
                                        <div class="d-flex align-items-center py-1">
                                            <i class="fas fa-file text-warning me-2"></i>
                                            Plus Size Modeling
                                            <span class="badge bg-success ms-2">Active</span>
                                            <div class="ms-auto">
                                                <span class="text-muted me-3">8 templates</span>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="editCategory('plus-size-modeling')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="viewUsage('plus-size-modeling')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="category-item" data-level="2">
                                <div class="d-flex align-items-center py-2">
                                    <button class="btn btn-link btn-sm me-2 expand-btn" onclick="toggleCategory(this)">
                                        <i class="fas fa-chevron-right"></i>
                                    </button>
                                    <i class="fas fa-folder-open text-info me-2"></i>
                                    Acting & Performance
                                    <span class="badge bg-info ms-2">5 subcategories</span>
                                    <span class="badge bg-success ms-2">Active</span>
                                    <div class="ms-auto">
                                        <span class="text-muted me-3">Used in 20 templates</span>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-primary" onclick="editCategory('acting-performance')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-outline-info" onclick="viewUsage('acting-performance')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-outline-success" onclick="addSubcategory('acting-performance')">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="subcategories ms-4" style="display: none;">
                                    <div class="category-item" data-level="3">
                                        <div class="d-flex align-items-center py-1">
                                            <i class="fas fa-file text-warning me-2"></i>
                                            Film Acting
                                            <span class="badge bg-success ms-2">Active</span>
                                            <div class="ms-auto">
                                                <span class="text-muted me-3">18 templates</span>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="editCategory('film-acting')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="viewUsage('film-acting')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="category-item" data-level="3">
                                        <div class="d-flex align-items-center py-1">
                                            <i class="fas fa-file text-warning me-2"></i>
                                            Theater Acting
                                            <span class="badge bg-success ms-2">Active</span>
                                            <div class="ms-auto">
                                                <span class="text-muted me-3">14 templates</span>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="editCategory('theater-acting')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-info" onclick="viewUsage('theater-acting')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Another Root Category -->
                    <div class="category-item" data-level="1">
                        <div class="d-flex align-items-center py-2">
                            <button class="btn btn-link btn-sm me-2 expand-btn" onclick="toggleCategory(this)">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                            <i class="fas fa-folder text-primary me-2"></i>
                            <strong>Media & Production</strong>
                            <span class="badge bg-primary ms-2">12 subcategories</span>
                            <span class="badge bg-success ms-2">Active</span>
                            <div class="ms-auto">
                                <span class="text-muted me-3">Used in 19 templates</span>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="editCategory('media-production')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-info" onclick="viewUsage('media-production')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-outline-success" onclick="addSubcategory('media-production')">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="subcategories ms-4" style="display: none;">
                            <div class="category-item" data-level="2">
                                <div class="d-flex align-items-center py-2">
                                    <i class="fas fa-file text-warning me-2"></i>
                                    Photography Services
                                    <span class="badge bg-success ms-2">Active</span>
                                    <div class="ms-auto">
                                        <span class="text-muted me-3">16 templates</span>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-primary" onclick="editCategory('photography-services')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-outline-info" onclick="viewUsage('photography-services')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="category-item" data-level="2">
                                <div class="d-flex align-items-center py-2">
                                    <i class="fas fa-file text-warning me-2"></i>
                                    Video Production
                                    <span class="badge bg-success ms-2">Active</span>
                                    <div class="ms-auto">
                                        <span class="text-muted me-3">11 templates</span>
                                        <div class="btn-group btn-group-sm">
                                            <button class="btn btn-outline-primary" onclick="editCategory('video-production')">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-outline-info" onclick="viewUsage('video-production')">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Inactive Category Example -->
                    <div class="category-item" data-level="1" style="opacity: 0.6;">
                        <div class="d-flex align-items-center py-2">
                            <i class="fas fa-folder text-secondary me-2"></i>
                            <strong>Event Management</strong>
                            <span class="badge bg-secondary ms-2">8 subcategories</span>
                            <span class="badge bg-secondary ms-2">Inactive</span>
                            <div class="ms-auto">
                                <span class="text-muted me-3">Used in 0 templates</span>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="editCategory('event-management')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-success" onclick="activateCategory('event-management')">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="deleteCategory('event-management')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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
                            <button class="btn btn-outline-success" onclick="validateHierarchy()">
                                <i class="fas fa-check-circle me-2"></i> Validate Hierarchy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function createCategory() {
    alert('Create New Category functionality - would open creation wizard');
}

function importCategories() {
    alert('Import Categories functionality - would open file upload dialog');
}

function editCategory(slug) {
    alert(`Edit Category: ${slug} - would open detailed editor`);
}

function viewUsage(slug) {
    alert(`View Usage for: ${slug} - would show which templates use this category`);
}

function addSubcategory(parentSlug) {
    alert(`Add Subcategory to: ${parentSlug} - would open creation form`);
}

function activateCategory(slug) {
    if (confirm(`Activate category: ${slug}?`)) {
        alert(`Category ${slug} would be activated`);
    }
}

function deleteCategory(slug) {
    if (confirm(`Delete category: ${slug}? This action cannot be undone.`)) {
        alert(`Category ${slug} would be deleted`);
    }
}

function toggleCategory(button) {
    const categoryItem = button.closest('.category-item');
    const subcategories = categoryItem.querySelector('.subcategories');
    const icon = button.querySelector('i');
    
    if (subcategories.style.display === 'none') {
        subcategories.style.display = 'block';
        icon.className = 'fas fa-chevron-down';
    } else {
        subcategories.style.display = 'none';
        icon.className = 'fas fa-chevron-right';
    }
}

function expandAll() {
    document.querySelectorAll('.subcategories').forEach(sub => {
        sub.style.display = 'block';
    });
    document.querySelectorAll('.expand-btn i').forEach(icon => {
        icon.className = 'fas fa-chevron-down';
    });
}

function collapseAll() {
    document.querySelectorAll('.subcategories').forEach(sub => {
        sub.style.display = 'none';
    });
    document.querySelectorAll('.expand-btn i').forEach(icon => {
        icon.className = 'fas fa-chevron-right';
    });
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('levelFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('viewMode').value = 'tree';
    alert('Filters would be reset and tree would refresh');
}

function bulkExport() {
    alert('Bulk Export functionality - would export selected categories');
}

function bulkActivate() {
    alert('Bulk Activate functionality - would activate selected categories');
}

function bulkDeactivate() {
    alert('Bulk Deactivate functionality - would deactivate selected categories');
}

function syncWithTemplates() {
    alert('Sync with Templates functionality - would update all template assignments');
}

function validateHierarchy() {
    alert('Validate Hierarchy functionality - would check for circular references and orphaned categories');
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Categories Management page initialized');
});
</script>

<style>
.category-tree {
    font-family: 'Courier New', monospace;
}

.category-item {
    border-left: 2px solid #e9ecef;
    margin-left: 10px;
}

.category-item[data-level="1"] {
    border-left: none;
    margin-left: 0;
}

.category-item[data-level="2"] {
    border-left-color: #0dcaf0;
}

.category-item[data-level="3"] {
    border-left-color: #ffc107;
}

.expand-btn {
    transition: transform 0.2s;
}
</style>

<?php echo renderFooter(); ?>