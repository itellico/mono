<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Media Library - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'media/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Media Library']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Platform Media Library</h2>
                <p class="text-muted mb-0">Manage global assets and shared resources across all tenants</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-info" onclick="openLocalizationCenter()">
                    <i class="fas fa-globe me-2"></i> Translate
                </button>
                <button class="btn btn-outline-secondary" onclick="createFolder()">
                    <i class="fas fa-folder-plus me-2"></i> New Folder
                </button>
                <button class="btn btn-primary" onclick="uploadMedia()">
                    <i class="fas fa-upload me-2"></i> Upload Media
                </button>
            </div>
        </div>

        <!-- Storage Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Total Files</h6>
                        <h3 class="mb-0">2,847</h3>
                        <small class="text-success">+23 this month</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Storage Used</h6>
                        <h3 class="mb-0">15.7 GB</h3>
                        <small class="text-muted">of 100 GB</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Monthly Bandwidth</h6>
                        <h3 class="mb-0">847 GB</h3>
                        <small class="text-warning">78% of limit</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Active CDN</h6>
                        <h3 class="mb-0 text-success">
                            <i class="fas fa-check-circle"></i>
                        </h3>
                        <small class="text-muted">Global delivery</small>
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
                                    <i class="fas fa-home"></i> Platform Media
                                </a>
                            </li>
                            <li class="breadcrumb-item active">Templates</li>
                        </ol>
                    </nav>
                </div>

                <!-- Folder Structure -->
                <div class="row g-3" id="mediaGrid">
                    <!-- Folders -->
                    <div class="col-md-3">
                        <div class="media-folder-card" onclick="openFolder('templates')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-warning"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">Industry Templates</h6>
                                <small class="text-muted">127 files</small>
                            </div>
                            <div class="folder-actions">
                                <button class="btn btn-sm btn-outline-secondary" onclick="editFolder('templates', event)">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-folder-card" onclick="openFolder('stock-photos')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-warning"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">Stock Photos</h6>
                                <small class="text-muted">456 files</small>
                            </div>
                            <div class="folder-actions">
                                <button class="btn btn-sm btn-outline-secondary" onclick="editFolder('stock-photos', event)">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-folder-card" onclick="openFolder('branding')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-warning"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">Platform Branding</h6>
                                <small class="text-muted">43 files</small>
                            </div>
                            <div class="folder-actions">
                                <button class="btn btn-sm btn-outline-secondary" onclick="editFolder('branding', event)">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-folder-card" onclick="openFolder('icons')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-warning"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">UI Icons</h6>
                                <small class="text-muted">89 files</small>
                            </div>
                            <div class="folder-actions">
                                <button class="btn btn-sm btn-outline-secondary" onclick="editFolder('icons', event)">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Media Files -->
                    <div class="col-md-3">
                        <div class="media-item-card" onclick="selectMedia('hero-bg.jpg')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=1" alt="Hero Background" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('hero-bg.jpg', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="downloadMedia('hero-bg.jpg', event)">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">hero-bg.jpg</h6>
                                <small class="text-muted">1920×1080 • 245 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-primary">15 uses</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-item-card" onclick="selectMedia('logo-template.svg')">
                            <div class="media-preview">
                                <div class="svg-preview">
                                    <i class="fas fa-file-image fa-3x text-info"></i>
                                </div>
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('logo-template.svg', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="downloadMedia('logo-template.svg', event)">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">logo-template.svg</h6>
                                <small class="text-muted">Vector • 12 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-success">Global</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-item-card" onclick="selectMedia('intro-video.mp4')">
                            <div class="media-preview">
                                <div class="video-preview">
                                    <i class="fas fa-play-circle fa-3x text-danger"></i>
                                    <div class="video-duration">2:45</div>
                                </div>
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('intro-video.mp4', event)">
                                        <i class="fas fa-play"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="downloadMedia('intro-video.mp4', event)">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">intro-video.mp4</h6>
                                <small class="text-muted">1080p • 15.2 MB</small>
                                <div class="media-usage">
                                    <span class="badge bg-warning">8 uses</span>
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
                        <small class="text-muted">Showing 1-12 of 247 files</small>
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

        <!-- Bulk Actions -->
        <div class="selected-actions" id="bulkActions" style="display: none;">
            <div class="card border-primary">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span id="selectedCount">0</span> files selected
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="bulkMove()">
                                <i class="fas fa-arrows-alt me-1"></i> Move
                            </button>
                            <button class="btn btn-outline-secondary" onclick="bulkDownload()">
                                <i class="fas fa-download me-1"></i> Download
                            </button>
                            <button class="btn btn-outline-danger" onclick="bulkDelete()">
                                <i class="fas fa-trash me-1"></i> Delete
                            </button>
                            <button class="btn btn-outline-secondary" onclick="clearSelection()">
                                <i class="fas fa-times me-1"></i> Clear
                            </button>
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
                                <option value="root">Platform Media (Root)</option>
                                <option value="templates">Industry Templates</option>
                                <option value="stock-photos">Stock Photos</option>
                                <option value="branding">Platform Branding</option>
                                <option value="icons">UI Icons</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Access Level</label>
                            <select class="form-select">
                                <option value="platform">Platform Only</option>
                                <option value="all-tenants">All Tenants</option>
                                <option value="specific">Specific Tenants</option>
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

.folder-actions {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s;
}

.media-folder-card:hover .folder-actions {
    opacity: 1;
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

.media-item-card.selected {
    border-color: #0d6efd;
    box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
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

.svg-preview, .video-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
}

.video-duration {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
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
}

.upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    border: 2px dashed #dee2e6;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 200px;
}

.upload-zone:hover {
    border-color: #0d6efd;
    background-color: #f8f9fa;
}

.upload-icon i {
    font-size: 3rem;
    color: #6c757d;
    margin-bottom: 1rem;
}

.upload-text {
    text-align: center;
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

.selected-actions {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    min-width: 400px;
}

.folder-breadcrumb {
    background: #f8f9fa;
    padding: 0.75rem;
    border-radius: 0.375rem;
}
</style>

<script>
let selectedFiles = new Set();

function uploadMedia() {
    const modal = new bootstrap.Modal(document.getElementById('uploadModal'));
    modal.show();
}

function openLocalizationCenter() {
    window.location.href = 'localization.php';
}

function createFolder() {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
        alert(`Creating folder: ${folderName}`);
    }
}

function setView(viewType) {
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (viewType === 'list') {
        document.getElementById('mediaGrid').classList.add('list-view');
    } else {
        document.getElementById('mediaGrid').classList.remove('list-view');
    }
}

function searchMedia() {
    const query = document.getElementById('mediaSearch').value;
    alert(`Searching for: ${query}`);
}

function filterByType(type) {
    alert(`Filtering by type: ${type}`);
}

function navigateToFolder(folder) {
    alert(`Navigating to folder: ${folder}`);
}

function openFolder(folder) {
    alert(`Opening folder: ${folder}`);
}

function editFolder(folder, event) {
    event.stopPropagation();
    alert(`Editing folder: ${folder}`);
}

function selectMedia(filename) {
    const card = event.currentTarget;
    
    if (selectedFiles.has(filename)) {
        selectedFiles.delete(filename);
        card.classList.remove('selected');
    } else {
        selectedFiles.add(filename);
        card.classList.add('selected');
    }
    
    updateBulkActions();
}

function previewMedia(filename, event) {
    event.stopPropagation();
    alert(`Previewing: ${filename}`);
}

function downloadMedia(filename, event) {
    event.stopPropagation();
    alert(`Downloading: ${filename}`);
}

function updateBulkActions() {
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (selectedFiles.size > 0) {
        bulkActions.style.display = 'block';
        selectedCount.textContent = selectedFiles.size;
    } else {
        bulkActions.style.display = 'none';
    }
}

function bulkMove() {
    alert(`Moving ${selectedFiles.size} files`);
}

function bulkDownload() {
    alert(`Downloading ${selectedFiles.size} files`);
}

function bulkDelete() {
    if (confirm(`Delete ${selectedFiles.size} files?`)) {
        alert(`Deleting ${selectedFiles.size} files`);
        clearSelection();
    }
}

function clearSelection() {
    selectedFiles.clear();
    document.querySelectorAll('.media-item-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateBulkActions();
}

function browseFiles() {
    document.getElementById('fileInput').click();
}

// File upload handling
document.getElementById('fileInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    handleFiles(files);
});

// Drag and drop handling
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
    
    // Simulate upload progress
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