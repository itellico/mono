<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

echo renderHeader("Blog - Go Models NYC", "Admin User", "Marketplace Admin", "Tenant");
?>

<div class="d-flex">
    <?php echo renderSidebar('Tenant', getTenantSidebarItems(), 'blocks/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Tenant', 'href' => '../index.php'],
            ['label' => 'Blog']
        ]);
        
        echo createHeroSection(
            "Blog Management System",
            "Create engaging blog posts using drag-and-drop content blocks. Build professional articles, stories, and marketing content with ease.",
            "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=300&fit=crop",
            [
                ['label' => 'New Article', 'icon' => 'fas fa-plus', 'style' => 'success'],
                ['label' => 'Block Library', 'icon' => 'fas fa-cubes', 'style' => 'info'],
                ['label' => 'Templates', 'icon' => 'fas fa-layer-group', 'style' => 'warning'],
                ['label' => 'Published', 'icon' => 'fas fa-globe', 'style' => 'primary']
            ]
        );
        ?>
        
        <!-- Article Stats -->
        <div class="row mb-4">
            <?php
            echo createStatCard('Total Articles', '23', 'fas fa-file-alt', 'primary');
            echo createStatCard('Published', '18', 'fas fa-check-circle', 'success');
            echo createStatCard('Draft Articles', '5', 'fas fa-edit', 'warning');
            echo createStatCard('Total Views', '12,450', 'fas fa-eye', 'info');
            ?>
        </div>

        <!-- Action Toolbar -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text"><i class="fas fa-search"></i></span>
                                    <input type="text" class="form-control" id="searchArticles" placeholder="Search articles...">
                                </div>
                            </div>
                            <div class="col-md-3">
                                <select class="form-select" id="filterStatus">
                                    <option value="">All Status</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <div class="btn-group w-100">
                                    <button class="btn btn-success" data-bs-toggle="modal" data-bs-target="#newArticleModal">
                                        <i class="fas fa-plus me-2"></i>New Article
                                    </button>
                                    <button class="btn btn-info" data-bs-toggle="modal" data-bs-target="#blockLibraryModal">
                                        <i class="fas fa-cubes me-2"></i>Blocks
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Articles Grid -->
        <div class="row" id="articlesGrid">
            <!-- Sample Article Cards -->
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100 article-card" data-article-id="model-casting-guide">
                    <div class="position-relative">
                        <img src="https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=200&fit=crop" class="card-img-top" alt="Article Thumbnail">
                        <div class="position-absolute top-0 end-0 p-2">
                            <span class="badge bg-success">Published</span>
                        </div>
                        <div class="position-absolute bottom-0 start-0 p-2">
                            <small class="text-white bg-dark bg-opacity-75 px-2 py-1 rounded">
                                <i class="fas fa-eye me-1"></i>2,450 views
                            </small>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">The Complete Model Casting Guide</h5>
                        <p class="text-muted small mb-2">
                            <i class="fas fa-calendar me-1"></i>Published Jan 15, 2024
                            <span class="ms-3"><i class="fas fa-clock me-1"></i>5 min read</span>
                        </p>
                        <p class="card-text flex-grow-1">A comprehensive guide for models preparing for their first casting. Learn what to expect, how to prepare, and tips for success.</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="block-info">
                                    <small class="text-muted">
                                        <i class="fas fa-cubes me-1"></i>8 blocks
                                    </small>
                                </div>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="previewArticle('model-casting-guide')" title="Preview">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-outline-warning" onclick="editArticle('model-casting-guide')" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-info" onclick="duplicateArticle('model-casting-guide')" title="Duplicate">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="deleteArticle('model-casting-guide')" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100 article-card" data-article-id="fashion-photography-tips">
                    <div class="position-relative">
                        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop" class="card-img-top" alt="Article Thumbnail">
                        <div class="position-absolute top-0 end-0 p-2">
                            <span class="badge bg-warning">Draft</span>
                        </div>
                        <div class="position-absolute bottom-0 start-0 p-2">
                            <small class="text-white bg-dark bg-opacity-75 px-2 py-1 rounded">
                                <i class="fas fa-edit me-1"></i>Last edited 2h ago
                            </small>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">Fashion Photography: Lighting Techniques</h5>
                        <p class="text-muted small mb-2">
                            <i class="fas fa-user me-1"></i>Created by Admin User
                            <span class="ms-3"><i class="fas fa-clock me-1"></i>Draft</span>
                        </p>
                        <p class="card-text flex-grow-1">Master the art of fashion photography with professional lighting techniques. From studio setups to natural light, create stunning model portraits.</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="block-info">
                                    <small class="text-muted">
                                        <i class="fas fa-cubes me-1"></i>12 blocks
                                    </small>
                                </div>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="previewArticle('fashion-photography-tips')" title="Preview">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-outline-warning" onclick="editArticle('fashion-photography-tips')" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-info" onclick="duplicateArticle('fashion-photography-tips')" title="Duplicate">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="deleteArticle('fashion-photography-tips')" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100 article-card" data-article-id="runway-modeling-basics">
                    <div class="position-relative">
                        <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=200&fit=crop" class="card-img-top" alt="Article Thumbnail">
                        <div class="position-absolute top-0 end-0 p-2">
                            <span class="badge bg-info">Scheduled</span>
                        </div>
                        <div class="position-absolute bottom-0 start-0 p-2">
                            <small class="text-white bg-dark bg-opacity-75 px-2 py-1 rounded">
                                <i class="fas fa-calendar me-1"></i>Publishes Jan 25
                            </small>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">Runway Modeling: Walk, Pose, Succeed</h5>
                        <p class="text-muted small mb-2">
                            <i class="fas fa-calendar-check me-1"></i>Scheduled for Jan 25, 2024
                            <span class="ms-3"><i class="fas fa-clock me-1"></i>7 min read</span>
                        </p>
                        <p class="card-text flex-grow-1">Everything you need to know about runway modeling. Learn the perfect walk, posing techniques, and how to command the catwalk with confidence.</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="block-info">
                                    <small class="text-muted">
                                        <i class="fas fa-cubes me-1"></i>15 blocks
                                    </small>
                                </div>
                                <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" onclick="previewArticle('runway-modeling-basics')" title="Preview">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-outline-warning" onclick="editArticle('runway-modeling-basics')" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-info" onclick="duplicateArticle('runway-modeling-basics')" title="Duplicate">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" onclick="deleteArticle('runway-modeling-basics')" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Load More Button -->
        <div class="row">
            <div class="col-12 text-center">
                <button class="btn btn-outline-primary" onclick="loadMoreArticles()">
                    <i class="fas fa-plus me-2"></i>Load More Articles
                </button>
            </div>
        </div>
    </div>
</div>

<!-- New Article Modal -->
<div class="modal fade" id="newArticleModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Create New Blog Post</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="newArticleForm">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="mb-3">
                                <label class="form-label">Article Title *</label>
                                <input type="text" class="form-control" id="articleTitle" required placeholder="Enter your article title...">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Article Type</label>
                                <select class="form-select" id="articleType">
                                    <option value="guide">Guide</option>
                                    <option value="tutorial">Tutorial</option>
                                    <option value="news">News</option>
                                    <option value="interview">Interview</option>
                                    <option value="showcase">Showcase</option>
                                    <option value="blog">Blog Post</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="articleDescription" rows="3" placeholder="Brief description of your blog post..."></textarea>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-select" id="articleCategory">
                                    <option value="modeling">Modeling</option>
                                    <option value="photography">Photography</option>
                                    <option value="fashion">Fashion</option>
                                    <option value="industry">Industry News</option>
                                    <option value="tips">Tips & Advice</option>
                                    <option value="career">Career</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Template</label>
                                <select class="form-select" id="articleTemplate">
                                    <option value="blank">Blank Article</option>
                                    <option value="guide">Step-by-Step Guide</option>
                                    <option value="showcase">Model Showcase</option>
                                    <option value="interview">Interview Format</option>
                                    <option value="tutorial">Photo Tutorial</option>
                                    <option value="news">News Article</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Featured Image</label>
                        <div class="input-group">
                            <input type="file" class="form-control" id="featuredImage" accept="image/*">
                            <button class="btn btn-outline-secondary" type="button" onclick="openImageLibrary()">
                                <i class="fas fa-images me-1"></i>Library
                            </button>
                        </div>
                        <div class="form-text">Upload a featured image or select from your media library</div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Tags</label>
                                <input type="text" class="form-control" id="articleTags" placeholder="Enter tags separated by commas...">
                                <div class="form-text">e.g., modeling, fashion, photography</div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Reading Time</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="readingTime" min="1" max="60" value="5">
                                    <span class="input-group-text">minutes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mb-3">
                        <h6>SEO Settings</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Meta Title</label>
                                    <input type="text" class="form-control" id="metaTitle" placeholder="SEO title for search engines">
                                    <div class="form-text">Recommended: 50-60 characters</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">URL Slug</label>
                                    <input type="text" class="form-control" id="urlSlug" placeholder="blog-post-url-slug">
                                    <div class="form-text">Auto-generated from title</div>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Meta Description</label>
                            <textarea class="form-control" id="metaDescription" rows="2" placeholder="Brief description for search engines..."></textarea>
                            <div class="form-text">Recommended: 150-160 characters</div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allowComments" checked>
                                <label class="form-check-label" for="allowComments">
                                    Allow Comments
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="featuredArticle">
                                <label class="form-check-label" for="featuredArticle">
                                    Featured Article
                                </label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-outline-primary" onclick="saveDraft()">Save as Draft</button>
                <button type="button" class="btn btn-success" onclick="createArticle()">Create & Edit</button>
            </div>
        </div>
    </div>
</div>

<!-- Block Library Modal -->
<div class="modal fade" id="blockLibraryModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Block Library</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-md-3">
                        <div class="list-group" id="blockCategories">
                            <a href="#" class="list-group-item list-group-item-action active" onclick="showBlockCategory('content')">
                                <i class="fas fa-align-left me-2"></i>Content Blocks
                            </a>
                            <a href="#" class="list-group-item list-group-item-action" onclick="showBlockCategory('media')">
                                <i class="fas fa-images me-2"></i>Media Blocks
                            </a>
                            <a href="#" class="list-group-item list-group-item-action" onclick="showBlockCategory('layout')">
                                <i class="fas fa-th-large me-2"></i>Layout Blocks
                            </a>
                            <a href="#" class="list-group-item list-group-item-action" onclick="showBlockCategory('interactive')">
                                <i class="fas fa-mouse-pointer me-2"></i>Interactive
                            </a>
                            <a href="#" class="list-group-item list-group-item-action" onclick="showBlockCategory('data')">
                                <i class="fas fa-database me-2"></i>Data Blocks
                            </a>
                            <a href="#" class="list-group-item list-group-item-action" onclick="showBlockCategory('custom')">
                                <i class="fas fa-code me-2"></i>Custom Blocks
                            </a>
                        </div>
                    </div>
                    <div class="col-md-9">
                        <div id="blockGrid" class="row g-3">
                            <!-- Content Blocks -->
                            <div class="block-category" id="content-blocks">
                                <div class="col-md-4 mb-3">
                                    <div class="card h-100 block-item" data-block-type="text">
                                        <div class="card-body text-center">
                                            <i class="fas fa-font fa-2x text-primary mb-2"></i>
                                            <h6>Text Block</h6>
                                            <p class="small text-muted">Rich text editor with formatting options</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card h-100 block-item" data-block-type="heading">
                                        <div class="card-body text-center">
                                            <i class="fas fa-heading fa-2x text-success mb-2"></i>
                                            <h6>Heading</h6>
                                            <p class="small text-muted">Customizable headings (H1-H6)</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card h-100 block-item" data-block-type="quote">
                                        <div class="card-body text-center">
                                            <i class="fas fa-quote-left fa-2x text-info mb-2"></i>
                                            <h6>Quote Block</h6>
                                            <p class="small text-muted">Styled blockquotes with attribution</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card h-100 block-item" data-block-type="list">
                                        <div class="card-body text-center">
                                            <i class="fas fa-list fa-2x text-warning mb-2"></i>
                                            <h6>List Block</h6>
                                            <p class="small text-muted">Ordered and unordered lists</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card h-100 block-item" data-block-type="callout">
                                        <div class="card-body text-center">
                                            <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                                            <h6>Callout Box</h6>
                                            <p class="small text-muted">Highlighted information boxes</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <div class="card h-100 block-item" data-block-type="separator">
                                        <div class="card-body text-center">
                                            <i class="fas fa-minus fa-2x text-secondary mb-2"></i>
                                            <h6>Separator</h6>
                                            <p class="small text-muted">Visual content dividers</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary">Add Selected Blocks</button>
            </div>
        </div>
    </div>
</div>

<!-- Blog Post Editor Modal (Full Screen) -->
<div class="modal fade" id="articleEditorModal" tabindex="-1">
    <div class="modal-dialog modal-fullscreen">
        <div class="modal-content">
            <div class="modal-header">
                <div class="d-flex align-items-center">
                    <h5 class="modal-title me-3" id="editorTitle">Blog Post Editor</h5>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" onclick="togglePreview()">
                            <i class="fas fa-eye me-1"></i>Preview
                        </button>
                        <button class="btn btn-outline-primary" onclick="saveArticle()">
                            <i class="fas fa-save me-1"></i>Save
                        </button>
                        <button class="btn btn-success" onclick="publishArticle()">
                            <i class="fas fa-globe me-1"></i>Publish
                        </button>
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-0">
                <div class="container-fluid h-100">
                    <div class="row h-100">
                        <!-- Block Library Sidebar -->
                        <div class="col-md-3 bg-light border-end p-3" id="editorSidebar">
                            <h6>Add Blocks</h6>
                            <div class="block-palette">
                                <div class="row g-2">
                                    <div class="col-6">
                                        <div class="card block-palette-item" draggable="true" data-block="text">
                                            <div class="card-body text-center p-2">
                                                <i class="fas fa-font mb-1"></i>
                                                <small>Text</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="card block-palette-item" draggable="true" data-block="image">
                                            <div class="card-body text-center p-2">
                                                <i class="fas fa-image mb-1"></i>
                                                <small>Image</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="card block-palette-item" draggable="true" data-block="heading">
                                            <div class="card-body text-center p-2">
                                                <i class="fas fa-heading mb-1"></i>
                                                <small>Heading</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="card block-palette-item" draggable="true" data-block="gallery">
                                            <div class="card-body text-center p-2">
                                                <i class="fas fa-images mb-1"></i>
                                                <small>Gallery</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="card block-palette-item" draggable="true" data-block="quote">
                                            <div class="card-body text-center p-2">
                                                <i class="fas fa-quote-left mb-1"></i>
                                                <small>Quote</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="card block-palette-item" draggable="true" data-block="video">
                                            <div class="card-body text-center p-2">
                                                <i class="fas fa-video mb-1"></i>
                                                <small>Video</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="card block-palette-item" draggable="true" data-block="screenshot">
                                            <div class="card-body text-center p-2">
                                                <i class="fas fa-camera mb-1"></i>
                                                <small>Screenshot</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="card block-palette-item" draggable="true" data-block="models">
                                            <div class="card-body text-center p-2">
                                                <i class="fas fa-users mb-1"></i>
                                                <small>Models</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <h6>Article Settings</h6>
                            <div class="article-settings">
                                <div class="mb-3">
                                    <label class="form-label small">Status</label>
                                    <select class="form-select form-select-sm">
                                        <option>Draft</option>
                                        <option>Published</option>
                                        <option>Scheduled</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small">Visibility</label>
                                    <select class="form-select form-select-sm">
                                        <option>Public</option>
                                        <option>Private</option>
                                        <option>Password Protected</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <button class="btn btn-outline-primary btn-sm w-100" onclick="openMetadataEditor()">
                                        <i class="fas fa-cog me-1"></i>Metadata & SEO
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Article Canvas -->
                        <div class="col-md-9 p-0">
                            <div class="article-canvas h-100" id="articleCanvas">
                                <div class="canvas-header p-3 bg-white border-bottom">
                                    <input type="text" class="form-control form-control-lg border-0" placeholder="Article Title..." id="canvasTitle">
                                </div>
                                <div class="canvas-body p-3" id="canvasBody">
                                    <div class="drop-zone text-center py-5" id="mainDropZone">
                                        <i class="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                                        <h5 class="text-muted">Start Building Your Article</h5>
                                        <p class="text-muted">Drag blocks from the sidebar or click the + button to add content</p>
                                        <button class="btn btn-primary" onclick="addFirstBlock()">
                                            <i class="fas fa-plus me-2"></i>Add Your First Block
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Article Management JavaScript
let articles = [
    {
        id: 'model-casting-guide',
        title: 'The Complete Model Casting Guide',
        description: 'A comprehensive guide for models preparing for their first casting.',
        status: 'published',
        views: 2450,
        readTime: 5,
        blocks: 8,
        thumbnail: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=200&fit=crop',
        publishDate: '2024-01-15',
        category: 'modeling'
    },
    {
        id: 'fashion-photography-tips',
        title: 'Fashion Photography: Lighting Techniques',
        description: 'Master the art of fashion photography with professional lighting techniques.',
        status: 'draft',
        views: 0,
        readTime: 0,
        blocks: 12,
        thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop',
        lastEdited: '2 hours ago',
        category: 'photography'
    },
    {
        id: 'runway-modeling-basics',
        title: 'Runway Modeling: Walk, Pose, Succeed',
        description: 'Everything you need to know about runway modeling.',
        status: 'scheduled',
        views: 0,
        readTime: 7,
        blocks: 15,
        thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=200&fit=crop',
        scheduleDate: '2024-01-25',
        category: 'modeling'
    }
];

let currentEditingArticle = null;
let blockCounter = 0;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Auto-generate slug from title
    document.getElementById('articleTitle').addEventListener('input', function() {
        const title = this.value;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        document.getElementById('urlSlug').value = slug;
        
        // Auto-generate meta title if empty
        if (!document.getElementById('metaTitle').value) {
            document.getElementById('metaTitle').value = title;
        }
    });
    
    // Search functionality
    document.getElementById('searchArticles').addEventListener('input', filterArticles);
    document.getElementById('filterStatus').addEventListener('change', filterArticles);
    
    console.log('ClickDami Blog System - Fully Interactive Version Loaded');
});

// Article Management Functions
function createArticle() {
    const title = document.getElementById('articleTitle').value;
    const description = document.getElementById('articleDescription').value;
    const type = document.getElementById('articleType').value;
    const category = document.getElementById('articleCategory').value;
    const template = document.getElementById('articleTemplate').value;
    
    if (!title.trim()) {
        showToast('error', 'Article title is required');
        return;
    }
    
    const articleId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Create new article object
    const newArticle = {
        id: articleId,
        title: title,
        description: description,
        type: type,
        category: category,
        template: template,
        status: 'draft',
        views: 0,
        readTime: 0,
        blocks: 0,
        thumbnail: '',
        createdDate: new Date().toISOString().split('T')[0],
        blocks: []
    };
    
    articles.push(newArticle);
    currentEditingArticle = newArticle;
    
    // Close modal and open editor
    bootstrap.Modal.getInstance(document.getElementById('newArticleModal')).hide();
    
    // Open article editor
    setTimeout(() => {
        openArticleEditor(articleId);
    }, 300);
    
    showToast('success', `Article "${title}" created successfully!`);
}

function editArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    currentEditingArticle = article;
    openArticleEditor(articleId);
}

function openArticleEditor(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    document.getElementById('editorTitle').textContent = `Editing: ${article.title}`;
    document.getElementById('canvasTitle').value = article.title;
    
    // Load article content based on template or existing blocks
    loadArticleTemplate(article.template || 'blank');
    
    const modal = new bootstrap.Modal(document.getElementById('articleEditorModal'));
    modal.show();
    
    // Initialize drag and drop
    initializeDragAndDrop();
    
    showToast('info', 'Article editor loaded');
}

function loadArticleTemplate(template) {
    const canvasBody = document.getElementById('canvasBody');
    
    switch(template) {
        case 'guide':
            canvasBody.innerHTML = `
                <div class="article-block" data-block="heading">
                    <h2>Introduction</h2>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="article-block" data-block="text">
                    <p>Write your introduction here...</p>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="article-block" data-block="heading">
                    <h3>Step 1: Getting Started</h3>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="article-block" data-block="text">
                    <p>Describe the first step...</p>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            break;
        case 'showcase':
            canvasBody.innerHTML = `
                <div class="article-block" data-block="heading">
                    <h2>Featured Model Showcase</h2>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="article-block" data-block="models">
                    <div class="model-showcase-placeholder">
                        <i class="fas fa-users fa-3x text-muted mb-2"></i>
                        <p>Select models to showcase</p>
                    </div>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            break;
        default:
            canvasBody.innerHTML = `
                <div class="drop-zone text-center py-5" id="mainDropZone">
                    <i class="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Start Building Your Article</h5>
                    <p class="text-muted">Drag blocks from the sidebar or click the + button to add content</p>
                    <button class="btn btn-primary" onclick="addFirstBlock()">
                        <i class="fas fa-plus me-2"></i>Add Your First Block
                    </button>
                </div>
            `;
    }
}

function addFirstBlock() {
    addBlock('text');
}

function addBlock(blockType) {
    blockCounter++;
    const canvasBody = document.getElementById('canvasBody');
    
    // Remove drop zone if it exists
    const dropZone = document.getElementById('mainDropZone');
    if (dropZone) {
        dropZone.remove();
    }
    
    let blockHtml = '';
    
    switch(blockType) {
        case 'text':
            blockHtml = `
                <div class="article-block" data-block="text" id="block-${blockCounter}">
                    <div class="editable-content" contenteditable="true">
                        <p>Start typing your content here...</p>
                    </div>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-success" onclick="duplicateBlock(this)"><i class="fas fa-copy"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            break;
        case 'heading':
            blockHtml = `
                <div class="article-block" data-block="heading" id="block-${blockCounter}">
                    <h2 contenteditable="true">Your Heading Here</h2>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-success" onclick="duplicateBlock(this)"><i class="fas fa-copy"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            break;
        case 'image':
            blockHtml = `
                <div class="article-block" data-block="image" id="block-${blockCounter}">
                    <div class="image-placeholder text-center py-4 bg-light border rounded">
                        <i class="fas fa-image fa-3x text-muted mb-2"></i>
                        <p class="text-muted">Click to add an image</p>
                        <button class="btn btn-primary btn-sm" onclick="uploadImage(this)">Upload Image</button>
                    </div>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-success" onclick="duplicateBlock(this)"><i class="fas fa-copy"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            break;
        case 'screenshot':
            blockHtml = `
                <div class="article-block" data-block="screenshot" id="block-${blockCounter}">
                    <div class="screenshot-block bg-light border rounded p-3">
                        <div class="d-flex align-items-center mb-2">
                            <i class="fas fa-camera text-primary me-2"></i>
                            <h6 class="mb-0">Screenshot Block</h6>
                        </div>
                        <div class="screenshot-placeholder text-center py-3">
                            <i class="fas fa-camera fa-2x text-muted mb-2"></i>
                            <p class="text-muted small">Upload a screenshot with automatic annotations</p>
                            <button class="btn btn-outline-primary btn-sm" onclick="uploadScreenshot(this)">
                                <i class="fas fa-upload me-1"></i>Upload Screenshot
                            </button>
                        </div>
                        <div class="screenshot-metadata mt-2" style="display: none;">
                            <input type="text" class="form-control form-control-sm mb-1" placeholder="Screenshot title...">
                            <textarea class="form-control form-control-sm" rows="2" placeholder="Description or caption..."></textarea>
                        </div>
                    </div>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-success" onclick="duplicateBlock(this)"><i class="fas fa-copy"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            break;
        case 'quote':
            blockHtml = `
                <div class="article-block" data-block="quote" id="block-${blockCounter}">
                    <blockquote class="blockquote text-center">
                        <p class="mb-0" contenteditable="true">"Enter your quote here..."</p>
                        <footer class="blockquote-footer mt-2">
                            <cite contenteditable="true">Quote Author</cite>
                        </footer>
                    </blockquote>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-success" onclick="duplicateBlock(this)"><i class="fas fa-copy"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            break;
        case 'models':
            blockHtml = `
                <div class="article-block" data-block="models" id="block-${blockCounter}">
                    <div class="models-showcase bg-light border rounded p-3">
                        <div class="d-flex align-items-center justify-content-between mb-3">
                            <h6 class="mb-0">Featured Models</h6>
                            <button class="btn btn-sm btn-primary" onclick="selectModels(this)">
                                <i class="fas fa-plus me-1"></i>Select Models
                            </button>
                        </div>
                        <div class="row" id="selectedModels">
                            <div class="col-12 text-center py-3">
                                <i class="fas fa-users fa-2x text-muted mb-2"></i>
                                <p class="text-muted">No models selected</p>
                            </div>
                        </div>
                    </div>
                    <div class="block-controls">
                        <button class="btn btn-sm btn-outline-primary" onclick="editBlock(this)"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-outline-success" onclick="duplicateBlock(this)"><i class="fas fa-copy"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlock(this)"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            break;
    }
    
    canvasBody.insertAdjacentHTML('beforeend', blockHtml);
    
    // Add insertion point after this block
    addInsertionPoint(canvasBody.lastElementChild);
    
    showToast('success', `${blockType.charAt(0).toUpperCase() + blockType.slice(1)} block added`);
}

function addInsertionPoint(afterElement) {
    const insertionPoint = document.createElement('div');
    insertionPoint.className = 'insertion-point text-center py-2';
    insertionPoint.innerHTML = `
        <button class="btn btn-outline-primary btn-sm" onclick="showBlockMenu(this)">
            <i class="fas fa-plus me-1"></i>Add Block
        </button>
    `;
    afterElement.insertAdjacentElement('afterend', insertionPoint);
}

function showBlockMenu(button) {
    // Simple block menu - in real implementation this would be a proper dropdown
    const menu = `
        <div class="btn-group-vertical">
            <button class="btn btn-sm btn-outline-secondary" onclick="insertBlockAfter(this, 'text')">Text</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="insertBlockAfter(this, 'heading')">Heading</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="insertBlockAfter(this, 'image')">Image</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="insertBlockAfter(this, 'screenshot')">Screenshot</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="insertBlockAfter(this, 'quote')">Quote</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="insertBlockAfter(this, 'models')">Models</button>
        </div>
    `;
    
    // Replace button with menu temporarily
    const originalButton = button.outerHTML;
    button.outerHTML = menu;
    
    // Restore button after 3 seconds
    setTimeout(() => {
        const menuElement = document.querySelector('.btn-group-vertical');
        if (menuElement) {
            menuElement.outerHTML = originalButton;
        }
    }, 3000);
}

function insertBlockAfter(element, blockType) {
    const insertionPoint = element.closest('.insertion-point');
    addBlock(blockType);
    
    // Restore insertion point
    const originalButton = `
        <button class="btn btn-outline-primary btn-sm" onclick="showBlockMenu(this)">
            <i class="fas fa-plus me-1"></i>Add Block
        </button>
    `;
    insertionPoint.innerHTML = originalButton;
}

// Block manipulation functions
function editBlock(button) {
    const block = button.closest('.article-block');
    const blockType = block.dataset.block;
    
    showToast('info', `Editing ${blockType} block`);
    
    // For this demo, just highlight the block
    block.style.border = '2px solid #007bff';
    setTimeout(() => {
        block.style.border = '';
    }, 2000);
}

function duplicateBlock(button) {
    const block = button.closest('.article-block');
    const clone = block.cloneNode(true);
    
    // Update IDs
    blockCounter++;
    clone.id = `block-${blockCounter}`;
    
    block.insertAdjacentElement('afterend', clone);
    addInsertionPoint(clone);
    
    showToast('success', 'Block duplicated');
}

function deleteBlock(button) {
    const block = button.closest('.article-block');
    const blockType = block.dataset.block;
    
    if (confirm(`Delete this ${blockType} block?`)) {
        block.remove();
        showToast('success', 'Block deleted');
    }
}

// Specialized block functions
function uploadImage(button) {
    const placeholder = button.closest('.image-placeholder');
    
    // Simulate image upload
    setTimeout(() => {
        placeholder.innerHTML = `
            <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=300&fit=crop" class="img-fluid rounded" alt="Uploaded image">
            <div class="mt-2">
                <input type="text" class="form-control form-control-sm" placeholder="Image caption...">
            </div>
        `;
        showToast('success', 'Image uploaded successfully');
    }, 1000);
    
    showToast('info', 'Uploading image...');
}

function uploadScreenshot(button) {
    const placeholder = button.closest('.screenshot-placeholder');
    const metadata = button.closest('.screenshot-block').querySelector('.screenshot-metadata');
    
    // Simulate screenshot upload
    setTimeout(() => {
        placeholder.innerHTML = `
            <img src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=300&fit=crop" class="img-fluid rounded" alt="Screenshot">
            <div class="screenshot-annotations mt-2">
                <span class="badge bg-primary position-absolute" style="top: 20px; left: 50px;">1</span>
                <span class="badge bg-success position-absolute" style="top: 60px; left: 200px;">2</span>
            </div>
        `;
        metadata.style.display = 'block';
        showToast('success', 'Screenshot uploaded with auto-annotations');
    }, 1500);
    
    showToast('info', 'Processing screenshot...');
}

function selectModels(button) {
    const modelsContainer = button.closest('.models-showcase').querySelector('#selectedModels');
    
    // Simulate model selection
    setTimeout(() => {
        modelsContainer.innerHTML = `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <img src="https://randomuser.me/api/portraits/women/1.jpg" class="card-img-top" alt="Model">
                    <div class="card-body p-2">
                        <h6 class="card-title small mb-0">Sarah Johnson</h6>
                        <small class="text-muted">Fashion Model</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card">
                    <img src="https://randomuser.me/api/portraits/women/2.jpg" class="card-img-top" alt="Model">
                    <div class="card-body p-2">
                        <h6 class="card-title small mb-0">Emma Davis</h6>
                        <small class="text-muted">Editorial Model</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card">
                    <img src="https://randomuser.me/api/portraits/men/1.jpg" class="card-img-top" alt="Model">
                    <div class="card-body p-2">
                        <h6 class="card-title small mb-0">Michael Brown</h6>
                        <small class="text-muted">Commercial Model</small>
                    </div>
                </div>
            </div>
        `;
        showToast('success', '3 models selected for showcase');
    }, 1000);
    
    showToast('info', 'Loading model selection...');
}

// Article actions
function previewArticle(articleId) {
    showToast('info', 'Opening article preview...');
    // In real implementation, this would open a preview window
}

function duplicateArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    const newArticle = { 
        ...article, 
        id: article.id + '-copy',
        title: article.title + ' (Copy)',
        status: 'draft',
        views: 0
    };
    
    articles.push(newArticle);
    showToast('success', 'Article duplicated successfully');
}

function deleteArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;
    
    if (confirm(`Delete "${article.title}"? This action cannot be undone.`)) {
        articles = articles.filter(a => a.id !== articleId);
        
        // Remove from DOM
        const articleCard = document.querySelector(`[data-article-id="${articleId}"]`);
        if (articleCard) {
            articleCard.remove();
        }
        
        showToast('success', 'Article deleted successfully');
    }
}

function saveArticle() {
    if (!currentEditingArticle) return;
    
    const title = document.getElementById('canvasTitle').value;
    currentEditingArticle.title = title;
    
    showToast('success', 'Article saved as draft');
}

function publishArticle() {
    if (!currentEditingArticle) return;
    
    currentEditingArticle.status = 'published';
    currentEditingArticle.publishDate = new Date().toISOString().split('T')[0];
    
    showToast('success', 'Article published successfully!');
}

// Utility functions
function filterArticles() {
    const search = document.getElementById('searchArticles').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    
    const articleCards = document.querySelectorAll('.article-card');
    let visibleCount = 0;
    
    articleCards.forEach(card => {
        const articleId = card.dataset.articleId;
        const article = articles.find(a => a.id === articleId);
        
        if (!article) return;
        
        const matchesSearch = !search || 
            article.title.toLowerCase().includes(search) || 
            article.description.toLowerCase().includes(search);
        const matchesStatus = !status || article.status === status;
        
        if (matchesSearch && matchesStatus) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (search || status) {
        showToast('info', `Showing ${visibleCount} articles`);
    }
}

function loadMoreArticles() {
    showToast('info', 'Loading more articles...');
    // Simulate loading more articles
}

function saveDraft() {
    createArticle();
}

function openImageLibrary() {
    showToast('info', 'Opening media library...');
}

function openMetadataEditor() {
    showToast('info', 'Opening metadata editor...');
}

function initializeDragAndDrop() {
    // Simplified drag and drop implementation
    const paletteItems = document.querySelectorAll('.block-palette-item');
    const canvas = document.getElementById('canvasBody');
    
    paletteItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', item.dataset.block);
        });
    });
    
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const blockType = e.dataTransfer.getData('text/plain');
        addBlock(blockType);
    });
}

// Block library functions
function showBlockCategory(category) {
    // Update active category
    document.querySelectorAll('#blockCategories .list-group-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show relevant blocks
    const blockGrid = document.getElementById('blockGrid');
    
    switch(category) {
        case 'media':
            blockGrid.innerHTML = `
                <div class="col-md-4 mb-3">
                    <div class="card h-100 block-item">
                        <div class="card-body text-center">
                            <i class="fas fa-image fa-2x text-primary mb-2"></i>
                            <h6>Image</h6>
                            <p class="small text-muted">Single image with caption</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100 block-item">
                        <div class="card-body text-center">
                            <i class="fas fa-images fa-2x text-success mb-2"></i>
                            <h6>Gallery</h6>
                            <p class="small text-muted">Image gallery with lightbox</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100 block-item">
                        <div class="card-body text-center">
                            <i class="fas fa-video fa-2x text-info mb-2"></i>
                            <h6>Video</h6>
                            <p class="small text-muted">Embedded video player</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100 block-item">
                        <div class="card-body text-center">
                            <i class="fas fa-camera fa-2x text-warning mb-2"></i>
                            <h6>Screenshot</h6>
                            <p class="small text-muted">Annotated screenshots</p>
                        </div>
                    </div>
                </div>
            `;
            break;
        default:
            // Show content blocks by default
            blockGrid.innerHTML = `
                <div class="col-md-4 mb-3">
                    <div class="card h-100 block-item">
                        <div class="card-body text-center">
                            <i class="fas fa-font fa-2x text-primary mb-2"></i>
                            <h6>Text Block</h6>
                            <p class="small text-muted">Rich text editor</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100 block-item">
                        <div class="card-body text-center">
                            <i class="fas fa-heading fa-2x text-success mb-2"></i>
                            <h6>Heading</h6>
                            <p class="small text-muted">Customizable headings</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card h-100 block-item">
                        <div class="card-body text-center">
                            <i class="fas fa-quote-left fa-2x text-info mb-2"></i>
                            <h6>Quote</h6>
                            <p class="small text-muted">Styled blockquotes</p>
                        </div>
                    </div>
                </div>
            `;
    }
    
    showToast('info', `Showing ${category} blocks`);
}

function togglePreview() {
    showToast('info', 'Switching to preview mode...');
}

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
    
    toastContainer.innerHTML = toastHtml;
    const toastElement = toastContainer.querySelector('.toast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
</script>

<style>
.article-card {
    transition: transform 0.2s;
    cursor: pointer;
}

.article-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.article-canvas {
    background: #fff;
    height: 100vh;
    overflow-y: auto;
}

.canvas-body {
    min-height: 500px;
}

.article-block {
    position: relative;
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid transparent;
    border-radius: 4px;
}

.article-block:hover {
    border-color: #dee2e6;
    background-color: #f8f9fa;
}

.block-controls {
    position: absolute;
    top: -15px;
    right: 10px;
    opacity: 0;
    transition: opacity 0.2s;
}

.article-block:hover .block-controls {
    opacity: 1;
}

.block-palette-item {
    cursor: grab;
    transition: transform 0.2s;
}

.block-palette-item:hover {
    transform: scale(1.05);
}

.drop-zone {
    border: 2px dashed #dee2e6;
    border-radius: 8px;
    transition: all 0.2s;
}

.drop-zone:hover {
    border-color: #007bff;
    background-color: #f8f9fa;
}

.insertion-point {
    opacity: 0;
    transition: opacity 0.2s;
}

.insertion-point:hover {
    opacity: 1;
}

.editable-content:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}

.screenshot-block {
    position: relative;
}

.screenshot-annotations .badge {
    cursor: pointer;
}

.models-showcase .card {
    transition: transform 0.2s;
}

.models-showcase .card:hover {
    transform: scale(1.02);
}
</style>

<?php echo renderFooter(); ?>