<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Go Models NYC - Premier Modeling Agency | Professional Models in New York</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Go Models NYC is New York's premier modeling agency. Discover professional models for fashion, commercial, editorial, and runway projects. Book talent today.">
    <meta name="keywords" content="Go Models NYC, modeling agency, New York models, fashion models, commercial models, editorial models, runway models">
    <meta name="author" content="Go Models NYC">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Go Models NYC - Premier Modeling Agency">
    <meta property="og:description" content="New York's premier modeling agency representing professional talent across all categories.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=630&fit=crop">
    
    <!-- Stylesheets -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>

<style>
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.hero-section {
    background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.3)), 
                url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop') center/cover;
    height: 100vh;
    display: flex;
    align-items: center;
    color: white;
    position: relative;
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, rgba(255,105,180,0.8), rgba(75,0,130,0.8));
}

.hero-content {
    position: relative;
    z-index: 2;
}

.category-card {
    transition: all 0.4s ease;
    cursor: pointer;
    border: none;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
}

.category-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.category-card .card-img-overlay {
    background: linear-gradient(transparent, rgba(0,0,0,0.8));
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.model-card {
    border: none;
    border-radius: 15px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.model-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.stats-counter {
    font-size: 2.5rem;
    font-weight: bold;
    color: #ff69b4;
}

.success-story {
    background: white;
    border-radius: 15px;
    padding: 2rem;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.success-story:hover {
    transform: translateY(-5px);
}

.job-card {
    border: none;
    border-radius: 12px;
    box-shadow: 0 3px 15px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
}

.job-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.search-hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 3rem;
    color: white;
    margin: 2rem 0;
}

.floating-cta {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 1000;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.testimonial-card {
    background: #f8f9fa;
    border-radius: 15px;
    padding: 2rem;
    border-left: 5px solid #ff69b4;
}

.feature-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(45deg, #ff69b4, #8a2be2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
}

.navbar-brand {
    font-size: 1.8rem;
    font-weight: bold;
    background: linear-gradient(45deg, #ff69b4, #8a2be2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.academy-card {
    background: white;
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    border: 2px solid transparent;
    transition: all 0.3s ease;
}

.academy-card:hover {
    transform: translateY(-5px);
    border-color: #ff69b4;
}

.academy-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(45deg, #ff69b4, #8a2be2);
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    color: white;
    font-size: 1.5rem;
}

.marketplace-card {
    background: white;
    border-radius: 15px;
    padding: 25px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
}

.marketplace-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
    text-decoration: none;
    color: inherit;
}

.marketplace-logo {
    height: 40px;
    margin-bottom: 15px;
}
</style>

<!-- Navigation -->
<nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
    <div class="container">
        <a class="navbar-brand" href="#home">
            <i class="fas fa-star me-2"></i>Go Models NYC
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item"><a class="nav-link" href="#categories">Categories</a></li>
                <li class="nav-item"><a class="nav-link" href="#featured">Featured</a></li>
                <li class="nav-item"><a class="nav-link" href="#how-to-become">Become a Model</a></li>
                <li class="nav-item"><a class="nav-link" href="#academy">Academy</a></li>
                <li class="nav-item"><a class="nav-link" href="#marketplaces">Marketplaces</a></li>
                <li class="nav-item"><a class="nav-link" href="blog/">Blog</a></li>
                <li class="nav-item"><a class="nav-link" href="../" style="color: #667eea;">← Public Directory</a></li>
            </ul>
            <div class="d-flex">
                <a href="#hire" class="btn btn-outline-primary me-2">Hire Models</a>
                <a href="#register" class="btn btn-primary">Apply Now</a>
            </div>
        </div>
    </div>
</nav>

<!-- Hero Section -->
<section id="home" class="hero-section">
    <div class="hero-overlay"></div>
    <div class="container hero-content text-center">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <h1 class="display-3 fw-bold mb-4 animate__animated animate__fadeInUp">
                    New York's Premier<br>Modeling Agency
                </h1>
                <p class="lead mb-5 animate__animated animate__fadeInUp animate__delay-1s">
                    Connecting exceptional talent with top brands worldwide. From baby models to seasoned professionals, we represent the finest talent in the industry.
                </p>
                <div class="d-flex justify-content-center gap-3 animate__animated animate__fadeInUp animate__delay-2s">
                    <a href="#hire" class="btn btn-light btn-lg px-4">
                        <i class="fas fa-users me-2"></i>Hire Models
                    </a>
                    <a href="#register" class="btn btn-outline-light btn-lg px-4">
                        <i class="fas fa-star me-2"></i>Become a Model
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Stats Counter -->
        <div class="row mt-5 animate__animated animate__fadeInUp animate__delay-3s">
            <div class="col-md-3 text-center">
                <div class="stats-counter" data-count="500">500+</div>
                <p class="mb-0">Active Models</p>
            </div>
            <div class="col-md-3 text-center">
                <div class="stats-counter" data-count="1200">1200+</div>
                <p class="mb-0">Successful Bookings</p>
            </div>
            <div class="col-md-3 text-center">
                <div class="stats-counter" data-count="85">85+</div>
                <p class="mb-0">Brand Partners</p>
            </div>
            <div class="col-md-3 text-center">
                <div class="stats-counter" data-count="12">15+</div>
                <p class="mb-0">Years Experience</p>
            </div>
        </div>
    </div>
</section>

<!-- Model Categories Section -->
<section id="categories" class="container my-5 py-5">
    <div class="text-center mb-5">
        <h2 class="fw-bold">Our Model Categories</h2>
        <p class="text-muted">Explore our diverse range of professional models</p>
    </div>
    
    <div class="row g-4">
        <!-- Baby Models -->
        <div class="col-lg-4 col-md-6">
            <div class="card category-card h-100" onclick="window.location.href='baby-models/'">
                <img src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop" class="card-img" alt="Baby Models">
                <div class="card-img-overlay">
                    <h4 class="card-title text-white fw-bold">Baby Models</h4>
                    <p class="card-text text-white">Ages 0-2 years • 45 models available</p>
                    <span class="badge bg-primary">Premium Care • Licensed Guardians</span>
                </div>
            </div>
        </div>
        
        <!-- Kids Models -->
        <div class="col-lg-4 col-md-6">
            <div class="card category-card h-100" onclick="window.location.href='kids-models/'">
                <img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop" class="card-img" alt="Kids Models">
                <div class="card-img-overlay">
                    <h4 class="card-title text-white fw-bold">Kids Models</h4>
                    <p class="card-text text-white">Ages 3-12 years • 78 models available</p>
                    <span class="badge bg-success">Experienced • Tutoring Available</span>
                </div>
            </div>
        </div>
        
        <!-- Male Models -->
        <div class="col-lg-4 col-md-6">
            <div class="card category-card h-100" onclick="window.location.href='male-models/'">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop" class="card-img" alt="Male Models">
                <div class="card-img-overlay">
                    <h4 class="card-title text-white fw-bold">Male Models</h4>
                    <p class="card-text text-white">Fashion & Commercial • 156 models available</p>
                    <span class="badge bg-warning">Runway • Editorial • Commercial</span>
                </div>
            </div>
        </div>
        
        <!-- Fitness Models -->
        <div class="col-lg-4 col-md-6">
            <div class="card category-card h-100" onclick="window.location.href='fitness-models/'">
                <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop" class="card-img" alt="Fitness Models">
                <div class="card-img-overlay">
                    <h4 class="card-title text-white fw-bold">Fitness Models</h4>
                    <p class="card-text text-white">Athletic & Wellness • 89 models available</p>
                    <span class="badge bg-danger">Certified • Athletic • Nutrition</span>
                </div>
            </div>
        </div>
        
        <!-- 50+ Models -->
        <div class="col-lg-4 col-md-6">
            <div class="card category-card h-100" onclick="window.location.href='50plus-models/'">
                <img src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=300&fit=crop" class="card-img" alt="50+ Models">
                <div class="card-img-overlay">
                    <h4 class="card-title text-white fw-bold">50+ Models</h4>
                    <p class="card-text text-white">Mature & Distinguished • 34 models available</p>
                    <span class="badge bg-info">Experienced • Professional • Elegant</span>
                </div>
            </div>
        </div>
        
        <!-- Curvy Models -->
        <div class="col-lg-4 col-md-6">
            <div class="card category-card h-100" onclick="window.location.href='curvy-models/'">
                <img src="https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=400&h=300&fit=crop" class="card-img" alt="Curvy Models">
                <div class="card-img-overlay">
                    <h4 class="card-title text-white fw-bold">Curvy Models</h4>
                    <p class="card-text text-white">Plus Size & Body Positive • 67 models available</p>
                    <span class="badge bg-secondary">Inclusive • Confident • Beautiful</span>
                </div>
            </div>
        </div>
        
        <!-- Tattoo Models -->
        <div class="col-lg-4 col-md-6">
            <div class="card category-card h-100" onclick="window.location.href='tattoo-models/'">
                <img src="https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=400&h=300&fit=crop" class="card-img" alt="Tattoo Models">
                <div class="card-img-overlay">
                    <h4 class="card-title text-white fw-bold">Tattoo Models</h4>
                    <p class="card-text text-white">Alternative & Inked • 75 models available</p>
                    <span class="badge bg-dark">Unique • Artistic • Edgy</span>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Featured Models Section -->
<section id="featured" class="bg-light py-5">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="fw-bold">Featured Models</h2>
            <p class="text-muted">Meet our top-performing models this month</p>
        </div>
        
        <div class="row g-4">
            <!-- Featured Model 1 -->
            <div class="col-lg-3 col-md-6">
                <div class="card model-card">
                    <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&crop=face" class="card-img-top" alt="Emma Johnson">
                    <div class="card-body text-center">
                        <h5 class="card-title">Emma Johnson</h5>
                        <p class="text-muted small">Fashion Model • 5'9" • NYC</p>
                        <div class="mb-3">
                            <span class="text-warning">
                                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            </span>
                            <small class="text-muted">(4.9)</small>
                        </div>
                        <div class="d-flex justify-content-around small mb-3">
                            <div><strong>47</strong><br><span class="text-muted">Projects</span></div>
                            <div><strong>8</strong><br><span class="text-muted">Years</span></div>
                            <div><strong>$500</strong><br><span class="text-muted">Rate/hr</span></div>
                        </div>
                        <a href="#contact" class="btn btn-primary btn-sm">Book Now</a>
                    </div>
                </div>
            </div>
            
            <!-- Featured Model 2 -->
            <div class="col-lg-3 col-md-6">
                <div class="card model-card">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face" class="card-img-top" alt="Marcus Rodriguez">
                    <div class="card-body text-center">
                        <h5 class="card-title">Marcus Rodriguez</h5>
                        <p class="text-muted small">Male Model • 6'2" • NYC</p>
                        <div class="mb-3">
                            <span class="text-warning">
                                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            </span>
                            <small class="text-muted">(4.8)</small>
                        </div>
                        <div class="d-flex justify-content-around small mb-3">
                            <div><strong>32</strong><br><span class="text-muted">Projects</span></div>
                            <div><strong>6</strong><br><span class="text-muted">Years</span></div>
                            <div><strong>$450</strong><br><span class="text-muted">Rate/hr</span></div>
                        </div>
                        <a href="#contact" class="btn btn-primary btn-sm">Book Now</a>
                    </div>
                </div>
            </div>
            
            <!-- Featured Model 3 -->
            <div class="col-lg-3 col-md-6">
                <div class="card model-card">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&crop=face" class="card-img-top" alt="Jessica Chen">
                    <div class="card-body text-center">
                        <h5 class="card-title">Jessica Chen</h5>
                        <p class="text-muted small">Editorial Model • 5'8" • NYC</p>
                        <div class="mb-3">
                            <span class="text-warning">
                                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            </span>
                            <small class="text-muted">(5.0)</small>
                        </div>
                        <div class="d-flex justify-content-around small mb-3">
                            <div><strong>65</strong><br><span class="text-muted">Projects</span></div>
                            <div><strong>10</strong><br><span class="text-muted">Years</span></div>
                            <div><strong>$600</strong><br><span class="text-muted">Rate/hr</span></div>
                        </div>
                        <a href="#contact" class="btn btn-primary btn-sm">Book Now</a>
                    </div>
                </div>
            </div>
            
            <!-- Featured Model 4 -->
            <div class="col-lg-3 col-md-6">
                <div class="card model-card">
                    <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop&crop=face" class="card-img-top" alt="Jake Thompson">
                    <div class="card-body text-center">
                        <h5 class="card-title">Jake Thompson</h5>
                        <p class="text-muted small">Fitness Model • 6'0" • NYC</p>
                        <div class="mb-3">
                            <span class="text-warning">
                                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            </span>
                            <small class="text-muted">(4.9)</small>
                        </div>
                        <div class="d-flex justify-content-around small mb-3">
                            <div><strong>55</strong><br><span class="text-muted">Projects</span></div>
                            <div><strong>7</strong><br><span class="text-muted">Years</span></div>
                            <div><strong>$475</strong><br><span class="text-muted">Rate/hr</span></div>
                        </div>
                        <a href="#contact" class="btn btn-primary btn-sm">Book Now</a>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="text-center mt-4">
            <a href="#categories" class="btn btn-outline-primary">View All Models</a>
        </div>
    </div>
</section>

<!-- How to Become a Model Section -->
<section id="how-to-become" class="container my-5 py-5">
    <div class="text-center mb-5">
        <h2 class="fw-bold">How to Become a Model</h2>
        <p class="text-muted">Your journey to professional modeling starts here</p>
    </div>
    
    <div class="row g-4">
        <div class="col-lg-3 col-md-6">
            <div class="text-center">
                <div class="feature-icon">
                    <i class="fas fa-user-plus text-white fa-2x"></i>
                </div>
                <h5>1. Apply Online</h5>
                <p class="text-muted">Submit your application with basic photos. No professional shots required to start!</p>
            </div>
        </div>
        
        <div class="col-lg-3 col-md-6">
            <div class="text-center">
                <div class="feature-icon">
                    <i class="fas fa-search text-white fa-2x"></i>
                </div>
                <h5>2. Agency Review</h5>
                <p class="text-muted">Our experts review your application and assess your potential in the industry.</p>
            </div>
        </div>
        
        <div class="col-lg-3 col-md-6">
            <div class="text-center">
                <div class="feature-icon">
                    <i class="fas fa-camera text-white fa-2x"></i>
                </div>
                <h5>3. Portfolio Shoot</h5>
                <p class="text-muted">We arrange professional photography to build your modeling portfolio.</p>
            </div>
        </div>
        
        <div class="col-lg-3 col-md-6">
            <div class="text-center">
                <div class="feature-icon">
                    <i class="fas fa-star text-white fa-2x"></i>
                </div>
                <h5>4. Start Booking</h5>
                <p class="text-muted">Begin your modeling career with our network of clients and opportunities.</p>
            </div>
        </div>
    </div>
    
    <div class="text-center mt-5">
        <a href="#register" class="btn btn-primary btn-lg">Apply Now</a>
    </div>
</section>

<!-- Go Models Academy Section -->
<section id="academy" class="bg-light py-5">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="fw-bold">Go Models Academy</h2>
            <p class="text-muted">Professional training and development for aspiring models</p>
        </div>
        
        <div class="row g-4">
            <div class="col-lg-4">
                <div class="academy-card h-100">
                    <div class="academy-icon">
                        <i class="fas fa-walking"></i>
                    </div>
                    <h4>Runway Training</h4>
                    <p class="text-muted">Master the art of runway walking with our professional coaches. Learn posture, timing, and presence.</p>
                    <ul class="list-unstyled mt-3">
                        <li><i class="fas fa-check text-success me-2"></i>12-week program</li>
                        <li><i class="fas fa-check text-success me-2"></i>Professional instructors</li>
                        <li><i class="fas fa-check text-success me-2"></i>Fashion week preparation</li>
                    </ul>
                    <a href="#contact" class="btn btn-outline-primary btn-sm">Learn More</a>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="academy-card h-100">
                    <div class="academy-icon">
                        <i class="fas fa-camera"></i>
                    </div>
                    <h4>Photography Posing</h4>
                    <p class="text-muted">Learn professional posing techniques for editorial, commercial, and fashion photography.</p>
                    <ul class="list-unstyled mt-3">
                        <li><i class="fas fa-check text-success me-2"></i>Studio practice</li>
                        <li><i class="fas fa-check text-success me-2"></i>Portfolio building</li>
                        <li><i class="fas fa-check text-success me-2"></i>Industry standards</li>
                    </ul>
                    <a href="#contact" class="btn btn-outline-primary btn-sm">Learn More</a>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="academy-card h-100">
                    <div class="academy-icon">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <h4>Business Skills</h4>
                    <p class="text-muted">Understand the business side of modeling, contracts, rates, and building your brand.</p>
                    <ul class="list-unstyled mt-3">
                        <li><i class="fas fa-check text-success me-2"></i>Contract negotiation</li>
                        <li><i class="fas fa-check text-success me-2"></i>Social media branding</li>
                        <li><i class="fas fa-check text-success me-2"></i>Financial planning</li>
                    </ul>
                    <a href="#contact" class="btn btn-outline-primary btn-sm">Learn More</a>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Marketplaces Section -->
<section id="marketplaces" class="container my-5 py-5">
    <div class="text-center mb-5">
        <h2 class="fw-bold">Other Marketplaces</h2>
        <p class="text-muted">Explore more professional services and marketplaces on our platform</p>
    </div>
    
    <div class="row g-4">
        <!-- OvercrewAI -->
        <div class="col-lg-4 col-md-6">
            <a href="../overcrewai/" class="marketplace-card d-block h-100">
                <div class="text-center">
                    <h4 style="background: linear-gradient(45deg, #00b894, #6c5ce7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                        <i class="fas fa-robot me-2"></i>OvercrewAI
                    </h4>
                    <p class="text-muted mb-3">AI Digital Workforce Marketplace</p>
                    <p class="small">Hire AI agents for customer service, sales, marketing, and data analysis. 24/7 availability with 82% cost reduction.</p>
                    <div class="mt-3">
                        <span class="badge bg-success me-1">10K+ AI Agents</span>
                        <span class="badge bg-primary">$0.10/task avg</span>
                    </div>
                </div>
            </a>
        </div>
        
        <!-- Creative Studio X -->
        <div class="col-lg-4 col-md-6">
            <div class="marketplace-card h-100">
                <div class="text-center">
                    <h4 style="color: #f39c12;">
                        <i class="fas fa-palette me-2"></i>Creative Studio X
                    </h4>
                    <p class="text-muted mb-3">Creative Services Agency</p>
                    <p class="small">Full-service creative agency specializing in branding, design, and digital experiences.</p>
                    <div class="mt-3">
                        <span class="badge bg-warning text-dark">Coming Soon</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- DevMarket Pro -->
        <div class="col-lg-4 col-md-6">
            <div class="marketplace-card h-100">
                <div class="text-center">
                    <h4 style="color: #3498db;">
                        <i class="fas fa-code me-2"></i>DevMarket Pro
                    </h4>
                    <p class="text-muted mb-3">Technology Marketplace</p>
                    <p class="small">Connect with top developers, designers, and tech professionals for your projects.</p>
                    <div class="mt-3">
                        <span class="badge bg-info text-dark">Coming Soon</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="text-center mt-5">
        <a href="../" class="btn btn-outline-primary">View All Marketplaces</a>
    </div>
</section>

<!-- Hire Models Section -->
<section id="hire" class="bg-light py-5">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="fw-bold">Hire Professional Models</h2>
            <p class="text-muted">Book talent for your next project</p>
        </div>
        
        <div class="row align-items-center">
            <div class="col-lg-6">
                <h4>Why Choose Go Models NYC?</h4>
                <ul class="list-unstyled mt-4">
                    <li class="mb-3">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        <strong>Diverse Talent Pool:</strong> 500+ professional models across all categories
                    </li>
                    <li class="mb-3">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        <strong>Vetted Professionals:</strong> All models are experienced and reliable
                    </li>
                    <li class="mb-3">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        <strong>Quick Booking:</strong> Fast response times and easy booking process
                    </li>
                    <li class="mb-3">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        <strong>Competitive Rates:</strong> Transparent pricing with no hidden fees
                    </li>
                    <li class="mb-3">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        <strong>Full Support:</strong> Dedicated team to assist with your project
                    </li>
                </ul>
                <a href="#contact" class="btn btn-primary">Get Started</a>
            </div>
            <div class="col-lg-6">
                <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=400&fit=crop" 
                     class="img-fluid rounded shadow" alt="Professional Models">
            </div>
        </div>
    </div>
</section>

<!-- Registration Section -->
<section id="register" class="bg-primary py-5">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6 text-white">
                <h2 class="fw-bold mb-4">Ready to Start Your Modeling Career?</h2>
                <p class="lead mb-4">Join Go Models NYC and take the first step towards professional modeling success.</p>
                
                <h5 class="mb-3">What We Offer:</h5>
                <ul class="list-unstyled">
                    <li class="mb-2"><i class="fas fa-check me-2"></i>Professional portfolio development</li>
                    <li class="mb-2"><i class="fas fa-check me-2"></i>Access to top brands and photographers</li>
                    <li class="mb-2"><i class="fas fa-check me-2"></i>Career guidance and support</li>
                    <li class="mb-2"><i class="fas fa-check me-2"></i>Competitive commission rates</li>
                    <li class="mb-2"><i class="fas fa-check me-2"></i>Flexible scheduling</li>
                </ul>
            </div>
            <div class="col-lg-6">
                <div class="card shadow">
                    <div class="card-body p-4">
                        <h4 class="card-title mb-4">Quick Application</h4>
                        <form id="modelApplicationForm">
                            <div class="mb-3">
                                <label class="form-label">Full Name</label>
                                <input type="text" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Phone</label>
                                <input type="tel" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Age</label>
                                <input type="number" class="form-control" min="0" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Category of Interest</label>
                                <select class="form-select" required>
                                    <option value="">Choose...</option>
                                    <option>Fashion</option>
                                    <option>Commercial</option>
                                    <option>Editorial</option>
                                    <option>Fitness</option>
                                    <option>Plus Size</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary w-100">Submit Application</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Contact Section -->
<section id="contact" class="container my-5 py-5">
    <div class="text-center mb-5">
        <h2 class="fw-bold">Contact Us</h2>
        <p class="text-muted">Get in touch with our team</p>
    </div>
    
    <div class="row justify-content-center">
        <div class="col-lg-8">
            <div class="row g-4 text-center">
                <div class="col-md-4">
                    <div class="p-4">
                        <i class="fas fa-map-marker-alt fa-3x text-primary mb-3"></i>
                        <h5>Visit Us</h5>
                        <p class="text-muted">123 Fashion Avenue<br>Manhattan, NY 10001</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-4">
                        <i class="fas fa-phone fa-3x text-primary mb-3"></i>
                        <h5>Call Us</h5>
                        <p class="text-muted">(555) 123-4567<br>Mon-Fri 9AM-6PM EST</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-4">
                        <i class="fas fa-envelope fa-3x text-primary mb-3"></i>
                        <h5>Email Us</h5>
                        <p class="text-muted">info@gomodelsnyc.com<br>bookings@gomodelsnyc.com</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Blog Section -->
<section id="blog" class="bg-light py-5">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="fw-bold">Latest from Our Blog</h2>
            <p class="text-muted">Industry insights, model success stories, and agency updates</p>
        </div>
        
        <div class="row g-4">
            <!-- Blog Post 1 -->
            <div class="col-lg-4 col-md-6">
                <article class="card h-100 border-0 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=250&fit=crop" 
                         class="card-img-top" alt="Fashion Week">
                    <div class="card-body">
                        <div class="text-muted small mb-2">
                            <i class="fas fa-calendar me-1"></i> December 20, 2024
                        </div>
                        <h5 class="card-title">Go Models Takes NYFW 2024</h5>
                        <p class="card-text">Our models walked for top designers during New York Fashion Week, showcasing diversity and talent on the runway.</p>
                        <a href="blog/fashion-week-2024.php" class="btn btn-sm btn-outline-primary">
                            Read More <i class="fas fa-arrow-right ms-1"></i>
                        </a>
                    </div>
                </article>
            </div>
            
            <!-- Blog Post 2 -->
            <div class="col-lg-4 col-md-6">
                <article class="card h-100 border-0 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=250&fit=crop" 
                         class="card-img-top" alt="Kids Modeling">
                    <div class="card-body">
                        <div class="text-muted small mb-2">
                            <i class="fas fa-calendar me-1"></i> December 15, 2024
                        </div>
                        <h5 class="card-title">Guide to Kids Modeling Success</h5>
                        <p class="card-text">Essential tips for parents considering modeling opportunities for their children. Safety, education, and fun come first.</p>
                        <a href="blog/kids-modeling-guide.php" class="btn btn-sm btn-outline-primary">
                            Read More <i class="fas fa-arrow-right ms-1"></i>
                        </a>
                    </div>
                </article>
            </div>
            
            <!-- Blog Post 3 -->
            <div class="col-lg-4 col-md-6">
                <article class="card h-100 border-0 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop" 
                         class="card-img-top" alt="Fitness Modeling">
                    <div class="card-body">
                        <div class="text-muted small mb-2">
                            <i class="fas fa-calendar me-1"></i> December 10, 2024
                        </div>
                        <h5 class="card-title">The Rise of Fitness Modeling</h5>
                        <p class="card-text">How the fitness industry is creating new opportunities for athletic models and wellness influencers in 2024.</p>
                        <a href="blog/fitness-modeling-rise.php" class="btn btn-sm btn-outline-primary">
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
    </div>
</section>

<!-- Footer -->
<footer class="bg-dark text-white py-5">
    <div class="container">
        <div class="row">
            <div class="col-lg-4 mb-4">
                <h5 class="mb-3"><i class="fas fa-star me-2"></i>Go Models NYC</h5>
                <p class="text-muted">New York's premier modeling agency representing diverse talent across all categories.</p>
                <div class="mt-3">
                    <a href="#" class="text-light me-3"><i class="fab fa-instagram fa-lg"></i></a>
                    <a href="#" class="text-light me-3"><i class="fab fa-facebook fa-lg"></i></a>
                    <a href="#" class="text-light me-3"><i class="fab fa-twitter fa-lg"></i></a>
                    <a href="#" class="text-light"><i class="fab fa-linkedin fa-lg"></i></a>
                </div>
            </div>
            
            <div class="col-lg-2 mb-4">
                <h6 class="fw-bold">Models</h6>
                <ul class="list-unstyled">
                    <li><a href="baby-models/" class="text-light opacity-75 text-decoration-none">Baby Models</a></li>
                    <li><a href="kids-models/" class="text-light opacity-75 text-decoration-none">Kids Models</a></li>
                    <li><a href="male-models/" class="text-light opacity-75 text-decoration-none">Male Models</a></li>
                    <li><a href="fitness-models/" class="text-light opacity-75 text-decoration-none">Fitness Models</a></li>
                    <li><a href="50plus-models/" class="text-light opacity-75 text-decoration-none">50+ Models</a></li>
                    <li><a href="curvy-models/" class="text-light opacity-75 text-decoration-none">Curvy Models</a></li>
                    <li><a href="tattoo-models/" class="text-light opacity-75 text-decoration-none">Tattoo Models</a></li>
                </ul>
            </div>
            
            <div class="col-lg-2 mb-4">
                <h6 class="fw-bold">Services</h6>
                <ul class="list-unstyled">
                    <li><a href="#hire" class="text-light opacity-75 text-decoration-none">Hire Models</a></li>
                    <li><a href="#academy" class="text-light opacity-75 text-decoration-none">Model Academy</a></li>
                    <li><a href="#register" class="text-light opacity-75 text-decoration-none">Become a Model</a></li>
                    <li><a href="#contact" class="text-light opacity-75 text-decoration-none">Contact Us</a></li>
                </ul>
            </div>
            
            <div class="col-lg-2 mb-4">
                <h6 class="fw-bold">Quick Links</h6>
                <ul class="list-unstyled">
                    <li><a href="#about" class="text-light opacity-75 text-decoration-none">About Us</a></li>
                    <li><a href="#" class="text-light opacity-75 text-decoration-none">Privacy Policy</a></li>
                    <li><a href="#" class="text-light opacity-75 text-decoration-none">Terms of Service</a></li>
                    <li><a href="../" class="text-light opacity-75 text-decoration-none">All Marketplaces</a></li>
                </ul>
            </div>
            
            <div class="col-lg-2 mb-4">
                <h6 class="fw-bold">Platform</h6>
                <ul class="list-unstyled">
                    <li><a href="../" class="text-light opacity-75 text-decoration-none">Public Directory</a></li>
                    <li><a href="../overcrewai/" class="text-light opacity-75 text-decoration-none">OvercrewAI</a></li>
                    <li><a href="#" class="text-light opacity-75 text-decoration-none">More Coming Soon</a></li>
                </ul>
            </div>
        </div>
        
        <hr class="my-4 opacity-25">
        
        <div class="text-center">
            <p class="mb-0 text-muted">&copy; 2024 Go Models NYC. All rights reserved. Part of the itellico Platform.</p>
        </div>
    </div>
</footer>

<!-- Floating CTA -->
<div class="floating-cta">
    <a href="#register" class="btn btn-primary btn-lg rounded-pill shadow">
        <i class="fas fa-star me-2"></i>Apply Now
    </a>
</div>

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

// Form submission handler
document.getElementById('modelApplicationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your application! We will review it and get back to you within 48 hours.');
    this.reset();
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('shadow-lg');
    } else {
        navbar.classList.remove('shadow-lg');
    }
});
</script>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html>