<?php
/**
 * Shared Media Library Components
 * 
 * This file contains reusable components for the media library system
 * across all tiers (Platform, Tenant, Account, User, Public)
 */

/**
 * Render media upload modal
 */
function renderMediaUploadModal($tier = 'platform', $options = []) {
    $modalId = $options['modalId'] ?? 'uploadModal';
    $title = $options['title'] ?? 'Upload Media Files';
    $folders = $options['folders'] ?? [];
    $accessLevels = $options['accessLevels'] ?? [];
    
    return '
    <div class="modal fade" id="' . $modalId . '" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">' . htmlspecialchars($title) . '</h5>
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
                                <select class="form-select" id="uploadFolder">
                                    ' . renderFolderOptions($folders) . '
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Access Level</label>
                                <select class="form-select" id="accessLevel">
                                    ' . renderAccessLevelOptions($accessLevels, $tier) . '
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
    </div>';
}

/**
 * Render folder options for upload modal
 */
function renderFolderOptions($folders) {
    if (empty($folders)) {
        return '<option value="root">Root Folder</option>';
    }
    
    $options = '';
    foreach ($folders as $folder) {
        $options .= '<option value="' . htmlspecialchars($folder['value']) . '">' . htmlspecialchars($folder['label']) . '</option>';
    }
    return $options;
}

/**
 * Render access level options based on tier
 */
function renderAccessLevelOptions($customLevels, $tier) {
    if (!empty($customLevels)) {
        $options = '';
        foreach ($customLevels as $level) {
            $options .= '<option value="' . htmlspecialchars($level['value']) . '">' . htmlspecialchars($level['label']) . '</option>';
        }
        return $options;
    }
    
    // Default access levels by tier
    switch ($tier) {
        case 'platform':
            return '
                <option value="platform">Platform Only</option>
                <option value="all-tenants">All Tenants</option>
                <option value="specific">Specific Tenants</option>';
                
        case 'tenant':
            return '
                <option value="tenant">Tenant Only</option>
                <option value="accounts">All Accounts</option>
                <option value="public">Public Access</option>';
                
        case 'account':
            return '
                <option value="account">Account Team Only</option>
                <option value="users">All Account Users</option>
                <option value="public">Public (Portfolio use)</option>';
                
        case 'user':
            return '
                <option value="private">Private (Only Me)</option>
                <option value="account">Account Team</option>
                <option value="public">Public Portfolio</option>';
                
        default:
            return '<option value="private">Private</option>';
    }
}

/**
 * Render media grid item
 */
function renderMediaItem($item, $tier = 'platform', $options = []) {
    $type = $item['type'] ?? 'image';
    $filename = $item['filename'] ?? 'unknown.jpg';
    $url = $item['url'] ?? '#';
    $size = $item['size'] ?? 'Unknown size';
    $usage = $item['usage'] ?? [];
    $owner = $item['owner'] ?? '';
    $status = $item['status'] ?? '';
    
    $colClass = $options['colClass'] ?? 'col-md-3';
    $cardClass = $options['cardClass'] ?? 'media-item-card';
    
    $preview = renderMediaPreview($type, $url, $filename);
    $overlay = renderMediaOverlay($filename, $type, $tier);
    $info = renderMediaInfo($filename, $size, $usage, $owner, $status);
    
    return '
    <div class="' . $colClass . '">
        <div class="' . $cardClass . '" onclick="selectMedia(\'' . htmlspecialchars($filename) . '\')">
            ' . $preview . '
            ' . $overlay . '
            ' . $info . '
        </div>
    </div>';
}

/**
 * Render media preview based on type
 */
function renderMediaPreview($type, $url, $filename) {
    switch ($type) {
        case 'image':
            return '
            <div class="media-preview">
                <img src="' . htmlspecialchars($url) . '" alt="' . htmlspecialchars($filename) . '" class="img-fluid">
            </div>';
            
        case 'video':
            return '
            <div class="media-preview">
                <div class="video-preview">
                    <i class="fas fa-play-circle fa-3x text-danger"></i>
                    <div class="video-duration">2:45</div>
                </div>
            </div>';
            
        case 'document':
        case 'pdf':
            return '
            <div class="media-preview">
                <div class="document-preview">
                    <i class="fas fa-file-pdf fa-3x text-danger"></i>
                </div>
            </div>';
            
        case 'svg':
            return '
            <div class="media-preview">
                <div class="svg-preview">
                    <i class="fas fa-file-image fa-3x text-info"></i>
                </div>
            </div>';
            
        default:
            return '
            <div class="media-preview">
                <div class="unknown-preview">
                    <i class="fas fa-file fa-3x text-muted"></i>
                </div>
            </div>';
    }
}

/**
 * Render media overlay with actions
 */
function renderMediaOverlay($filename, $type, $tier) {
    $actions = [];
    
    // Common actions
    $actions[] = '<button class="btn btn-sm btn-light" onclick="previewMedia(\'' . htmlspecialchars($filename) . '\', event)">
                    <i class="fas fa-eye"></i>
                  </button>';
    
    // Tier-specific actions
    switch ($tier) {
        case 'platform':
            $actions[] = '<button class="btn btn-sm btn-light" onclick="editMedia(\'' . htmlspecialchars($filename) . '\', event)">
                            <i class="fas fa-edit"></i>
                          </button>';
            break;
            
        case 'tenant':
            if ($type === 'image') {
                $actions[] = '<button class="btn btn-sm btn-light" onclick="editMedia(\'' . htmlspecialchars($filename) . '\', event)">
                                <i class="fas fa-edit"></i>
                              </button>';
            }
            $actions[] = '<button class="btn btn-sm btn-light" onclick="shareMedia(\'' . htmlspecialchars($filename) . '\', event)">
                            <i class="fas fa-share"></i>
                          </button>';
            break;
            
        case 'account':
            $actions[] = '<button class="btn btn-sm btn-light" onclick="approveMedia(\'' . htmlspecialchars($filename) . '\', event)">
                            <i class="fas fa-check"></i>
                          </button>';
            $actions[] = '<button class="btn btn-sm btn-light" onclick="moderateMedia(\'' . htmlspecialchars($filename) . '\', event)">
                            <i class="fas fa-flag"></i>
                          </button>';
            break;
            
        case 'user':
            if ($type === 'image') {
                $actions[] = '<button class="btn btn-sm btn-light" onclick="setAsProfile(\'' . htmlspecialchars($filename) . '\', event)">
                                <i class="fas fa-star"></i>
                              </button>';
            }
            $actions[] = '<button class="btn btn-sm btn-light" onclick="shareMedia(\'' . htmlspecialchars($filename) . '\', event)">
                            <i class="fas fa-share"></i>
                          </button>';
            break;
    }
    
    // Download action (always available)
    $actions[] = '<button class="btn btn-sm btn-light" onclick="downloadMedia(\'' . htmlspecialchars($filename) . '\', event)">
                    <i class="fas fa-download"></i>
                  </button>';
    
    return '
    <div class="media-overlay">
        ' . implode('', $actions) . '
    </div>';
}

/**
 * Render media info section
 */
function renderMediaInfo($filename, $size, $usage, $owner, $status) {
    $badges = [];
    
    // Add usage badges
    foreach ($usage as $badge) {
        $class = $badge['class'] ?? 'bg-secondary';
        $text = $badge['text'] ?? '';
        $badges[] = '<span class="badge ' . $class . '">' . htmlspecialchars($text) . '</span>';
    }
    
    // Add owner badge if specified
    if ($owner) {
        $badges[] = '<span class="badge bg-warning">' . htmlspecialchars($owner) . '</span>';
    }
    
    // Add status badge if specified
    if ($status) {
        $statusClass = match($status) {
            'approved' => 'bg-success',
            'pending' => 'bg-warning',
            'rejected' => 'bg-danger',
            default => 'bg-secondary'
        };
        $badges[] = '<span class="badge ' . $statusClass . '">' . htmlspecialchars(ucfirst($status)) . '</span>';
    }
    
    return '
    <div class="media-info">
        <h6 class="mb-1">' . htmlspecialchars($filename) . '</h6>
        <small class="text-muted">' . htmlspecialchars($size) . '</small>
        <div class="media-usage">
            ' . implode('', $badges) . '
        </div>
    </div>';
}

/**
 * Render folder card
 */
function renderFolderCard($folder, $tier = 'platform', $options = []) {
    $name = $folder['name'] ?? 'Untitled Folder';
    $count = $folder['count'] ?? 0;
    $id = $folder['id'] ?? 'folder';
    $icon = $folder['icon'] ?? 'fas fa-folder';
    $color = $folder['color'] ?? 'text-warning';
    $source = $folder['source'] ?? '';
    
    $colClass = $options['colClass'] ?? 'col-md-3';
    $cardClass = $options['cardClass'] ?? 'media-folder-card';
    
    $sourcebadge = '';
    if ($source) {
        $sourceClass = match($source) {
            'platform' => 'bg-secondary',
            'tenant' => 'bg-primary',
            'account' => 'bg-info',
            'user' => 'bg-warning',
            default => 'bg-secondary'
        };
        $sourceBadge = '<div class="folder-source">
                          <span class="badge ' . $sourceClass . '">' . htmlspecialchars(ucfirst($source)) . '</span>
                        </div>';
    }
    
    return '
    <div class="' . $colClass . '">
        <div class="' . $cardClass . '" onclick="openFolder(\'' . htmlspecialchars($id) . '\')">
            <div class="folder-icon">
                <i class="' . $icon . ' ' . $color . '"></i>
            </div>
            <div class="folder-info">
                <h6 class="mb-1">' . htmlspecialchars($name) . '</h6>
                <small class="text-muted">' . $count . ' files</small>
            </div>
            ' . $sourceBadge . '
            <div class="folder-actions">
                <button class="btn btn-sm btn-outline-secondary" onclick="editFolder(\'' . htmlspecialchars($id) . '\', event)">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
    </div>';
}

/**
 * Render upload zone
 */
function renderUploadZone($tier = 'platform', $options = []) {
    $title = $options['title'] ?? 'Upload New Media';
    $subtitle = $options['subtitle'] ?? 'Drag & drop or click to browse';
    $icon = $options['icon'] ?? 'fas fa-cloud-upload-alt';
    $colClass = $options['colClass'] ?? 'col-md-3';
    
    $color = match($tier) {
        'platform' => '#0d6efd',
        'tenant' => '#0d6efd', 
        'account' => '#17a2b8',
        'user' => '#ffc107',
        default => '#6c757d'
    };
    
    return '
    <div class="' . $colClass . '">
        <div class="upload-zone" onclick="uploadMedia()" style="border-color: ' . $color . ';">
            <div class="upload-icon">
                <i class="' . $icon . '" style="color: ' . $color . ';"></i>
            </div>
            <div class="upload-text">
                <h6>' . htmlspecialchars($title) . '</h6>
                <small class="text-muted">' . htmlspecialchars($subtitle) . '</small>
            </div>
        </div>
    </div>';
}

/**
 * Render media stats row
 */
function renderMediaStats($stats, $options = []) {
    $cards = [];
    
    foreach ($stats as $stat) {
        $title = $stat['title'] ?? '';
        $value = $stat['value'] ?? '0';
        $subtitle = $stat['subtitle'] ?? '';
        $color = $stat['color'] ?? '';
        $icon = $stat['icon'] ?? '';
        
        $colorClass = $color ? 'text-' . $color : '';
        $iconHtml = $icon ? '<i class="' . $icon . ' me-2"></i>' : '';
        
        $cards[] = '
        <div class="col-md-3">
            <div class="card">
                <div class="card-body">
                    <h6 class="text-muted mb-2">' . $iconHtml . htmlspecialchars($title) . '</h6>
                    <h3 class="mb-0 ' . $colorClass . '">' . htmlspecialchars($value) . '</h3>
                    <small class="text-muted">' . htmlspecialchars($subtitle) . '</small>
                </div>
            </div>
        </div>';
    }
    
    return '
    <div class="row g-3 mb-4">
        ' . implode('', $cards) . '
    </div>';
}

/**
 * Common CSS for media library components
 */
function renderMediaLibraryCSS() {
    return '
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

    .svg-preview, .video-preview, .document-preview, .unknown-preview {
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
        border: 2px dashed #dee2e6;
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

    .folder-breadcrumb, .album-breadcrumb {
        background: #f8f9fa;
        padding: 0.75rem;
        border-radius: 0.375rem;
    }

    .selected-actions {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        min-width: 400px;
    }
    </style>';
}

/**
 * Common JavaScript for media library functionality
 */
function renderMediaLibraryJS() {
    return '
    <script>
    // File upload handling
    function browseFiles() {
        document.getElementById("fileInput").click();
    }

    document.getElementById("fileInput").addEventListener("change", function(e) {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });

    // Drag and drop handling
    const dropzone = document.getElementById("uploadDropzone");
    if (dropzone) {
        dropzone.addEventListener("dragover", function(e) {
            e.preventDefault();
            dropzone.classList.add("dragover");
        });

        dropzone.addEventListener("dragleave", function(e) {
            e.preventDefault();
            dropzone.classList.remove("dragover");
        });

        dropzone.addEventListener("drop", function(e) {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            
            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        });
    }

    function handleFiles(files) {
        if (files.length > 0) {
            document.getElementById("startUpload").disabled = false;
            console.log(`${files.length} files selected for upload`);
        }
    }

    // Upload progress simulation
    document.getElementById("startUpload").addEventListener("click", function() {
        const progress = document.getElementById("uploadProgress");
        const progressBar = document.getElementById("progressBar");
        const progressText = document.getElementById("progressText");
        
        progress.style.display = "block";
        
        let percent = 0;
        const interval = setInterval(() => {
            percent += 10;
            progressBar.style.width = percent + "%";
            progressText.textContent = percent + "%";
            
            if (percent >= 100) {
                clearInterval(interval);
                alert("Upload completed successfully!");
                bootstrap.Modal.getInstance(document.getElementById("uploadModal")).hide();
                progress.style.display = "none";
                progressBar.style.width = "0%";
                progressText.textContent = "0%";
                
                // Refresh the page or update the media grid
                location.reload();
            }
        }, 200);
    });

    // Common media functions
    function setView(viewType) {
        document.querySelectorAll(".btn-group .btn").forEach(btn => btn.classList.remove("active"));
        event.target.classList.add("active");
    }

    function searchMedia() {
        const query = document.getElementById("mediaSearch").value;
        console.log(`Searching for: ${query}`);
    }

    function openFolder(folderId) {
        console.log(`Opening folder: ${folderId}`);
    }

    function editFolder(folderId, event) {
        event.stopPropagation();
        console.log(`Editing folder: ${folderId}`);
    }

    function selectMedia(filename) {
        console.log(`Selected: ${filename}`);
    }

    function previewMedia(filename, event) {
        event.stopPropagation();
        console.log(`Previewing: ${filename}`);
    }

    function downloadMedia(filename, event) {
        event.stopPropagation();
        console.log(`Downloading: ${filename}`);
    }

    function editMedia(filename, event) {
        event.stopPropagation();
        console.log(`Editing: ${filename}`);
    }

    function shareMedia(filename, event) {
        event.stopPropagation();
        console.log(`Sharing: ${filename}`);
    }

    function approveMedia(filename, event) {
        event.stopPropagation();
        console.log(`Approving: ${filename}`);
    }

    function moderateMedia(filename, event) {
        event.stopPropagation();
        console.log(`Moderating: ${filename}`);
    }

    function setAsProfile(filename, event) {
        event.stopPropagation();
        console.log(`Setting as profile: ${filename}`);
    }
    </script>';
}
?>