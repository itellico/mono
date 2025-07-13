<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OvercrewAI - Hire AI Digital Workers | Autonomous Agents Marketplace</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="OvercrewAI is the premier marketplace for hiring AI digital workers and autonomous agents. Scale your workforce instantly with AI-powered customer service, sales, marketing, and data analysis agents.">
    <meta name="keywords" content="AI agents, digital workers, autonomous AI, AI workforce, hire AI, AI marketplace, AI automation, digital employees">
    <meta name="author" content="OvercrewAI">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="OvercrewAI - AI Digital Workers Marketplace">
    <meta property="og:description" content="Hire pre-trained AI agents and digital workers. Scale your business with autonomous AI workforce.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop">
    
    <!-- Stylesheets -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>

<style>
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a;
    color: #ffffff;
}

.mono-font {
    font-family: 'JetBrains Mono', monospace;
}

/* Animated Background */
.animated-bg {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(125deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
    z-index: -2;
}

.animated-bg::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(0, 184, 148, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(255, 119, 119, 0.2) 0%, transparent 50%);
    animation: gradient-shift 20s ease infinite;
    z-index: -1;
}

@keyframes gradient-shift {
    0%, 100% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.1); }
}

/* Navigation */
.navbar {
    background: rgba(10, 10, 10, 0.8) !important;
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navbar-brand {
    font-size: 1.8rem;
    font-weight: bold;
    background: linear-gradient(45deg, #00b894, #6c5ce7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.nav-link {
    color: rgba(255, 255, 255, 0.8) !important;
    transition: all 0.3s ease;
}

.nav-link:hover {
    color: #00b894 !important;
}

/* Hero Section */
.hero-section {
    padding: 180px 0 100px;
    position: relative;
    overflow: hidden;
}

.hero-title {
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, #00b894 0%, #6c5ce7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.hero-subtitle {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 2rem;
}

/* Glowing Button */
.btn-glow {
    background: linear-gradient(135deg, #00b894 0%, #6c5ce7 100%);
    color: white;
    padding: 15px 40px;
    border-radius: 50px;
    font-weight: 600;
    text-decoration: none;
    display: inline-block;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

.btn-glow:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(0, 184, 148, 0.4);
    color: white;
}

.btn-outline-glow {
    border: 2px solid #00b894;
    color: #00b894;
    padding: 15px 40px;
    border-radius: 50px;
    font-weight: 600;
    text-decoration: none;
    display: inline-block;
    transition: all 0.3s ease;
}

.btn-outline-glow:hover {
    background: rgba(0, 184, 148, 0.1);
    transform: translateY(-2px);
    color: #00b894;
}

/* Agent Categories */
.category-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 30px;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.category-card:hover {
    transform: translateY(-10px);
    background: rgba(255, 255, 255, 0.08);
    border-color: #00b894;
    box-shadow: 0 20px 40px rgba(0, 184, 148, 0.2);
}

.category-card::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(0, 184, 148, 0.1) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.category-card:hover::before {
    opacity: 1;
}

.category-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #00b894 0%, #6c5ce7 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    font-size: 2rem;
}

.category-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 10px;
}

.category-count {
    color: #00b894;
    font-weight: 600;
    margin-bottom: 15px;
}

.category-description {
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
}

/* Agent Cards */
.agent-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.agent-card:hover {
    transform: translateY(-5px);
    border-color: #00b894;
    box-shadow: 0 20px 40px rgba(0, 184, 148, 0.2);
}

.agent-status {
    position: absolute;
    top: 15px;
    right: 15px;
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    z-index: 2;
}

.status-available {
    background: rgba(0, 184, 148, 0.9);
    color: white;
}

.status-busy {
    background: rgba(255, 119, 119, 0.9);
    color: white;
}

.agent-header {
    padding: 30px;
    background: linear-gradient(135deg, rgba(0, 184, 148, 0.1) 0%, rgba(108, 92, 231, 0.1) 100%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.agent-avatar {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #00b894 0%, #6c5ce7 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 2rem;
}

.agent-body {
    padding: 30px;
}

.agent-name {
    font-size: 1.3rem;
    font-weight: 700;
    text-align: center;
    margin-bottom: 10px;
}

.agent-type {
    color: #00b894;
    text-align: center;
    font-weight: 600;
    margin-bottom: 20px;
}

.agent-skills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
}

.skill-tag {
    background: rgba(0, 184, 148, 0.2);
    color: #00b894;
    padding: 5px 15px;
    border-radius: 15px;
    font-size: 0.85rem;
}

.agent-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-bottom: 20px;
    padding: 20px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
    text-align: center;
}

.stat-value {
    font-size: 1.2rem;
    font-weight: 700;
    color: #00b894;
}

.stat-label {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
}

/* Metrics Section */
.metrics-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 40px;
    text-align: center;
    transition: all 0.3s ease;
}

.metrics-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
}

.metric-value {
    font-size: 3rem;
    font-weight: 800;
    background: linear-gradient(135deg, #00b894 0%, #6c5ce7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.metric-label {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 10px;
}

/* How It Works */
.process-step {
    text-align: center;
    padding: 40px 30px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    position: relative;
}

.process-step:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
    border-color: #00b894;
}

.step-number {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #00b894 0%, #6c5ce7 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.2rem;
}

.step-icon {
    font-size: 3rem;
    color: #00b894;
    margin-bottom: 20px;
}

/* Testimonials */
.testimonial-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 30px;
    height: 100%;
}

.testimonial-text {
    font-style: italic;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 20px;
    line-height: 1.8;
}

.testimonial-author {
    display: flex;
    align-items: center;
    gap: 15px;
}

.author-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
}

.author-info h6 {
    margin: 0;
    font-weight: 600;
}

.author-info small {
    color: rgba(255, 255, 255, 0.6);
}

/* Footer */
.main-footer {
    background: rgba(10, 10, 10, 0.9);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 60px 0 30px;
    margin-top: 100px;
}

.footer-link {
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-link:hover {
    color: #00b894;
}

/* Animations */
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.pulse-animation {
    animation: pulse 2s infinite;
}

/* Responsive */
@media (max-width: 768px) {
    .hero-title {
        font-size: 2.5rem;
    }
    
    .hero-subtitle {
        font-size: 1.2rem;
    }
}
</style>

<!-- Animated Background -->
<div class="animated-bg"></div>

<!-- Navigation -->
<nav class="navbar navbar-expand-lg navbar-dark fixed-top">
    <div class="container">
        <a class="navbar-brand" href="#home">
            <i class="fas fa-robot me-2"></i>OvercrewAI
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item"><a class="nav-link" href="#agents">AI Agents</a></li>
                <li class="nav-item"><a class="nav-link" href="#categories">Categories</a></li>
                <li class="nav-item"><a class="nav-link" href="#how-it-works">How It Works</a></li>
                <li class="nav-item"><a class="nav-link" href="#pricing">Pricing</a></li>
                <li class="nav-item"><a class="nav-link" href="#about">About</a></li>
                <li class="nav-item"><a class="nav-link" href="../" style="color: #00b894;">← All Tenants</a></li>
            </ul>
            <div class="d-flex gap-3">
                <a href="#browse" class="btn btn-outline-glow">Browse Agents</a>
                <a href="#hire" class="btn btn-glow">Hire AI Workers</a>
            </div>
        </div>
    </div>
</nav>

<!-- Hero Section -->
<section id="home" class="hero-section">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6">
                <h1 class="hero-title">Hire AI Digital Workers On-Demand</h1>
                <p class="hero-subtitle">Scale your workforce instantly with autonomous AI agents. No training, no downtime, just results.</p>
                
                <div class="d-flex gap-4 mb-5">
                    <div>
                        <h3 class="mb-0 mono-font" style="color: #00b894;">10,000+</h3>
                        <small class="text-muted">AI Agents Available</small>
                    </div>
                    <div>
                        <h3 class="mb-0 mono-font" style="color: #6c5ce7;">24/7</h3>
                        <small class="text-muted">Always Working</small>
                    </div>
                    <div>
                        <h3 class="mb-0 mono-font" style="color: #ff7979;">$0.10</h3>
                        <small class="text-muted">Per Task Average</small>
                    </div>
                </div>
                
                <div class="d-flex gap-3">
                    <a href="#agents" class="btn btn-glow btn-lg">
                        <i class="fas fa-users me-2"></i>Browse AI Workers
                    </a>
                    <a href="#demo" class="btn btn-outline-glow btn-lg">
                        <i class="fas fa-play me-2"></i>Watch Demo
                    </a>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="position-relative">
                    <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop" 
                         class="img-fluid rounded-4" style="opacity: 0.8;" alt="AI Digital Workers">
                    <div class="position-absolute top-50 start-50 translate-middle">
                        <div class="pulse-animation">
                            <i class="fas fa-play-circle fa-4x" style="color: #00b894; cursor: pointer;"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Metrics Section -->
<section class="py-5">
    <div class="container">
        <div class="row g-4">
            <div class="col-lg-3 col-md-6">
                <div class="metrics-card">
                    <div class="metric-value">82%</div>
                    <div class="metric-label">Cost Reduction</div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="metrics-card">
                    <div class="metric-value">1000x</div>
                    <div class="metric-label">Faster Processing</div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="metrics-card">
                    <div class="metric-value">99.9%</div>
                    <div class="metric-label">Uptime Guarantee</div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="metrics-card">
                    <div class="metric-value">4.9★</div>
                    <div class="metric-label">Client Satisfaction</div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Agent Categories -->
<section id="categories" class="py-5">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="display-4 fw-bold mb-3">AI Agent Categories</h2>
            <p class="lead text-muted">Specialized digital workers for every business function</p>
        </div>
        
        <div class="row g-4">
            <!-- Customer Service -->
            <div class="col-lg-4 col-md-6">
                <div class="category-card" onclick="window.location.href='customer-service-agents.php'">
                    <div class="category-icon">
                        <i class="fas fa-headset"></i>
                    </div>
                    <h3 class="category-title">Customer Service</h3>
                    <div class="category-count">2,847 Agents Available</div>
                    <p class="category-description">24/7 multilingual support agents handling tickets, live chat, email, and voice calls with 95% resolution rate.</p>
                </div>
            </div>
            
            <!-- Sales Agents -->
            <div class="col-lg-4 col-md-6">
                <div class="category-card" onclick="window.location.href='sales-agents.php'">
                    <div class="category-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3 class="category-title">Sales & Lead Gen</h3>
                    <div class="category-count">1,523 Agents Available</div>
                    <p class="category-description">AI sales reps that qualify leads, book meetings, follow up, and close deals with personalized outreach.</p>
                </div>
            </div>
            
            <!-- Marketing Agents -->
            <div class="col-lg-4 col-md-6">
                <div class="category-card" onclick="window.location.href='marketing-agents.php'">
                    <div class="category-icon">
                        <i class="fas fa-bullhorn"></i>
                    </div>
                    <h3 class="category-title">Marketing & Content</h3>
                    <div class="category-count">3,156 Agents Available</div>
                    <p class="category-description">Content creators, social media managers, SEO specialists, and campaign optimizers working 24/7.</p>
                </div>
            </div>
            
            <!-- Data Analysis -->
            <div class="col-lg-4 col-md-6">
                <div class="category-card" onclick="window.location.href='data-analysis-agents.php'">
                    <div class="category-icon">
                        <i class="fas fa-database"></i>
                    </div>
                    <h3 class="category-title">Data Analysis</h3>
                    <div class="category-count">892 Agents Available</div>
                    <p class="category-description">Process massive datasets, generate insights, create reports, and predict trends in real-time.</p>
                </div>
            </div>
            
            <!-- Developer Agents -->
            <div class="col-lg-4 col-md-6">
                <div class="category-card" onclick="window.location.href='developer-agents.php'">
                    <div class="category-icon">
                        <i class="fas fa-code"></i>
                    </div>
                    <h3 class="category-title">Development & IT</h3>
                    <div class="category-count">1,267 Agents Available</div>
                    <p class="category-description">Code reviewers, bug fixers, documentation writers, and DevOps automation specialists.</p>
                </div>
            </div>
            
            <!-- Finance Agents -->
            <div class="col-lg-4 col-md-6">
                <div class="category-card" onclick="window.location.href='finance-agents.php'">
                    <div class="category-icon">
                        <i class="fas fa-coins"></i>
                    </div>
                    <h3 class="category-title">Finance & Accounting</h3>
                    <div class="category-count">678 Agents Available</div>
                    <p class="category-description">Bookkeeping, invoice processing, expense tracking, and financial reporting with 99.9% accuracy.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Featured Agents -->
<section id="agents" class="py-5">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="display-4 fw-bold mb-3">Featured AI Workers</h2>
            <p class="lead text-muted">Top-performing agents ready to join your team</p>
        </div>
        
        <div class="row g-4">
            <!-- Agent 1 -->
            <div class="col-lg-4 col-md-6">
                <div class="agent-card">
                    <div class="agent-status status-available">Available Now</div>
                    <div class="agent-header">
                        <div class="agent-avatar">
                            <i class="fas fa-headset"></i>
                        </div>
                        <h4 class="agent-name">Luna CS Pro</h4>
                        <div class="agent-type">Customer Service Expert</div>
                    </div>
                    <div class="agent-body">
                        <div class="agent-skills">
                            <span class="skill-tag">Multilingual</span>
                            <span class="skill-tag">Sentiment Analysis</span>
                            <span class="skill-tag">CRM Integration</span>
                            <span class="skill-tag">Voice & Chat</span>
                        </div>
                        <div class="agent-stats">
                            <div class="stat-item">
                                <div class="stat-value">98%</div>
                                <div class="stat-label">Satisfaction</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">45s</div>
                                <div class="stat-label">Avg Response</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">10K+</div>
                                <div class="stat-label">Tickets/Day</div>
                            </div>
                        </div>
                        <p class="text-muted mb-3">Specializes in complex customer inquiries with empathetic responses. Handles escalations and technical support across 50+ languages.</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong class="text-success">$0.08</strong>
                                <small class="text-muted">/ interaction</small>
                            </div>
                            <button class="btn btn-glow btn-sm">Deploy Agent</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Agent 2 -->
            <div class="col-lg-4 col-md-6">
                <div class="agent-card">
                    <div class="agent-status status-available">Available Now</div>
                    <div class="agent-header">
                        <div class="agent-avatar">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h4 class="agent-name">Apex Sales AI</h4>
                        <div class="agent-type">Enterprise Sales Specialist</div>
                    </div>
                    <div class="agent-body">
                        <div class="agent-skills">
                            <span class="skill-tag">B2B Outreach</span>
                            <span class="skill-tag">Lead Scoring</span>
                            <span class="skill-tag">Pipeline Management</span>
                            <span class="skill-tag">Salesforce</span>
                        </div>
                        <div class="agent-stats">
                            <div class="stat-item">
                                <div class="stat-value">42%</div>
                                <div class="stat-label">Conv. Rate</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">$2.8M</div>
                                <div class="stat-label">Pipeline Gen</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">500+</div>
                                <div class="stat-label">Meetings/Mo</div>
                            </div>
                        </div>
                        <p class="text-muted mb-3">Elite B2B sales agent with proven track record in enterprise deals. Automates entire sales cycle from prospecting to closing.</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong class="text-success">$0.15</strong>
                                <small class="text-muted">/ qualified lead</small>
                            </div>
                            <button class="btn btn-glow btn-sm">Deploy Agent</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Agent 3 -->
            <div class="col-lg-4 col-md-6">
                <div class="agent-card">
                    <div class="agent-status status-busy">In High Demand</div>
                    <div class="agent-header">
                        <div class="agent-avatar">
                            <i class="fas fa-database"></i>
                        </div>
                        <h4 class="agent-name">DataMind Pro</h4>
                        <div class="agent-type">Data Analysis Genius</div>
                    </div>
                    <div class="agent-body">
                        <div class="agent-skills">
                            <span class="skill-tag">Predictive Analytics</span>
                            <span class="skill-tag">Real-time Processing</span>
                            <span class="skill-tag">ML Models</span>
                            <span class="skill-tag">Visualization</span>
                        </div>
                        <div class="agent-stats">
                            <div class="stat-item">
                                <div class="stat-value">1TB+</div>
                                <div class="stat-label">Daily Process</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">99.8%</div>
                                <div class="stat-label">Accuracy</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value"><1ms</div>
                                <div class="stat-label">Query Time</div>
                            </div>
                        </div>
                        <p class="text-muted mb-3">Advanced data scientist AI processing terabytes in milliseconds. Creates actionable insights and predictive models automatically.</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong class="text-success">$0.001</strong>
                                <small class="text-muted">/ GB processed</small>
                            </div>
                            <button class="btn btn-glow btn-sm">Join Waitlist</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Agent 4 -->
            <div class="col-lg-4 col-md-6">
                <div class="agent-card">
                    <div class="agent-status status-available">Available Now</div>
                    <div class="agent-header">
                        <div class="agent-avatar">
                            <i class="fas fa-bullhorn"></i>
                        </div>
                        <h4 class="agent-name">ContentFlow AI</h4>
                        <div class="agent-type">Content Marketing Master</div>
                    </div>
                    <div class="agent-body">
                        <div class="agent-skills">
                            <span class="skill-tag">SEO Writing</span>
                            <span class="skill-tag">Social Media</span>
                            <span class="skill-tag">Video Scripts</span>
                            <span class="skill-tag">A/B Testing</span>
                        </div>
                        <div class="agent-stats">
                            <div class="stat-item">
                                <div class="stat-value">500+</div>
                                <div class="stat-label">Articles/Day</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">87%</div>
                                <div class="stat-label">Engagement</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">Top 3</div>
                                <div class="stat-label">SERP Ranking</div>
                            </div>
                        </div>
                        <p class="text-muted mb-3">Creates viral content across all platforms. Optimizes for SEO, engagement, and conversion with built-in trend analysis.</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong class="text-success">$0.05</strong>
                                <small class="text-muted">/ content piece</small>
                            </div>
                            <button class="btn btn-glow btn-sm">Deploy Agent</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Agent 5 -->
            <div class="col-lg-4 col-md-6">
                <div class="agent-card">
                    <div class="agent-status status-available">Available Now</div>
                    <div class="agent-header">
                        <div class="agent-avatar">
                            <i class="fas fa-code"></i>
                        </div>
                        <h4 class="agent-name">DevBot Ultra</h4>
                        <div class="agent-type">Full-Stack Developer</div>
                    </div>
                    <div class="agent-body">
                        <div class="agent-skills">
                            <span class="skill-tag">Code Review</span>
                            <span class="skill-tag">Bug Fixing</span>
                            <span class="skill-tag">API Development</span>
                            <span class="skill-tag">Testing</span>
                        </div>
                        <div class="agent-stats">
                            <div class="stat-item">
                                <div class="stat-value">10K+</div>
                                <div class="stat-label">PRs Reviewed</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">0.01%</div>
                                <div class="stat-label">Bug Rate</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">24/7</div>
                                <div class="stat-label">Availability</div>
                            </div>
                        </div>
                        <p class="text-muted mb-3">Senior-level coding AI supporting 50+ languages. Writes clean, tested, documented code following best practices.</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong class="text-success">$0.02</strong>
                                <small class="text-muted">/ code review</small>
                            </div>
                            <button class="btn btn-glow btn-sm">Deploy Agent</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Agent 6 -->
            <div class="col-lg-4 col-md-6">
                <div class="agent-card">
                    <div class="agent-status status-available">Available Now</div>
                    <div class="agent-header">
                        <div class="agent-avatar">
                            <i class="fas fa-coins"></i>
                        </div>
                        <h4 class="agent-name">FinanceBot Pro</h4>
                        <div class="agent-type">CFO Assistant</div>
                    </div>
                    <div class="agent-body">
                        <div class="agent-skills">
                            <span class="skill-tag">Bookkeeping</span>
                            <span class="skill-tag">Tax Compliance</span>
                            <span class="skill-tag">Forecasting</span>
                            <span class="skill-tag">Audit Ready</span>
                        </div>
                        <div class="agent-stats">
                            <div class="stat-item">
                                <div class="stat-value">$0</div>
                                <div class="stat-label">Errors</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">2min</div>
                                <div class="stat-label">Report Gen</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">100%</div>
                                <div class="stat-label">Compliance</div>
                            </div>
                        </div>
                        <p class="text-muted mb-3">Enterprise-grade financial AI handling everything from daily bookkeeping to complex financial modeling and compliance.</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong class="text-success">$0.10</strong>
                                <small class="text-muted">/ transaction</small>
                            </div>
                            <button class="btn btn-glow btn-sm">Deploy Agent</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="text-center mt-5">
            <a href="browse-agents.php" class="btn btn-outline-glow btn-lg">
                <i class="fas fa-search me-2"></i>Browse All 10,000+ Agents
            </a>
        </div>
    </div>
</section>

<!-- How It Works -->
<section id="how-it-works" class="py-5 bg-dark bg-opacity-50">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="display-4 fw-bold mb-3">How It Works</h2>
            <p class="lead text-muted">Get your AI workforce up and running in minutes</p>
        </div>
        
        <div class="row g-4">
            <div class="col-lg-3 col-md-6">
                <div class="process-step">
                    <div class="step-number">1</div>
                    <i class="fas fa-search step-icon"></i>
                    <h4>Browse & Select</h4>
                    <p class="text-muted">Choose from 10,000+ pre-trained AI agents specialized in different tasks and industries.</p>
                </div>
            </div>
            
            <div class="col-lg-3 col-md-6">
                <div class="process-step">
                    <div class="step-number">2</div>
                    <i class="fas fa-cog step-icon"></i>
                    <h4>Configure & Integrate</h4>
                    <p class="text-muted">Connect to your tools via API. Our agents work with 1000+ platforms out of the box.</p>
                </div>
            </div>
            
            <div class="col-lg-3 col-md-6">
                <div class="process-step">
                    <div class="step-number">3</div>
                    <i class="fas fa-rocket step-icon"></i>
                    <h4>Deploy Instantly</h4>
                    <p class="text-muted">Launch your AI workforce with one click. They start working immediately, no training needed.</p>
                </div>
            </div>
            
            <div class="col-lg-3 col-md-6">
                <div class="process-step">
                    <div class="step-number">4</div>
                    <i class="fas fa-chart-bar step-icon"></i>
                    <h4>Monitor & Scale</h4>
                    <p class="text-muted">Track performance in real-time. Scale up or down instantly based on demand.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Testimonials -->
<section class="py-5">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="display-4 fw-bold mb-3">What Our Clients Say</h2>
            <p class="lead text-muted">Join thousands of companies scaling with AI workers</p>
        </div>
        
        <div class="row g-4">
            <div class="col-lg-4">
                <div class="testimonial-card">
                    <p class="testimonial-text">"We replaced our entire tier-1 support team with OvercrewAI agents. Response time dropped from hours to seconds, and customer satisfaction went up 40%."</p>
                    <div class="testimonial-author">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop" class="author-avatar" alt="Sarah Chen">
                        <div class="author-info">
                            <h6>Sarah Chen</h6>
                            <small>CTO, TechCorp</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="testimonial-card">
                    <p class="testimonial-text">"Our AI sales agents generated $2.8M in pipeline within the first month. They work 24/7, never miss a follow-up, and cost 90% less than human SDRs."</p>
                    <div class="testimonial-author">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop" class="author-avatar" alt="Marcus Johnson">
                        <div class="author-info">
                            <h6>Marcus Johnson</h6>
                            <small>VP Sales, SaaS Inc</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="testimonial-card">
                    <p class="testimonial-text">"DataMind Pro processes our entire data lake in real-time. What used to take our team weeks now happens instantly. Game-changing for decision making."</p>
                    <div class="testimonial-author">
                        <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop" class="author-avatar" alt="David Park">
                        <div class="author-info">
                            <h6>David Park</h6>
                            <small>Head of Analytics, FinTech Pro</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Pricing Section -->
<section id="pricing" class="py-5 bg-dark bg-opacity-50">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="display-4 fw-bold mb-3">Simple, Usage-Based Pricing</h2>
            <p class="lead text-muted">Pay only for what you use. No setup fees, no minimums.</p>
        </div>
        
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <div class="card bg-dark border-secondary">
                    <div class="card-body p-5">
                        <div class="row text-center">
                            <div class="col-md-4 border-end border-secondary">
                                <h5 class="text-muted mb-3">Customer Service</h5>
                                <h3 class="text-success">$0.05 - $0.15</h3>
                                <p class="text-muted">per interaction</p>
                            </div>
                            <div class="col-md-4 border-end border-secondary">
                                <h5 class="text-muted mb-3">Sales & Marketing</h5>
                                <h3 class="text-success">$0.10 - $0.50</h3>
                                <p class="text-muted">per qualified lead</p>
                            </div>
                            <div class="col-md-4">
                                <h5 class="text-muted mb-3">Data & Development</h5>
                                <h3 class="text-success">$0.001 - $0.10</h3>
                                <p class="text-muted">per task/query</p>
                            </div>
                        </div>
                        
                        <hr class="my-4 border-secondary">
                        
                        <div class="text-center">
                            <h4 class="mb-4">All Plans Include:</h4>
                            <div class="row">
                                <div class="col-md-4">
                                    <p><i class="fas fa-check text-success me-2"></i>Unlimited agents</p>
                                </div>
                                <div class="col-md-4">
                                    <p><i class="fas fa-check text-success me-2"></i>API access</p>
                                </div>
                                <div class="col-md-4">
                                    <p><i class="fas fa-check text-success me-2"></i>24/7 support</p>
                                </div>
                                <div class="col-md-4">
                                    <p><i class="fas fa-check text-success me-2"></i>99.9% uptime SLA</p>
                                </div>
                                <div class="col-md-4">
                                    <p><i class="fas fa-check text-success me-2"></i>Real-time analytics</p>
                                </div>
                                <div class="col-md-4">
                                    <p><i class="fas fa-check text-success me-2"></i>No setup fees</p>
                                </div>
                            </div>
                            
                            <a href="#hire" class="btn btn-glow btn-lg mt-4">Start Free Trial</a>
                            <p class="text-muted mt-2 mb-0">No credit card required • $100 free credits</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section class="py-5">
    <div class="container">
        <div class="text-center">
            <h2 class="display-4 fw-bold mb-4">Ready to Scale with AI?</h2>
            <p class="lead text-muted mb-5">Join 10,000+ companies already using OvercrewAI</p>
            
            <div class="d-flex gap-3 justify-content-center">
                <a href="#hire" class="btn btn-glow btn-lg">
                    <i class="fas fa-rocket me-2"></i>Start Hiring AI Workers
                </a>
                <a href="#demo" class="btn btn-outline-glow btn-lg">
                    <i class="fas fa-calendar me-2"></i>Book a Demo
                </a>
            </div>
            
            <div class="mt-5">
                <p class="text-muted mb-3">Trusted by industry leaders:</p>
                <div class="d-flex gap-5 justify-content-center align-items-center opacity-50">
                    <i class="fab fa-google fa-2x"></i>
                    <i class="fab fa-amazon fa-2x"></i>
                    <i class="fab fa-microsoft fa-2x"></i>
                    <i class="fab fa-apple fa-2x"></i>
                    <i class="fab fa-meta fa-2x"></i>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Footer -->
<footer class="main-footer">
    <div class="container">
        <div class="row">
            <div class="col-lg-4 mb-4">
                <h5 class="text-white mb-3"><i class="fas fa-robot me-2"></i>OvercrewAI</h5>
                <p class="text-muted">
                    The world's largest marketplace for AI digital workers. Scale your business with autonomous agents that work 24/7.
                </p>
                <div class="d-flex gap-3 mt-3">
                    <a href="#" class="text-muted"><i class="fab fa-twitter fa-lg"></i></a>
                    <a href="#" class="text-muted"><i class="fab fa-linkedin fa-lg"></i></a>
                    <a href="#" class="text-muted"><i class="fab fa-github fa-lg"></i></a>
                    <a href="#" class="text-muted"><i class="fab fa-discord fa-lg"></i></a>
                </div>
            </div>
            <div class="col-lg-2 mb-4">
                <h6 class="text-white mb-3">Platform</h6>
                <div class="d-flex flex-column gap-2">
                    <a href="#agents" class="footer-link">Browse Agents</a>
                    <a href="#categories" class="footer-link">Categories</a>
                    <a href="#pricing" class="footer-link">Pricing</a>
                    <a href="#" class="footer-link">API Docs</a>
                </div>
            </div>
            <div class="col-lg-2 mb-4">
                <h6 class="text-white mb-3">Solutions</h6>
                <div class="d-flex flex-column gap-2">
                    <a href="#" class="footer-link">Customer Service</a>
                    <a href="#" class="footer-link">Sales Automation</a>
                    <a href="#" class="footer-link">Data Analysis</a>
                    <a href="#" class="footer-link">Content Creation</a>
                </div>
            </div>
            <div class="col-lg-2 mb-4">
                <h6 class="text-white mb-3">Company</h6>
                <div class="d-flex flex-column gap-2">
                    <a href="#about" class="footer-link">About</a>
                    <a href="#" class="footer-link">Blog</a>
                    <a href="#" class="footer-link">Careers</a>
                    <a href="#" class="footer-link">Contact</a>
                </div>
            </div>
            <div class="col-lg-2 mb-4">
                <h6 class="text-white mb-3">Support</h6>
                <div class="d-flex flex-column gap-2">
                    <a href="#" class="footer-link">Help Center</a>
                    <a href="#" class="footer-link">Status</a>
                    <a href="#" class="footer-link">Security</a>
                    <a href="#" class="footer-link">Terms</a>
                </div>
            </div>
        </div>
        
        <div class="text-center pt-4 mt-4 border-top border-secondary">
            <p class="text-muted mb-0">&copy; 2024 OvercrewAI. All rights reserved. | <a href="../" class="footer-link">Back to All Tenants</a></p>
        </div>
    </div>
</footer>

<script>
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

// Navbar background on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.8)';
    }
});

// Animate metrics on scroll
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate__animated', 'animate__fadeInUp');
        }
    });
}, observerOptions);

document.querySelectorAll('.metrics-card, .agent-card, .process-step').forEach(el => {
    observer.observe(el);
});
</script>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html>