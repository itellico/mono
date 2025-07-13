<?php
require_once 'includes/header.php';
require_once 'includes/components.php';
require_once 'includes/footer.php';

echo renderHeader("itellico Mono Platform - Click Dummy", "Demo User", "Multi-Tier Access", "Hub");
?>

<!-- Custom styles for homepage -->
<style>
.hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 80px 0;
    text-align: center;
}

.tier-card {
    transition: all 0.3s ease;
    cursor: pointer;
    border: 2px solid transparent;
    height: 100%;
}

.tier-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
}

.tier-card.tier-platform:hover { border-color: #007bff; }
.tier-card.tier-tenant:hover { border-color: #28a745; }
.tier-card.tier-account:hover { border-color: #17a2b8; }
.tier-card.tier-user:hover { border-color: #ffc107; }
.tier-card.tier-public:hover { border-color: #6c757d; }

.profile-card {
    transition: all 0.3s ease;
    cursor: pointer;
}

.profile-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.stats-banner {
    background: linear-gradient(45deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 15px;
    padding: 30px;
    margin: 40px auto;
    max-width: 1200px;
}

.homepage-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Center all content on homepage - Enhanced */
.homepage-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    min-height: calc(100vh - var(--header-height));
}

.homepage-container .container-fluid {
    width: 100%;
    max-width: 1400px;
}

/* Hero section full width */
.hero-section {
    width: 100vw;
    margin-left: calc(-50vw + 50%);
}
</style>

<div class="homepage-container">
    <!-- Hero Section -->
    <div class="hero-section">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8 text-center">
                    <h1 class="display-4 fw-bold mb-4">itellico Mono Platform</h1>
                    <p class="lead mb-4">Multi-Tenant Marketplace Builder with 5-Tier Architecture</p>
                    <p class="mb-4">Explore our comprehensive platform through interactive prototypes showcasing all user roles and marketplace features.</p>
                    <div class="d-flex justify-content-center gap-3">
                        <span class="badge bg-light text-dark px-3 py-2">Next.js Frontend</span>
                        <span class="badge bg-light text-dark px-3 py-2">Fastify API</span>
                        <span class="badge bg-light text-dark px-3 py-2">Multi-Tenant SaaS</span>
                        <span class="badge bg-light text-dark px-3 py-2">RBAC System</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="homepage-content">
        <!-- Platform Statistics -->
        <div class="stats-banner">
            <div class="row text-center">
                <div class="col-md-3">
                    <h3 class="text-primary fw-bold">5</h3>
                    <p class="text-muted mb-0">Architectural Tiers</p>
                </div>
                <div class="col-md-3">
                    <h3 class="text-success fw-bold">15+</h3>
                    <p class="text-muted mb-0">User Types</p>
                </div>
                <div class="col-md-3">
                    <h3 class="text-info fw-bold">50+</h3>
                    <p class="text-muted mb-0">Features Demonstrated</p>
                </div>
                <div class="col-md-3">
                    <h3 class="text-warning fw-bold">100%</h3>
                    <p class="text-muted mb-0">Interactive</p>
                </div>
            </div>
        </div>

        <!-- 5-Tier Architecture -->
        <div class="row mb-5">
            <div class="col-12 text-center mb-4">
                <h2 class="fw-bold">Explore the 5-Tier Architecture</h2>
                <p class="text-muted">Each tier represents a different level of access and functionality within the platform</p>
            </div>
        </div>

        <div class="row g-4 mb-5">
            <!-- Platform Tier -->
            <div class="col-lg-6">
                <div class="card tier-card tier-platform h-100" onclick="window.location.href='platform/index.php'">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-3">
                            <div class="bg-primary rounded-circle p-3 me-3">
                                <i class="fas fa-crown text-white fa-2x"></i>
                            </div>
                            <div>
                                <h4 class="mb-1 text-primary">Platform Tier</h4>
                                <p class="text-muted mb-0">Super Admin Dashboard</p>
                            </div>
                        </div>
                        <p class="mb-3">Manage all tenants, revenue analytics, system monitoring, and platform-wide settings. Complete oversight of the entire marketplace ecosystem.</p>
                        <div class="mb-3">
                            <span class="badge bg-primary me-2">Tenant Management</span>
                            <span class="badge bg-primary me-2">Revenue Analytics</span>
                            <span class="badge bg-primary me-2">System Monitoring</span>
                            <span class="badge bg-primary">API Management</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">13 Admin Features</small>
                            <span class="text-primary fw-bold">Tier 1 →</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tenant Tier -->
            <div class="col-lg-6">
                <div class="card tier-card tier-tenant h-100" onclick="window.location.href='tenant/index.php'">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-3">
                            <div class="bg-success rounded-circle p-3 me-3">
                                <i class="fas fa-building text-white fa-2x"></i>
                            </div>
                            <div>
                                <h4 class="mb-1 text-success">Tenant Tier</h4>
                                <p class="text-muted mb-0">Marketplace Admin</p>
                            </div>
                        </div>
                        <p class="mb-3">Run your marketplace with talent management, casting calls, applications, and marketplace-specific analytics. Example: Go Models NYC admin portal.</p>
                        <div class="mb-3">
                            <span class="badge bg-success me-2">Talent Database</span>
                            <span class="badge bg-success me-2">Casting Calls</span>
                            <span class="badge bg-success me-2">Applications</span>
                            <span class="badge bg-success">Analytics</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">7 Management Tools</small>
                            <span class="text-success fw-bold">Tier 2 →</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Account Tier -->
            <div class="col-lg-4">
                <div class="card tier-card tier-account h-100" onclick="window.location.href='account/index.php'">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-3">
                            <div class="bg-info rounded-circle p-3 me-3">
                                <i class="fas fa-briefcase text-white fa-lg"></i>
                            </div>
                            <div>
                                <h4 class="mb-1 text-info">Account Tier</h4>
                                <p class="text-muted mb-0">Agency/Company</p>
                            </div>
                        </div>
                        <p class="mb-3">Manage projects, talent rosters, team members, and client relationships. Perfect for agencies and production companies.</p>
                        <div class="mb-3">
                            <span class="badge bg-info me-1">Projects</span>
                            <span class="badge bg-info me-1">Team</span>
                            <span class="badge bg-info">Talent</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">6 Business Tools</small>
                            <span class="text-info fw-bold">Tier 3 →</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Tier -->
            <div class="col-lg-4">
                <div class="card tier-card tier-user h-100" onclick="window.location.href='user/index.php'">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-3">
                            <div class="bg-warning rounded-circle p-3 me-3">
                                <i class="fas fa-user text-white fa-lg"></i>
                            </div>
                            <div>
                                <h4 class="mb-1 text-warning">User Tier</h4>
                                <p class="text-muted mb-0">Individual Dashboard</p>
                            </div>
                        </div>
                        <p class="mb-3">Personal workspace for models, photographers, and talent. Manage portfolios, applications, messages, and bookings.</p>
                        <div class="mb-3">
                            <span class="badge bg-warning me-1">Portfolio</span>
                            <span class="badge bg-warning me-1">Jobs</span>
                            <span class="badge bg-warning">Messages</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">7 Personal Tools</small>
                            <span class="text-warning fw-bold">Tier 4 →</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Public Tier -->
            <div class="col-lg-4">
                <div class="card tier-card tier-public h-100" onclick="window.location.href='public/index.php'">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-3">
                            <div class="bg-secondary rounded-circle p-3 me-3">
                                <i class="fas fa-globe text-white fa-lg"></i>
                            </div>
                            <div>
                                <h4 class="mb-1 text-secondary">Public Tier</h4>
                                <p class="text-muted mb-0">No Authentication</p>
                            </div>
                        </div>
                        <p class="mb-3">Public marketplace browsing, talent discovery, and registration. What visitors see before logging in.</p>
                        <div class="mb-3">
                            <span class="badge bg-secondary me-1">Browse</span>
                            <span class="badge bg-secondary me-1">Search</span>
                            <span class="badge bg-secondary">Register</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">3 Public Pages</small>
                            <span class="text-secondary fw-bold">Tier 5 →</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Featured Profiles Section -->
        <div class="row mb-5">
            <div class="col-12 text-center mb-4">
                <h2 class="fw-bold">Featured User Profiles</h2>
                <p class="text-muted">Explore different user types and their unique dashboards</p>
            </div>
        </div>

        <div class="row g-4 mb-5">
            <!-- Model Profile -->
            <div class="col-md-6 col-lg-3">
                <div class="card profile-card h-100" onclick="window.location.href='user/model.php'">
                    <div class="card-body text-center p-4">
                        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face" 
                             class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Model">
                        <h5 class="card-title">Emma Johnson</h5>
                        <p class="text-muted small">Professional Fashion Model</p>
                        <div class="mb-3">
                            <span class="badge bg-light text-dark me-1">Fashion</span>
                            <span class="badge bg-light text-dark me-1">Editorial</span>
                            <span class="badge bg-light text-dark">Runway</span>
                        </div>
                        <div class="d-flex justify-content-around small">
                            <div>
                                <strong class="d-block">47</strong>
                                <span class="text-muted">Projects</span>
                            </div>
                            <div>
                                <strong class="d-block">5'9"</strong>
                                <span class="text-muted">Height</span>
                            </div>
                            <div>
                                <strong class="d-block">NYC</strong>
                                <span class="text-muted">Location</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Photographer Profile -->
            <div class="col-md-6 col-lg-3">
                <div class="card profile-card h-100" onclick="window.location.href='user/photographer.php'">
                    <div class="card-body text-center p-4">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" 
                             class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Photographer">
                        <h5 class="card-title">Marcus Rodriguez</h5>
                        <p class="text-muted small">Fashion Photographer</p>
                        <div class="mb-3">
                            <span class="badge bg-light text-dark me-1">Fashion</span>
                            <span class="badge bg-light text-dark me-1">Portrait</span>
                            <span class="badge bg-light text-dark">Commercial</span>
                        </div>
                        <div class="d-flex justify-content-around small">
                            <div>
                                <strong class="d-block">234</strong>
                                <span class="text-muted">Shoots</span>
                            </div>
                            <div>
                                <strong class="d-block">4.9★</strong>
                                <span class="text-muted">Rating</span>
                            </div>
                            <div>
                                <strong class="d-block">LA</strong>
                                <span class="text-muted">Studio</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Agency Profile -->
            <div class="col-md-6 col-lg-3">
                <div class="card profile-card h-100" onclick="window.location.href='account/agency.php'">
                    <div class="card-body text-center p-4">
                        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop" 
                             class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Agency">
                        <h5 class="card-title">Elite Model Management</h5>
                        <p class="text-muted small">International Modeling Agency</p>
                        <div class="mb-3">
                            <span class="badge bg-light text-dark me-1">High Fashion</span>
                            <span class="badge bg-light text-dark me-1">Commercial</span>
                            <span class="badge bg-light text-dark">Global</span>
                        </div>
                        <div class="d-flex justify-content-around small">
                            <div>
                                <strong class="d-block">1,890</strong>
                                <span class="text-muted">Talent</span>
                            </div>
                            <div>
                                <strong class="d-block">15</strong>
                                <span class="text-muted">Years</span>
                            </div>
                            <div>
                                <strong class="d-block">Global</strong>
                                <span class="text-muted">Reach</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Marketplace Profile -->
            <div class="col-md-6 col-lg-3">
                <div class="card profile-card h-100" onclick="window.location.href='tenant/index.php'">
                    <div class="card-body text-center p-4">
                        <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=100&h=100&fit=crop" 
                             class="rounded-circle mb-3" style="width: 80px; height: 80px; object-fit: cover;" alt="Marketplace">
                        <h5 class="card-title">Go Models NYC</h5>
                        <p class="text-muted small">Fashion Modeling Marketplace</p>
                        <div class="mb-3">
                            <span class="badge bg-light text-dark me-1">Fashion</span>
                            <span class="badge bg-light text-dark me-1">Editorial</span>
                            <span class="badge bg-light text-dark">Premium</span>
                        </div>
                        <div class="d-flex justify-content-around small">
                            <div>
                                <strong class="d-block">2,450</strong>
                                <span class="text-muted">Users</span>
                            </div>
                            <div>
                                <strong class="d-block">Enterprise</strong>
                                <span class="text-muted">Plan</span>
                            </div>
                            <div>
                                <strong class="d-block">NYC</strong>
                                <span class="text-muted">Market</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Industry Verticals -->
        <div class="row mb-5">
            <div class="col-12 text-center mb-4">
                <h2 class="fw-bold">Industry Verticals</h2>
                <p class="text-muted">See how different industries use the itellico Mono platform</p>
            </div>
        </div>

        <div class="row g-3">
            <div class="col-md-4 col-lg-2">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="fas fa-female fa-2x text-primary mb-2"></i>
                        <h6>Fashion Modeling</h6>
                        <small class="text-muted">3 Tenants</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4 col-lg-2">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="fas fa-dumbbell fa-2x text-success mb-2"></i>
                        <h6>Fitness & Sports</h6>
                        <small class="text-muted">2 Tenants</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4 col-lg-2">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="fas fa-microphone fa-2x text-danger mb-2"></i>
                        <h6>Voice Talent</h6>
                        <small class="text-muted">1 Tenant</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4 col-lg-2">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="fas fa-camera fa-2x text-info mb-2"></i>
                        <h6>Photography</h6>
                        <small class="text-muted">1 Tenant</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4 col-lg-2">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="fas fa-child fa-2x text-warning mb-2"></i>
                        <h6>Child Modeling</h6>
                        <small class="text-muted">1 Tenant</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4 col-lg-2">
                <div class="card text-center h-100">
                    <div class="card-body">
                        <i class="fas fa-paw fa-2x text-secondary mb-2"></i>
                        <h6>Pet Modeling</h6>
                        <small class="text-muted">1 Tenant</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer Info -->
        <div class="text-center mt-5 mb-4">
            <p class="text-muted">
                <strong>itellico Mono Platform</strong> - Multi-Tenant Marketplace Builder<br>
                <small>Built with Next.js, Fastify, PostgreSQL, Redis, and modern web technologies</small>
            </p>
        </div>
    </div>
</div>

<?php echo renderFooter(); ?>