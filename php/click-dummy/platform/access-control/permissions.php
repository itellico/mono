<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Permissions Management - Platform Admin", "Admin User", "Super Admin", "Platform");
?>

<div class="d-flex">
    <?php echo renderSidebar('Platform', getPlatformSidebarItems(), 'access-control/permissions.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Platform', 'href' => '../index.php'],
            ['label' => 'Access Control', 'href' => 'index.php'],
            ['label' => 'Permissions']
        ]);
        ?>
        
        <!-- Header Section -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="mb-1">Permissions Management</h2>
                <p class="text-muted mb-0">Define and organize system permissions</p>
            </div>
            <div class="btn-group">
                <button class="btn btn-outline-secondary" onclick="importPermissions()">
                    <i class="fas fa-upload me-2"></i> Import
                </button>
                <button class="btn btn-primary" onclick="createNewPermission()">
                    <i class="fas fa-plus me-2"></i> Create Permission
                </button>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <h6 class="text-muted mb-1">Total Permissions</h6>
                                <h3 class="mb-0">247</h3>
                            </div>
                            <div class="fs-2 text-primary">
                                <i class="fas fa-key"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <h6 class="text-muted mb-1">Permission Groups</h6>
                                <h3 class="mb-0">12</h3>
                            </div>
                            <div class="fs-2 text-success">
                                <i class="fas fa-folder"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <h6 class="text-muted mb-1">Unused</h6>
                                <h3 class="mb-0">18</h3>
                            </div>
                            <div class="fs-2 text-warning">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex align-items-center">
                            <div class="flex-grow-1">
                                <h6 class="text-muted mb-1">Recently Added</h6>
                                <h3 class="mb-0">7</h3>
                            </div>
                            <div class="fs-2 text-info">
                                <i class="fas fa-clock"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Filter and Search -->
        <div class="card mb-4">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label small text-muted">Search Permissions</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                            <input type="text" class="form-control" placeholder="e.g., user.profile.edit">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small text-muted">Module</label>
                        <select class="form-select">
                            <option>All Modules</option>
                            <option>User Management</option>
                            <option>Content Management</option>
                            <option>Marketplace</option>
                            <option>Analytics</option>
                            <option>Administration</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small text-muted">Status</label>
                        <select class="form-select">
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Deprecated</option>
                            <option>Unused</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button class="btn btn-primary w-100">
                            <i class="fas fa-filter me-2"></i> Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Permissions List -->
        <div class="card">
            <div class="card-header">
                <ul class="nav nav-tabs card-header-tabs" id="viewTabs">
                    <li class="nav-item">
                        <a class="nav-link active" href="#" onclick="switchView('grouped')">
                            <i class="fas fa-layer-group me-2"></i> Grouped View
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="switchView('list')">
                            <i class="fas fa-list me-2"></i> List View
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="switchView('tree')">
                            <i class="fas fa-sitemap me-2"></i> Tree View
                        </a>
                    </li>
                </ul>
            </div>
            <div class="card-body">
                <!-- Grouped View (Default) -->
                <div id="groupedView" class="view-content">
                    <!-- User Management Module -->
                    <div class="permission-module mb-4">
                        <h5 class="module-header">
                            <i class="fas fa-users text-primary me-2"></i> User Management
                            <span class="badge bg-secondary ms-2">42 permissions</span>
                        </h5>
                        <div class="permission-group">
                            <h6 class="text-muted mb-3">Profile Operations</h6>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="permission-card">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <code>user.profile.view</code>
                                                <p class="text-muted small mb-1">View user profile information</p>
                                                <div class="permission-meta">
                                                    <span class="badge bg-success me-1">Active</span>
                                                    <span class="badge bg-light text-dark me-1">
                                                        <i class="fas fa-users me-1"></i> 7 roles
                                                    </span>
                                                    <span class="badge bg-light text-dark">
                                                        <i class="fas fa-shield-alt me-1"></i> Read-only
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="dropdown">
                                                <button class="btn btn-sm btn-link" data-bs-toggle="dropdown">
                                                    <i class="fas fa-ellipsis-v"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item" href="#" onclick="editPermission('user.profile.view')">
                                                        <i class="fas fa-edit me-2"></i> Edit
                                                    </a></li>
                                                    <li><a class="dropdown-item" href="#" onclick="viewUsage('user.profile.view')">
                                                        <i class="fas fa-chart-bar me-2"></i> View Usage
                                                    </a></li>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li><a class="dropdown-item text-danger" href="#" onclick="deprecatePermission('user.profile.view')">
                                                        <i class="fas fa-archive me-2"></i> Deprecate
                                                    </a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="permission-card">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <code>user.profile.edit</code>
                                                <p class="text-muted small mb-1">Edit own profile information</p>
                                                <div class="permission-meta">
                                                    <span class="badge bg-success me-1">Active</span>
                                                    <span class="badge bg-light text-dark me-1">
                                                        <i class="fas fa-users me-1"></i> 6 roles
                                                    </span>
                                                    <span class="badge bg-light text-dark">
                                                        <i class="fas fa-pen me-1"></i> Write
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="dropdown">
                                                <button class="btn btn-sm btn-link" data-bs-toggle="dropdown">
                                                    <i class="fas fa-ellipsis-v"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item" href="#" onclick="editPermission('user.profile.edit')">
                                                        <i class="fas fa-edit me-2"></i> Edit
                                                    </a></li>
                                                    <li><a class="dropdown-item" href="#" onclick="viewUsage('user.profile.edit')">
                                                        <i class="fas fa-chart-bar me-2"></i> View Usage
                                                    </a></li>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li><a class="dropdown-item text-danger" href="#" onclick="deprecatePermission('user.profile.edit')">
                                                        <i class="fas fa-archive me-2"></i> Deprecate
                                                    </a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="permission-card">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <code>user.profile.delete</code>
                                                <p class="text-muted small mb-1">Delete user accounts</p>
                                                <div class="permission-meta">
                                                    <span class="badge bg-success me-1">Active</span>
                                                    <span class="badge bg-light text-dark me-1">
                                                        <i class="fas fa-users me-1"></i> 2 roles
                                                    </span>
                                                    <span class="badge bg-danger">
                                                        <i class="fas fa-trash me-1"></i> Destructive
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="dropdown">
                                                <button class="btn btn-sm btn-link" data-bs-toggle="dropdown">
                                                    <i class="fas fa-ellipsis-v"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item" href="#" onclick="editPermission('user.profile.delete')">
                                                        <i class="fas fa-edit me-2"></i> Edit
                                                    </a></li>
                                                    <li><a class="dropdown-item" href="#" onclick="viewUsage('user.profile.delete')">
                                                        <i class="fas fa-chart-bar me-2"></i> View Usage
                                                    </a></li>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li><a class="dropdown-item text-danger" href="#" onclick="deprecatePermission('user.profile.delete')">
                                                        <i class="fas fa-archive me-2"></i> Deprecate
                                                    </a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Content Management Module -->
                    <div class="permission-module mb-4">
                        <h5 class="module-header">
                            <i class="fas fa-file-alt text-success me-2"></i> Content Management
                            <span class="badge bg-secondary ms-2">38 permissions</span>
                        </h5>
                        <div class="permission-group">
                            <h6 class="text-muted mb-3">Portfolio Operations</h6>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="permission-card">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <code>content.portfolio.create</code>
                                                <p class="text-muted small mb-1">Create new portfolios</p>
                                                <div class="permission-meta">
                                                    <span class="badge bg-success me-1">Active</span>
                                                    <span class="badge bg-light text-dark me-1">
                                                        <i class="fas fa-users me-1"></i> 5 roles
                                                    </span>
                                                    <span class="badge bg-light text-dark">
                                                        <i class="fas fa-plus me-1"></i> Create
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="dropdown">
                                                <button class="btn btn-sm btn-link" data-bs-toggle="dropdown">
                                                    <i class="fas fa-ellipsis-v"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item" href="#" onclick="editPermission('content.portfolio.create')">
                                                        <i class="fas fa-edit me-2"></i> Edit
                                                    </a></li>
                                                    <li><a class="dropdown-item" href="#" onclick="viewUsage('content.portfolio.create')">
                                                        <i class="fas fa-chart-bar me-2"></i> View Usage
                                                    </a></li>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li><a class="dropdown-item text-danger" href="#" onclick="deprecatePermission('content.portfolio.create')">
                                                        <i class="fas fa-archive me-2"></i> Deprecate
                                                    </a></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- List View (Hidden by default) -->
                <div id="listView" class="view-content" style="display: none;">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Permission Key</th>
                                <th>Description</th>
                                <th>Module</th>
                                <th>Type</th>
                                <th>Roles</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><code>user.profile.view</code></td>
                                <td>View user profile information</td>
                                <td><span class="badge bg-primary">User Management</span></td>
                                <td><span class="badge bg-info">Read</span></td>
                                <td>7 roles</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPermission('user.profile.view')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deprecatePermission('user.profile.view')">
                                            <i class="fas fa-archive"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><code>user.profile.edit</code></td>
                                <td>Edit own profile information</td>
                                <td><span class="badge bg-primary">User Management</span></td>
                                <td><span class="badge bg-warning">Write</span></td>
                                <td>6 roles</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPermission('user.profile.edit')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deprecatePermission('user.profile.edit')">
                                            <i class="fas fa-archive"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><code>user.profile.delete</code></td>
                                <td>Delete user accounts</td>
                                <td><span class="badge bg-primary">User Management</span></td>
                                <td><span class="badge bg-danger">Delete</span></td>
                                <td>2 roles</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPermission('user.profile.delete')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deprecatePermission('user.profile.delete')">
                                            <i class="fas fa-archive"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><code>content.portfolio.create</code></td>
                                <td>Create new portfolios</td>
                                <td><span class="badge bg-success">Content Management</span></td>
                                <td><span class="badge bg-info">Create</span></td>
                                <td>5 roles</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPermission('content.portfolio.create')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deprecatePermission('content.portfolio.create')">
                                            <i class="fas fa-archive"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><code>content.portfolio.edit</code></td>
                                <td>Edit existing portfolios</td>
                                <td><span class="badge bg-success">Content Management</span></td>
                                <td><span class="badge bg-warning">Write</span></td>
                                <td>5 roles</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPermission('content.portfolio.edit')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deprecatePermission('content.portfolio.edit')">
                                            <i class="fas fa-archive"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><code>marketplace.listings.create</code></td>
                                <td>Create marketplace listings</td>
                                <td><span class="badge bg-warning">Marketplace</span></td>
                                <td><span class="badge bg-info">Create</span></td>
                                <td>4 roles</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPermission('marketplace.listings.create')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deprecatePermission('marketplace.listings.create')">
                                            <i class="fas fa-archive"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><code>analytics.reports.view</code></td>
                                <td>View analytics reports</td>
                                <td><span class="badge bg-info">Analytics</span></td>
                                <td><span class="badge bg-info">Read</span></td>
                                <td>3 roles</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPermission('analytics.reports.view')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deprecatePermission('analytics.reports.view')">
                                            <i class="fas fa-archive"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td><code>admin.settings.manage</code></td>
                                <td>Manage system settings</td>
                                <td><span class="badge bg-danger">Administration</span></td>
                                <td><span class="badge bg-warning">Write</span></td>
                                <td>2 roles</td>
                                <td><span class="badge bg-success">Active</span></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="editPermission('admin.settings.manage')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="deprecatePermission('admin.settings.manage')">
                                            <i class="fas fa-archive"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Tree View (Hidden by default) -->
                <div id="treeView" class="view-content" style="display: none;">
                    <div class="tree-container">
                        <ul class="tree-list">
                            <li class="tree-node">
                                <span class="tree-toggle" onclick="toggleTreeNode(this)">
                                    <i class="fas fa-chevron-down"></i>
                                </span>
                                <span class="tree-label">
                                    <i class="fas fa-users text-primary me-2"></i> 
                                    <strong>user</strong> (User Management)
                                </span>
                                <ul class="tree-children">
                                    <li class="tree-node">
                                        <span class="tree-toggle" onclick="toggleTreeNode(this)">
                                            <i class="fas fa-chevron-down"></i>
                                        </span>
                                        <span class="tree-label">
                                            <i class="fas fa-folder text-warning me-2"></i>
                                            <strong>profile</strong>
                                        </span>
                                        <ul class="tree-children">
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>view</code>
                                                    <span class="text-muted ms-2">View user profile information</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>edit</code>
                                                    <span class="text-muted ms-2">Edit own profile information</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>delete</code>
                                                    <span class="text-muted ms-2">Delete user accounts</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="tree-node">
                                        <span class="tree-toggle" onclick="toggleTreeNode(this)">
                                            <i class="fas fa-chevron-right"></i>
                                        </span>
                                        <span class="tree-label">
                                            <i class="fas fa-folder text-warning me-2"></i>
                                            <strong>settings</strong>
                                        </span>
                                        <ul class="tree-children" style="display: none;">
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>view</code>
                                                    <span class="text-muted ms-2">View user settings</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>update</code>
                                                    <span class="text-muted ms-2">Update user settings</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                            <li class="tree-node">
                                <span class="tree-toggle" onclick="toggleTreeNode(this)">
                                    <i class="fas fa-chevron-right"></i>
                                </span>
                                <span class="tree-label">
                                    <i class="fas fa-file-alt text-success me-2"></i>
                                    <strong>content</strong> (Content Management)
                                </span>
                                <ul class="tree-children" style="display: none;">
                                    <li class="tree-node">
                                        <span class="tree-toggle" onclick="toggleTreeNode(this)">
                                            <i class="fas fa-chevron-right"></i>
                                        </span>
                                        <span class="tree-label">
                                            <i class="fas fa-folder text-warning me-2"></i>
                                            <strong>portfolio</strong>
                                        </span>
                                        <ul class="tree-children" style="display: none;">
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>create</code>
                                                    <span class="text-muted ms-2">Create new portfolios</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>edit</code>
                                                    <span class="text-muted ms-2">Edit existing portfolios</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>delete</code>
                                                    <span class="text-muted ms-2">Delete portfolios</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                        </ul>
                                    </li>
                                    <li class="tree-node">
                                        <span class="tree-toggle" onclick="toggleTreeNode(this)">
                                            <i class="fas fa-chevron-right"></i>
                                        </span>
                                        <span class="tree-label">
                                            <i class="fas fa-folder text-warning me-2"></i>
                                            <strong>comp_card</strong>
                                        </span>
                                        <ul class="tree-children" style="display: none;">
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>create</code>
                                                    <span class="text-muted ms-2">Create comp cards</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>edit</code>
                                                    <span class="text-muted ms-2">Edit comp cards</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                            <li class="tree-node">
                                <span class="tree-toggle" onclick="toggleTreeNode(this)">
                                    <i class="fas fa-chevron-right"></i>
                                </span>
                                <span class="tree-label">
                                    <i class="fas fa-shopping-cart text-warning me-2"></i>
                                    <strong>marketplace</strong> (Marketplace)
                                </span>
                                <ul class="tree-children" style="display: none;">
                                    <li class="tree-node">
                                        <span class="tree-toggle" onclick="toggleTreeNode(this)">
                                            <i class="fas fa-chevron-right"></i>
                                        </span>
                                        <span class="tree-label">
                                            <i class="fas fa-folder text-warning me-2"></i>
                                            <strong>listings</strong>
                                        </span>
                                        <ul class="tree-children" style="display: none;">
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>create</code>
                                                    <span class="text-muted ms-2">Create marketplace listings</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                            <li class="tree-leaf">
                                                <span class="tree-permission">
                                                    <i class="fas fa-key text-muted me-2"></i>
                                                    <code>search</code>
                                                    <span class="text-muted ms-2">Search listings</span>
                                                    <span class="badge bg-success ms-2">Active</span>
                                                </span>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.module-header {
    padding: 0.75rem;
    background-color: #f8f9fa;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
    font-size: 1.1rem;
}

.permission-card {
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    transition: all 0.2s;
}

.permission-card:hover {
    border-color: #0d6efd;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.permission-card code {
    font-size: 0.9rem;
    background-color: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
}

.permission-meta {
    margin-top: 0.5rem;
}

.permission-group {
    padding-left: 1rem;
}

/* Tree View Styles */
.tree-container {
    padding: 1rem;
}

.tree-list {
    list-style: none;
    padding-left: 0;
    margin: 0;
}

.tree-children {
    list-style: none;
    padding-left: 2rem;
    margin: 0;
}

.tree-node, .tree-leaf {
    margin-bottom: 0.5rem;
}

.tree-toggle {
    cursor: pointer;
    display: inline-block;
    width: 20px;
    text-align: center;
    user-select: none;
}

.tree-toggle:hover {
    color: #0d6efd;
}

.tree-label {
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
}

.tree-label:hover {
    background-color: #f8f9fa;
}

.tree-permission {
    padding: 0.25rem 0.5rem;
    display: block;
    transition: background-color 0.2s;
    border-radius: 0.25rem;
}

.tree-permission:hover {
    background-color: #f8f9fa;
}

.tree-permission code {
    background-color: #e9ecef;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
}
</style>

<script>
function createNewPermission() {
    alert('Create new permission with:\n- Permission key (e.g., module.resource.action)\n- Display name\n- Description\n- Module assignment\n- Access type (read/write/delete)');
}

function editPermission(permissionKey) {
    alert('Edit permission: ' + permissionKey);
}

function viewUsage(permissionKey) {
    alert('View usage stats for: ' + permissionKey + '\n\nShow:\n- Roles using this permission\n- Users with this permission\n- Recent access logs');
}

function deprecatePermission(permissionKey) {
    if (confirm('Deprecate permission: ' + permissionKey + '?\n\nThis will mark it for removal in future versions.')) {
        alert('Permission deprecated');
    }
}

function importPermissions() {
    alert('Import permissions from:\n- JSON file\n- Another environment\n- Permission template');
}

function switchView(viewType) {
    // Hide all views
    document.getElementById('groupedView').style.display = 'none';
    document.getElementById('listView').style.display = 'none';
    document.getElementById('treeView').style.display = 'none';
    
    // Show selected view
    document.getElementById(viewType + 'View').style.display = 'block';
    
    // Update tab active states
    const tabs = document.querySelectorAll('#viewTabs .nav-link');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.toLowerCase().includes(viewType)) {
            tab.classList.add('active');
        }
    });
}

function toggleTreeNode(toggleElement) {
    const icon = toggleElement.querySelector('i');
    const parentLi = toggleElement.closest('.tree-node');
    const childrenUl = parentLi.querySelector(':scope > .tree-children');
    
    if (childrenUl) {
        if (childrenUl.style.display === 'none') {
            childrenUl.style.display = 'block';
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        } else {
            childrenUl.style.display = 'none';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
        }
    }
}
</script>

<?php echo renderFooter(); ?>