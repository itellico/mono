<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Template Engine - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'template-engine/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Template Engine']
        ]);
        ?>
        
        <!-- Template Engine Header -->
        <div class="bg-primary text-white p-4 rounded mb-4">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h2 class="mb-2">📧 Template Engine</h2>
                    <p class="mb-0 opacity-75">Manage MJML email templates with variables and multi-language support</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="btn-group">
                        <button class="btn btn-light" onclick="createTemplate()">
                            <i class="fas fa-plus me-2"></i> Create Template
                        </button>
                        <button class="btn btn-warning" onclick="showVariables()">
                            <i class="fas fa-code me-2"></i> Variables
                        </button>
                        <button class="btn btn-success" onclick="testTemplates()">
                            <i class="fas fa-vial me-2"></i> Test
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Template Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="display-6 text-primary mb-2">89</div>
                        <h6 class="text-muted mb-0">Email Templates</h6>
                        <small class="text-success">All categories</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="display-6 text-success mb-2">247</div>
                        <h6 class="text-muted mb-0">Template Variables</h6>
                        <small class="text-info">Available for use</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="display-6 text-warning mb-2">34</div>
                        <h6 class="text-muted mb-0">Active Components</h6>
                        <small class="text-primary">MJML blocks</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <div class="display-6 text-info mb-2">15.2K</div>
                        <h6 class="text-muted mb-0">Sent This Month</h6>
                        <small class="text-success">Email deliveries</small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Template Filters -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                            <input type="text" class="form-control" placeholder="Search templates..." id="searchTemplates">
                        </div>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="categoryFilter">
                            <option value="">All Categories</option>
                            <option value="system">System</option>
                            <option value="tenant">Tenant</option>
                            <option value="workflow">Workflow</option>
                            <option value="marketing">Marketing</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="statusFilter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="typeFilter">
                            <option value="">All Types</option>
                            <option value="mjml">MJML</option>
                            <option value="html">HTML</option>
                            <option value="text">Text</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary w-100" onclick="applyFilters()">
                            <i class="fas fa-filter me-2"></i>Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Template List -->
        <div class="card">
            <div class="card-header">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <h5 class="mb-0">📧 Email Templates</h5>
                    </div>
                    <div class="col-md-6 text-end">
                        <span class="badge bg-info me-2">Showing: 89 templates</span>
                    </div>
                </div>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th style="width: 300px;">Template Name</th>
                                <th style="width: 150px;">Category</th>
                                <th style="width: 200px;">Description</th>
                                <th style="width: 100px;">Type</th>
                                <th style="width: 100px;">Status</th>
                                <th style="width: 120px;">Last Modified</th>
                                <th style="width: 150px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-envelope text-primary me-2"></i>
                                        <div>
                                            <strong>Welcome Email</strong>
                                            <br><small class="text-muted">welcome-email-v2</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-primary">System</span>
                                </td>
                                <td>
                                    <small>New user welcome email with onboarding steps</small>
                                </td>
                                <td>
                                    <span class="badge bg-info">MJML</span>
                                </td>
                                <td>
                                    <span class="badge bg-success">Active</span>
                                </td>
                                <td>
                                    <small>2 hours ago</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTemplate('welcome-email-v2')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="previewTemplate('welcome-email-v2')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="testTemplate('welcome-email-v2')">
                                            <i class="fas fa-vial"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateTemplate('welcome-email-v2')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-key text-warning me-2"></i>
                                        <div>
                                            <strong>Password Reset</strong>
                                            <br><small class="text-muted">password-reset-secure</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-primary">System</span>
                                </td>
                                <td>
                                    <small>Secure password reset with time-limited token</small>
                                </td>
                                <td>
                                    <span class="badge bg-info">MJML</span>
                                </td>
                                <td>
                                    <span class="badge bg-success">Active</span>
                                </td>
                                <td>
                                    <small>1 day ago</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTemplate('password-reset-secure')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="previewTemplate('password-reset-secure')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="testTemplate('password-reset-secure')">
                                            <i class="fas fa-vial"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateTemplate('password-reset-secure')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-check-circle text-success me-2"></i>
                                        <div>
                                            <strong>Account Verification</strong>
                                            <br><small class="text-muted">account-verification-v3</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-primary">System</span>
                                </td>
                                <td>
                                    <small>Email verification with security code</small>
                                </td>
                                <td>
                                    <span class="badge bg-info">MJML</span>
                                </td>
                                <td>
                                    <span class="badge bg-success">Active</span>
                                </td>
                                <td>
                                    <small>3 days ago</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTemplate('account-verification-v3')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="previewTemplate('account-verification-v3')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="testTemplate('account-verification-v3')">
                                            <i class="fas fa-vial"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateTemplate('account-verification-v3')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-file-alt text-info me-2"></i>
                                        <div>
                                            <strong>Booking Confirmation</strong>
                                            <br><small class="text-muted">booking-confirmation-new</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-success">Workflow</span>
                                </td>
                                <td>
                                    <small>Job booking confirmation with details</small>
                                </td>
                                <td>
                                    <span class="badge bg-info">MJML</span>
                                </td>
                                <td>
                                    <span class="badge bg-success">Active</span>
                                </td>
                                <td>
                                    <small>5 hours ago</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTemplate('booking-confirmation-new')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="previewTemplate('booking-confirmation-new')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="testTemplate('booking-confirmation-new')">
                                            <i class="fas fa-vial"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateTemplate('booking-confirmation-new')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-bullhorn text-warning me-2"></i>
                                        <div>
                                            <strong>Casting Call Invitation</strong>
                                            <br><small class="text-muted">casting-invitation-v1</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-success">Workflow</span>
                                </td>
                                <td>
                                    <small>Casting call invitation with deadline</small>
                                </td>
                                <td>
                                    <span class="badge bg-info">MJML</span>
                                </td>
                                <td>
                                    <span class="badge bg-success">Active</span>
                                </td>
                                <td>
                                    <small>1 week ago</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTemplate('casting-invitation-v1')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="previewTemplate('casting-invitation-v1')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="testTemplate('casting-invitation-v1')">
                                            <i class="fas fa-vial"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateTemplate('casting-invitation-v1')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-chart-line text-info me-2"></i>
                                        <div>
                                            <strong>Monthly Newsletter</strong>
                                            <br><small class="text-muted">newsletter-monthly-template</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-warning">Marketing</span>
                                </td>
                                <td>
                                    <small>Monthly newsletter with industry updates</small>
                                </td>
                                <td>
                                    <span class="badge bg-info">MJML</span>
                                </td>
                                <td>
                                    <span class="badge bg-warning">Draft</span>
                                </td>
                                <td>
                                    <small>3 days ago</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTemplate('newsletter-monthly-template')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="previewTemplate('newsletter-monthly-template')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="testTemplate('newsletter-monthly-template')">
                                            <i class="fas fa-vial"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateTemplate('newsletter-monthly-template')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <i class="fas fa-building text-secondary me-2"></i>
                                        <div>
                                            <strong>Tenant Onboarding</strong>
                                            <br><small class="text-muted">tenant-onboarding-flow</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge bg-info">Tenant</span>
                                </td>
                                <td>
                                    <small>Multi-step tenant onboarding sequence</small>
                                </td>
                                <td>
                                    <span class="badge bg-info">MJML</span>
                                </td>
                                <td>
                                    <span class="badge bg-success">Active</span>
                                </td>
                                <td>
                                    <small>2 weeks ago</small>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editTemplate('tenant-onboarding-flow')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-info" onclick="previewTemplate('tenant-onboarding-flow')">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-outline-success" onclick="testTemplate('tenant-onboarding-flow')">
                                            <i class="fas fa-vial"></i>
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="duplicateTemplate('tenant-onboarding-flow')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="card-footer">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <span class="text-muted">Showing 1 to 7 of 89 templates</span>
                        </div>
                        <div class="col-md-6">
                            <nav>
                                <ul class="pagination pagination-sm justify-content-end mb-0">
                                    <li class="page-item disabled">
                                        <span class="page-link">Previous</span>
                                    </li>
                                    <li class="page-item active">
                                        <span class="page-link">1</span>
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
            </div>
        </div>
    </div>
</div>

<!-- Template Creation Modal -->
<div class="modal fade" id="createTemplateModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create New Template</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Template Name</label>
                                <input type="text" class="form-control" placeholder="e.g., Welcome Email">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-select">
                                    <option>System Templates</option>
                                    <option>Tenant Templates</option>
                                    <option>Workflow Templates</option>
                                    <option>Marketing Templates</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" rows="2" placeholder="Template description..."></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Template Type</label>
                                <select class="form-select">
                                    <option>Email Template (MJML)</option>
                                    <option>SMS Template</option>
                                    <option>Push Notification</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Base Template</label>
                                <select class="form-select">
                                    <option>Blank Template</option>
                                    <option>Basic Layout</option>
                                    <option>Marketing Layout</option>
                                    <option>Transactional Layout</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary">Create Template</button>
            </div>
        </div>
    </div>
</div>

<script>
// Template management functions
function createTemplate() {
    const modal = new bootstrap.Modal(document.getElementById('createTemplateModal'));
    modal.show();
}

function templateBuilder() {
    alert('Visual Template Builder: Open drag-and-drop MJML editor with live preview and component library.');
}

function editTemplate(templateId) {
    // Redirect to the template editor page
    window.location.href = `editor.php?template=${templateId}`;
}

function previewTemplate(templateId) {
    alert(`Preview Template: ${templateId} - Show rendered email with sample data in browser window.`);
}

function testTemplate(templateId) {
    alert(`Test Template: ${templateId} - Send test email to specified address with sample data.`);
}

function duplicateTemplate(templateId) {
    alert(`Duplicate Template: ${templateId} - Create copy for customization.`);
}

function copyToClipboard(element) {
    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        const original = element.textContent;
        element.textContent = 'Copied!';
        element.style.color = '#28a745';
        setTimeout(() => {
            element.textContent = original;
            element.style.color = '';
        }, 1000);
    });
}

function sendTestEmail() {
    alert('Test Email: Sending template with sample data to test email address.');
}

function previewInBrowser() {
    alert('Browser Preview: Opening rendered template in new browser window.');
}

function showVisualEditor() {
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    alert('Visual Editor: Switch to drag-and-drop MJML editor.');
}

function showCodeEditor() {
    document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    alert('Code Editor: Switch to raw MJML/Nunjucks code editor.');
}

function saveTemplate() {
    alert('Save Template: Template saved with validation and version control.');
}

function validateTemplate() {
    alert('Validate MJML: Checking template syntax and variable references.');
}

function insertVariable() {
    alert('Insert Variable: Open variable picker to insert template variables at cursor position.');
}

function testRender() {
    alert('Test Render: Compile template with sample data and show result.');
}

// Live preview simulation
document.getElementById('mjmlEditor').addEventListener('input', function() {
    // In real implementation, this would compile MJML and update preview
    console.log('Template updated - would trigger live preview refresh');
});
</script>

<?php echo renderFooter(); ?>