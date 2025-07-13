<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

// Get template ID from URL parameter
$templateId = $_GET['template'] ?? 'welcome-email-v2';

echo renderHeader("Template Editor - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'template-engine/editor.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Template Engine', 'href' => 'index.php'],
            ['label' => 'Template Editor']
        ]);
        ?>
        
        <!-- Template Editor Header -->
        <div class="bg-primary text-white p-4 rounded mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="mb-2">📧 Template Editor</h2>
                    <p class="mb-0 opacity-75">Visual MJML editor with live preview and variable management</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group">
                        <button class="btn btn-light" onclick="saveTemplate()">
                            <i class="fas fa-save me-2"></i> Save Template
                        </button>
                        <button class="btn btn-warning" onclick="validateTemplate()">
                            <i class="fas fa-check me-2"></i> Validate
                        </button>
                        <button class="btn btn-success" onclick="testTemplate()">
                            <i class="fas fa-paper-plane me-2"></i> Test Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Template Info Bar -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label class="form-label">Template Name</label>
                            <input type="text" class="form-control" value="Welcome Email" id="templateName">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="templateCategory">
                                <option value="system" selected>System</option>
                                <option value="tenant">Tenant</option>
                                <option value="workflow">Workflow</option>
                                <option value="marketing">Marketing</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="templateStatus">
                                <option value="active" selected>Active</option>
                                <option value="draft">Draft</option>
                                <option value="disabled">Disabled</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-group">
                            <label class="form-label">Type</label>
                            <select class="form-select" id="templateType">
                                <option value="mjml" selected>MJML</option>
                                <option value="html">HTML</option>
                                <option value="text">Text</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Editor Interface -->
        <div class="row g-4">
            <!-- Left Panel: Code Editor -->
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h5 class="mb-0">
                                    <i class="fas fa-code me-2"></i>
                                    MJML Editor
                                </h5>
                            </div>
                            <div class="col-md-6 text-end">
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary active" onclick="showCodeEditor()">
                                        <i class="fas fa-code"></i> Code
                                    </button>
                                    <button class="btn btn-outline-primary" onclick="showVisualEditor()">
                                        <i class="fas fa-eye"></i> Visual
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="editor-toolbar bg-light p-2 border-bottom">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-secondary" onclick="insertVariable()">
                                    <i class="fas fa-plus me-1"></i> Variable
                                </button>
                                <button class="btn btn-outline-secondary" onclick="insertComponent()">
                                    <i class="fas fa-puzzle-piece me-1"></i> Component
                                </button>
                                <button class="btn btn-outline-secondary" onclick="formatCode()">
                                    <i class="fas fa-align-left me-1"></i> Format
                                </button>
                                <button class="btn btn-outline-secondary" onclick="validateSyntax()">
                                    <i class="fas fa-check-circle me-1"></i> Validate
                                </button>
                            </div>
                        </div>
                        <div class="editor-container" style="height: 600px; position: relative;">
                            <textarea class="form-control h-100" id="mjmlEditor" style="font-family: 'Courier New', monospace; font-size: 14px; border: none; resize: none; outline: none;">
<mjml>
  <mj-head>
    <mj-title>Welcome to our platform!</mj-title>
    <mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" />
    <mj-attributes>
      <mj-all font-family="Roboto, Arial, sans-serif" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f0f0f0">
    <mj-section background-color="#ffffff" padding="40px">
      <mj-column>
        <mj-text font-size="32px" color="#333" align="center" font-weight="bold">
          Welcome, {{user.firstName}}!
        </mj-text>
        <mj-text font-size="18px" color="#666" align="center" line-height="1.6">
          Thank you for joining our platform. We're excited to have you on board!
        </mj-text>
        <mj-button background-color="#007bff" color="white" font-size="16px" align="center" href="{{platform.baseUrl}}/onboarding">
          Get Started
        </mj-button>
      </mj-column>
    </mj-section>
    
    <mj-section background-color="#f8f9fa" padding="30px">
      <mj-column>
        <mj-text font-size="16px" color="#666" align="center">
          If you have any questions, feel free to contact our support team.
        </mj-text>
        <mj-text font-size="14px" color="#999" align="center">
          {{platform.companyName}} | {{platform.address}}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
                            </textarea>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Right Panel: Live Preview -->
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h5 class="mb-0">
                                    <i class="fas fa-eye me-2"></i>
                                    Live Preview
                                </h5>
                            </div>
                            <div class="col-md-6 text-end">
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="refreshPreview()">
                                        <i class="fas fa-sync"></i> Refresh
                                    </button>
                                    <button class="btn btn-outline-primary" onclick="previewInNewTab()">
                                        <i class="fas fa-external-link-alt"></i> New Tab
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="preview-toolbar bg-light p-2 border-bottom">
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-secondary active" onclick="setPreviewMode('desktop')">
                                    <i class="fas fa-desktop me-1"></i> Desktop
                                </button>
                                <button class="btn btn-outline-secondary" onclick="setPreviewMode('tablet')">
                                    <i class="fas fa-tablet-alt me-1"></i> Tablet
                                </button>
                                <button class="btn btn-outline-secondary" onclick="setPreviewMode('mobile')">
                                    <i class="fas fa-mobile-alt me-1"></i> Mobile
                                </button>
                            </div>
                            <div class="btn-group btn-group-sm ms-2">
                                <button class="btn btn-outline-info" onclick="testRender()">
                                    <i class="fas fa-vial me-1"></i> Test Render
                                </button>
                            </div>
                        </div>
                        <div class="preview-container" style="height: 600px; overflow-y: auto; background: #f8f9fa;">
                            <div class="preview-frame" id="previewFrame" style="max-width: 100%; margin: 0 auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                                <!-- Live preview will be rendered here -->
                                <div class="p-4 text-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading preview...</span>
                                    </div>
                                    <p class="mt-2 text-muted">Rendering template preview...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Variable Library -->
        <div class="card mt-4">
            <div class="card-header">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h5 class="mb-0">
                            <i class="fas fa-code me-2"></i>
                            Variable Library
                        </h5>
                    </div>
                    <div class="col-md-6 text-end">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="addCustomVariable()">
                                <i class="fas fa-plus me-1"></i> Add Custom
                            </button>
                            <button class="btn btn-outline-secondary" onclick="importVariables()">
                                <i class="fas fa-upload me-1"></i> Import
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <!-- User Variables -->
                    <div class="col-md-4">
                        <h6 class="text-muted mb-3">User Variables</h6>
                        <div class="variable-group">
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{user.firstName}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{user.firstName}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{user.lastName}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{user.lastName}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{user.email}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{user.email}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{user.fullName}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{user.fullName}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Platform Variables -->
                    <div class="col-md-4">
                        <h6 class="text-muted mb-3">Platform Variables</h6>
                        <div class="variable-group">
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{platform.companyName}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{platform.companyName}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{platform.baseUrl}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{platform.baseUrl}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{platform.supportEmail}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{platform.supportEmail}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{platform.address}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{platform.address}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Dynamic Variables -->
                    <div class="col-md-4">
                        <h6 class="text-muted mb-3">Dynamic Variables</h6>
                        <div class="variable-group">
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{date.now}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{date.now}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{date.year}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{date.year}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{verification.code}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{verification.code}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <div class="variable-item d-flex justify-content-between align-items-center mb-2">
                                <code class="variable-code" onclick="copyToClipboard(this)">{{reset.token}}</code>
                                <button class="btn btn-sm btn-outline-primary" onclick="insertAtCursor('{{reset.token}}')">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Version History -->
        <div class="card mt-4">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="fas fa-history me-2"></i>
                    Version History
                </h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <div class="list-group">
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Version 2.1</strong> (Current)
                                    <br><small class="text-muted">Updated button styling and spacing - 2 hours ago</small>
                                </div>
                                <span class="badge bg-success">Current</span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Version 2.0</strong>
                                    <br><small class="text-muted">Major redesign with new color scheme - 1 day ago</small>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" onclick="restoreVersion('2.0')">
                                    Restore
                                </button>
                            </div>
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Version 1.8</strong>
                                    <br><small class="text-muted">Fixed mobile responsiveness issues - 3 days ago</small>
                                </div>
                                <button class="btn btn-sm btn-outline-primary" onclick="restoreVersion('1.8')">
                                    Restore
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h6>Version Control</h6>
                                <button class="btn btn-sm btn-outline-primary mb-2 w-100" onclick="createVersion()">
                                    <i class="fas fa-save me-1"></i> Create Version
                                </button>
                                <button class="btn btn-sm btn-outline-secondary mb-2 w-100" onclick="compareVersions()">
                                    <i class="fas fa-code-branch me-1"></i> Compare
                                </button>
                                <button class="btn btn-sm btn-outline-warning w-100" onclick="exportTemplate()">
                                    <i class="fas fa-download me-1"></i> Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.variable-code {
    background-color: #f8f9fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.variable-code:hover {
    background-color: #e9ecef;
}

.editor-toolbar {
    border-bottom: 1px solid #dee2e6;
}

.preview-toolbar {
    border-bottom: 1px solid #dee2e6;
}

.preview-frame {
    transition: max-width 0.3s ease;
}

.preview-frame.tablet {
    max-width: 768px;
}

.preview-frame.mobile {
    max-width: 375px;
}

.variable-item {
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.variable-item:hover {
    background-color: #f8f9fa;
}

#mjmlEditor {
    line-height: 1.4;
    tab-size: 2;
}

.editor-container {
    position: relative;
}

.card h-100 {
    min-height: 700px;
}
</style>

<script>
// Template editor functionality
function saveTemplate() {
    const content = document.getElementById('mjmlEditor').value;
    const name = document.getElementById('templateName').value;
    const category = document.getElementById('templateCategory').value;
    const status = document.getElementById('templateStatus').value;
    
    showToast('info', 'Saving template...');
    
    // Simulate API call
    setTimeout(() => {
        showToast('success', `Template "${name}" saved successfully!`);
    }, 1500);
}

function validateTemplate() {
    const content = document.getElementById('mjmlEditor').value;
    showToast('info', 'Validating MJML syntax...');
    
    // Simulate validation
    setTimeout(() => {
        showToast('success', 'Template validation passed! No errors found.');
    }, 1000);
}

function testTemplate() {
    showToast('info', 'Sending test email...');
    
    // Simulate test email
    setTimeout(() => {
        showToast('success', 'Test email sent successfully to admin@example.com');
    }, 2000);
}

function refreshPreview() {
    showToast('info', 'Refreshing preview...');
    const previewFrame = document.getElementById('previewFrame');
    previewFrame.innerHTML = `
        <div class="p-4 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading preview...</span>
            </div>
            <p class="mt-2 text-muted">Rendering template preview...</p>
        </div>
    `;
    
    setTimeout(() => {
        previewFrame.innerHTML = `
            <div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <h1 style="font-size: 32px; margin-bottom: 20px;">Welcome, John Doe!</h1>
                <p style="font-size: 18px; margin-bottom: 30px; opacity: 0.9;">Thank you for joining our platform. We're excited to have you on board!</p>
                <div style="margin: 30px 0;">
                    <a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
                </div>
            </div>
            <div style="background: #f8f9fa; padding: 30px; text-align: center; color: #666;">
                <p>If you have any questions, feel free to contact our support team.</p>
                <p style="font-size: 14px; color: #999;">Your Company | 123 Main Street, City, State 12345</p>
            </div>
        `;
        showToast('success', 'Preview updated successfully!');
    }, 1500);
}

function setPreviewMode(mode) {
    const previewFrame = document.getElementById('previewFrame');
    const buttons = document.querySelectorAll('.preview-toolbar .btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    previewFrame.classList.remove('tablet', 'mobile');
    if (mode !== 'desktop') {
        previewFrame.classList.add(mode);
    }
}

function insertAtCursor(text) {
    const editor = document.getElementById('mjmlEditor');
    const startPos = editor.selectionStart;
    const endPos = editor.selectionEnd;
    const beforeText = editor.value.substring(0, startPos);
    const afterText = editor.value.substring(endPos);
    
    editor.value = beforeText + text + afterText;
    editor.focus();
    editor.selectionStart = editor.selectionEnd = startPos + text.length;
    
    showToast('success', `Inserted ${text} at cursor position`);
}

function copyToClipboard(element) {
    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const original = element.textContent;
        element.textContent = 'Copied!';
        element.style.color = '#28a745';
        setTimeout(() => {
            element.textContent = original;
            element.style.color = '';
        }, 1000);
    });
}

function insertVariable() {
    showToast('info', 'Select a variable from the library below or type {{variable.name}}');
}

function insertComponent() {
    showToast('info', 'Opening component library...');
}

function formatCode() {
    showToast('success', 'Code formatted successfully!');
}

function validateSyntax() {
    showToast('success', 'Syntax validation passed!');
}

function previewInNewTab() {
    window.open('about:blank', '_blank');
    showToast('info', 'Opening preview in new tab...');
}

function testRender() {
    showToast('info', 'Testing template render with sample data...');
    setTimeout(() => {
        showToast('success', 'Template rendered successfully!');
    }, 1000);
}

function showCodeEditor() {
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    showToast('info', 'Switched to code editor mode');
}

function showVisualEditor() {
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    showToast('info', 'Visual editor mode (coming soon)');
}

function addCustomVariable() {
    const name = prompt('Enter variable name (e.g., booking.date):');
    if (name) {
        showToast('success', `Custom variable {{${name}}} added to library`);
    }
}

function importVariables() {
    showToast('info', 'Opening variable import dialog...');
}

function createVersion() {
    const comment = prompt('Enter version comment:');
    if (comment) {
        showToast('success', `Version created with comment: "${comment}"`);
    }
}

function compareVersions() {
    showToast('info', 'Opening version comparison tool...');
}

function exportTemplate() {
    showToast('info', 'Exporting template...');
    setTimeout(() => {
        showToast('success', 'Template exported as welcome-email-v2.mjml');
    }, 1000);
}

function restoreVersion(version) {
    if (confirm(`Are you sure you want to restore version ${version}? This will overwrite the current template.`)) {
        showToast('info', `Restoring version ${version}...`);
        setTimeout(() => {
            showToast('success', `Version ${version} restored successfully!`);
        }, 1500);
    }
}

// Auto-refresh preview when editor content changes
document.getElementById('mjmlEditor').addEventListener('input', function() {
    clearTimeout(window.previewTimeout);
    window.previewTimeout = setTimeout(refreshPreview, 2000);
});

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
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

// Initialize the editor
document.addEventListener('DOMContentLoaded', function() {
    // Load initial preview
    setTimeout(refreshPreview, 1000);
    
    console.log('Template editor initialized');
});
</script>

<?php echo renderFooter(); ?>