<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

$titles = [
    'portfolio' => 'Portfolio Management - User Dashboard',
    'applications' => 'My Applications - User Dashboard', 
    'messages' => 'Messages - User Dashboard',
    'calendar' => 'Calendar - User Dashboard',
    'settings' => 'Settings - User Dashboard'
];

$pageNames = [
    'portfolio' => 'Portfolio Management',
    'applications' => 'My Applications',
    'messages' => 'Messages', 
    'calendar' => 'Calendar',
    'settings' => 'Settings'
];

$currentDir = basename(__DIR__);
echo renderHeader($titles[$currentDir], "Emma Johnson", "Fashion Model", "User");
?>

<style>
.portfolio-hero { 
    background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
    color: white;
    padding: 2rem 0;
    margin: -20px -20px 30px -20px;
}
.portfolio-item {
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}
.portfolio-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.portfolio-item img {
    transition: transform 0.3s ease;
}
.portfolio-item:hover img {
    transform: scale(1.05);
}
.portfolio-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}
.portfolio-item:hover .portfolio-overlay {
    opacity: 1;
}
.upload-zone {
    border: 2px dashed #dee2e6;
    border-radius: 10px;
    padding: 3rem;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;
}
.upload-zone:hover {
    border-color: #007bff;
    background: #f8f9fa;
}
.upload-zone.dragover {
    border-color: #28a745;
    background: #e8f5e9;
}
.stat-card {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}
.stat-card:hover {
    transform: translateY(-3px);
}
.category-filter {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 25px;
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    cursor: pointer;
    transition: all 0.3s ease;
}
.category-filter:hover,
.category-filter.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
}
.portfolio-modal .modal-content {
    border: none;
    border-radius: 15px;
}
.progress-ring {
    transform: rotate(-90deg);
}
.progress-ring-circle {
    transition: stroke-dashoffset 0.35s;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
}
</style>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), 'portfolio/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Dashboard', 'href' => '../index.php'],
            ['label' => 'Portfolio Management']
        ]);
        ?>
        
        <!-- Portfolio Hero Section -->
        <div class="portfolio-hero">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h1 class="fw-bold mb-2">Portfolio Management</h1>
                        <p class="fs-5 mb-3">Manage your professional portfolio and showcase your work</p>
                        <div class="row">
                            <div class="col-md-3">
                                <div class="stat-card text-center">
                                    <h3 class="fw-bold text-primary mb-1" id="totalPhotos">47</h3>
                                    <small class="text-muted">Total Photos</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-card text-center">
                                    <h3 class="fw-bold text-success mb-1" id="totalViews">12.4K</h3>
                                    <small class="text-muted">Total Views</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-card text-center">
                                    <h3 class="fw-bold text-warning mb-1" id="avgRating">4.8</h3>
                                    <small class="text-muted">Avg Rating</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-card text-center">
                                    <h3 class="fw-bold text-info mb-1" id="activeCategories">6</h3>
                                    <small class="text-muted">Categories</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-light btn-lg me-2" onclick="showUploadModal()">
                            <i class="fas fa-cloud-upload-alt me-2"></i>Upload Photos
                        </button>
                        <button class="btn btn-outline-light btn-lg" onclick="showAnalyticsModal()">
                            <i class="fas fa-chart-line me-2"></i>Analytics
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Portfolio Controls -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h5 class="mb-0">My Portfolio</h5>
                        <small class="text-muted">Organize and manage your professional photos</small>
                    </div>
                    <div class="col-md-6 text-end">
                        <div class="input-group" style="max-width: 300px; margin-left: auto;">
                            <input type="text" class="form-control" placeholder="Search photos..." id="portfolioSearch">
                            <button class="btn btn-outline-secondary" type="button">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="mt-3">
                    <div class="d-flex flex-wrap">
                        <span class="category-filter active" data-category="all">All</span>
                        <span class="category-filter" data-category="fashion">Fashion</span>
                        <span class="category-filter" data-category="editorial">Editorial</span>
                        <span class="category-filter" data-category="commercial">Commercial</span>
                        <span class="category-filter" data-category="runway">Runway</span>
                        <span class="category-filter" data-category="beauty">Beauty</span>
                        <span class="category-filter" data-category="lifestyle">Lifestyle</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Portfolio Grid -->
        <div class="row" id="portfolioGrid">
            <!-- Fashion Category -->
            <div class="col-md-4 mb-4 portfolio-item" data-category="fashion" data-views="892" data-rating="4.9">
                <div class="card border-0 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop" class="card-img-top" alt="Fashion Shoot 1">
                    <div class="portfolio-overlay">
                        <div class="text-center">
                            <h5>Fashion Editorial</h5>
                            <p><i class="fas fa-eye me-2"></i>892 views</p>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-light" onclick="viewPhoto(1)">View</button>
                                <button class="btn btn-sm btn-primary" onclick="editPhoto(1)">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deletePhoto(1)">Delete</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <h6 class="card-title">Vogue Style Editorial</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Fashion</small>
                            <div>
                                <i class="fas fa-star text-warning"></i>
                                <span class="small">4.9</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4 mb-4 portfolio-item" data-category="editorial" data-views="1205" data-rating="4.7">
                <div class="card border-0 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop" class="card-img-top" alt="Editorial Shoot">
                    <div class="portfolio-overlay">
                        <div class="text-center">
                            <h5>Editorial Portrait</h5>
                            <p><i class="fas fa-eye me-2"></i>1,205 views</p>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-light" onclick="viewPhoto(2)">View</button>
                                <button class="btn btn-sm btn-primary" onclick="editPhoto(2)">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deletePhoto(2)">Delete</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <h6 class="card-title">Magazine Cover Story</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Editorial</small>
                            <div>
                                <i class="fas fa-star text-warning"></i>
                                <span class="small">4.7</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4 mb-4 portfolio-item" data-category="commercial" data-views="756" data-rating="4.8">
                <div class="card border-0 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop" class="card-img-top" alt="Commercial Shoot">
                    <div class="portfolio-overlay">
                        <div class="text-center">
                            <h5>Commercial Campaign</h5>
                            <p><i class="fas fa-eye me-2"></i>756 views</p>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-light" onclick="viewPhoto(3)">View</button>
                                <button class="btn btn-sm btn-primary" onclick="editPhoto(3)">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deletePhoto(3)">Delete</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <h6 class="card-title">Luxury Brand Campaign</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Commercial</small>
                            <div>
                                <i class="fas fa-star text-warning"></i>
                                <span class="small">4.8</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4 mb-4 portfolio-item" data-category="runway" data-views="543" data-rating="4.6">
                <div class="card border-0 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop" class="card-img-top" alt="Runway Show">
                    <div class="portfolio-overlay">
                        <div class="text-center">
                            <h5>Runway Collection</h5>
                            <p><i class="fas fa-eye me-2"></i>543 views</p>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-light" onclick="viewPhoto(4)">View</button>
                                <button class="btn btn-sm btn-primary" onclick="editPhoto(4)">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deletePhoto(4)">Delete</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <h6 class="card-title">Paris Fashion Week</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Runway</small>
                            <div>
                                <i class="fas fa-star text-warning"></i>
                                <span class="small">4.6</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4 mb-4 portfolio-item" data-category="beauty" data-views="934" data-rating="4.9">
                <div class="card border-0 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1506629905607-c2b01beaa85f?w=400&h=500&fit=crop" class="card-img-top" alt="Beauty Shot">
                    <div class="portfolio-overlay">
                        <div class="text-center">
                            <h5>Beauty Editorial</h5>
                            <p><i class="fas fa-eye me-2"></i>934 views</p>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-light" onclick="viewPhoto(5)">View</button>
                                <button class="btn btn-sm btn-primary" onclick="editPhoto(5)">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deletePhoto(5)">Delete</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <h6 class="card-title">Cosmetics Campaign</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Beauty</small>
                            <div>
                                <i class="fas fa-star text-warning"></i>
                                <span class="small">4.9</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4 mb-4 portfolio-item" data-category="lifestyle" data-views="687" data-rating="4.5">
                <div class="card border-0 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=500&fit=crop" class="card-img-top" alt="Lifestyle Shot">
                    <div class="portfolio-overlay">
                        <div class="text-center">
                            <h5>Lifestyle Shoot</h5>
                            <p><i class="fas fa-eye me-2"></i>687 views</p>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-light" onclick="viewPhoto(6)">View</button>
                                <button class="btn btn-sm btn-primary" onclick="editPhoto(6)">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deletePhoto(6)">Delete</button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <h6 class="card-title">Summer Collection</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">Lifestyle</small>
                            <div>
                                <i class="fas fa-star text-warning"></i>
                                <span class="small">4.5</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Load More Button -->
        <div class="text-center mt-4 mb-4">
            <button class="btn btn-outline-primary btn-lg" onclick="loadMorePhotos()">
                <i class="fas fa-plus me-2"></i>Load More Photos
            </button>
        </div>
    </div>
</div>

<!-- Upload Modal -->
<div class="modal fade" id="uploadModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Upload New Photos</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="upload-zone" id="uploadZone">
                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                    <h5>Drag & Drop Photos Here</h5>
                    <p class="text-muted">or click to browse files</p>
                    <input type="file" id="fileInput" multiple accept="image/*" style="display: none;">
                    <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                        Choose Files
                    </button>
                </div>
                <div id="uploadPreview" class="mt-4" style="display: none;">
                    <h6>Selected Files:</h6>
                    <div id="previewContainer"></div>
                </div>
                <div class="mt-4">
                    <label class="form-label">Category</label>
                    <select class="form-select" id="uploadCategory">
                        <option value="fashion">Fashion</option>
                        <option value="editorial">Editorial</option>
                        <option value="commercial">Commercial</option>
                        <option value="runway">Runway</option>
                        <option value="beauty">Beauty</option>
                        <option value="lifestyle">Lifestyle</option>
                    </select>
                </div>
                <div class="mt-3">
                    <label class="form-label">Description</label>
                    <textarea class="form-control" id="uploadDescription" rows="3" placeholder="Add a description for these photos..."></textarea>
                </div>
                <div class="mt-3">
                    <label class="form-label">Tags</label>
                    <input type="text" class="form-control" id="uploadTags" placeholder="fashion, editorial, model, photoshoot">
                    <small class="text-muted">Separate tags with commas</small>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="uploadPhotos()">
                    <i class="fas fa-upload me-2"></i>Upload Photos
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Photo View Modal -->
<div class="modal fade" id="photoModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="photoModalTitle">Photo Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-8">
                        <img id="photoModalImage" src="" class="img-fluid rounded" alt="Photo">
                    </div>
                    <div class="col-md-4">
                        <h6>Photo Information</h6>
                        <ul class="list-unstyled">
                            <li><strong>Category:</strong> <span id="photoCategory"></span></li>
                            <li><strong>Views:</strong> <span id="photoViews"></span></li>
                            <li><strong>Rating:</strong> <span id="photoRating"></span></li>
                            <li><strong>Uploaded:</strong> <span id="photoDate"></span></li>
                        </ul>
                        
                        <h6 class="mt-4">Description</h6>
                        <p id="photoDescription" class="text-muted">Professional fashion editorial capturing the essence of modern elegance and style.</p>
                        
                        <h6 class="mt-4">Tags</h6>
                        <div id="photoTags">
                            <span class="badge bg-light text-dark me-1">fashion</span>
                            <span class="badge bg-light text-dark me-1">editorial</span>
                            <span class="badge bg-light text-dark me-1">model</span>
                        </div>
                        
                        <h6 class="mt-4">Actions</h6>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" onclick="sharePhoto()">
                                <i class="fas fa-share me-2"></i>Share Photo
                            </button>
                            <button class="btn btn-outline-secondary" onclick="downloadPhoto()">
                                <i class="fas fa-download me-2"></i>Download
                            </button>
                            <button class="btn btn-outline-warning" onclick="editPhotoDetails()">
                                <i class="fas fa-edit me-2"></i>Edit Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Analytics Modal -->
<div class="modal fade" id="analyticsModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Portfolio Analytics</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="stat-card text-center">
                            <h4 class="text-primary">47</h4>
                            <small>Total Photos</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card text-center">
                            <h4 class="text-success">12.4K</h4>
                            <small>Total Views</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card text-center">
                            <h4 class="text-warning">4.8</h4>
                            <small>Avg Rating</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card text-center">
                            <h4 class="text-info">89%</h4>
                            <small>Engagement</small>
                        </div>
                    </div>
                </div>
                
                <h6>Category Performance</h6>
                <div class="progress mb-2">
                    <div class="progress-bar bg-primary" style="width: 35%">Fashion (35%)</div>
                </div>
                <div class="progress mb-2">
                    <div class="progress-bar bg-success" style="width: 25%">Editorial (25%)</div>
                </div>
                <div class="progress mb-2">
                    <div class="progress-bar bg-warning" style="width: 20%">Beauty (20%)</div>
                </div>
                <div class="progress mb-2">
                    <div class="progress-bar bg-info" style="width: 15%">Commercial (15%)</div>
                </div>
                <div class="progress mb-4">
                    <div class="progress-bar bg-secondary" style="width: 5%">Other (5%)</div>
                </div>
                
                <h6>Recent Activity</h6>
                <div class="list-group">
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">New photo uploaded</h6>
                            <small>2 hours ago</small>
                        </div>
                        <p class="mb-1">Beauty editorial - Cosmetics Campaign</p>
                    </div>
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">Photo reached 1K views</h6>
                            <small class="text-muted">1 day ago</small>
                        </div>
                        <p class="mb-1">Fashion Editorial - Vogue Style</p>
                    </div>
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">New 5-star rating</h6>
                            <small class="text-muted">2 days ago</small>
                        </div>
                        <p class="mb-1">Commercial Campaign - Luxury Brand</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Portfolio functionality
document.addEventListener('DOMContentLoaded', function() {
    initializePortfolio();
});

function initializePortfolio() {
    // Category filtering
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            document.querySelectorAll('.category-filter').forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            filterPortfolio(category);
        });
    });

    // Search functionality
    document.getElementById('portfolioSearch').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterPortfolioBySearch(searchTerm);
    });

    // Upload zone functionality
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
}

function filterPortfolio(category) {
    const items = document.querySelectorAll('.portfolio-item');
    
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 50);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });

    // Update stats
    updatePortfolioStats(category);
}

function filterPortfolioBySearch(searchTerm) {
    const items = document.querySelectorAll('.portfolio-item');
    
    items.forEach(item => {
        const title = item.querySelector('.card-title').textContent.toLowerCase();
        const category = item.dataset.category.toLowerCase();
        
        if (title.includes(searchTerm) || category.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function updatePortfolioStats(category) {
    const items = document.querySelectorAll('.portfolio-item');
    let totalPhotos = 0;
    let totalViews = 0;
    let totalRating = 0;
    
    items.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            totalPhotos++;
            totalViews += parseInt(item.dataset.views);
            totalRating += parseFloat(item.dataset.rating);
        }
    });

    const avgRating = totalPhotos > 0 ? (totalRating / totalPhotos).toFixed(1) : 0;
    
    document.getElementById('totalPhotos').textContent = totalPhotos;
    document.getElementById('totalViews').textContent = formatNumber(totalViews);
    document.getElementById('avgRating').textContent = avgRating;
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function showUploadModal() {
    const modal = new bootstrap.Modal(document.getElementById('uploadModal'));
    modal.show();
}

function showAnalyticsModal() {
    const modal = new bootstrap.Modal(document.getElementById('analyticsModal'));
    modal.show();
}

function viewPhoto(photoId) {
    const modal = new bootstrap.Modal(document.getElementById('photoModal'));
    
    // Sample photo data (in real app, this would come from API)
    const photoData = {
        1: {
            title: 'Vogue Style Editorial',
            image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop',
            category: 'Fashion',
            views: 892,
            rating: 4.9,
            date: '2024-01-15'
        },
        2: {
            title: 'Magazine Cover Story',
            image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop',
            category: 'Editorial',
            views: 1205,
            rating: 4.7,
            date: '2024-01-10'
        },
        3: {
            title: 'Luxury Brand Campaign',
            image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=600&fit=crop',
            category: 'Commercial',
            views: 756,
            rating: 4.8,
            date: '2024-01-08'
        }
        // Add more as needed
    };

    const photo = photoData[photoId] || photoData[1];
    
    document.getElementById('photoModalTitle').textContent = photo.title;
    document.getElementById('photoModalImage').src = photo.image;
    document.getElementById('photoCategory').textContent = photo.category;
    document.getElementById('photoViews').textContent = photo.views.toLocaleString();
    document.getElementById('photoRating').textContent = photo.rating + ' ⭐';
    document.getElementById('photoDate').textContent = new Date(photo.date).toLocaleDateString();
    
    modal.show();
}

function editPhoto(photoId) {
    alert('Edit photo functionality would open detailed editing interface');
}

function deletePhoto(photoId) {
    if (confirm('Are you sure you want to delete this photo?')) {
        // In real app, would make API call
        alert('Photo deleted successfully!');
        // Remove from DOM
        const photoElement = document.querySelector(`[onclick="viewPhoto(${photoId})"]`).closest('.portfolio-item');
        photoElement.remove();
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    processFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    processFiles(files);
}

function processFiles(files) {
    const previewContainer = document.getElementById('previewContainer');
    const uploadPreview = document.getElementById('uploadPreview');
    
    previewContainer.innerHTML = '';
    
    if (files.length > 0) {
        uploadPreview.style.display = 'block';
        
        Array.from(files).forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.createElement('div');
                    preview.className = 'border rounded p-2 mb-2 d-flex align-items-center';
                    preview.innerHTML = `
                        <img src="${e.target.result}" style="width: 50px; height: 50px; object-fit: cover;" class="rounded me-3">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${file.name}</h6>
                            <small class="text-muted">${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                        </div>
                        <button class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    previewContainer.appendChild(preview);
                };
                reader.readAsDataURL(file);
            }
        });
    } else {
        uploadPreview.style.display = 'none';
    }
}

function uploadPhotos() {
    const files = document.getElementById('fileInput').files;
    const category = document.getElementById('uploadCategory').value;
    const description = document.getElementById('uploadDescription').value;
    const tags = document.getElementById('uploadTags').value;
    
    if (files.length === 0) {
        alert('Please select at least one photo to upload.');
        return;
    }
    
    // Simulate upload process
    const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
    modal.hide();
    
    // Show success message
    showToast('Photos uploaded successfully!', 'success');
    
    // Reset form
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadDescription').value = '';
    document.getElementById('uploadTags').value = '';
    document.getElementById('uploadPreview').style.display = 'none';
}

function loadMorePhotos() {
    // Simulate loading more photos
    showToast('Loading more photos...', 'info');
    
    setTimeout(() => {
        showToast('No more photos to load', 'warning');
    }, 1000);
}

function sharePhoto() {
    // Simulate sharing
    showToast('Photo link copied to clipboard!', 'success');
}

function downloadPhoto() {
    // Simulate download
    showToast('Photo download started', 'info');
}

function editPhotoDetails() {
    // Simulate edit mode
    showToast('Edit mode activated', 'info');
}

function showToast(message, type = 'info') {
    // Create and show toast notification
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

// Initialize with all photos on page load
updatePortfolioStats('all');
</script>

<?php echo renderFooter(); ?>