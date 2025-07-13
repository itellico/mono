<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Tag Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'tags/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Tag Management']
        ]);
        
        echo createHeroSection(
            "Tag Management",
            "Manage global tags and labeling system for enhanced content discovery across all marketplaces",
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=300&fit=crop",
            [
                ['label' => 'Create Tag', 'icon' => 'fas fa-plus', 'style' => 'primary'],
                ['label' => 'Import Tags', 'icon' => 'fas fa-upload', 'style' => 'light'],
                ['label' => 'Tag Analytics', 'icon' => 'fas fa-chart-bar', 'style' => 'info']
            ]
        );
        ?>
        
        <!-- Tag Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Tags', '324', 'fas fa-tags', 'primary');
            echo createStatCard('Active Tags', '289', 'fas fa-check-circle', 'success');
            echo createStatCard('Usage Frequency', '92%', 'fas fa-chart-line', 'info');
            echo createStatCard('Most Used Tag', 'Professional', 'fas fa-star', 'warning');
            ?>
        </div>
        
        <div class="row mb-4">
            <!-- Tag Cloud & Management -->
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Tag Cloud & Search</h5>
                        <div class="btn-group">
                            <button class="btn btn-outline-secondary btn-sm" onclick="showAllTags()">
                                <i class="fas fa-eye me-1"></i> Show All
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="showPopularTags()">
                                <i class="fas fa-fire me-1"></i> Popular Only
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Search Tags -->
                        <div class="mb-4">
                            <div class="input-group">
                                <input type="text" class="form-control" placeholder="Search tags..." id="tagSearch">
                                <button class="btn btn-outline-secondary" type="button">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Tag Cloud -->
                        <div class="tag-cloud mb-4">
                            <span class="badge bg-primary me-2 mb-2" style="font-size: 1.2rem; cursor: pointer;" onclick="editTag('professional')">
                                Professional <span class="text-light">(456)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-success me-2 mb-2" style="font-size: 1.1rem; cursor: pointer;" onclick="editTag('fashion')">
                                Fashion <span class="text-light">(398)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-info me-2 mb-2" style="font-size: 1.0rem; cursor: pointer;" onclick="editTag('modeling')">
                                Modeling <span class="text-light">(367)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-warning me-2 mb-2" style="font-size: 0.95rem; cursor: pointer;" onclick="editTag('fitness')">
                                Fitness <span class="text-dark">(289)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-danger me-2 mb-2" style="font-size: 0.9rem; cursor: pointer;" onclick="editTag('commercial')">
                                Commercial <span class="text-light">(234)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-secondary me-2 mb-2" style="font-size: 0.85rem; cursor: pointer;" onclick="editTag('editorial')">
                                Editorial <span class="text-light">(198)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-dark me-2 mb-2" style="font-size: 0.8rem; cursor: pointer;" onclick="editTag('runway')">
                                Runway <span class="text-light">(167)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-primary me-2 mb-2" style="font-size: 0.75rem; cursor: pointer;" onclick="editTag('photography')">
                                Photography <span class="text-light">(145)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-success me-2 mb-2" style="font-size: 0.7rem; cursor: pointer;" onclick="editTag('voice')">
                                Voice <span class="text-light">(123)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-info me-2 mb-2" style="font-size: 0.65rem; cursor: pointer;" onclick="editTag('talent')">
                                Talent <span class="text-light">(98)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-warning me-2 mb-2" style="font-size: 0.6rem; cursor: pointer;" onclick="editTag('sports')">
                                Sports <span class="text-dark">(87)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-danger me-2 mb-2" style="font-size: 0.55rem; cursor: pointer;" onclick="editTag('swim')">
                                Swimwear <span class="text-light">(76)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-secondary me-2 mb-2" style="font-size: 0.5rem; cursor: pointer;" onclick="editTag('plus-size')">
                                Plus Size <span class="text-light">(65)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-dark me-2 mb-2" style="font-size: 0.45rem; cursor: pointer;" onclick="editTag('kids')">
                                Kids <span class="text-light">(54)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                            <span class="badge bg-primary me-2 mb-2" style="font-size: 0.4rem; cursor: pointer;" onclick="editTag('mature')">
                                Mature <span class="text-light">(43)</span>
                                <i class="fas fa-edit ms-1 small"></i>
                            </span>
                        </div>
                        
                        <!-- Tag Categories -->
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">Popular by Category</h6>
                                <div class="mb-3">
                                    <strong class="d-block small">Fashion Modeling</strong>
                                    <div class="mt-1">
                                        <span class="badge bg-light text-dark me-1 mb-1">High Fashion</span>
                                        <span class="badge bg-light text-dark me-1 mb-1">Commercial</span>
                                        <span class="badge bg-light text-dark me-1 mb-1">Editorial</span>
                                        <span class="badge bg-light text-dark me-1 mb-1">Runway</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <strong class="d-block small">Photography</strong>
                                    <div class="mt-1">
                                        <span class="badge bg-light text-dark me-1 mb-1">Portrait</span>
                                        <span class="badge bg-light text-dark me-1 mb-1">Lifestyle</span>
                                        <span class="badge bg-light text-dark me-1 mb-1">Product</span>
                                        <span class="badge bg-light text-dark me-1 mb-1">Wedding</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="fw-bold mb-3">Trending Tags</h6>
                                <div class="mb-3">
                                    <strong class="d-block small">This Week</strong>
                                    <div class="mt-1">
                                        <span class="badge bg-success me-1 mb-1">Sustainable Fashion</span>
                                        <span class="badge bg-success me-1 mb-1">AI Generated</span>
                                        <span class="badge bg-success me-1 mb-1">Virtual Modeling</span>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <strong class="d-block small">Emerging</strong>
                                    <div class="mt-1">
                                        <span class="badge bg-warning me-1 mb-1">NFT Ready</span>
                                        <span class="badge bg-warning me-1 mb-1">Metaverse</span>
                                        <span class="badge bg-warning me-1 mb-1">3D Modeling</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tag Actions & Analytics -->
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Tag Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2 mb-3">
                            <button class="btn btn-primary" onclick="createNewTag()">
                                <i class="fas fa-plus me-2"></i> Create New Tag
                            </button>
                            <button class="btn btn-outline-secondary" onclick="mergeTags()">
                                <i class="fas fa-compress me-2"></i> Merge Duplicate Tags
                            </button>
                            <button class="btn btn-outline-info" onclick="exportTags()">
                                <i class="fas fa-download me-2"></i> Export Tag Data
                            </button>
                            <button class="btn btn-outline-warning" onclick="cleanupTags()">
                                <i class="fas fa-broom me-2"></i> Cleanup Unused Tags
                            </button>
                        </div>
                        
                        <hr>
                        
                        <h6>Tag Usage Analytics</h6>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Most Active Hour</small>
                                <small class="fw-bold">2-3 PM UTC</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-primary" style="width: 85%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Peak Usage Day</small>
                                <small class="fw-bold">Monday</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-success" style="width: 72%"></div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <small>Average Tags per Profile</small>
                                <small class="fw-bold">8.3 tags</small>
                            </div>
                            <div class="progress mb-2" style="height: 4px;">
                                <div class="progress-bar bg-info" style="width: 68%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h5 class="mb-0">Recent Tag Activity</h5>
                    </div>
                    <div class="card-body">
                        <div class="timeline">
                            <div class="d-flex mb-3">
                                <div class="bg-success rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">New Tag: "Sustainable Fashion"</small><br>
                                    <small class="text-muted">Created by Admin User</small><br>
                                    <small class="text-muted">1 hour ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-info rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Merged "Athletic" → "Sports"</small><br>
                                    <small class="text-muted">67 profiles updated</small><br>
                                    <small class="text-muted">3 hours ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-warning rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Cleanup: 12 unused tags removed</small><br>
                                    <small class="text-muted">Automated cleanup</small><br>
                                    <small class="text-muted">1 day ago</small>
                                </div>
                            </div>
                            <div class="d-flex mb-3">
                                <div class="bg-primary rounded-circle me-3" style="width: 8px; height: 8px; margin-top: 6px;"></div>
                                <div class="flex-grow-1">
                                    <small class="fw-bold">Bulk Import: 45 new tags</small><br>
                                    <small class="text-muted">From industry standards</small><br>
                                    <small class="text-muted">2 days ago</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tag Management Table -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">All Tags Management</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Tag Name</th>
                                <th>Usage Count</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span class="badge bg-primary">Professional</span>
                                </td>
                                <td><strong>456</strong> profiles</td>
                                <td>General</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>6 months ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTag('professional')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewTagUsage('professional')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deleteTag('professional')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span class="badge bg-success">Fashion</span>
                                </td>
                                <td><strong>398</strong> profiles</td>
                                <td>Industry</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>8 months ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTag('fashion')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewTagUsage('fashion')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deleteTag('fashion')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span class="badge bg-info">Modeling</span>
                                </td>
                                <td><strong>367</strong> profiles</td>
                                <td>Industry</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>1 year ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTag('modeling')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewTagUsage('modeling')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deleteTag('modeling')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span class="badge bg-warning">Fitness</span>
                                </td>
                                <td><strong>289</strong> profiles</td>
                                <td>Industry</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>5 months ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTag('fitness')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewTagUsage('fitness')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deleteTag('fitness')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span class="badge bg-danger">Commercial</span>
                                </td>
                                <td><strong>234</strong> profiles</td>
                                <td>Type</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>7 months ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTag('commercial')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewTagUsage('commercial')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deleteTag('commercial')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span class="badge bg-secondary">Unused Tag</span>
                                </td>
                                <td><strong>0</strong> profiles</td>
                                <td>General</td>
                                <td><span class="badge bg-warning">Inactive</span></td>
                                <td>3 months ago</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTag('unused')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="viewTagUsage('unused')">
                                            <i class="fas fa-chart-bar"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deleteTag('unused')">
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
    </div>
</div>

<!-- Tag Management Modals -->
<div class="modal fade" id="createTagModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create New Tag</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="createTagForm">
                    <div class="mb-3">
                        <label class="form-label">Tag Name</label>
                        <input type="text" class="form-control" placeholder="e.g., Professional Model">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Category</label>
                        <select class="form-select">
                            <option value="general">General</option>
                            <option value="industry">Industry</option>
                            <option value="type">Type</option>
                            <option value="skill">Skill</option>
                            <option value="specialty">Specialty</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" rows="3" placeholder="Tag description and usage guidelines..."></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Color Theme</label>
                        <div class="d-flex gap-2">
                            <span class="badge bg-primary p-2" style="cursor: pointer;" onclick="selectColor('primary')">Primary</span>
                            <span class="badge bg-success p-2" style="cursor: pointer;" onclick="selectColor('success')">Success</span>
                            <span class="badge bg-info p-2" style="cursor: pointer;" onclick="selectColor('info')">Info</span>
                            <span class="badge bg-warning p-2" style="cursor: pointer;" onclick="selectColor('warning')">Warning</span>
                            <span class="badge bg-danger p-2" style="cursor: pointer;" onclick="selectColor('danger')">Danger</span>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">Create Tag</button>
            </div>
        </div>
    </div>
</div>

<script>
function createNewTag() {
    new bootstrap.Modal(document.getElementById('createTagModal')).show();
}

function editTag(tagId) {
    alert('Edit tag: ' + tagId + '\n\nThis would open a detailed edit form with tag settings, color themes, and usage analytics.');
}

function viewTagUsage(tagId) {
    alert('View usage analytics for: ' + tagId + '\n\nThis would show detailed analytics including:\n- Usage trends over time\n- Most common combinations\n- User demographics\n- Performance metrics');
}

function deleteTag(tagId) {
    if (confirm('Are you sure you want to delete this tag?\n\nThis action cannot be undone and will remove the tag from all profiles.')) {
        alert('Tag "' + tagId + '" would be deleted and removed from all profiles.');
    }
}

function mergeTags() {
    alert('Merge Duplicate Tags\n\nThis would open a tool to:\n- Identify similar tags\n- Merge duplicates\n- Update all affected profiles\n- Maintain tag history');
}

function exportTags() {
    alert('Export Tag Data\n\nThis would generate and download:\n- Complete tag list with usage stats\n- Tag relationships and categories\n- Usage analytics report\n- CSV format for external tools');
}

function cleanupTags() {
    if (confirm('Clean up unused tags?\n\nThis will remove all tags with 0 usage. This action cannot be undone.')) {
        alert('Cleanup completed:\n- 12 unused tags removed\n- Tag database optimized\n- Cache cleared');
    }
}

function selectColor(color) {
    document.querySelectorAll('.badge').forEach(badge => {
        badge.style.border = '2px solid transparent';
    });
    event.target.style.border = '2px solid #000';
}

function showAllTags() {
    alert('Show All Tags\n\nDisplaying complete tag cloud with all 324 tags.');
}

function showPopularTags() {
    alert('Show Popular Tags Only\n\nDisplaying only tags with 50+ usage count.');
}

// Tag search functionality
document.getElementById('tagSearch').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    // In a real implementation, this would filter the tag cloud and table
    console.log('Searching for tags containing:', searchTerm);
});
</script>

<?php echo renderFooter(); ?>