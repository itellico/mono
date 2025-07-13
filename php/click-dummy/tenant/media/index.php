<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Media Library - Tenant Admin", "Tenant Admin", "Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'media/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Media Library']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Media Library</h2>
                <p class="text-muted mb-0">Manage your brand assets and content media</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="accessPlatformMedia()">
                    <i class="fas fa-globe me-2"></i> Platform Assets
                </button>
                <button class="btn btn-outline-secondary" onclick="createFolder()">
                    <i class="fas fa-folder-plus me-2"></i> New Folder
                </button>
                <button class="btn btn-primary" onclick="uploadMedia()">
                    <i class="fas fa-upload me-2"></i> Upload Media
                </button>
            </div>
        </div>

        <!-- Tenant Media Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Your Files</h6>
                        <h3 class="mb-0">1,247</h3>
                        <small class="text-success">+45 this month</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Storage Used</h6>
                        <h3 class="mb-0">8.3 GB</h3>
                        <small class="text-muted">of 50 GB</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Platform Assets</h6>
                        <h3 class="mb-0">2,847</h3>
                        <small class="text-muted">Available to use</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">CDN Performance</h6>
                        <h3 class="mb-0 text-success">97%</h3>
                        <small class="text-muted">Cache hit rate</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Source Toggle -->
        <div class="card mb-4">
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="btn-group" role="group">
                        <input type="radio" class="btn-check" name="mediaSource" id="tenantMedia" checked>
                        <label class="btn btn-outline-primary" for="tenantMedia">
                            <i class="fas fa-building me-2"></i> Your Media
                        </label>
                        
                        <input type="radio" class="btn-check" name="mediaSource" id="platformMedia">
                        <label class="btn btn-outline-primary" for="platformMedia">
                            <i class="fas fa-globe me-2"></i> Platform Assets
                        </label>
                        
                        <input type="radio" class="btn-check" name="mediaSource" id="allMedia">
                        <label class="btn btn-outline-primary" for="allMedia">
                            <i class="fas fa-layer-group me-2"></i> All Media
                        </label>
                    </div>
                    
                    <div class="text-muted small">
                        <i class="fas fa-info-circle me-1"></i>
                        Platform assets are available to all tenants
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
                            <h5 class="mb-0 me-3">Media Assets</h5>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-secondary active" onclick="setView('grid')">
                                    <i class="fas fa-th"></i>
                                </button>
                                <button class="btn btn-outline-secondary" onclick="setView('list')">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center">
                            <div class="input-group">
                                <input type="text" class="form-control" placeholder="Search media..." id="mediaSearch">
                                <button class="btn btn-outline-secondary" onclick="searchMedia()">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                            <div class="dropdown ms-2">
                                <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                                    <i class="fas fa-filter"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="filterByType('all')">All Files</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="filterByType('image')">Images</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="filterByType('video')">Videos</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="filterByType('document')">Documents</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="#" onclick="filterBySource('tenant')">Your Media Only</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="filterBySource('platform')">Platform Assets Only</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card-body">
                <!-- Folder Navigation -->
                <div class="folder-breadcrumb mb-3">
                    <nav aria-label="folder navigation">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <a href="#" onclick="navigateToFolder('root')">
                                    <i class="fas fa-home"></i> Media Library
                                </a>
                            </li>
                            <li class="breadcrumb-item active">Brand Assets</li>
                        </ol>
                    </nav>
                </div>

                <!-- Media Grid -->
                <div class="row g-3" id="mediaGrid">
                    <!-- Tenant Folders -->
                    <div class="col-md-3">
                        <div class="media-folder-card tenant-folder" onclick="openFolder('brand-assets')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-primary"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">Brand Assets</h6>
                                <small class="text-muted">34 files</small>
                            </div>
                            <div class="folder-source">
                                <span class="badge bg-primary">Your Media</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-folder-card tenant-folder" onclick="openFolder('blog-images')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-primary"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">Blog Images</h6>
                                <small class="text-muted">127 files</small>
                            </div>
                            <div class="folder-source">
                                <span class="badge bg-primary">Your Media</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-folder-card tenant-folder" onclick="openFolder('marketing')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-primary"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">Marketing</h6>
                                <small class="text-muted">89 files</small>
                            </div>
                            <div class="folder-source">
                                <span class="badge bg-primary">Your Media</span>
                            </div>
                        </div>
                    </div>

                    <!-- Platform Folders (Available) -->
                    <div class="col-md-3">
                        <div class="media-folder-card platform-folder" onclick="openFolder('platform-templates')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-warning"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">Industry Templates</h6>
                                <small class="text-muted">127 files</small>
                            </div>
                            <div class="folder-source">
                                <span class="badge bg-secondary">Platform</span>
                            </div>
                        </div>
                    </div>

                    <!-- Tenant Media Files -->
                    <div class="col-md-3">
                        <div class="media-item-card tenant-media" onclick="selectMedia('company-logo.png')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=10" alt="Company Logo" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('company-logo.png', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="editMedia('company-logo.png', event)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="downloadMedia('company-logo.png', event)">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">company-logo.png</h6>
                                <small class="text-muted">500×300 • 45 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-primary">Your Media</span>
                                    <span class="badge bg-success">23 uses</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-item-card tenant-media" onclick="selectMedia('banner-promo.jpg')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=11" alt="Promotional Banner" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('banner-promo.jpg', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="editMedia('banner-promo.jpg', event)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="downloadMedia('banner-promo.jpg', event)">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">banner-promo.jpg</h6>
                                <small class="text-muted">1200×400 • 180 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-primary">Your Media</span>
                                    <span class="badge bg-info">12 uses</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Platform Media Files (Available) -->
                    <div class="col-md-3">
                        <div class="media-item-card platform-media" onclick="selectMedia('hero-bg-template.jpg')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=1" alt="Hero Background Template" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('hero-bg-template.jpg', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="copyToPlatform('hero-bg-template.jpg', event)">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="downloadMedia('hero-bg-template.jpg', event)">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">hero-bg-template.jpg</h6>
                                <small class="text-muted">1920×1080 • 245 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-secondary">Platform</span>
                                    <span class="badge bg-warning">Available</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Upload Zone -->
                    <div class="col-md-3">
                        <div class="upload-zone" onclick="uploadMedia()">
                            <div class="upload-icon">
                                <i class="fas fa-cloud-upload-alt"></i>
                            </div>
                            <div class="upload-text">
                                <h6>Upload New Media</h6>
                                <small class="text-muted">Drag & drop or click to browse</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div class="d-flex justify-content-between align-items-center mt-4">
                    <div>
                        <small class="text-muted">Showing 1-8 of 156 files</small>
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

        <!-- Usage Analytics -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Most Used Assets</h5>
                    </div>
                    <div class="card-body">
                        <div class="usage-item d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center">
                                <img src="https://picsum.photos/40/40?random=10" class="rounded me-2" alt="Logo">
                                <div>
                                    <h6 class="mb-0">company-logo.png</h6>
                                    <small class="text-muted">Brand Assets</small>
                                </div>
                            </div>
                            <span class="badge bg-success">23 uses</span>
                        </div>
                        <div class="usage-item d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center">
                                <img src="https://picsum.photos/40/40?random=11" class="rounded me-2" alt="Banner">
                                <div>
                                    <h6 class="mb-0">banner-promo.jpg</h6>
                                    <small class="text-muted">Marketing</small>
                                </div>
                            </div>
                            <span class="badge bg-info">12 uses</span>
                        </div>
                        <div class="usage-item d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <img src="https://picsum.photos/40/40?random=12" class="rounded me-2" alt="Hero">
                                <div>
                                    <h6 class="mb-0">hero-image.jpg</h6>
                                    <small class="text-muted">Blog Images</small>
                                </div>
                            </div>
                            <span class="badge bg-warning">8 uses</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Recent Uploads</h5>
                    </div>
                    <div class="card-body">
                        <div class="recent-item d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-file-image text-info me-2"></i>
                                <div>
                                    <h6 class="mb-0">new-product.jpg</h6>
                                    <small class="text-muted">2 hours ago</small>
                                </div>
                            </div>
                            <span class="badge bg-primary">New</span>
                        </div>
                        <div class="recent-item d-flex justify-content-between align-items-center mb-2">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-file-video text-danger me-2"></i>
                                <div>
                                    <h6 class="mb-0">intro-video.mp4</h6>
                                    <small class="text-muted">1 day ago</small>
                                </div>
                            </div>
                            <span class="badge bg-secondary">Video</span>
                        </div>
                        <div class="recent-item d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-file-pdf text-warning me-2"></i>
                                <div>
                                    <h6 class="mb-0">catalog.pdf</h6>
                                    <small class="text-muted">3 days ago</small>
                                </div>
                            </div>
                            <span class="badge bg-info">Document</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Upload Modal (Similar to Platform) -->
<div class="modal fade" id="uploadModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Upload Media Files</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="upload-dropzone" id="uploadDropzone">
                    <div class="text-center py-5">
                        <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                        <h5>Drag & Drop Files Here</h5>
                        <p class="text-muted">Or click to browse and select files</p>
                        <button class="btn btn-primary" onclick="browseFiles()">Browse Files</button>
                        <input type="file" id="fileInput" multiple accept="image/*,video/*,.pdf,.doc,.docx" style="display: none;">
                    </div>
                </div>
                
                <div class="upload-options mt-3">
                    <div class="row">
                        <div class="col-md-6">
                            <label class="form-label">Upload to Folder</label>
                            <select class="form-select">
                                <option value="root">Media Library (Root)</option>
                                <option value="brand-assets">Brand Assets</option>
                                <option value="blog-images">Blog Images</option>
                                <option value="marketing">Marketing</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Access Level</label>
                            <select class="form-select">
                                <option value="tenant">Tenant Only</option>
                                <option value="accounts">All Accounts</option>
                                <option value="public">Public Access</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="upload-progress mt-3" id="uploadProgress" style="display: none;">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Uploading files...</span>
                        <span id="progressText">0%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar" id="progressBar" style="width: 0%"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="startUpload">Start Upload</button>
            </div>
        </div>
    </div>
</div>

<style>
.media-folder-card.tenant-folder {
    border-color: #0d6efd;
}

.media-folder-card.platform-folder {
    border-color: #6c757d;
    opacity: 0.8;
}

.media-item-card.tenant-media {
    border-color: #0d6efd;
}

.media-item-card.platform-media {
    border-color: #6c757d;
    opacity: 0.9;
}

.media-item-card.platform-media:hover {
    opacity: 1;
}

.folder-source {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
}

.usage-item {
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
}

.usage-item:hover {
    background-color: #f8f9fa;
}

.recent-item {
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
}

.recent-item:hover {
    background-color: #f8f9fa;
}

/* Reuse platform media library styles */
.media-folder-card {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px dashed #dee2e6;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
}

.media-folder-card:hover {
    border-color: #0d6efd;
    background-color: #f8f9fa;
}

.folder-icon {
    margin-right: 0.75rem;
}

.folder-icon i {
    font-size: 2rem;
}

.folder-info h6 {
    margin-bottom: 0.25rem;
    font-weight: 600;
}

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
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s;
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
    border: 2px dashed #0d6efd;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 200px;
}

.upload-zone:hover {
    background-color: #f8f9fa;
}

.upload-icon i {
    font-size: 3rem;
    color: #0d6efd;
    margin-bottom: 1rem;
}

.upload-text {
    text-align: center;
}

.folder-breadcrumb {
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
    border-color: #0d6efd;
    background-color: #f8f9fa;
}
</style>

<script>
function accessPlatformMedia() {
    document.getElementById('platformMedia').checked = true;
    filterMedia('platform');
}

function createFolder() {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
        alert(`Creating folder: ${folderName}`);
    }
}

function uploadMedia() {
    const modal = new bootstrap.Modal(document.getElementById('uploadModal'));
    modal.show();
}

function setView(viewType) {
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function searchMedia() {
    const query = document.getElementById('mediaSearch').value;
    alert(`Searching for: ${query}`);
}

function filterByType(type) {
    alert(`Filtering by type: ${type}`);
}

function filterBySource(source) {
    alert(`Filtering by source: ${source}`);
}

function filterMedia(source) {
    const tenantMedia = document.querySelectorAll('.tenant-media, .tenant-folder');
    const platformMedia = document.querySelectorAll('.platform-media, .platform-folder');
    
    if (source === 'tenant') {
        tenantMedia.forEach(el => el.style.display = 'block');
        platformMedia.forEach(el => el.style.display = 'none');
    } else if (source === 'platform') {
        tenantMedia.forEach(el => el.style.display = 'none');
        platformMedia.forEach(el => el.style.display = 'block');
    } else {
        tenantMedia.forEach(el => el.style.display = 'block');
        platformMedia.forEach(el => el.style.display = 'block');
    }
}

function openFolder(folder) {
    alert(`Opening folder: ${folder}`);
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
    alert(`Editing: ${filename}`);
}

function copyToPlatform(filename, event) {
    event.stopPropagation();
    alert(`Copying to your media library: ${filename}`);
}

function downloadMedia(filename, event) {
    event.stopPropagation();
    alert(`Downloading: ${filename}`);
}

// Media source toggle handling
document.querySelectorAll('input[name="mediaSource"]').forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.id === 'tenantMedia') {
            filterMedia('tenant');
        } else if (this.id === 'platformMedia') {
            filterMedia('platform');
        } else {
            filterMedia('all');
        }
    });
});

// File upload handling (similar to platform)
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
        percent += 10;
        progressBar.style.width = percent + '%';
        progressText.textContent = percent + '%';
        
        if (percent >= 100) {
            clearInterval(interval);
            alert('Upload completed successfully!');
            bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
            progress.style.display = 'none';
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
        }
    }, 200);
});
</script>

<?php echo renderFooter(); ?>