<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("My Media Library - User Dashboard", "John Doe", "Talent", "User");
?>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), 'media/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'User', 'href' => '../index.php'],
            ['label' => 'My Media Library']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">My Media Library</h2>
                <p class="text-muted mb-0">Manage your personal photos, portfolio, and documents</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="accessSharedMedia()">
                    <i class="fas fa-share-alt me-2"></i> Shared Media
                </button>
                <button class="btn btn-outline-secondary" onclick="createAlbum()">
                    <i class="fas fa-images me-2"></i> New Album
                </button>
                <button class="btn btn-primary" onclick="uploadMedia()">
                    <i class="fas fa-upload me-2"></i> Upload Photos
                </button>
            </div>
        </div>

        <!-- User Media Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">My Photos</h6>
                        <h3 class="mb-0">847</h3>
                        <small class="text-success">+12 this week</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Storage Used</h6>
                        <h3 class="mb-0">2.1 GB</h3>
                        <small class="text-muted">of 5 GB</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Albums</h6>
                        <h3 class="mb-0">7</h3>
                        <small class="text-muted">Collections</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Recent Views</h6>
                        <h3 class="mb-0">156</h3>
                        <small class="text-muted">This month</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Media Categories Toggle -->
        <div class="card mb-4">
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="btn-group" role="group">
                        <input type="radio" class="btn-check" name="mediaCategory" id="allMedia" checked>
                        <label class="btn btn-outline-warning" for="allMedia">
                            <i class="fas fa-layer-group me-2"></i> All Media
                        </label>
                        
                        <input type="radio" class="btn-check" name="mediaCategory" id="portfolioMedia">
                        <label class="btn btn-outline-warning" for="portfolioMedia">
                            <i class="fas fa-camera me-2"></i> Portfolio
                        </label>
                        
                        <input type="radio" class="btn-check" name="mediaCategory" id="profileMedia">
                        <label class="btn btn-outline-warning" for="profileMedia">
                            <i class="fas fa-user me-2"></i> Profile Photos
                        </label>
                        
                        <input type="radio" class="btn-check" name="mediaCategory" id="documentsMedia">
                        <label class="btn btn-outline-warning" for="documentsMedia">
                            <i class="fas fa-file me-2"></i> Documents
                        </label>
                    </div>
                    
                    <div class="text-muted small">
                        <i class="fas fa-info-circle me-1"></i>
                        Organize your media by type and usage
                    </div>
                </div>
            </div>
        </div>

        <!-- Media Library Interface -->
        <div class="card">
            <div class="card-header">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center">
                            <h5 class="mb-0 me-3">Media Collection</h5>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-secondary active" onclick="setView('grid')">
                                    <i class="fas fa-th"></i>
                                </button>
                                <button class="btn btn-outline-secondary" onclick="setView('list')">
                                    <i class="fas fa-list"></i>
                                </button>
                                <button class="btn btn-outline-secondary" onclick="setView('slideshow')">
                                    <i class="fas fa-play"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center">
                            <div class="input-group">
                                <input type="text" class="form-control" placeholder="Search my media..." id="mediaSearch">
                                <button class="btn btn-outline-secondary" onclick="searchMedia()">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                            <div class="dropdown ms-2">
                                <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                    <i class="fas fa-sort"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="sortBy('newest')">Newest First</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="sortBy('oldest')">Oldest First</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="sortBy('name')">Name A-Z</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="sortBy('size')">File Size</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="sortBy('views')">Most Viewed</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card-body">
                <!-- Album Navigation -->
                <div class="album-breadcrumb mb-3">
                    <nav aria-label="album navigation">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="#" onclick="navigateToAlbum('root')">
                                    <i class="fas fa-home"></i> My Media
                                </a>
                            </li>
                            <li class="breadcrumb-item active">Portfolio</li>
                        </ol>
                    </nav>
                </div>

                <!-- Media Grid -->
                <div class="row g-3" id="mediaGrid">
                    <!-- Albums/Collections -->
                    <div class="col-md-3">
                        <div class="media-album-card portfolio-album" onclick="openAlbum('portfolio')">
                            <div class="album-preview">
                                <img src="https://picsum.photos/300/200?random=40" alt="Portfolio Album" class="img-fluid">
                                <div class="album-count">
                                    <span class="badge bg-dark">47 photos</span>
                                </div>
                            </div>
                            <div class="album-info">
                                <h6 class="mb-1">Portfolio Collection</h6>
                                <small class="text-muted">Professional photos</small>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-album-card profile-album" onclick="openAlbum('profile')">
                            <div class="album-preview">
                                <img src="https://picsum.photos/300/200?random=41" alt="Profile Album" class="img-fluid">
                                <div class="album-count">
                                    <span class="badge bg-dark">23 photos</span>
                                </div>
                            </div>
                            <div class="album-info">
                                <h6 class="mb-1">Profile Photos</h6>
                                <small class="text-muted">Headshots & comp cards</small>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-album-card document-album" onclick="openAlbum('documents')">
                            <div class="album-preview">
                                <div class="document-preview">
                                    <i class="fas fa-file-alt fa-3x text-primary"></i>
                                </div>
                                <div class="album-count">
                                    <span class="badge bg-dark">8 files</span>
                                </div>
                            </div>
                            <div class="album-info">
                                <h6 class="mb-1">Documents</h6>
                                <small class="text-muted">Contracts & forms</small>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-album-card personal-album" onclick="openAlbum('personal')">
                            <div class="album-preview">
                                <img src="https://picsum.photos/300/200?random=42" alt="Personal Album" class="img-fluid">
                                <div class="album-count">
                                    <span class="badge bg-dark">156 photos</span>
                                </div>
                            </div>
                            <div class="album-info">
                                <h6 class="mb-1">Personal Photos</h6>
                                <small class="text-muted">Behind the scenes</small>
                            </div>
                        </div>
                    </div>

                    <!-- Individual Media Files -->
                    <div class="col-md-3">
                        <div class="media-item-card user-photo portfolio-photo" onclick="selectMedia('headshot-001.jpg')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=43" alt="Professional Headshot" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('headshot-001.jpg', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="editMedia('headshot-001.jpg', event)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="shareMedia('headshot-001.jpg', event)">
                                        <i class="fas fa-share"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="downloadMedia('headshot-001.jpg', event)">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">headshot-001.jpg</h6>
                                <small class="text-muted">600×800 • 145 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-warning">Portfolio</span>
                                    <span class="badge bg-success">Public</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-item-card user-photo portfolio-photo" onclick="selectMedia('fashion-001.jpg')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=44" alt="Fashion Photo" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('fashion-001.jpg', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="editMedia('fashion-001.jpg', event)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="shareMedia('fashion-001.jpg', event)">
                                        <i class="fas fa-share"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="downloadMedia('fashion-001.jpg', event)">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">fashion-001.jpg</h6>
                                <small class="text-muted">1200×1600 • 890 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-warning">Portfolio</span>
                                    <span class="badge bg-info">Featured</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-item-card user-photo profile-photo" onclick="selectMedia('profile-main.jpg')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=45" alt="Main Profile Photo" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('profile-main.jpg', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="setAsProfile('profile-main.jpg', event)">
                                        <i class="fas fa-star"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="shareMedia('profile-main.jpg', event)">
                                        <i class="fas fa-share"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="downloadMedia('profile-main.jpg', event)">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">profile-main.jpg</h6>
                                <small class="text-muted">500×500 • 120 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-primary">Profile</span>
                                    <span class="badge bg-warning">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-item-card user-document" onclick="selectMedia('contract-2024.pdf')">
                            <div class="media-preview">
                                <div class="document-preview">
                                    <i class="fas fa-file-pdf fa-3x text-danger"></i>
                                </div>
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('contract-2024.pdf', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="downloadMedia('contract-2024.pdf', event)">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">contract-2024.pdf</h6>
                                <small class="text-muted">PDF • 245 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-secondary">Document</span>
                                    <span class="badge bg-success">Signed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Upload Zone -->
                    <div class="col-md-3">
                        <div class="upload-zone" onclick="uploadMedia()">
                            <div class="upload-icon">
                                <i class="fas fa-camera"></i>
                            </div>
                            <div class="upload-text">
                                <h6>Add More Photos</h6>
                                <small class="text-muted">Drag & drop or click to upload</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div class="d-flex justify-content-between align-items-center mt-4">
                    <div>
                        <small class="text-muted">Showing 1-9 of 47 files</small>
                    </div>
                    <nav>
                        <ul class="pagination pagination-sm mb-0">
                            <li class="page-item disabled">
                                <a class="page-link" href="#">Previous</a>
                            </li>
                            <li class="page-item active">
                                <a class="page-link" href="#">1</a>
                            </li>
                            <li class="page-item">
                                <a class="page-link" href="#">2</a>
                            </li>
                            <li class="page-item">
                                <a class="page-link" href="#">3</a>
                            </li>
                            <li class="page-item">
                                <a class="page-link" href="#">Next</a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>

        <!-- Quick Actions & Stats -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Quick Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary" onclick="createCompCard()">
                                <i class="fas fa-id-card me-2"></i> Create Comp Card
                            </button>
                            <button class="btn btn-outline-success" onclick="generatePortfolio()">
                                <i class="fas fa-camera me-2"></i> Generate Portfolio PDF
                            </button>
                            <button class="btn btn-outline-info" onclick="shareCollection()">
                                <i class="fas fa-share-alt me-2"></i> Share Collection
                            </button>
                            <button class="btn btn-outline-warning" onclick="requestPhotoshoot()">
                                <i class="fas fa-calendar-plus me-2"></i> Request Photoshoot
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Media Performance</h5>
                    </div>
                    <div class="card-body">
                        <div class="performance-item d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 class="mb-0">Most Viewed Photo</h6>
                                <small class="text-muted">headshot-001.jpg</small>
                            </div>
                            <span class="badge bg-success">234 views</span>
                        </div>
                        <div class="performance-item d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <h6 class="mb-0">Latest Upload</h6>
                                <small class="text-muted">fashion-latest.jpg</small>
                            </div>
                            <span class="badge bg-info">2 hours ago</span>
                        </div>
                        <div class="performance-item d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0">Portfolio Completeness</h6>
                                <small class="text-muted">Add 3 more photos</small>
                            </div>
                            <span class="badge bg-warning">80%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Upload Modal -->
<div class="modal fade" id="uploadModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Upload My Photos</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="upload-dropzone" id="uploadDropzone">
                    <div class="text-center py-5">
                        <i class="fas fa-camera fa-3x text-muted mb-3"></i>
                        <h5>Drop Your Photos Here</h5>
                        <p class="text-muted">Or click to select files from your device</p>
                        <button class="btn btn-primary" onclick="browseFiles()">Choose Photos</button>
                        <input type="file" id="fileInput" multiple accept="image/*,.pdf,.doc,.docx" style="display: none;">
                    </div>
                </div>
                
                <div class="upload-options mt-3">
                    <div class="row">
                        <div class="col-md-6">
                            <label class="form-label">Add to Album</label>
                            <select class="form-select">
                                <option value="portfolio">Portfolio Collection</option>
                                <option value="profile">Profile Photos</option>
                                <option value="personal">Personal Photos</option>
                                <option value="documents">Documents</option>
                                <option value="new">+ Create New Album</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Privacy Setting</label>
                            <select class="form-select">
                                <option value="private">Private (Only Me)</option>
                                <option value="account">Account Team</option>
                                <option value="public">Public Portfolio</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="autoTags">
                            <label class="form-check-label" for="autoTags">
                                Auto-generate tags from image content
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="autoResize" checked>
                            <label class="form-check-label" for="autoResize">
                                Automatically optimize for web
                            </label>
                        </div>
                    </div>
                </div>

                <div class="upload-progress mt-3" id="uploadProgress" style="display: none;">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Uploading photos...</span>
                        <span id="progressText">0%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" id="progressBar" style="width: 0%"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="startUpload">Upload Photos</button>
            </div>
        </div>
    </div>
</div>

<style>
.media-album-card {
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}

.media-album-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.album-preview {
    position: relative;
    height: 120px;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
}

.album-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.document-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.album-count {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
}

.album-info {
    padding: 0.75rem;
}

.album-info h6 {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.media-item-card.user-photo {
    border-color: #ffc107;
}

.media-item-card.user-document {
    border-color: #6c757d;
}

.performance-item {
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
}

.performance-item:hover {
    background-color: #f8f9fa;
}

/* Reuse existing media styles */
.media-item-card {
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}

.media-item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.media-preview {
    position: relative;
    height: 150px;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
}

.media-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.media-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;
    flex-wrap: wrap;
    padding: 0.5rem;
}

.media-item-card:hover .media-overlay {
    opacity: 1;
}

.media-info {
    padding: 0.75rem;
}

.media-info h6 {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.media-usage {
    margin-top: 0.5rem;
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    border: 2px dashed #ffc107;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 200px;
}

.upload-zone:hover {
    background-color: #fff3cd;
}

.upload-icon i {
    font-size: 3rem;
    color: #ffc107;
    margin-bottom: 1rem;
}

.upload-text {
    text-align: center;
}

.album-breadcrumb {
    background: #f8f9fa;
    padding: 0.75rem;
    border-radius: 0.375rem;
}

.upload-dropzone {
    border: 2px dashed #dee2e6;
    border-radius: 0.375rem;
    transition: all 0.2s;
}

.upload-dropzone.dragover {
    border-color: #ffc107;
    background-color: #fff3cd;
}
</style>

<script>
function accessSharedMedia() {
    alert('Accessing shared media from your account and team...');
}

function createAlbum() {
    const albumName = prompt('Enter album name:');
    if (albumName) {
        alert(`Creating album: ${albumName}`);
    }
}

function uploadMedia() {
    const modal = new bootstrap.Modal(document.getElementById('uploadModal'));
    modal.show();
}

function setView(viewType) {
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (viewType === 'slideshow') {
        alert('Starting slideshow mode...');
    }
}

function searchMedia() {
    const query = document.getElementById('mediaSearch').value;
    alert(`Searching your media for: ${query}`);
}

function sortBy(criteria) {
    alert(`Sorting by: ${criteria}`);
}

function navigateToAlbum(album) {
    alert(`Navigating to album: ${album}`);
}

function openAlbum(album) {
    alert(`Opening album: ${album}`);
}

function selectMedia(filename) {
    alert(`Selected: ${filename}`);
}

function previewMedia(filename, event) {
    event.stopPropagation();
    alert(`Previewing: ${filename}`);
}

function editMedia(filename, event) {
    event.stopPropagation();
    alert(`Opening editor for: ${filename}`);
}

function shareMedia(filename, event) {
    event.stopPropagation();
    alert(`Sharing: ${filename}`);
}

function setAsProfile(filename, event) {
    event.stopPropagation();
    alert(`Setting as profile photo: ${filename}`);
}

function downloadMedia(filename, event) {
    event.stopPropagation();
    alert(`Downloading: ${filename}`);
}

function createCompCard() {
    alert('Opening comp card creator...');
}

function generatePortfolio() {
    alert('Generating portfolio PDF...');
}

function shareCollection() {
    alert('Opening collection sharing options...');
}

function requestPhotoshoot() {
    alert('Opening photoshoot booking system...');
}

// Media category filtering
document.querySelectorAll('input[name="mediaCategory"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const portfolioItems = document.querySelectorAll('.portfolio-photo, .portfolio-album');
        const profileItems = document.querySelectorAll('.profile-photo, .profile-album');
        const documentItems = document.querySelectorAll('.user-document, .document-album');
        const personalItems = document.querySelectorAll('.personal-album');
        
        // Hide all
        portfolioItems.forEach(el => el.style.display = 'none');
        profileItems.forEach(el => el.style.display = 'none');
        documentItems.forEach(el => el.style.display = 'none');
        personalItems.forEach(el => el.style.display = 'none');
        
        if (this.id === 'portfolioMedia') {
            portfolioItems.forEach(el => el.style.display = 'block');
        } else if (this.id === 'profileMedia') {
            profileItems.forEach(el => el.style.display = 'block');
        } else if (this.id === 'documentsMedia') {
            documentItems.forEach(el => el.style.display = 'block');
        } else {
            // Show all
            portfolioItems.forEach(el => el.style.display = 'block');
            profileItems.forEach(el => el.style.display = 'block');
            documentItems.forEach(el => el.style.display = 'block');
            personalItems.forEach(el => el.style.display = 'block');
        }
    });
});

// File upload handling
function browseFiles() {
    document.getElementById('fileInput').click();
}

document.getElementById('fileInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
});

const dropzone = document.getElementById('uploadDropzone');

dropzone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
});

function handleFiles(files) {
    if (files.length > 0) {
        document.getElementById('startUpload').disabled = false;
        alert(`${files.length} files selected for upload`);
    }
}

document.getElementById('startUpload').addEventListener('click', function() {
    const progress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progress.style.display = 'block';
    
    let percent = 0;
    const interval = setInterval(() => {
        percent += 15;
        progressBar.style.width = percent + '%';
        progressText.textContent = percent + '%';
        
        if (percent >= 100) {
            clearInterval(interval);
            alert('Photos uploaded successfully!');
            bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
            progress.style.display = 'none';
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
        }
    }, 300);
});
</script>

<?php echo renderFooter(); ?>