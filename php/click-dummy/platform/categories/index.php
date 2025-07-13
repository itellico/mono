<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Category Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'categories/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Category Management']
        ]);
        
        echo createHeroSection(
            "Category Management",
            "Manage global categories and hierarchical classification systems across all marketplace types",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Category', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Import Categories', 'icon' => 'fas fa-upload', 'style' => 'light']
            ]
        );
        ?>
        
        <!-- Category Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Categories', '147', 'fas fa-folder', 'primary');
            echo createStatCard('Root Categories', '12', 'fas fa-layer-group', 'success');
            echo createStatCard('Usage Frequency', '89%', 'fas fa-chart-line', 'info');
            echo createStatCard('Active Tenants Using', '8', 'fas fa-users', 'warning');
            ?>
        </div>
        
        <div class="row mb-4">
            <!-- Category Tree -->
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Category Hierarchy</h5>
                        <div class="btn-group">
                            <button class="btn btn-outline-secondary btn-sm" onclick="expandAll()">
                                <i class="fas fa-expand-arrows-alt me-1"></i> Expand All
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="collapseAll()">
                                <i class="fas fa-compress-arrows-alt me-1"></i> Collapse All
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Fashion Categories -->
                        <div class="category-tree">
                            <div class="category-node mb-3">
                                <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm btn-outline-secondary me-2" onclick="toggleChildren(this)">
                                            <i class="fas fa-chevron-down"></i>
                                        </button>
                                        <i class="fas fa-female text-primary me-2"></i>
                                        <strong>Fashion Modeling</strong>
                                        <span class="badge bg-primary ms-2">34 subcategories</span>
                                    </div>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="editCategory('fashion')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-success" onclick="addSubcategory('fashion')">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="category-children ps-4 mt-2">
                                    <div class="category-subcategory mb-2 p-2 border-start border-3 border-primary">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div><i class="fas fa-star text-warning me-2"></i> Editorial Modeling</div>
                                            <small class="text-muted">78 users</small>
                                        </div>
                                    </div>
                                    <div class="category-subcategory mb-2 p-2 border-start border-3 border-primary">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div><i class="fas fa-shopping-bag text-info me-2"></i> Commercial Modeling</div>
                                            <small class="text-muted">124 users</small>
                                        </div>
                                    </div>
                                    <div class="category-subcategory mb-2 p-2 border-start border-3 border-primary">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div><i class="fas fa-walking text-success me-2"></i> Runway Modeling</div>
                                            <small class="text-muted">89 users</small>
                                        </div>
                                    </div>
                                    <div class="category-subcategory mb-2 p-2 border-start border-3 border-primary">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div><i class="fas fa-tshirt text-secondary me-2"></i> Plus Size Modeling</div>
                                            <small class="text-muted">45 users</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Fitness Categories -->
                            <div class="category-node mb-3">
                                <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm btn-outline-secondary me-2" onclick="toggleChildren(this)">
                                            <i class="fas fa-chevron-right"></i>
                                        </button>
                                        <i class="fas fa-dumbbell text-success me-2"></i>
                                        <strong>Fitness & Sports</strong>
                                        <span class="badge bg-success ms-2">18 subcategories</span>
                                    </div>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="editCategory('fitness')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-success" onclick="addSubcategory('fitness')">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="category-children ps-4 mt-2" style="display: none;">
                                    <div class="category-subcategory mb-2 p-2 border-start border-3 border-success">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div><i class="fas fa-running text-primary me-2"></i> Athletic Modeling</div>
                                            <small class="text-muted">67 users</small>
                                        </div>
                                    </div>
                                    <div class="category-subcategory mb-2 p-2 border-start border-3 border-success">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div><i class="fas fa-swimmer text-info me-2"></i> Swimwear Modeling</div>
                                            <small class="text-muted">89 users</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Voice Talent Categories -->
                            <div class="category-node mb-3">
                                <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm btn-outline-secondary me-2" onclick="toggleChildren(this)">
                                            <i class="fas fa-chevron-right"></i>
                                        </button>
                                        <i class="fas fa-microphone text-danger me-2"></i>
                                        <strong>Voice Talent</strong>
                                        <span class="badge bg-danger ms-2">12 subcategories</span>
                                    </div>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="editCategory('voice')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-success" onclick="addSubcategory('voice')">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Photography Categories -->
                            <div class="category-node mb-3">
                                <div class="d-flex align-items-center justify-content-between p-2 bg-light rounded">
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm btn-outline-secondary me-2" onclick="toggleChildren(this)">
                                            <i class="fas fa-chevron-right"></i>
                                        </button>
                                        <i class="fas fa-camera text-info me-2"></i>
                                        <strong>Photography</strong>
                                        <span class="badge bg-info ms-2">23 subcategories</span>
                                    </div>
                                    <div class="btn-group">
                                        <button class="btn btn-sm btn-outline-primary" onclick="editCategory('photography')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-success" onclick="addSubcategory('photography')">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Category Management -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Category Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2 mb-3">
                            <button class="btn btn-primary" onclick="createRootCategory()">
                                <i class="fas fa-plus me-2"></i> Create Root Category
                            </button>
                            <button class="btn btn-outline-secondary" onclick="importCategories()">
                                <i class="fas fa-upload me-2"></i> Import from CSV
                            </button>
                            <button class="btn btn-outline-info" onclick="exportCategories()">
                                <i class="fas fa-download me-2"></i> Export Categories
                            </button>
                        </div>
                        
                        <hr>
                        
                        <h6>Category Analytics</h6>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Fashion Modeling</small>
                                <small class="fw-bold">336 users</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-primary" style="width: 75%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Photography</small>
                                <small class="fw-bold">234 users</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-info" style="width: 52%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Fitness & Sports</small>
                                <small class="fw-bold">156 users</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-success" style="width: 35%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Voice Talent</small>
                                <small class="fw-bold">89 users</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-danger" style="width: 20%"></div>
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
                                    <small class="fw-bold">Added "Maternity Modeling"</small><br>
                                    <small class="text-muted">Fashion > Commercial > Maternity</small><br>
                                    <small class="text-muted">2 hours ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-info rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Updated "Portrait Photography"</small><br>
                                    <small class="text-muted">Photography > Portrait</small><br>
                                    <small class="text-muted">1 day ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-warning rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Moved "Kids Fitness"</small><br>
                                    <small class="text-muted">From Child → Fitness & Sports</small><br>
                                    <small class="text-muted">2 days ago</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Category Management Modals -->
<div class="modal fade" id="createCategoryModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create New Category</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="createCategoryForm">
                    <div class="mb-3">
                        <label class="form-label">Category Name</label>
                        <input type="text" class="form-control" placeholder="e.g., Commercial Modeling">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Parent Category</label>
                        <select class="form-select">
                            <option value="">Root Level Category</option>
                            <option value="fashion">Fashion Modeling</option>
                            <option value="fitness">Fitness & Sports</option>
                            <option value="voice">Voice Talent</option>
                            <option value="photography">Photography</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" rows="3" placeholder="Category description..."></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Icon</label>
                        <input type="text" class="form-control" placeholder="fas fa-icon-name">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">Create Category</button>
            </div>
        </div>
    </div>
</div>

<script>
function toggleChildren(button) {
    const icon = button.querySelector('i');
    const children = button.closest('.category-node').querySelector('.category-children');
    
    if (children.style.display === 'none' || !children.style.display) {
        children.style.display = 'block';
        icon.className = 'fas fa-chevron-down';
    } else {
        children.style.display = 'none';
        icon.className = 'fas fa-chevron-right';
    }
}

function expandAll() {
    document.querySelectorAll('.category-children').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.category-node button i').forEach(el => el.className = 'fas fa-chevron-down');
}

function collapseAll() {
    document.querySelectorAll('.category-children').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.category-node button i').forEach(el => el.className = 'fas fa-chevron-right');
}

function createRootCategory() {
    new bootstrap.Modal(document.getElementById('createCategoryModal')).show();
}

function editCategory(categoryId) {
    alert('Edit category: ' + categoryId + '\n\nThis would open a detailed edit form with category settings, permissions, and subcategory management.');
}

function addSubcategory(parentId) {
    alert('Add subcategory to: ' + parentId + '\n\nThis would open a form to create a new subcategory under the selected parent category.');
}

function importCategories() {
    alert('Import Categories\n\nThis would open a CSV import wizard to bulk import category hierarchies.');
}

function exportCategories() {
    alert('Export Categories\n\nThis would generate and download a CSV file with the complete category hierarchy.');
}
</script>

<?php echo renderFooter(); ?>