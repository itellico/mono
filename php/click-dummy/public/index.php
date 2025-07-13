<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Public Tenants - Discover Professional Services & Marketplaces</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Explore our network of professional service providers and marketplaces. From modeling agencies to creative services, find trusted businesses and platforms.">
    <meta name="keywords" content="professional services, marketplaces, modeling agencies, creative services, business directory, trusted providers">
    <meta name="author" content="itellico Platform">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Public Tenants - Professional Services Directory">
    <meta property="og:description" content="Discover trusted professional service providers and marketplaces on our platform.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=630&fit=crop">
    
    <!-- Stylesheets -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>

<style>
/* Global Variables */
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --accent-color: #ff6b6b;
    --text-dark: #2c3e50;
    --text-light: #7f8c8d;
    --section-padding: 80px 0;
}

/* Global Font */
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header Styles */
.top-header {
    background: white;
    box-shadow: 0 2px 20px rgba(0,0,0,0.1);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

.logo {
    font-size: 2rem;
    font-weight: bold;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-decoration: none;
}

.nav-link {
    color: var(--text-dark);
    font-weight: 500;
    margin: 0 15px;
    transition: color 0.3s ease;
}

.nav-link:hover {
    color: #667eea;
}

/* Hero Section */
.hero-section {
    background: var(--primary-gradient);
    padding: 140px 0 80px;
    color: white;
    position: relative;
    overflow: hidden;
}

.hero-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=1080&fit=crop') center/cover;
    opacity: 0.1;
    z-index: 1;
}

.hero-content {
    position: relative;
    z-index: 2;
}

.hero-title {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    line-height: 1.2;
}

.hero-subtitle {
    font-size: 1.3rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

/* Tenant Cards */
.tenant-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    margin-bottom: 30px;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.tenant-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.tenant-header {
    position: relative;
    height: 200px;
    overflow: hidden;
}

.tenant-logo {
    position: absolute;
    top: 20px;
    left: 20px;
    background: white;
    padding: 15px 25px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    z-index: 2;
}

.tenant-cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.tenant-body {
    padding: 30px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
}

.tenant-name {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 10px;
    color: var(--text-dark);
}

.tenant-category {
    color: #667eea;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 15px;
}

.tenant-description {
    color: var(--text-light);
    line-height: 1.6;
    margin-bottom: 20px;
    flex-grow: 1;
}

.tenant-stats {
    display: flex;
    justify-content: space-between;
    padding: 20px 0;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    margin-bottom: 20px;
}

.stat-item {
    text-align: center;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-dark);
}

.stat-label {
    font-size: 0.85rem;
    color: var(--text-light);
}

.tenant-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
}

.tag {
    background: #f0f2f5;
    color: #495057;
    padding: 5px 12px;
    border-radius: 15px;
    font-size: 0.8rem;
}

.tenant-action {
    display: inline-block;
    background: var(--primary-gradient);
    color: white;
    padding: 12px 30px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    transition: transform 0.3s ease;
    text-align: center;
}

.tenant-action:hover {
    transform: translateY(-2px);
    color: white;
}

/* Featured Badge */
.featured-badge {
    position: absolute;
    top: 20px;
    right: 20px;
    background: #ff6b6b;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    z-index: 2;
}

/* Categories Section */
.categories-section {
    background: #f8f9fa;
    padding: var(--section-padding);
}

.category-filter {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 25px;
    padding: 10px 25px;
    margin: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-block;
    color: var(--text-dark);
    text-decoration: none;
}

.category-filter:hover,
.category-filter.active {
    background: var(--primary-gradient);
    color: white;
    border-color: transparent;
    transform: scale(1.05);
}

/* Stats Section */
.platform-stats {
    background: white;
    padding: 60px 0;
    border-top: 1px solid #e9ecef;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 40px;
}

.platform-stat {
    text-align: center;
}

.platform-stat-value {
    font-size: 3rem;
    font-weight: 700;
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.platform-stat-label {
    font-size: 1.1rem;
    color: var(--text-light);
}

/* Footer */
.main-footer {
    background: var(--text-dark);
    color: white;
    padding: 60px 0 30px;
}

.footer-link {
    color: #bdc3c7;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-link:hover {
    color: white;
}

/* Responsive Design */
@media (max-width: 768px) {
    .hero-title {
        font-size: 2.5rem;
    }
    
    .tenant-stats {
        flex-direction: column;
        gap: 15px;
    }
}
</style>

<!-- Top Header -->
<header class="top-header">
    <div class="container">
        <nav class="navbar navbar-expand-lg navbar-light">
            <a class="logo" href="/"><i class="fas fa-globe me-2"></i>Public Tenants</a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="#tenants">All Tenants</a></li>
                    <li class="nav-item"><a class="nav-link" href="#categories">Categories</a></li>
                    <li class="nav-item"><a class="nav-link" href="#about">About</a></li>
                    <li class="nav-item"><a class="nav-link" href="../">Back to Platform</a></li>
                </ul>
            </div>
        </nav>
    </div>
</header>

<!-- Hero Section -->
<section class="hero-section">
    <div class="container">
        <div class="hero-content text-center">
            <h1 class="hero-title">Discover Professional Services & Marketplaces</h1>
            <p class="hero-subtitle">Explore our network of trusted businesses, agencies, and service providers</p>
            
            <div class="d-flex justify-content-center gap-3 mt-4">
                <a href="#tenants" class="btn btn-light btn-lg">
                    <i class="fas fa-search me-2"></i>Browse Tenants
                </a>
                <a href="../register" class="btn btn-outline-light btn-lg">
                    <i class="fas fa-plus me-2"></i>List Your Business
                </a>
            </div>
        </div>
    </div>
</section>

<!-- Categories Filter -->
<section id="categories" class="categories-section">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="fw-bold">Browse by Category</h2>
            <p class="text-muted">Find businesses and services that match your needs</p>
        </div>
        
        <div class="text-center">
            <a href="#" class="category-filter active" data-category="all">All Categories</a>
            <a href="#" class="category-filter" data-category="agency">Agencies</a>
            <a href="#" class="category-filter" data-category="marketplace">Marketplaces</a>
            <a href="#" class="category-filter" data-category="creative">Creative Services</a>
            <a href="#" class="category-filter" data-category="technology">Technology</a>
            <a href="#" class="category-filter" data-category="consulting">Consulting</a>
            <a href="#" class="category-filter" data-category="education">Education</a>
        </div>
    </div>
</section>

<!-- Tenants Grid -->
<section id="tenants" class="container my-5">
    <div class="text-center mb-5">
        <h2 class="fw-bold">Featured Tenants</h2>
        <p class="text-muted">Trusted businesses and service providers on our platform</p>
    </div>
    
    <div class="row g-4">
        <!-- Go Models NYC -->
        <div class="col-lg-4 col-md-6" data-category="agency">
            <div class="tenant-card">
                <div class="tenant-header">
                    <div class="featured-badge">⭐ Featured</div>
                    <div class="tenant-logo">
                        <h4 class="mb-0" style="background: linear-gradient(45deg, #ff69b4, #8a2be2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            <i class="fas fa-star me-1"></i>Go Models
                        </h4>
                    </div>
                    <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop" 
                         class="tenant-cover" alt="Go Models NYC">
                </div>
                <div class="tenant-body">
                    <div class="tenant-category">Modeling Agency</div>
                    <h3 class="tenant-name">Go Models NYC</h3>
                    <p class="tenant-description">
                        New York's premier modeling agency representing diverse talent across all categories. 
                        From babies to seniors, fashion to fitness, we celebrate authentic beauty.
                    </p>
                    <div class="tenant-stats">
                        <div class="stat-item">
                            <div class="stat-value">500+</div>
                            <div class="stat-label">Models</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">15</div>
                            <div class="stat-label">Years</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">1000+</div>
                            <div class="stat-label">Campaigns</div>
                        </div>
                    </div>
                    <div class="tenant-tags">
                        <span class="tag">Fashion</span>
                        <span class="tag">Commercial</span>
                        <span class="tag">Editorial</span>
                        <span class="tag">Inclusive</span>
                    </div>
                    <a href="gomodels/" class="tenant-action">
                        <i class="fas fa-arrow-right me-2"></i>Visit Go Models
                    </a>
                </div>
            </div>
        </div>
        
        <!-- OvercrewAI -->
        <div class="col-lg-4 col-md-6" data-category="marketplace technology">
            <div class="tenant-card">
                <div class="tenant-header">
                    <div class="featured-badge">🚀 New</div>
                    <div class="tenant-logo">
                        <h4 class="mb-0" style="background: linear-gradient(45deg, #00b894, #6c5ce7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            <i class="fas fa-robot me-1"></i>OvercrewAI
                        </h4>
                    </div>
                    <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop" 
                         class="tenant-cover" alt="OvercrewAI">
                </div>
                <div class="tenant-body">
                    <div class="tenant-category">AI Workforce Marketplace</div>
                    <h3 class="tenant-name">OvercrewAI</h3>
                    <p class="tenant-description">
                        Hire AI digital workers on-demand. Deploy autonomous agents for customer service, sales, 
                        marketing, and data analysis. 24/7 availability, 82% cost reduction.
                    </p>
                    <div class="tenant-stats">
                        <div class="stat-item">
                            <div class="stat-value">10K+</div>
                            <div class="stat-label">AI Agents</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">24/7</div>
                            <div class="stat-label">Availability</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">$0.10</div>
                            <div class="stat-label">Avg Cost</div>
                        </div>
                    </div>
                    <div class="tenant-tags">
                        <span class="tag">AI Agents</span>
                        <span class="tag">Automation</span>
                        <span class="tag">Digital Workers</span>
                        <span class="tag">B2B</span>
                    </div>
                    <a href="overcrewai/" class="tenant-action">
                        <i class="fas fa-arrow-right me-2"></i>Visit OvercrewAI
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Creative Studio Example -->
        <div class="col-lg-4 col-md-6" data-category="creative">
            <div class="tenant-card">
                <div class="tenant-header">
                    <div class="tenant-logo">
                        <h4 class="mb-0" style="color: #f39c12;">
                            <i class="fas fa-palette me-1"></i>Studio X
                        </h4>
                    </div>
                    <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop" 
                         class="tenant-cover" alt="Creative Studio X">
                </div>
                <div class="tenant-body">
                    <div class="tenant-category">Creative Services</div>
                    <h3 class="tenant-name">Creative Studio X</h3>
                    <p class="tenant-description">
                        Full-service creative agency specializing in branding, design, and digital experiences. 
                        We bring ideas to life with innovative solutions.
                    </p>
                    <div class="tenant-stats">
                        <div class="stat-item">
                            <div class="stat-value">200+</div>
                            <div class="stat-label">Projects</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">50+</div>
                            <div class="stat-label">Awards</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">8</div>
                            <div class="stat-label">Years</div>
                        </div>
                    </div>
                    <div class="tenant-tags">
                        <span class="tag">Branding</span>
                        <span class="tag">Web Design</span>
                        <span class="tag">Marketing</span>
                    </div>
                    <a href="#" class="tenant-action">
                        <i class="fas fa-arrow-right me-2"></i>Coming Soon
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Tech Marketplace Example -->
        <div class="col-lg-4 col-md-6" data-category="marketplace">
            <div class="tenant-card">
                <div class="tenant-header">
                    <div class="tenant-logo">
                        <h4 class="mb-0" style="color: #3498db;">
                            <i class="fas fa-code me-1"></i>DevMarket
                        </h4>
                    </div>
                    <img src="https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&h=200&fit=crop" 
                         class="tenant-cover" alt="DevMarket">
                </div>
                <div class="tenant-body">
                    <div class="tenant-category">Technology Marketplace</div>
                    <h3 class="tenant-name">DevMarket Pro</h3>
                    <p class="tenant-description">
                        Connect with top developers, designers, and tech professionals. Find the perfect talent 
                        for your next project or showcase your skills.
                    </p>
                    <div class="tenant-stats">
                        <div class="stat-item">
                            <div class="stat-value">5K+</div>
                            <div class="stat-label">Developers</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">1K+</div>
                            <div class="stat-label">Projects</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">95%</div>
                            <div class="stat-label">Success</div>
                        </div>
                    </div>
                    <div class="tenant-tags">
                        <span class="tag">Development</span>
                        <span class="tag">Freelance</span>
                        <span class="tag">Remote</span>
                    </div>
                    <a href="#" class="tenant-action">
                        <i class="fas fa-arrow-right me-2"></i>Coming Soon
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Education Platform Example -->
        <div class="col-lg-4 col-md-6" data-category="education">
            <div class="tenant-card">
                <div class="tenant-header">
                    <div class="tenant-logo">
                        <h4 class="mb-0" style="color: #27ae60;">
                            <i class="fas fa-graduation-cap me-1"></i>LearnHub
                        </h4>
                    </div>
                    <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=200&fit=crop" 
                         class="tenant-cover" alt="LearnHub">
                </div>
                <div class="tenant-body">
                    <div class="tenant-category">Education Platform</div>
                    <h3 class="tenant-name">LearnHub Academy</h3>
                    <p class="tenant-description">
                        Online learning platform offering courses in business, technology, and creative skills. 
                        Learn from industry experts at your own pace.
                    </p>
                    <div class="tenant-stats">
                        <div class="stat-item">
                            <div class="stat-value">300+</div>
                            <div class="stat-label">Courses</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">10K+</div>
                            <div class="stat-label">Students</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">4.8</div>
                            <div class="stat-label">Rating</div>
                        </div>
                    </div>
                    <div class="tenant-tags">
                        <span class="tag">Online Learning</span>
                        <span class="tag">Certification</span>
                        <span class="tag">Skills</span>
                    </div>
                    <a href="#" class="tenant-action">
                        <i class="fas fa-arrow-right me-2"></i>Coming Soon
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Consulting Firm Example -->
        <div class="col-lg-4 col-md-6" data-category="consulting">
            <div class="tenant-card">
                <div class="tenant-header">
                    <div class="tenant-logo">
                        <h4 class="mb-0" style="color: #9b59b6;">
                            <i class="fas fa-chart-line me-1"></i>ProConsult
                        </h4>
                    </div>
                    <img src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=200&fit=crop" 
                         class="tenant-cover" alt="ProConsult">
                </div>
                <div class="tenant-body">
                    <div class="tenant-category">Business Consulting</div>
                    <h3 class="tenant-name">ProConsult Group</h3>
                    <p class="tenant-description">
                        Strategic business consulting for growth-focused companies. We help businesses scale, 
                        optimize operations, and achieve their goals.
                    </p>
                    <div class="tenant-stats">
                        <div class="stat-item">
                            <div class="stat-value">150+</div>
                            <div class="stat-label">Clients</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">$50M+</div>
                            <div class="stat-label">Revenue Generated</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">12</div>
                            <div class="stat-label">Years</div>
                        </div>
                    </div>
                    <div class="tenant-tags">
                        <span class="tag">Strategy</span>
                        <span class="tag">Growth</span>
                        <span class="tag">Operations</span>
                    </div>
                    <a href="#" class="tenant-action">
                        <i class="fas fa-arrow-right me-2"></i>Coming Soon
                    </a>
                </div>
            </div>
        </div>
        
        <!-- More Placeholder -->
        <div class="col-lg-4 col-md-6">
            <div class="tenant-card" style="background: #f8f9fa; border: 2px dashed #dee2e6;">
                <div class="tenant-body d-flex align-items-center justify-content-center" style="min-height: 400px;">
                    <div class="text-center">
                        <i class="fas fa-plus-circle fa-4x mb-3" style="color: #dee2e6;"></i>
                        <h4 class="text-muted">Your Business Here</h4>
                        <p class="text-muted mb-4">Join our platform and reach thousands of customers</p>
                        <a href="../register" class="btn btn-outline-primary">
                            <i class="fas fa-rocket me-2"></i>Get Listed
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Blog Section -->
<section class="container my-5 py-5">
    <div class="text-center mb-5">
        <h2 class="fw-bold">Latest from Our Blog</h2>
        <p class="text-muted">Industry insights, success stories, and platform updates</p>
    </div>
    
    <div class="row g-4">
        <!-- Blog Post 1 -->
        <div class="col-lg-4 col-md-6">
            <article class="card h-100 border-0 shadow-sm">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop" 
                     class="card-img-top" alt="Business Growth">
                <div class="card-body">
                    <div class="text-muted small mb-2">
                        <i class="fas fa-calendar me-1"></i> December 15, 2024
                    </div>
                    <h5 class="card-title">How Go Models Revolutionized Inclusive Modeling</h5>
                    <p class="card-text">Discover how Go Models NYC became a leader in diverse representation, breaking barriers in the fashion industry.</p>
                    <a href="blog/go-models-success-story.html" class="btn btn-sm btn-outline-primary">
                        Read More <i class="fas fa-arrow-right ms-1"></i>
                    </a>
                </div>
            </article>
        </div>
        
        <!-- Blog Post 2 -->
        <div class="col-lg-4 col-md-6">
            <article class="card h-100 border-0 shadow-sm">
                <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=250&fit=crop" 
                     class="card-img-top" alt="AI Technology">
                <div class="card-body">
                    <div class="text-muted small mb-2">
                        <i class="fas fa-calendar me-1"></i> December 10, 2024
                    </div>
                    <h5 class="card-title">The Rise of AI Digital Workers</h5>
                    <p class="card-text">Learn how OvercrewAI is transforming businesses with autonomous AI agents that work 24/7.</p>
                    <a href="blog/ai-digital-workers.html" class="btn btn-sm btn-outline-primary">
                        Read More <i class="fas fa-arrow-right ms-1"></i>
                    </a>
                </div>
            </article>
        </div>
        
        <!-- Blog Post 3 -->
        <div class="col-lg-4 col-md-6">
            <article class="card h-100 border-0 shadow-sm">
                <img src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=250&fit=crop" 
                     class="card-img-top" alt="Platform Features">
                <div class="card-body">
                    <div class="text-muted small mb-2">
                        <i class="fas fa-calendar me-1"></i> December 5, 2024
                    </div>
                    <h5 class="card-title">5 Tips for Growing Your Business on Our Platform</h5>
                    <p class="card-text">Expert advice on maximizing your presence and attracting more customers through our tenant platform.</p>
                    <a href="blog/platform-growth-tips.html" class="btn btn-sm btn-outline-primary">
                        Read More <i class="fas fa-arrow-right ms-1"></i>
                    </a>
                </div>
            </article>
        </div>
    </div>
    
    <div class="text-center mt-5">
        <a href="blog/" class="btn btn-primary btn-lg">
            <i class="fas fa-blog me-2"></i>View All Articles
        </a>
    </div>
</section>

<!-- Platform Stats -->
<section class="platform-stats">
    <div class="container">
        <div class="stats-grid">
            <div class="platform-stat">
                <div class="platform-stat-value">50+</div>
                <div class="platform-stat-label">Active Tenants</div>
            </div>
            <div class="platform-stat">
                <div class="platform-stat-value">10K+</div>
                <div class="platform-stat-label">Monthly Visitors</div>
            </div>
            <div class="platform-stat">
                <div class="platform-stat-value">500+</div>
                <div class="platform-stat-label">Successful Connections</div>
            </div>
            <div class="platform-stat">
                <div class="platform-stat-value">4.9</div>
                <div class="platform-stat-label">Average Rating</div>
            </div>
        </div>
    </div>
</section>

<!-- About Section -->
<section id="about" class="container my-5">
    <div class="row align-items-center">
        <div class="col-lg-6">
            <h2 class="fw-bold mb-4">About Public Tenants</h2>
            <p class="lead text-muted mb-4">
                We connect customers with trusted businesses and service providers across various industries.
            </p>
            <p class="mb-4">
                Our platform hosts a diverse range of professional services, from creative agencies and consultancies 
                to marketplaces and educational platforms. Each tenant is carefully vetted to ensure quality and reliability.
            </p>
            <p class="mb-4">
                Whether you're looking for modeling services, creative design, business consulting, or technology solutions, 
                you'll find established professionals ready to help you succeed.
            </p>
            <div class="d-flex gap-3">
                <a href="../register" class="btn btn-primary btn-lg">
                    <i class="fas fa-plus me-2"></i>List Your Business
                </a>
                <a href="#tenants" class="btn btn-outline-primary btn-lg">
                    <i class="fas fa-search me-2"></i>Browse Tenants
                </a>
            </div>
        </div>
        <div class="col-lg-6">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop" 
                 class="img-fluid rounded-3 shadow-lg" alt="Professional Services">
        </div>
    </div>
</section>

<!-- Footer -->
<footer class="main-footer">
    <div class="container">
        <div class="row">
            <div class="col-lg-4 mb-4">
                <h5 class="text-white mb-3"><i class="fas fa-globe me-2"></i>Public Tenants</h5>
                <p class="text-light">
                    Discover and connect with professional service providers and marketplaces on our platform.
                </p>
            </div>
            <div class="col-lg-4 mb-4">
                <h5 class="text-white mb-3">Quick Links</h5>
                <div class="d-flex flex-column gap-2">
                    <a href="#tenants" class="footer-link">Browse Tenants</a>
                    <a href="#categories" class="footer-link">Categories</a>
                    <a href="../register" class="footer-link">List Your Business</a>
                    <a href="../" class="footer-link">Back to Platform</a>
                </div>
            </div>
            <div class="col-lg-4 mb-4">
                <h5 class="text-white mb-3">Featured Tenants</h5>
                <div class="d-flex flex-column gap-2">
                    <a href="gomodels/" class="footer-link">Go Models NYC</a>
                    <a href="overcrewai/" class="footer-link">OvercrewAI</a>
                    <a href="#" class="footer-link">Creative Studio X</a>
                    <a href="#" class="footer-link">DevMarket Pro</a>
                    <a href="#" class="footer-link">LearnHub Academy</a>
                </div>
            </div>
        </div>
        
        <div class="text-center pt-4 mt-4 border-top border-secondary">
            <p class="text-light mb-0">&copy; 2024 itellico Platform. All rights reserved.</p>
        </div>
    </div>
</footer>

<script>
// Category filter functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.category-filter');
    const tenantCards = document.querySelectorAll('[data-category]');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const selectedCategory = this.getAttribute('data-category');
            
            // Filter tenant cards
            tenantCards.forEach(card => {
                if (selectedCategory === 'all' || card.getAttribute('data-category') === selectedCategory) {
                    card.style.display = 'block';
                    // Add fade-in animation
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.3s ease';
                        card.style.opacity = '1';
                    }, 10);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.top-header');
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255,255,255,0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'white';
            header.style.backdropFilter = 'none';
        }
    });
});
</script>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html>