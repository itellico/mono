<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Schema Builder - Developer Platform", "Developer", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'schema-builder/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Schema Builder']
        ]);
        ?>
        
        <div class="container-fluid">
            <!-- Developer-Focused Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="mb-1">Schema Builder</h2>
                    <p class="text-muted mb-0">Build data models for rapid SaaS development</p>
                </div>
                <div class="btn-group">
                    <button class="btn btn-outline-info" onclick="window.location.href='vertical-generator.php'">
                        <i class="fas fa-magic me-2"></i> Generate Vertical
                    </button>
                    <button class="btn btn-outline-secondary" onclick="compileSchemas()">
                        <i class="fas fa-cogs me-2"></i> Compile All
                    </button>
                    <button class="btn btn-primary" onclick="createNewSchema()">
                        <i class="fas fa-plus me-2"></i> New Schema
                    </button>
                </div>
            </div>

            <!-- Developer Benefits -->
            <div class="alert alert-success mb-4">
                <div class="d-flex align-items-center">
                    <i class="fas fa-code fa-2x me-3"></i>
                    <div>
                        <h5 class="alert-heading mb-1">Developer-First Approach</h5>
                        <p class="mb-0">Define schemas once → Platform generates: Prisma models, TypeScript types, API endpoints, React components, and migrations. You focus on building great user experiences.</p>
                    </div>
                </div>
            </div>

            <!-- Current Schemas -->
            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Current Schemas</h5>
                        </div>
                        <div class="card-body">
                            <div class="schema-list">
                                <!-- Fashion Model Schema -->
                                <div class="schema-item">
                                    <div class="schema-header">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-1">fashion_model</h6>
                                                <small class="text-muted">Professional fashion and runway models</small>
                                            </div>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" onclick="editSchema('fashion_model')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="compileSchema('fashion_model')">
                                                    <i class="fas fa-cogs"></i>
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewGenerated('fashion_model')">
                                                    <i class="fas fa-code"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="schema-details">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <h6 class="small text-muted mb-2">FIELDS (12)</h6>
                                                <div class="field-tags">
                                                    <span class="badge bg-primary">name</span>
                                                    <span class="badge bg-info">height</span>
                                                    <span class="badge bg-info">weight</span>
                                                    <span class="badge bg-warning">measurements</span>
                                                    <span class="badge bg-secondary">hair_color</span>
                                                    <span class="badge bg-secondary">eye_color</span>
                                                    <span class="badge bg-success">experience</span>
                                                    <span class="badge bg-light text-dark">+5 more</span>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <h6 class="small text-muted mb-2">GENERATES</h6>
                                                <div class="generated-items">
                                                    <small class="me-3"><i class="fas fa-database text-primary me-1"></i> Prisma Model</small>
                                                    <small class="me-3"><i class="fas fa-code text-info me-1"></i> TypeScript Types</small>
                                                    <small class="me-3"><i class="fas fa-plug text-success me-1"></i> API Endpoints</small>
                                                    <small><i class="fas fa-wpforms text-warning me-1"></i> React Forms</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Pet Model Schema -->
                                <div class="schema-item">
                                    <div class="schema-header">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-1">pet_model</h6>
                                                <small class="text-muted">Animal talent and pet models</small>
                                            </div>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" onclick="editSchema('pet_model')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="compileSchema('pet_model')">
                                                    <i class="fas fa-cogs"></i>
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewGenerated('pet_model')">
                                                    <i class="fas fa-code"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="schema-details">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <h6 class="small text-muted mb-2">FIELDS (10)</h6>
                                                <div class="field-tags">
                                                    <span class="badge bg-primary">name</span>
                                                    <span class="badge bg-info">species</span>
                                                    <span class="badge bg-info">breed</span>
                                                    <span class="badge bg-warning">age</span>
                                                    <span class="badge bg-secondary">training</span>
                                                    <span class="badge bg-success">owner</span>
                                                    <span class="badge bg-light text-dark">+4 more</span>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <h6 class="small text-muted mb-2">OPTION SETS</h6>
                                                <div class="option-set-tags">
                                                    <span class="badge bg-outline-primary">pet_species</span>
                                                    <span class="badge bg-outline-info">dog_breeds</span>
                                                    <span class="badge bg-outline-warning">training_types</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Freelancer Schema -->
                                <div class="schema-item">
                                    <div class="schema-header">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-1">freelancer_profile</h6>
                                                <small class="text-muted">Freelance professionals and consultants</small>
                                            </div>
                                            <div class="btn-group btn-group-sm">
                                                <button class="btn btn-outline-primary" onclick="editSchema('freelancer_profile')">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn btn-outline-secondary" onclick="compileSchema('freelancer_profile')">
                                                    <i class="fas fa-cogs"></i>
                                                </button>
                                                <button class="btn btn-outline-info" onclick="viewGenerated('freelancer_profile')">
                                                    <i class="fas fa-code"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="schema-details">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <h6 class="small text-muted mb-2">FIELDS (15)</h6>
                                                <div class="field-tags">
                                                    <span class="badge bg-primary">name</span>
                                                    <span class="badge bg-info">skills</span>
                                                    <span class="badge bg-info">hourly_rate</span>
                                                    <span class="badge bg-warning">availability</span>
                                                    <span class="badge bg-secondary">portfolio</span>
                                                    <span class="badge bg-success">languages</span>
                                                    <span class="badge bg-light text-dark">+9 more</span>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <h6 class="small text-muted mb-2">RELATIONSHIPS</h6>
                                                <div class="relation-tags">
                                                    <span class="badge bg-outline-success">projects</span>
                                                    <span class="badge bg-outline-info">reviews</span>
                                                    <span class="badge bg-outline-warning">client</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Quick Actions</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="window.location.href='vertical-generator.php'">
                                    <i class="fas fa-rocket me-2"></i> Generate New Vertical
                                </button>
                                <button class="btn btn-outline-secondary" onclick="compileAllSchemas()">
                                    <i class="fas fa-cogs me-2"></i> Compile All Schemas
                                </button>
                                <button class="btn btn-outline-info" onclick="window.location.href='schema-editor.php'">
                                    <i class="fas fa-edit me-2"></i> Schema Editor
                                </button>
                                <button class="btn btn-outline-success" onclick="viewGeneratedCode()">
                                    <i class="fas fa-code me-2"></i> View Generated Code
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Compilation Status -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Compilation Status</h5>
                        </div>
                        <div class="card-body">
                            <div class="compilation-status">
                                <div class="status-item">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span>fashion_model</span>
                                        <span class="badge bg-success">Compiled</span>
                                    </div>
                                    <small class="text-muted">Generated 2 hours ago</small>
                                </div>
                                <div class="status-item">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span>pet_model</span>
                                        <span class="badge bg-warning">Needs Compile</span>
                                    </div>
                                    <small class="text-muted">Schema modified 10 minutes ago</small>
                                </div>
                                <div class="status-item">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span>freelancer_profile</span>
                                        <span class="badge bg-success">Compiled</span>
                                    </div>
                                    <small class="text-muted">Generated 1 day ago</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Generated Files -->
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Generated Files</h5>
                        </div>
                        <div class="card-body">
                            <div class="generated-files">
                                <div class="file-category">
                                    <h6 class="small text-muted">DATABASE</h6>
                                    <ul class="list-unstyled small">
                                        <li><i class="fas fa-database text-primary me-1"></i> prisma/schema.prisma</li>
                                        <li><i class="fas fa-file text-secondary me-1"></i> migrations/</li>
                                    </ul>
                                </div>
                                <div class="file-category">
                                    <h6 class="small text-muted">TYPESCRIPT</h6>
                                    <ul class="list-unstyled small">
                                        <li><i class="fas fa-code text-info me-1"></i> types/models.ts</li>
                                        <li><i class="fas fa-code text-info me-1"></i> types/api.ts</li>
                                    </ul>
                                </div>
                                <div class="file-category">
                                    <h6 class="small text-muted">API</h6>
                                    <ul class="list-unstyled small">
                                        <li><i class="fas fa-plug text-success me-1"></i> api/models/</li>
                                        <li><i class="fas fa-plug text-success me-1"></i> api/auth/</li>
                                    </ul>
                                </div>
                                <div class="file-category">
                                    <h6 class="small text-muted">REACT</h6>
                                    <ul class="list-unstyled small">
                                        <li><i class="fas fa-wpforms text-warning me-1"></i> components/forms/</li>
                                        <li><i class="fas fa-th text-warning me-1"></i> components/grids/</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Development Workflow -->
            <div class="card mt-4">
                <div class="card-header">
                    <h5 class="mb-0">Development Workflow</h5>
                </div>
                <div class="card-body">
                    <div class="workflow-steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h6>Define Schema</h6>
                                <p class="text-muted">Create your data model with fields, relationships, and validations</p>
                                <code>edit schemas/pet-agency/pet-model.ts</code>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h6>Compile</h6>
                                <p class="text-muted">Generate database models, types, API endpoints, and React components</p>
                                <code>npm run compile pet-agency</code>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h6>Develop Frontend</h6>
                                <p class="text-muted">Build your React pages using generated components and types</p>
                                <code>cd apps/pet-agency && npm run dev</code>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <h6>Deploy</h6>
                                <p class="text-muted">Deploy your complete SaaS application with database and API</p>
                                <code>npm run deploy pet-agency</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.schema-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.schema-item {
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
}

.schema-header {
    margin-bottom: 1rem;
}

.field-tags, .option-set-tags, .relation-tags, .generated-items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
}

.field-tags .badge, .option-set-tags .badge, .relation-tags .badge {
    font-size: 0.75rem;
}

.generated-items small {
    display: inline-block;
    margin-bottom: 0.25rem;
}

.compilation-status {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.status-item {
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 0.25rem;
}

.generated-files {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.file-category h6 {
    margin-bottom: 0.5rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid #dee2e6;
}

.workflow-steps {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.step {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.step-number {
    width: 2.5rem;
    height: 2.5rem;
    background: #0d6efd;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    flex-shrink: 0;
}

.step-content {
    flex-grow: 1;
}

.step-content h6 {
    margin-bottom: 0.5rem;
}

.step-content p {
    margin-bottom: 0.5rem;
}

.step-content code {
    background: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.bg-outline-primary {
    background: transparent;
    border: 1px solid #0d6efd;
    color: #0d6efd;
}

.bg-outline-info {
    background: transparent;
    border: 1px solid #0dcaf0;
    color: #0dcaf0;
}

.bg-outline-warning {
    background: transparent;
    border: 1px solid #ffc107;
    color: #ffc107;
}

.bg-outline-success {
    background: transparent;
    border: 1px solid #198754;
    color: #198754;
}
</style>

<script>
function createNewSchema() {
    window.location.href = 'schema-editor.php';
}

function editSchema(schemaName) {
    window.location.href = `schema-editor.php?schema=${schemaName}`;
}

function compileSchema(schemaName) {
    alert(`Compiling ${schemaName} schema...`);
    // In real implementation, this would trigger the compilation process
    setTimeout(() => {
        alert(`${schemaName} compiled successfully!\nGenerated: Prisma model, TypeScript types, API endpoints, React components`);
    }, 2000);
}

function compileAllSchemas() {
    alert('Compiling all schemas...');
    setTimeout(() => {
        alert('All schemas compiled successfully!');
    }, 3000);
}

function viewGenerated(schemaName) {
    window.open(`/generated-code/${schemaName}`, '_blank');
}

function viewGeneratedCode() {
    window.open('/generated-code/', '_blank');
}
</script>

<?php echo renderFooter(); ?>