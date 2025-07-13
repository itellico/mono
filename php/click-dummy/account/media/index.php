<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Media Library - Account Manager", "Account Manager", "Manager", "Account");
?>

<div class="d-flex">
    <?php echo renderSidebar('Account', getAgencySidebarItems(), 'media/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Account', 'href' => '../index.php'],
            ['label' => 'Media Library']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Account Media Library</h2>
                <p class="text-muted mb-0">Manage team media assets and user profiles</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="manageUserUploads()">
                    <i class="fas fa-users me-2"></i> User Uploads
                </button>
                <button class="btn btn-outline-secondary" onclick="createFolder()">
                    <i class="fas fa-folder-plus me-2"></i> New Folder
                </button>
                <button class="btn btn-primary" onclick="uploadMedia()">
                    <i class="fas fa-upload me-2"></i> Upload Media
                </button>
            </div>
        </div>

        <!-- Account Media Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Account Files</h6>
                        <h3 class="mb-0">1,847</h3>
                        <small class="text-success">+67 this month</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">User Profiles</h6>
                        <h3 class="mb-0">247</h3>
                        <small class="text-muted">Media files</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Storage Used</h6>
                        <h3 class="mb-0">3.2 GB</h3>
                        <small class="text-muted">of 10 GB</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Active Users</h6>
                        <h3 class="mb-0">12</h3>
                        <small class="text-muted">With media uploads</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Media Sources Toggle -->
        <div class="card mb-4">
            <div class="card-body py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="btn-group" role="group">
                        <input type="radio" class="btn-check" name="mediaScope" id="accountMedia" checked>
                        <label class="btn btn-outline-info" for="accountMedia">
                            <i class="fas fa-briefcase me-2"></i> Account Media
                        </label>
                        
                        <input type="radio" class="btn-check" name="mediaScope" id="userMedia">
                        <label class="btn btn-outline-info" for="userMedia">
                            <i class="fas fa-user me-2"></i> User Uploads
                        </label>
                        
                        <input type="radio" class="btn-check" name="mediaScope" id="sharedMedia">
                        <label class="btn btn-outline-info" for="sharedMedia">
                            <i class="fas fa-share-alt me-2"></i> Shared Assets
                        </label>
                        
                        <input type="radio" class="btn-check" name="mediaScope" id="allAccountMedia">
                        <label class="btn btn-outline-info" for="allAccountMedia">
                            <i class="fas fa-layer-group me-2"></i> All Media
                        </label>
                    </div>
                    
                    <div class="text-muted small">
                        <i class="fas fa-info-circle me-1"></i>
                        Manage media across your account and team members
                    </div>
                </div>
            </div>
        </div>

        <!-- User Management Panel -->
        <div class="card mb-4" id="userManagementPanel" style="display: none;">
            <div class="card-header">
                <h5 class="mb-0">User Media Management</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex align-items-center">
                            <select class="form-select me-2" id="userSelect">
                                <option value="all">All Users</option>
                                <option value="user1">Sarah Johnson (Talent)</option>
                                <option value="user2">Mike Chen (Photographer)</option>
                                <option value="user3">Lisa Anderson (Model)</option>
                                <option value="user4">David Wilson (Talent)</option>
                            </select>
                            <button class="btn btn-outline-secondary" onclick="filterByUser()">
                                <i class="fas fa-filter"></i> Filter
                            </button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-end">
                            <button class="btn btn-outline-danger btn-sm" onclick="moderateContent()">
                                <i class="fas fa-flag me-1"></i> Moderate Content
                            </button>
                        </div>
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
                                    <li><a class="dropdown-item" href="#" onclick="filterByOwner('account')">Account Assets</a></li>
                                    <li><a class="dropdown-item" href="#" onclick="filterByOwner('users')">User Uploads</a></li>
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
                                    <i class="fas fa-home"></i> Account Media
                                </a>
                            </li>
                            <li class="breadcrumb-item active">Team Assets</li>
                        </ol>
                    </nav>
                </div>

                <!-- Media Grid -->
                <div class="row g-3" id="mediaGrid">
                    <!-- Account Folders -->
                    <div class="col-md-3">
                        <div class="media-folder-card account-folder" onclick="openFolder('team-assets')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-info"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">Team Assets</h6>
                                <small class="text-muted">89 files</small>
                            </div>
                            <div class="folder-source">
                                <span class="badge bg-info">Account</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-folder-card account-folder" onclick="openFolder('profiles')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-info"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">Profile Media</h6>
                                <small class="text-muted">247 files</small>
                            </div>
                            <div class="folder-source">
                                <span class="badge bg-info">Account</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-folder-card account-folder" onclick="openFolder('marketing')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-info"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">Marketing</h6>
                                <small class="text-muted">156 files</small>
                            </div>
                            <div class="folder-source">
                                <span class="badge bg-info">Account</span>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-folder-card user-folder" onclick="openFolder('user-uploads')">
                            <div class="folder-icon">
                                <i class="fas fa-folder text-warning"></i>
                            </div>
                            <div class="folder-info">
                                <h6 class="mb-1">User Uploads</h6>
                                <small class="text-muted">234 files</small>
                            </div>
                            <div class="folder-source">
                                <span class="badge bg-warning">Users</span>
                            </div>
                        </div>
                    </div>

                    <!-- Account Media Files -->
                    <div class="col-md-3">
                        <div class="media-item-card account-media" onclick="selectMedia('agency-logo.png')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=20" alt="Agency Logo" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('agency-logo.png', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="editMedia('agency-logo.png', event)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="shareMedia('agency-logo.png', event)">
                                        <i class="fas fa-share"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">agency-logo.png</h6>
                                <small class="text-muted">400×200 • 35 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-info">Account</span>
                                    <span class="badge bg-success">45 uses</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-item-card account-media" onclick="selectMedia('team-photo.jpg')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=21" alt="Team Photo" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('team-photo.jpg', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="editMedia('team-photo.jpg', event)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="shareMedia('team-photo.jpg', event)">
                                        <i class="fas fa-share"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">team-photo.jpg</h6>
                                <small class="text-muted">1200×800 • 280 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-info">Account</span>
                                    <span class="badge bg-primary">23 uses</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- User Media Files -->
                    <div class="col-md-3">
                        <div class="media-item-card user-media" onclick="selectMedia('profile-sarah.jpg')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=22" alt="Sarah's Profile" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('profile-sarah.jpg', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="approveMedia('profile-sarah.jpg', event)">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="moderateMedia('profile-sarah.jpg', event)">
                                        <i class="fas fa-flag"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">profile-sarah.jpg</h6>
                                <small class="text-muted">600×800 • 145 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-warning">Sarah J.</span>
                                    <span class="badge bg-success">Approved</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <div class="media-item-card user-media" onclick="selectMedia('portfolio-mike.jpg')">
                            <div class="media-preview">
                                <img src="https://picsum.photos/300/200?random=23" alt="Mike's Portfolio" class="img-fluid">
                                <div class="media-overlay">
                                    <button class="btn btn-sm btn-light" onclick="previewMedia('portfolio-mike.jpg', event)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="approveMedia('portfolio-mike.jpg', event)">
                                        <i class="fas fa-check"></i>
                                    </button>
                                    <button class="btn btn-sm btn-light" onclick="moderateMedia('portfolio-mike.jpg', event)">
                                        <i class="fas fa-flag"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="media-info">
                                <h6 class="mb-1">portfolio-mike.jpg</h6>
                                <small class="text-muted">1200×900 • 320 KB</small>
                                <div class="media-usage">
                                    <span class="badge bg-warning">Mike C.</span>
                                    <span class="badge bg-secondary">Pending</span>
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
                                <h6>Upload Account Media</h6>
                                <small class="text-muted">Drag & drop or click to browse</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div class="d-flex justify-content-between align-items-center mt-4">
                    <div>
                        <small class="text-muted">Showing 1-9 of 89 files</small>
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

        <!-- User Activity & Moderation -->
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Recent User Activity</h5>
                    </div>
                    <div class="card-body">
                        <div class="activity-item d-flex justify-content-between align-items-center mb-3">
                            <div class="d-flex align-items-center">
                                <img src="https://picsum.photos/40/40?random=30" class="rounded-circle me-2" alt="User">
                                <div>
                                    <h6 class="mb-0">Sarah uploaded 3 profile photos</h6>
                                    <small class="text-muted">2 hours ago</small>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-outline-primary" onclick="reviewActivity('sarah-upload')">
                                Review
                            </button>
                        </div>
                        <div class="activity-item d-flex justify-content-between align-items-center mb-3">
                            <div class="d-flex align-items-center">
                                <img src="https://picsum.photos/40/40?random=31" class="rounded-circle me-2" alt="User">
                                <div>
                                    <h6 class="mb-0">Mike updated portfolio images</h6>
                                    <small class="text-muted">5 hours ago</small>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-outline-primary" onclick="reviewActivity('mike-update')">
                                Review
                            </button>
                        </div>
                        <div class="activity-item d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <img src="https://picsum.photos/40/40?random=32" class="rounded-circle me-2" alt="User">
                                <div>
                                    <h6 class="mb-0">Lisa removed old headshots</h6>
                                    <small class="text-muted">1 day ago</small>
                                </div>
                            </div>
                            <span class="badge bg-success">Completed</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Content Moderation</h5>
                    </div>
                    <div class="card-body">
                        <div class="moderation-item d-flex justify-content-between align-items-center mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-flag text-warning me-2"></i>
                                <div>
                                    <h6 class="mb-0">2 files pending review</h6>
                                    <small class="text-muted">Require approval</small>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-warning" onclick="reviewPending()">
                                Review
                            </button>
                        </div>
                        <div class="moderation-item d-flex justify-content-between align-items-center mb-3">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                                <div>
                                    <h6 class="mb-0">1 file flagged</h6>
                                    <small class="text-muted">Inappropriate content</small>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-danger" onclick="reviewFlagged()">
                                Review
                            </button>
                        </div>
                        <div class="moderation-item d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <i class="fas fa-check-circle text-success me-2"></i>
                                <div>
                                    <h6 class="mb-0">15 files approved today</h6>
                                    <small class="text-muted">All clear</small>
                                </div>
                            </div>
                            <span class="badge bg-success">Good</span>
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
                <h5 class="modal-title">Upload Account Media</h5>
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
                                <option value="root">Account Media (Root)</option>
                                <option value="team-assets">Team Assets</option>
                                <option value="profiles">Profile Media</option>
                                <option value="marketing">Marketing</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Visibility</label>
                            <select class="form-select">
                                <option value="account">Account Team Only</option>
                                <option value="users">All Account Users</option>
                                <option value="public">Public (Portfolio use)</option>
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
.media-folder-card.account-folder {
    border-color: #17a2b8;
}

.media-folder-card.user-folder {
    border-color: #ffc107;
}

.media-item-card.account-media {
    border-color: #17a2b8;
}

.media-item-card.user-media {
    border-color: #ffc107;
}

.activity-item, .moderation-item {
    padding: 0.75rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
}

.activity-item:hover, .moderation-item:hover {
    background-color: #f8f9fa;
}

/* Reuse existing media styles */
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
    border-color: #17a2b8;
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

.folder-source {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
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
    border: 2px dashed #17a2b8;
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
    color: #17a2b8;
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
    border-color: #17a2b8;
    background-color: #f8f9fa;
}
</style>

<script>
function manageUserUploads() {
    document.getElementById('userMedia').checked = true;
    filterMedia('user');
    document.getElementById('userManagementPanel').style.display = 'block';
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

function filterByOwner(owner) {
    alert(`Filtering by owner: ${owner}`);
}

function filterByUser() {
    const user = document.getElementById('userSelect').value;
    alert(`Filtering by user: ${user}`);
}

function moderateContent() {
    alert('Opening content moderation panel...');
}

function filterMedia(scope) {
    const accountMedia = document.querySelectorAll('.account-media, .account-folder');
    const userMedia = document.querySelectorAll('.user-media, .user-folder');
    const userPanel = document.getElementById('userManagementPanel');
    
    userPanel.style.display = 'none';
    
    if (scope === 'account') {
        accountMedia.forEach(el => el.style.display = 'block');
        userMedia.forEach(el => el.style.display = 'none');
    } else if (scope === 'user') {
        accountMedia.forEach(el => el.style.display = 'none');
        userMedia.forEach(el => el.style.display = 'block');
        userPanel.style.display = 'block';
    } else {
        accountMedia.forEach(el => el.style.display = 'block');
        userMedia.forEach(el => el.style.display = 'block');
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

function shareMedia(filename, event) {
    event.stopPropagation();
    alert(`Sharing: ${filename}`);
}

function approveMedia(filename, event) {
    event.stopPropagation();
    alert(`Approving: ${filename}`);
}

function moderateMedia(filename, event) {
    event.stopPropagation();
    alert(`Moderating: ${filename}`);
}

function reviewActivity(activityId) {
    alert(`Reviewing activity: ${activityId}`);
}

function reviewPending() {
    alert('Opening pending content review...');
}

function reviewFlagged() {
    alert('Opening flagged content review...');
}

// Media scope toggle handling
document.querySelectorAll('input[name="mediaScope"]').forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.id === 'accountMedia') {
            filterMedia('account');
        } else if (this.id === 'userMedia') {
            filterMedia('user');
        } else if (this.id === 'sharedMedia') {
            filterMedia('shared');
        } else {
            filterMedia('all');
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