<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tattoo Models - Go Models NYC | Alternative & Inked Model Agency</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Discover Go Models NYC's stunning tattoo models. Professional alternative models with unique ink art for fashion, editorial, and commercial campaigns. Book tattooed models in New York.">
    <meta name="keywords" content="tattoo models NYC, inked models, alternative models, tattooed model agency, body art models, fashion tattoos, editorial tattoo photography, NYC modeling">
    <meta name="author" content="Go Models NYC">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Tattoo Models - Go Models NYC | Alternative & Inked Models">
    <meta property="og:description" content="Professional tattoo models for fashion and commercial projects. Unique individuals with stunning body art. Book NYC's best inked models.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://gomodels.com/tattoo-models">
    <meta property="og:image" content="https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=1200&h=630&fit=crop">
    
    <!-- Stylesheets -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>

<style>
/* Global Styles */
:root {
    --primary-color: #ff69b4;
    --secondary-color: #8a2be2;
    --accent-color: #ff1493;
    --dark-color: #1a1a1a;
    --light-bg: #f8f9fa;
}

body {
    font-family: 'Poppins', sans-serif;
    color: #333;
}

/* Hero Section */
.hero-section {
    background: linear-gradient(135deg, rgba(255,105,180,0.9) 0%, rgba(138,43,226,0.9) 100%),
                url('https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=1920&h=1080&fit=crop') center/cover;
    min-height: 100vh;
    display: flex;
    align-items: center;
    position: relative;
    color: white;
}

.hero-content h1 {
    font-family: 'Playfair Display', serif;
    font-size: 4rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.hero-subtitle {
    font-size: 1.4rem;
    margin-bottom: 2rem;
    opacity: 0.95;
}

/* Category Badge */
.category-badge {
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255,255,255,0.3);
    padding: 12px 30px;
    border-radius: 30px;
    display: inline-block;
    margin-bottom: 2rem;
    font-weight: 500;
}

/* Navigation */
.main-nav {
    background: rgba(26, 26, 26, 0.95);
    backdrop-filter: blur(10px);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
    padding: 1rem 0;
    transition: all 0.3s ease;
}

.nav-logo {
    font-size: 1.8rem;
    font-weight: 700;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-decoration: none;
}

.nav-link {
    color: white !important;
    margin: 0 15px;
    transition: color 0.3s ease;
    font-weight: 500;
}

.nav-link:hover {
    color: var(--primary-color) !important;
}

/* Model Cards */
.model-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    margin-bottom: 30px;
    height: 100%;
}

.model-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.model-image {
    position: relative;
    overflow: hidden;
    height: 400px;
}

.model-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.model-card:hover .model-image img {
    transform: scale(1.1);
}

.model-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
    padding: 20px;
    transform: translateY(100%);
    transition: transform 0.3s ease;
}

.model-card:hover .model-overlay {
    transform: translateY(0);
}

.model-info {
    padding: 25px;
}

.model-name {
    font-size: 1.4rem;
    font-weight: 600;
    margin-bottom: 5px;
    color: var(--dark-color);
}

.model-stats {
    display: flex;
    gap: 20px;
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 15px;
}

.model-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 15px;
}

.tag {
    background: var(--light-bg);
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    color: #555;
}

.tag.featured {
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    color: white;
}

/* Book Now Button */
.book-now-btn {
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 25px;
    font-weight: 500;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
}

.book-now-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255,105,180,0.4);
    color: white;
}

/* Stats Section */
.stats-section {
    background: var(--dark-color);
    color: white;
    padding: 80px 0;
}

.stat-box {
    text-align: center;
    padding: 30px;
}

.stat-number {
    font-size: 3rem;
    font-weight: 700;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.stat-label {
    font-size: 1.1rem;
    opacity: 0.8;
}

/* CTA Section */
.cta-section {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    padding: 80px 0;
    color: white;
    text-align: center;
}

.cta-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

/* About Section */
.about-section {
    padding: 80px 0;
    background: white;
}

.about-content {
    max-width: 800px;
    margin: 0 auto;
}

.about-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    text-align: center;
    color: var(--dark-color);
}

.feature-list {
    list-style: none;
    padding: 0;
    margin: 30px 0;
}

.feature-list li {
    padding: 15px 0;
    border-bottom: 1px solid #eee;
    display: flex;
    align-items: center;
}

.feature-list i {
    color: var(--primary-color);
    margin-right: 15px;
    font-size: 1.2rem;
}

/* Footer */
.footer {
    background: var(--dark-color);
    color: white;
    padding: 60px 0 30px;
}

.footer-logo {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1rem;
}

.footer-link {
    color: #bbb;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-link:hover {
    color: var(--primary-color);
}

/* Responsive */
@media (max-width: 768px) {
    .hero-content h1 {
        font-size: 2.5rem;
    }
    
    .model-stats {
        font-size: 0.8rem;
    }
    
    .stat-number {
        font-size: 2rem;
    }
}
</style>

<!-- Navigation -->
<nav class="main-nav">
    <div class="container">
        <div class="d-flex justify-content-between align-items-center">
            <a href="../index.php" class="nav-logo">
                <i class="fas fa-star me-2"></i>Go Models
            </a>
            <div class="nav-menu d-none d-lg-flex align-items-center">
                <a href="../index.php" class="nav-link">Home</a>
                <a href="../index.php#categories" class="nav-link">Categories</a>
                <a href="../male-models/" class="nav-link">Male</a>
                <a href="../baby-models/" class="nav-link">Baby</a>
                <a href="../kids-models/" class="nav-link">Kids</a>
                <a href="../fitness-models/" class="nav-link">Fitness</a>
                <a href="../curvy-models/" class="nav-link">Curvy</a>
                <a href="../50plus-models/" class="nav-link">50+</a>
                <a href="./" class="nav-link active">Tattoo</a>
                <a href="../index.php#contact" class="nav-link">Contact</a>
            </div>
            <button class="btn btn-outline-light d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu">
                <i class="fas fa-bars"></i>
            </button>
        </div>
    </div>
</nav>

<!-- Mobile Menu -->
<div class="offcanvas offcanvas-end" tabindex="-1" id="mobileMenu">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title">Menu</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body">
        <div class="d-flex flex-column">
            <a href="../index.php" class="nav-link mb-3">Home</a>
            <a href="../index.php#categories" class="nav-link mb-3">Categories</a>
            <a href="../male-models/" class="nav-link mb-3">Male Models</a>
            <a href="../baby-models/" class="nav-link mb-3">Baby Models</a>
            <a href="../kids-models/" class="nav-link mb-3">Kids Models</a>
            <a href="../fitness-models/" class="nav-link mb-3">Fitness Models</a>
            <a href="../curvy-models/" class="nav-link mb-3">Curvy Models</a>
            <a href="../50plus-models/" class="nav-link mb-3">50+ Models</a>
            <a href="./" class="nav-link mb-3 active">Tattoo Models</a>
            <a href="../index.php#contact" class="nav-link mb-3">Contact</a>
        </div>
    </div>
</div>

<!-- Hero Section -->
<section class="hero-section">
    <div class="container">
        <div class="hero-content text-center" data-aos="fade-up">
            <div class="category-badge">
                <i class="fas fa-palette me-2"></i>Alternative & Inked Models
            </div>
            <h1>Tattoo Models</h1>
            <p class="hero-subtitle">
                Unique individuals with stunning body art.<br>
                Where ink meets fashion, art meets commerce.
            </p>
            <div class="d-flex gap-3 justify-content-center flex-wrap">
                <a href="#models" class="btn btn-light btn-lg">
                    <i class="fas fa-images me-2"></i>View Portfolio
                </a>
                <a href="#book" class="btn btn-outline-light btn-lg">
                    <i class="fas fa-calendar me-2"></i>Book a Model
                </a>
            </div>
        </div>
    </div>
</section>

<!-- Stats Section -->
<section class="stats-section">
    <div class="container">
        <div class="row">
            <div class="col-md-3 col-6">
                <div class="stat-box" data-aos="fade-up" data-aos-delay="100">
                    <div class="stat-number">75+</div>
                    <div class="stat-label">Tattoo Models</div>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="stat-box" data-aos="fade-up" data-aos-delay="200">
                    <div class="stat-number">300+</div>
                    <div class="stat-label">Campaigns</div>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="stat-box" data-aos="fade-up" data-aos-delay="300">
                    <div class="stat-number">50+</div>
                    <div class="stat-label">Brand Partners</div>
                </div>
            </div>
            <div class="col-md-3 col-6">
                <div class="stat-box" data-aos="fade-up" data-aos-delay="400">
                    <div class="stat-number">98%</div>
                    <div class="stat-label">Client Satisfaction</div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Models Grid -->
<section id="models" class="container my-5 py-5">
    <div class="text-center mb-5" data-aos="fade-up">
        <h2 class="display-4 fw-bold">Our Tattoo Models</h2>
        <p class="lead text-muted">Unique personalities with distinctive body art</p>
    </div>

    <div class="row g-4">
        <!-- Model 1 - Featured Alternative Model -->
        <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="100">
            <div class="model-card">
                <div class="model-image">
                    <img src="https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=600&h=400&fit=crop" 
                         alt="Tattoo Model Phoenix">
                    <div class="model-overlay">
                        <p class="text-white mb-0">Alternative fashion specialist with full sleeve tattoos and vibrant personality</p>
                    </div>
                </div>
                <div class="model-info">
                    <h3 class="model-name">Phoenix Rose</h3>
                    <div class="model-stats">
                        <span><i class="fas fa-ruler-vertical me-1"></i>5'8"</span>
                        <span><i class="fas fa-palette me-1"></i>Full Sleeves</span>
                        <span><i class="fas fa-camera me-1"></i>Editorial</span>
                    </div>
                    <div class="model-tags">
                        <span class="tag featured">Featured</span>
                        <span class="tag">Alternative</span>
                        <span class="tag">Fashion</span>
                        <span class="tag">Rock Style</span>
                    </div>
                    <a href="#" class="book-now-btn">
                        <i class="fas fa-calendar-check me-2"></i>Book Phoenix
                    </a>
                </div>
            </div>
        </div>

        <!-- Model 2 -->
        <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="200">
            <div class="model-card">
                <div class="model-image">
                    <img src="https://images.unsplash.com/photo-1568828623407-feb926dec92f?w=600&h=400&fit=crop" 
                         alt="Male Tattoo Model">
                    <div class="model-overlay">
                        <p class="text-white mb-0">Versatile model with Japanese-style tattoos, perfect for streetwear and luxury brands</p>
                    </div>
                </div>
                <div class="model-info">
                    <h3 class="model-name">Kai Nakamura</h3>
                    <div class="model-stats">
                        <span><i class="fas fa-ruler-vertical me-1"></i>6'1"</span>
                        <span><i class="fas fa-palette me-1"></i>Japanese Art</span>
                        <span><i class="fas fa-camera me-1"></i>Commercial</span>
                    </div>
                    <div class="model-tags">
                        <span class="tag">Japanese Tattoos</span>
                        <span class="tag">Streetwear</span>
                        <span class="tag">Athletic</span>
                    </div>
                    <a href="#" class="book-now-btn">
                        <i class="fas fa-calendar-check me-2"></i>Book Kai
                    </a>
                </div>
            </div>
        </div>

        <!-- Model 3 -->
        <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="300">
            <div class="model-card">
                <div class="model-image">
                    <img src="https://images.unsplash.com/photo-1597586124394-fbd6ef244026?w=600&h=400&fit=crop" 
                         alt="Female Tattoo Model">
                    <div class="model-overlay">
                        <p class="text-white mb-0">Elegant model with delicate botanical tattoos, specializing in beauty and lifestyle</p>
                    </div>
                </div>
                <div class="model-info">
                    <h3 class="model-name">Luna Martinez</h3>
                    <div class="model-stats">
                        <span><i class="fas fa-ruler-vertical me-1"></i>5'6"</span>
                        <span><i class="fas fa-palette me-1"></i>Botanical Art</span>
                        <span><i class="fas fa-camera me-1"></i>Beauty</span>
                    </div>
                    <div class="model-tags">
                        <span class="tag">Botanical</span>
                        <span class="tag">Beauty</span>
                        <span class="tag">Lifestyle</span>
                    </div>
                    <a href="#" class="book-now-btn">
                        <i class="fas fa-calendar-check me-2"></i>Book Luna
                    </a>
                </div>
            </div>
        </div>

        <!-- Model 4 -->
        <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="400">
            <div class="model-card">
                <div class="model-image">
                    <img src="https://images.unsplash.com/photo-1602933428329-981e5099f01e?w=600&h=400&fit=crop" 
                         alt="Punk Rock Model">
                    <div class="model-overlay">
                        <p class="text-white mb-0">Punk rock aesthetic with bold traditional tattoos, music industry favorite</p>
                    </div>
                </div>
                <div class="model-info">
                    <h3 class="model-name">Raven Black</h3>
                    <div class="model-stats">
                        <span><i class="fas fa-ruler-vertical me-1"></i>5'9"</span>
                        <span><i class="fas fa-palette me-1"></i>Traditional</span>
                        <span><i class="fas fa-camera me-1"></i>Music/Fashion</span>
                    </div>
                    <div class="model-tags">
                        <span class="tag">Punk</span>
                        <span class="tag">Music Videos</span>
                        <span class="tag">Alternative</span>
                    </div>
                    <a href="#" class="book-now-btn">
                        <i class="fas fa-calendar-check me-2"></i>Book Raven
                    </a>
                </div>
            </div>
        </div>

        <!-- Model 5 -->
        <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="500">
            <div class="model-card">
                <div class="model-image">
                    <img src="https://images.unsplash.com/photo-1595514535215-57013fbbfae3?w=600&h=400&fit=crop" 
                         alt="Geometric Tattoo Model">
                    <div class="model-overlay">
                        <p class="text-white mb-0">Modern aesthetic with geometric and minimalist tattoos, tech brand specialist</p>
                    </div>
                </div>
                <div class="model-info">
                    <h3 class="model-name">Atlas Grey</h3>
                    <div class="model-stats">
                        <span><i class="fas fa-ruler-vertical me-1"></i>6'0"</span>
                        <span><i class="fas fa-palette me-1"></i>Geometric</span>
                        <span><i class="fas fa-camera me-1"></i>Tech/Lifestyle</span>
                    </div>
                    <div class="model-tags">
                        <span class="tag">Minimalist</span>
                        <span class="tag">Tech Brands</span>
                        <span class="tag">Modern</span>
                    </div>
                    <a href="#" class="book-now-btn">
                        <i class="fas fa-calendar-check me-2"></i>Book Atlas
                    </a>
                </div>
            </div>
        </div>

        <!-- Model 6 -->
        <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="600">
            <div class="model-card">
                <div class="model-image">
                    <img src="https://images.unsplash.com/photo-1571566882372-1598d88abd79?w=600&h=400&fit=crop" 
                         alt="Colorful Tattoo Model">
                    <div class="model-overlay">
                        <p class="text-white mb-0">Vibrant personality with colorful neo-traditional tattoos, festival and event specialist</p>
                    </div>
                </div>
                <div class="model-info">
                    <h3 class="model-name">Iris Rainbow</h3>
                    <div class="model-stats">
                        <span><i class="fas fa-ruler-vertical me-1"></i>5'7"</span>
                        <span><i class="fas fa-palette me-1"></i>Neo-Traditional</span>
                        <span><i class="fas fa-camera me-1"></i>Events</span>
                    </div>
                    <div class="model-tags">
                        <span class="tag">Colorful</span>
                        <span class="tag">Festival Fashion</span>
                        <span class="tag">Vibrant</span>
                    </div>
                    <a href="#" class="book-now-btn">
                        <i class="fas fa-calendar-check me-2"></i>Book Iris
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div class="text-center mt-5">
        <button class="btn btn-outline-primary btn-lg">
            <i class="fas fa-plus me-2"></i>Load More Models
        </button>
    </div>
</section>

<!-- About Section -->
<section class="about-section">
    <div class="container">
        <div class="about-content" data-aos="fade-up">
            <h2 class="about-title">Breaking Boundaries in Fashion</h2>
            <p class="lead text-center mb-5">
                Our tattoo models represent the intersection of art, fashion, and personal expression. 
                Each model brings their unique story, told through the art on their skin.
            </p>
            
            <div class="row">
                <div class="col-md-6">
                    <h4 class="mb-3">Why Choose Our Tattoo Models?</h4>
                    <ul class="feature-list">
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>Diverse range of tattoo styles and aesthetics</span>
                        </li>
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>Professional models experienced in showcasing body art</span>
                        </li>
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>Perfect for alternative fashion and lifestyle brands</span>
                        </li>
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>Comfortable in various settings from studio to street</span>
                        </li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h4 class="mb-3">Ideal For:</h4>
                    <ul class="feature-list">
                        <li>
                            <i class="fas fa-star"></i>
                            <span>Alternative fashion campaigns</span>
                        </li>
                        <li>
                            <i class="fas fa-star"></i>
                            <span>Music videos and album covers</span>
                        </li>
                        <li>
                            <i class="fas fa-star"></i>
                            <span>Tattoo and lifestyle magazines</span>
                        </li>
                        <li>
                            <i class="fas fa-star"></i>
                            <span>Streetwear and urban brands</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- CTA Section -->
<section id="book" class="cta-section">
    <div class="container" data-aos="zoom-in">
        <h2 class="cta-title">Ready to Book Your Tattoo Model?</h2>
        <p class="lead mb-4">
            Let's bring your creative vision to life with our unique talent
        </p>
        <div class="d-flex gap-3 justify-content-center flex-wrap">
            <a href="tel:+12125551234" class="btn btn-light btn-lg">
                <i class="fas fa-phone me-2"></i>Call Now
            </a>
            <a href="mailto:booking@gomodels.com" class="btn btn-outline-light btn-lg">
                <i class="fas fa-envelope me-2"></i>Email Us
            </a>
        </div>
    </div>
</section>

<!-- Footer -->
<footer class="footer">
    <div class="container">
        <div class="row">
            <div class="col-lg-4 mb-4">
                <div class="footer-logo">
                    <i class="fas fa-star me-2"></i>Go Models
                </div>
                <p class="text-muted">
                    New York's premier modeling agency celebrating diversity and authentic beauty since 2009.
                </p>
                <div class="d-flex gap-3 mt-3">
                    <a href="#" class="text-white fs-5"><i class="fab fa-instagram"></i></a>
                    <a href="#" class="text-white fs-5"><i class="fab fa-facebook"></i></a>
                    <a href="#" class="text-white fs-5"><i class="fab fa-twitter"></i></a>
                    <a href="#" class="text-white fs-5"><i class="fab fa-linkedin"></i></a>
                </div>
            </div>
            <div class="col-lg-4 mb-4">
                <h5 class="text-white mb-3">Quick Links</h5>
                <div class="d-flex flex-column gap-2">
                    <a href="../index.php" class="footer-link">Home</a>
                    <a href="../index.php#about" class="footer-link">About Us</a>
                    <a href="../index.php#categories" class="footer-link">All Categories</a>
                    <a href="../index.php#contact" class="footer-link">Contact</a>
                </div>
            </div>
            <div class="col-lg-4 mb-4">
                <h5 class="text-white mb-3">Model Categories</h5>
                <div class="d-flex flex-column gap-2">
                    <a href="../male-models/" class="footer-link">Male Models</a>
                    <a href="../baby-models/" class="footer-link">Baby Models</a>
                    <a href="../kids-models/" class="footer-link">Kids Models</a>
                    <a href="../fitness-models/" class="footer-link">Fitness Models</a>
                    <a href="../curvy-models/" class="footer-link">Curvy Models</a>
                    <a href="../50plus-models/" class="footer-link">50+ Models</a>
                    <a href="./" class="footer-link">Tattoo Models</a>
                </div>
            </div>
        </div>
        <div class="text-center pt-4 mt-4 border-top border-secondary">
            <p class="text-muted mb-0">&copy; 2024 Go Models NYC. All rights reserved. | <a href="../" class="footer-link">Back to Platform</a></p>
        </div>
    </div>
</footer>

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>
<script>
    // Initialize AOS
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const nav = document.querySelector('.main-nav');
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(26, 26, 26, 0.98)';
            nav.style.backdropFilter = 'blur(20px)';
        } else {
            nav.style.background = 'rgba(26, 26, 26, 0.95)';
            nav.style.backdropFilter = 'blur(10px)';
        }
    });

    // Smooth scrolling
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
</script>

</body>
</html>