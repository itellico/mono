<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Vertical Generator - Create New SaaS", "Developer", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'schema-builder/vertical-generator.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Schema Builder', 'href' => 'index.php'],
            ['label' => 'Vertical Generator']
        ]);
        ?>
        
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-8">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 class="mb-1">Create New SaaS Vertical</h2>
                            <p class="text-muted mb-0">Generate a complete SaaS application from industry templates</p>
                        </div>
                    </div>

                    <!-- Step 1: Choose Template -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Step 1: Choose Industry Template</h5>
                        </div>
                        <div class="card-body">
                            <div class="template-grid">
                                <div class="template-option active" onclick="selectTemplate('modeling-agency')">
                                    <div class="template-icon">
                                        <i class="fas fa-user-tie fa-2x"></i>
                                    </div>
                                    <h6>Modeling Agency</h6>
                                    <p class="text-muted small">Fashion, commercial, fitness models</p>
                                    <div class="template-stats">
                                        <span class="badge bg-info">5 models</span>
                                        <span class="badge bg-success">12 schemas</span>
                                    </div>
                                </div>

                                <div class="template-option" onclick="selectTemplate('pet-agency')">
                                    <div class="template-icon">
                                        <i class="fas fa-paw fa-2x"></i>
                                    </div>
                                    <h6>Pet Modeling Agency</h6>
                                    <p class="text-muted small">Animal talent, pet models, training</p>
                                    <div class="template-stats">
                                        <span class="badge bg-info">3 models</span>
                                        <span class="badge bg-success">8 schemas</span>
                                    </div>
                                </div>

                                <div class="template-option" onclick="selectTemplate('freelancer-marketplace')">
                                    <div class="template-icon">
                                        <i class="fas fa-laptop-code fa-2x"></i>
                                    </div>
                                    <h6>Freelancer Marketplace</h6>
                                    <p class="text-muted small">Skills, projects, client matching</p>
                                    <div class="template-stats">
                                        <span class="badge bg-info">4 models</span>
                                        <span class="badge bg-success">10 schemas</span>
                                    </div>
                                </div>

                                <div class="template-option" onclick="selectTemplate('talent-agency')">
                                    <div class="template-icon">
                                        <i class="fas fa-microphone fa-2x"></i>
                                    </div>
                                    <h6>Talent Agency</h6>
                                    <p class="text-muted small">Actors, voice talent, performers</p>
                                    <div class="template-stats">
                                        <span class="badge bg-info">6 models</span>
                                        <span class="badge bg-success">15 schemas</span>
                                    </div>
                                </div>

                                <div class="template-option" onclick="selectTemplate('property-rental')">
                                    <div class="template-icon">
                                        <i class="fas fa-home fa-2x"></i>
                                    </div>
                                    <h6>Property Rental</h6>
                                    <p class="text-muted small">Properties, bookings, reviews</p>
                                    <div class="template-stats">
                                        <span class="badge bg-info">5 models</span>
                                        <span class="badge bg-success">11 schemas</span>
                                    </div>
                                </div>

                                <div class="template-option" onclick="selectTemplate('custom')">
                                    <div class="template-icon">
                                        <i class="fas fa-cogs fa-2x"></i>
                                    </div>
                                    <h6>Custom Template</h6>
                                    <p class="text-muted small">Start from scratch</p>
                                    <div class="template-stats">
                                        <span class="badge bg-secondary">Blank</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 2: Configuration -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Step 2: Configure Your SaaS</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Project Name</label>
                                        <input type="text" class="form-control" id="projectName" placeholder="e.g., PetStars Agency">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label class="form-label">Domain/Slug</label>
                                        <div class="input-group">
                                            <input type="text" class="form-control" id="projectSlug" placeholder="petstars">
                                            <span class="input-group-text">.mono.com</span>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label">Database Name</label>
                                        <input type="text" class="form-control" id="databaseName" placeholder="petstars_db">
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Primary Color</label>
                                        <input type="color" class="form-control form-control-color" value="#0d6efd">
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label">Target Region</label>
                                        <select class="form-select">
                                            <option>Global (Multi-region)</option>
                                            <option>North America</option>
                                            <option>Europe</option>
                                            <option>Asia Pacific</option>
                                        </select>
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label">Features</label>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="feature-payments" checked>
                                            <label class="form-check-label" for="feature-payments">
                                                Payment Processing
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="feature-calendar" checked>
                                            <label class="form-check-label" for="feature-calendar">
                                                Calendar Booking
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="feature-chat">
                                            <label class="form-check-label" for="feature-chat">
                                                Real-time Chat
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Step 3: Preview -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Step 3: Preview Generated Structure</h5>
                        </div>
                        <div class="card-body">
                            <div class="preview-structure">
                                <h6>Project Structure</h6>
                                <div class="file-tree">
                                    <div class="tree-item">
                                        <i class="fas fa-folder text-warning me-2"></i>
                                        <strong>apps/petstars/</strong>
                                        <div class="tree-children">
                                            <div class="tree-item">
                                                <i class="fas fa-file-code text-info me-2"></i>
                                                package.json
                                            </div>
                                            <div class="tree-item">
                                                <i class="fas fa-folder text-warning me-2"></i>
                                                src/
                                                <div class="tree-children">
                                                    <div class="tree-item">
                                                        <i class="fas fa-folder text-warning me-2"></i>
                                                        pages/
                                                        <div class="tree-children">
                                                            <div class="tree-item">
                                                                <i class="fas fa-file-code text-info me-2"></i>
                                                                index.tsx
                                                            </div>
                                                            <div class="tree-item">
                                                                <i class="fas fa-file-code text-info me-2"></i>
                                                                pets/index.tsx
                                                            </div>
                                                            <div class="tree-item">
                                                                <i class="fas fa-file-code text-info me-2"></i>
                                                                pets/[id].tsx
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="tree-item">
                                                        <i class="fas fa-folder text-warning me-2"></i>
                                                        components/
                                                        <div class="tree-children">
                                                            <div class="tree-item">
                                                                <i class="fas fa-file-code text-success me-2"></i>
                                                                PetCard.tsx
                                                            </div>
                                                            <div class="tree-item">
                                                                <i class="fas fa-file-code text-success me-2"></i>
                                                                PetForm.tsx
                                                            </div>
                                                            <div class="tree-item">
                                                                <i class="fas fa-file-code text-success me-2"></i>
                                                                PetGrid.tsx
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="tree-item">
                                        <i class="fas fa-folder text-warning me-2"></i>
                                        <strong>packages/petstars-api/</strong>
                                        <div class="tree-children">
                                            <div class="tree-item">
                                                <i class="fas fa-database text-primary me-2"></i>
                                                prisma/schema.prisma
                                            </div>
                                            <div class="tree-item">
                                                <i class="fas fa-folder text-warning me-2"></i>
                                                src/routes/
                                                <div class="tree-children">
                                                    <div class="tree-item">
                                                        <i class="fas fa-plug text-success me-2"></i>
                                                        pets.ts
                                                    </div>
                                                    <div class="tree-item">
                                                        <i class="fas fa-plug text-success me-2"></i>
                                                        bookings.ts
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Generate Button -->
                    <div class="d-flex justify-content-end">
                        <button class="btn btn-outline-secondary me-2" onclick="window.location.href='index.php'">
                            Cancel
                        </button>
                        <button class="btn btn-primary btn-lg" onclick="generateVertical()">
                            <i class="fas fa-rocket me-2"></i>
                            Generate SaaS Application
                        </button>
                    </div>
                </div>

                <!-- Right Sidebar -->
                <div class="col-md-4">
                    <!-- Template Details -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Template Details</h5>
                        </div>
                        <div class="card-body">
                            <div class="template-details">
                                <h6>Pet Modeling Agency</h6>
                                <p class="text-muted">Complete platform for pet talent agencies including animal models, training records, and booking management.</p>
                                
                                <h6 class="mt-3">Included Models</h6>
                                <ul class="list-unstyled">
                                    <li><i class="fas fa-dog text-primary me-2"></i> Pet Model</li>
                                    <li><i class="fas fa-user text-info me-2"></i> Pet Owner</li>
                                    <li><i class="fas fa-calendar text-success me-2"></i> Booking</li>
                                    <li><i class="fas fa-award text-warning me-2"></i> Training Session</li>
                                </ul>

                                <h6 class="mt-3">Features</h6>
                                <ul class="list-unstyled">
                                    <li><i class="fas fa-check text-success me-2"></i> Photo Upload</li>
                                    <li><i class="fas fa-check text-success me-2"></i> Breed Management</li>
                                    <li><i class="fas fa-check text-success me-2"></i> Training Tracking</li>
                                    <li><i class="fas fa-check text-success me-2"></i> Booking System</li>
                                    <li><i class="fas fa-check text-success me-2"></i> Health Records</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Generation Options -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Generation Options</h5>
                        </div>
                        <div class="card-body">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="gen-frontend" checked>
                                <label class="form-check-label" for="gen-frontend">
                                    Generate React Frontend
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="gen-api" checked>
                                <label class="form-check-label" for="gen-api">
                                    Generate API Backend
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="gen-db" checked>
                                <label class="form-check-label" for="gen-db">
                                    Generate Database Schema
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="gen-auth" checked>
                                <label class="form-check-label" for="gen-auth">
                                    Include Authentication
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="gen-admin" checked>
                                <label class="form-check-label" for="gen-admin">
                                    Generate Admin Panel
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Development Commands -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Next Steps</h5>
                        </div>
                        <div class="card-body">
                            <p class="text-muted">After generation, you'll run:</p>
                            <div class="command-preview">
                                <code>cd apps/petstars</code><br>
                                <code>npm install</code><br>
                                <code>npm run db:migrate</code><br>
                                <code>npm run dev</code>
                            </div>
                            <p class="text-muted mt-3">Your SaaS will be available at:<br>
                                <strong>petstars.localhost:3000</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.template-option {
    text-align: center;
    padding: 1.5rem;
    border: 2px solid #dee2e6;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}

.template-option:hover {
    border-color: #0d6efd;
    background: #f8f9fa;
}

.template-option.active {
    border-color: #0d6efd;
    background: #e7f1ff;
}

.template-icon {
    color: #0d6efd;
    margin-bottom: 1rem;
}

.template-stats {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

.file-tree {
    font-family: monospace;
    font-size: 0.9rem;
}

.tree-item {
    margin: 0.25rem 0;
    padding-left: 1rem;
}

.tree-children {
    margin-left: 1rem;
    border-left: 1px solid #dee2e6;
    padding-left: 1rem;
}

.command-preview {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.9rem;
}

.command-preview code {
    background: none;
    padding: 0;
    color: #0d6efd;
}

.template-details ul {
    font-size: 0.9rem;
}

.template-details li {
    margin-bottom: 0.5rem;
}
</style>

<script>
let selectedTemplate = 'pet-agency';

function selectTemplate(template) {
    selectedTemplate = template;
    
    // Update UI
    document.querySelectorAll('.template-option').forEach(el => {
        el.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Update project name based on template
    const projectNames = {
        'modeling-agency': 'Elite Models',
        'pet-agency': 'PetStars Agency',
        'freelancer-marketplace': 'SkillHub',
        'talent-agency': 'StarTalent',
        'property-rental': 'PropertyPro',
        'custom': 'My SaaS'
    };
    
    const slugs = {
        'modeling-agency': 'elitemodels',
        'pet-agency': 'petstars',
        'freelancer-marketplace': 'skillhub',
        'talent-agency': 'startalent',
        'property-rental': 'propertypro',
        'custom': 'mysaas'
    };
    
    document.getElementById('projectName').value = projectNames[template];
    document.getElementById('projectSlug').value = slugs[template];
    document.getElementById('databaseName').value = slugs[template] + '_db';
}

function generateVertical() {
    const projectName = document.getElementById('projectName').value;
    const projectSlug = document.getElementById('projectSlug').value;
    
    if (!projectName || !projectSlug) {
        alert('Please fill in project name and slug');
        return;
    }
    
    // Show loading
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';
    
    // Simulate generation process
    setTimeout(() => {
        showGenerationProgress();
    }, 1000);
}

function showGenerationProgress() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="modal fade show" style="display: block;" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Generating SaaS Application</h5>
                    </div>
                    <div class="modal-body">
                        <div class="progress-steps">
                            <div class="step completed">
                                <i class="fas fa-check-circle text-success"></i>
                                Creating project structure
                            </div>
                            <div class="step completed">
                                <i class="fas fa-check-circle text-success"></i>
                                Generating database schema
                            </div>
                            <div class="step completed">
                                <i class="fas fa-check-circle text-success"></i>
                                Creating API endpoints
                            </div>
                            <div class="step completed">
                                <i class="fas fa-check-circle text-success"></i>
                                Generating React components
                            </div>
                            <div class="step completed">
                                <i class="fas fa-check-circle text-success"></i>
                                Setting up authentication
                            </div>
                            <div class="step completed">
                                <i class="fas fa-check-circle text-success"></i>
                                Creating admin panel
                            </div>
                        </div>
                        <div class="alert alert-success mt-3">
                            <h6 class="alert-heading">🎉 Generation Complete!</h6>
                            <p class="mb-0">Your SaaS application has been generated successfully.</p>
                        </div>
                        <div class="generated-info">
                            <h6>Generated Files:</h6>
                            <ul>
                                <li>📁 apps/petstars/ - React frontend</li>
                                <li>📁 packages/petstars-api/ - API backend</li>
                                <li>🗄️ Database schema with 8 tables</li>
                                <li>⚛️ 15 React components</li>
                                <li>🔌 12 API endpoints</li>
                                <li>🔐 Complete authentication system</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="openInVSCode()">
                            <i class="fas fa-code me-2"></i>Open in VS Code
                        </button>
                        <button class="btn btn-success" onclick="startDevelopment()">
                            <i class="fas fa-play me-2"></i>Start Development
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function openInVSCode() {
    alert('Opening project in VS Code...');
}

function startDevelopment() {
    alert('Starting development server...\n\nYour SaaS will be available at:\nhttp://petstars.localhost:3000');
}

// Auto-generate slug from project name
document.getElementById('projectName').addEventListener('input', function(e) {
    const slug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .substring(0, 20);
    document.getElementById('projectSlug').value = slug;
    document.getElementById('databaseName').value = slug + '_db';
});
</script>

<style>
.progress-steps {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
}

.step.completed {
    background: #d4edda;
}

.generated-info {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 0.25rem;
    margin-top: 1rem;
}

.generated-info ul {
    margin-bottom: 0;
}
</style>

<?php echo renderFooter(); ?>