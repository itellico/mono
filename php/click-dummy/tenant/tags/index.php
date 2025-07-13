<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Tags Management - Go Models NYC", "Admin User", "Marketplace Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'tags/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Tags Management']
        ]);
        
        echo createHeroSection(
            "Tags & Specializations",
            "Create and manage detailed tags to help talent showcase their unique skills and specializations",
            "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&h=300&fit=crop",
            [
                ['label' => 'Add Tag', 'icon' => 'fas fa-tag', 'style' => 'success'],
                ['label' => 'Bulk Manager', 'icon' => 'fas fa-tasks', 'style' => 'info'],
                ['label' => 'Tag Analytics', 'icon' => 'fas fa-chart-pie', 'style' => 'warning'],
                ['label' => 'Import Tags', 'icon' => 'fas fa-upload', 'style' => 'secondary']
            ]
        );
        ?>
        
        <!-- Tag Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Tags', '847', 'fas fa-tags', 'primary');
            echo createStatCard('Active Tags', '763', 'fas fa-check-circle', 'success');
            echo createStatCard('Tag Usage', '12,450', 'fas fa-chart-line', 'info');
            echo createStatCard('Popular Tags', '156', 'fas fa-fire', 'warning');
            ?>
        </div>

        <!-- Interactive Tag Cloud -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Popular Tags Cloud</h5>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="refreshTagCloud()">
                                <i class="fas fa-sync me-1"></i>Refresh
                            </button>
                            <button class="btn btn-success" onclick="addNewTag()">
                                <i class="fas fa-plus me-1"></i>Add Tag
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="tagCloud" class="text-center py-4">
                            <span class="badge bg-primary me-2 mb-2 tag-item" data-popularity="156" style="font-size: 1.5rem; cursor: pointer;" onclick="selectTag('high-fashion')">High Fashion</span>
                            <span class="badge bg-success me-2 mb-2 tag-item" data-popularity="142" style="font-size: 1.3rem; cursor: pointer;" onclick="selectTag('runway')">Runway</span>
                            <span class="badge bg-info me-2 mb-2 tag-item" data-popularity="129" style="font-size: 1.2rem; cursor: pointer;" onclick="selectTag('editorial')">Editorial</span>
                            <span class="badge bg-warning me-2 mb-2 tag-item" data-popularity="98" style="font-size: 1.1rem; cursor: pointer;" onclick="selectTag('commercial')">Commercial</span>
                            <span class="badge bg-danger me-2 mb-2 tag-item" data-popularity="87" style="font-size: 1rem; cursor: pointer;" onclick="selectTag('beauty')">Beauty</span>
                            <span class="badge bg-secondary me-2 mb-2 tag-item" data-popularity="76" style="font-size: 0.95rem; cursor: pointer;" onclick="selectTag('lifestyle')">Lifestyle</span>
                            <span class="badge bg-primary me-2 mb-2 tag-item" data-popularity="65" style="font-size: 0.9rem; cursor: pointer;" onclick="selectTag('sports')">Sports</span>
                            <span class="badge bg-success me-2 mb-2 tag-item" data-popularity="54" style="font-size: 0.85rem; cursor: pointer;" onclick="selectTag('fitness')">Fitness</span>
                            <span class="badge bg-info me-2 mb-2 tag-item" data-popularity="43" style="font-size: 0.8rem; cursor: pointer;" onclick="selectTag('lingerie')">Lingerie</span>
                            <span class="badge bg-warning me-2 mb-2 tag-item" data-popularity="38" style="font-size: 0.75rem; cursor: pointer;" onclick="selectTag('plus-size')">Plus Size</span>
                            <span class="badge bg-danger me-2 mb-2 tag-item" data-popularity="32" style="font-size: 0.7rem; cursor: pointer;" onclick="selectTag('mature')">Mature</span>
                            <span class="badge bg-secondary me-2 mb-2 tag-item" data-popularity="29" style="font-size: 0.65rem; cursor: pointer;" onclick="selectTag('petite')">Petite</span>
                            <span class="badge bg-primary me-2 mb-2 tag-item" data-popularity="26" style="font-size: 0.6rem; cursor: pointer;" onclick="selectTag('swimwear')">Swimwear</span>
                            <span class="badge bg-success me-2 mb-2 tag-item" data-popularity="23" style="font-size: 0.55rem; cursor: pointer;" onclick="selectTag('bridal')">Bridal</span>
                            <span class="badge bg-info me-2 mb-2 tag-item" data-popularity="21" style="font-size: 0.5rem; cursor: pointer;" onclick="selectTag('avant-garde')">Avant Garde</span>
                        </div>
                        <div class="text-center mt-3">
                            <small class="text-muted">Click on any tag to see details • Tag size represents popularity</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tag Management Table -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">All Tags</h5>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-secondary" onclick="toggleView('table')" id="tableViewBtn">
                                <i class="fas fa-list"></i> Table
                            </button>
                            <button class="btn btn-outline-secondary active" onclick="toggleView('grid')" id="gridViewBtn">
                                <i class="fas fa-th"></i> Grid
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Search and Filter Bar -->
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                                    <input type="text" class="form-control" id="searchTags" placeholder="Search tags...">
                                </div>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="filterCategory">
                                    <option value="">All Categories</option>
                                    <option value="fashion">Fashion</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="editorial">Editorial</option>
                                    <option value="fitness">Fitness</option>
                                    <option value="beauty">Beauty</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="filterStatus">
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <select class="form-select" id="sortBy">
                                    <option value="popularity">Popularity</option>
                                    <option value="alphabetical">A-Z</option>
                                    <option value="usage">Usage</option>
                                    <option value="recent">Recent</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <button class="btn btn-primary w-100" onclick="applyFilters()">
                                    <i class="fas fa-filter me-1"></i>Filter
                                </button>
                            </div>
                        </div>

                        <!-- Grid View (Default) -->
                        <div id="gridView">
                            <div class="row" id="tagsGrid">
                                <!-- Tag cards will be populated by JavaScript -->
                                <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
                                    <div class="card h-100 tag-card" data-tag="high-fashion">
                                        <div class="card-body text-center">
                                            <span class="badge bg-primary mb-3" style="font-size: 1rem;">High Fashion</span>
                                            <div class="mb-2">
                                                <small class="text-muted">Category: Fashion</small>
                                            </div>
                                            <div class="row text-center mb-3">
                                                <div class="col-6">
                                                    <strong>156</strong><br>
                                                    <small class="text-muted">Uses</small>
                                                </div>
                                                <div class="col-6">
                                                    <strong>95%</strong><br>
                                                    <small class="text-muted">Popular</small>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="viewTagDetails('high-fashion')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-warning" onclick="editTag('high-fashion')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-danger" onclick="deleteTag('high-fashion')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- More tag cards would be generated here -->
                                <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
                                    <div class="card h-100 tag-card" data-tag="runway">
                                        <div class="card-body text-center">
                                            <span class="badge bg-success mb-3" style="font-size: 1rem;">Runway</span>
                                            <div class="mb-2">
                                                <small class="text-muted">Category: Fashion</small>
                                            </div>
                                            <div class="row text-center mb-3">
                                                <div class="col-6">
                                                    <strong>142</strong><br>
                                                    <small class="text-muted">Uses</small>
                                                </div>
                                                <div class="col-6">
                                                    <strong>89%</strong><br>
                                                    <small class="text-muted">Popular</small>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="viewTagDetails('runway')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-warning" onclick="editTag('runway')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-danger" onclick="deleteTag('runway')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
                                    <div class="card h-100 tag-card" data-tag="editorial">
                                        <div class="card-body text-center">
                                            <span class="badge bg-info mb-3" style="font-size: 1rem;">Editorial</span>
                                            <div class="mb-2">
                                                <small class="text-muted">Category: Editorial</small>
                                            </div>
                                            <div class="row text-center mb-3">
                                                <div class="col-6">
                                                    <strong>129</strong><br>
                                                    <small class="text-muted">Uses</small>
                                                </div>
                                                <div class="col-6">
                                                    <strong>83%</strong><br>
                                                    <small class="text-muted">Popular</small>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="viewTagDetails('editorial')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-warning" onclick="editTag('editorial')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-danger" onclick="deleteTag('editorial')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
                                    <div class="card h-100 tag-card" data-tag="commercial">
                                        <div class="card-body text-center">
                                            <span class="badge bg-warning mb-3" style="font-size: 1rem;">Commercial</span>
                                            <div class="mb-2">
                                                <small class="text-muted">Category: Commercial</small>
                                            </div>
                                            <div class="row text-center mb-3">
                                                <div class="col-6">
                                                    <strong>98</strong><br>
                                                    <small class="text-muted">Uses</small>
                                                </div>
                                                <div class="col-6">
                                                    <strong>76%</strong><br>
                                                    <small class="text-muted">Popular</small>
                                                </div>
                                            </div>
                                            <div class="btn-group btn-group-sm w-100">
                                                <button class="btn btn-outline-primary" onclick="viewTagDetails('commercial')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button class="btn btn-outline-warning" onclick="editTag('commercial')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-danger" onclick="deleteTag('commercial')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Table View (Hidden by default) -->
                        <div id="tableView" style="display: none;">
                            <div class="table-responsive">
                                <table class="table table-hover" id="tagsTable">
                                    <thead>
                                        <tr>
                                            <th><input type="checkbox" id="selectAll"></th>
                                            <th>Tag</th>
                                            <th>Category</th>
                                            <th>Usage</th>
                                            <th>Popularity</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><input type="checkbox" value="high-fashion"></td>
                                            <td><span class="badge bg-primary">High Fashion</span></td>
                                            <td>Fashion</td>
                                            <td><strong>156</strong> uses</td>
                                            <td>
                                                <div class="progress" style="height: 20px;">
                                                    <div class="progress-bar bg-primary" style="width: 95%">95%</div>
                                                </div>
                                            </td>
                                            <td><span class="badge bg-success">Active</span></td>
                                            <td>
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-outline-primary" onclick="viewTagDetails('high-fashion')">
                                                        <i class="fas fa-eye"></i>
                                                    </button>
                                                    <button class="btn btn-outline-warning" onclick="editTag('high-fashion')">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn btn-outline-danger" onclick="deleteTag('high-fashion')">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        <!-- More rows would be generated here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Add Tag Modal -->
<div class="modal fade" id="addTagModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Add New Tag</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="addTagForm">
                    <div class="mb-3">
                        <label class="form-label">Tag Name *</label>
                        <input type="text" class="form-control" id="tagName" required placeholder="e.g., High Fashion">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="tagDescription" rows="3" placeholder="Brief description of this tag..."></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-select" id="tagCategory">
                                    <option value="fashion">Fashion</option>
                                    <option value="commercial">Commercial</option>
                                    <option value="editorial">Editorial</option>
                                    <option value="fitness">Fitness</option>
                                    <option value="beauty">Beauty</option>
                                    <option value="lifestyle">Lifestyle</option>
                                    <option value="specialty">Specialty</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Color</label>
                                <select class="form-select" id="tagColor">
                                    <option value="primary">Primary Blue</option>
                                    <option value="success">Success Green</option>
                                    <option value="info">Info Cyan</option>
                                    <option value="warning">Warning Yellow</option>
                                    <option value="danger">Danger Red</option>
                                    <option value="secondary">Secondary Gray</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="tagActive" checked>
                        <label class="form-check-label" for="tagActive">
                            Active (visible to talent and clients)
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-success" onclick="addTag()">Add Tag</button>
            </div>
        </div>
    </div>
</div>

<!-- Tag Details Modal -->
<div class="modal fade" id="tagDetailsModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="tagDetailsTitle">Tag Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">Usage Statistics</h6>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Total Usage:</span>
                                        <strong id="detailTotalUsage">0</strong>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>This Month:</span>
                                        <strong id="detailMonthUsage">0</strong>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Popularity Rank:</span>
                                        <strong id="detailRank">#1</strong>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between">
                                        <span>Category:</span>
                                        <strong id="detailCategory">Fashion</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">Talent Using This Tag</h6>
                                <div id="talentList">
                                    <div class="d-flex align-items-center mb-2">
                                        <img src="https://randomuser.me/api/portraits/women/1.jpg" class="rounded-circle me-2" width="32" height="32">
                                        <span class="small">Sarah Johnson</span>
                                    </div>
                                    <div class="d-flex align-items-center mb-2">
                                        <img src="https://randomuser.me/api/portraits/women/2.jpg" class="rounded-circle me-2" width="32" height="32">
                                        <span class="small">Emma Davis</span>
                                    </div>
                                    <div class="d-flex align-items-center mb-2">
                                        <img src="https://randomuser.me/api/portraits/men/1.jpg" class="rounded-circle me-2" width="32" height="32">
                                        <span class="small">Michael Brown</span>
                                    </div>
                                    <div class="text-center mt-3">
                                        <button class="btn btn-outline-primary btn-sm">
                                            <i class="fas fa-users me-1"></i> View All Talent
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script>
// Tags Management JavaScript
let currentView = 'grid';
let tags = [
    { id: 'high-fashion', name: 'High Fashion', category: 'fashion', usage: 156, popularity: 95, color: 'primary', active: true },
    { id: 'runway', name: 'Runway', category: 'fashion', usage: 142, popularity: 89, color: 'success', active: true },
    { id: 'editorial', name: 'Editorial', category: 'editorial', usage: 129, popularity: 83, color: 'info', active: true },
    { id: 'commercial', name: 'Commercial', category: 'commercial', usage: 98, popularity: 76, color: 'warning', active: true },
    { id: 'beauty', name: 'Beauty', category: 'beauty', usage: 87, popularity: 69, color: 'danger', active: true },
    { id: 'lifestyle', name: 'Lifestyle', category: 'lifestyle', usage: 76, popularity: 62, color: 'secondary', active: true }
];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('ClickDami Tags Management - Fully Interactive Version Loaded');
});

// Tag Cloud Functions
function selectTag(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
        showToast('info', `Selected tag: ${tag.name}`);
        viewTagDetails(tagId);
    }
}

function refreshTagCloud() {
    showToast('success', 'Tag cloud refreshed');
    // Animate the cloud refresh
    const cloud = document.getElementById('tagCloud');
    cloud.style.opacity = '0.5';
    setTimeout(() => {
        cloud.style.opacity = '1';
    }, 500);
}

// View Toggle Functions
function toggleView(view) {
    currentView = view;
    const tableView = document.getElementById('tableView');
    const gridView = document.getElementById('gridView');
    const tableBtn = document.getElementById('tableViewBtn');
    const gridBtn = document.getElementById('gridViewBtn');
    
    if (view === 'table') {
        tableView.style.display = 'block';
        gridView.style.display = 'none';
        tableBtn.classList.add('active');
        gridBtn.classList.remove('active');
    } else {
        tableView.style.display = 'none';
        gridView.style.display = 'block';
        gridBtn.classList.add('active');
        tableBtn.classList.remove('active');
    }
    
    showToast('info', `Switched to ${view} view`);
}

// Tag Management Functions
function addNewTag() {
    const modal = new bootstrap.Modal(document.getElementById('addTagModal'));
    modal.show();
}

function addTag() {
    const name = document.getElementById('tagName').value;
    const description = document.getElementById('tagDescription').value;
    const category = document.getElementById('tagCategory').value;
    const color = document.getElementById('tagColor').value;
    const active = document.getElementById('tagActive').checked;
    
    if (!name.trim()) {
        showToast('error', 'Tag name is required');
        return;
    }
    
    const tagId = name.toLowerCase().replace(/\s+/g, '-');
    
    if (tags.find(t => t.id === tagId)) {
        showToast('error', 'A tag with this name already exists');
        return;
    }
    
    // Add new tag
    tags.push({
        id: tagId,
        name: name,
        category: category,
        usage: 0,
        popularity: 0,
        color: color,
        active: active
    });
    
    // Close modal and reset form
    bootstrap.Modal.getInstance(document.getElementById('addTagModal')).hide();
    document.getElementById('addTagForm').reset();
    document.getElementById('tagActive').checked = true;
    
    showToast('success', `Tag "${name}" created successfully!`);
    
    // Refresh displays
    refreshTagCloud();
}

function viewTagDetails(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    
    document.getElementById('tagDetailsTitle').textContent = `${tag.name} - Details`;
    document.getElementById('detailTotalUsage').textContent = tag.usage;
    document.getElementById('detailMonthUsage').textContent = Math.floor(tag.usage * 0.3);
    document.getElementById('detailRank').textContent = '#' + (tags.findIndex(t => t.id === tagId) + 1);
    document.getElementById('detailCategory').textContent = tag.category.charAt(0).toUpperCase() + tag.category.slice(1);
    
    const modal = new bootstrap.Modal(document.getElementById('tagDetailsModal'));
    modal.show();
    
    showToast('success', `Loading ${tag.name} details...`);
}

function editTag(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    
    showToast('info', `Edit mode for tag: ${tag.name}`);
    
    // In a real implementation, this would open an edit modal
    // For now, just simulate the action
    setTimeout(() => {
        showToast('success', `Tag "${tag.name}" updated successfully!`);
    }, 1000);
}

function deleteTag(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    
    if (confirm(`Are you sure you want to delete "${tag.name}"? This action cannot be undone.`)) {
        // Remove from array
        tags = tags.filter(t => t.id !== tagId);
        
        // Remove from DOM
        const tagCard = document.querySelector(`[data-tag="${tagId}"]`);
        if (tagCard) {
            tagCard.style.transition = 'all 0.3s ease';
            tagCard.style.opacity = '0';
            tagCard.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                tagCard.remove();
                showToast('success', `Tag "${tag.name}" deleted successfully!`);
            }, 300);
        }
        
        // Refresh tag cloud
        refreshTagCloud();
    }
}

// Filter Functions
function applyFilters() {
    const search = document.getElementById('searchTags').value.toLowerCase();
    const category = document.getElementById('filterCategory').value;
    const status = document.getElementById('filterStatus').value;
    const sortBy = document.getElementById('sortBy').value;
    
    let filteredTags = [...tags];
    
    // Apply filters
    if (search) {
        filteredTags = filteredTags.filter(tag => 
            tag.name.toLowerCase().includes(search)
        );
    }
    
    if (category) {
        filteredTags = filteredTags.filter(tag => tag.category === category);
    }
    
    if (status) {
        filteredTags = filteredTags.filter(tag => 
            status === 'active' ? tag.active : !tag.active
        );
    }
    
    // Apply sorting
    switch(sortBy) {
        case 'alphabetical':
            filteredTags.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'usage':
            filteredTags.sort((a, b) => b.usage - a.usage);
            break;
        case 'recent':
            // In real implementation, this would sort by creation date
            break;
        default: // popularity
            filteredTags.sort((a, b) => b.popularity - a.popularity);
    }
    
    showToast('success', `Filtered to ${filteredTags.length} tags`);
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
    
    toastContainer.innerHTML = toastHtml;
    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
</script>

<style>
.tag-item {
    transition: transform 0.2s ease;
}

.tag-item:hover {
    transform: scale(1.1);
}

.tag-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
}

.tag-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

#tagCloud {
    min-height: 150px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
}

.badge {
    transition: all 0.2s ease;
}

.badge:hover {
    opacity: 0.8;
}
</style>

<?php echo renderFooter(); ?>