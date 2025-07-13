<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blog - Go Models NYC | Fashion & Modeling Industry Insights</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Go Models NYC blog featuring modeling tips, industry insights, fashion trends, and success stories from our diverse talent roster.">
    <meta name="keywords" content="modeling blog, fashion industry news, NYC models, modeling tips, Go Models blog, fashion trends 2024">
    <meta name="author" content="Go Models NYC">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Go Models NYC Blog - Industry Insights & Model Stories">
    <meta property="og:description" content="Stay updated with the latest modeling industry news, tips for aspiring models, and success stories from Go Models NYC.">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&h=630&fit=crop">
    
    <!-- Stylesheets -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
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
    background-color: #f8f9fa;
}

/* Navigation */
.main-nav {
    background: white;
    box-shadow: 0 2px 20px rgba(0,0,0,0.1);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
    padding: 1rem 0;
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
    color: #333 !important;
    margin: 0 15px;
    transition: color 0.3s ease;
    font-weight: 500;
}

.nav-link:hover,
.nav-link.active {
    color: var(--primary-color) !important;
}

/* Blog Header */
.blog-header {
    background: linear-gradient(135deg, rgba(255,105,180,0.9) 0%, rgba(138,43,226,0.9) 100%),
                url('https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=600&fit=crop') center/cover;
    padding: 150px 0 80px;
    color: white;
    text-align: center;
}

.blog-header h1 {
    font-family: 'Playfair Display', serif;
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

/* Blog Layout */
.blog-content {
    padding: 60px 0;
}

/* Blog Post Card */
.blog-post-card {
    background: white;
    border-radius: 15px;
    overflow: hidden;
    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
    margin-bottom: 40px;
    transition: all 0.3s ease;
}

.blog-post-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

.blog-post-image {
    position: relative;
    overflow: hidden;
    height: 300px;
}

.blog-post-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.blog-post-card:hover .blog-post-image img {
    transform: scale(1.05);
}

.blog-category-badge {
    position: absolute;
    top: 20px;
    left: 20px;
    background: var(--primary-color);
    color: white;
    padding: 5px 15px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
}

.blog-post-content {
    padding: 30px;
}

.blog-meta {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 15px;
    font-size: 0.9rem;
    color: #666;
}

.blog-meta i {
    color: var(--primary-color);
}

.blog-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--dark-color);
    margin-bottom: 15px;
    text-decoration: none;
    display: block;
    transition: color 0.3s ease;
}

.blog-title:hover {
    color: var(--primary-color);
}

.blog-excerpt {
    color: #666;
    line-height: 1.6;
    margin-bottom: 20px;
}

.read-more-btn {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: gap 0.3s ease;
}

.read-more-btn:hover {
    gap: 10px;
    color: var(--secondary-color);
}

/* Sidebar */
.blog-sidebar {
    position: sticky;
    top: 100px;
}

.sidebar-widget {
    background: white;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.08);
}

.widget-title {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 20px;
    color: var(--dark-color);
    position: relative;
    padding-bottom: 15px;
}

.widget-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50px;
    height: 3px;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
}

/* Search Widget */
.search-form {
    position: relative;
}

.search-form input {
    width: 100%;
    padding: 12px 45px 12px 20px;
    border: 2px solid #e0e0e0;
    border-radius: 25px;
    transition: border-color 0.3s ease;
}

.search-form input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.search-form button {
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--primary-color);
    border: none;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: background 0.3s ease;
}

.search-form button:hover {
    background: var(--secondary-color);
}

/* Categories Widget */
.category-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.category-list li {
    margin-bottom: 12px;
}

.category-list a {
    color: #666;
    text-decoration: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.category-list a:hover {
    background: var(--light-bg);
    color: var(--primary-color);
    padding-left: 20px;
}

.category-count {
    background: var(--light-bg);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.85rem;
}

/* Popular Posts Widget */
.popular-post {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
}

.popular-post:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.popular-post-image {
    width: 80px;
    height: 80px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
}

.popular-post-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.popular-post-content h6 {
    font-size: 0.95rem;
    margin-bottom: 5px;
    line-height: 1.4;
}

.popular-post-content h6 a {
    color: var(--dark-color);
    text-decoration: none;
    transition: color 0.3s ease;
}

.popular-post-content h6 a:hover {
    color: var(--primary-color);
}

.popular-post-date {
    font-size: 0.85rem;
    color: #999;
}

/* Tags Widget */
.tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.tag-cloud a {
    background: var(--light-bg);
    color: #666;
    padding: 8px 16px;
    border-radius: 20px;
    text-decoration: none;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

.tag-cloud a:hover {
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    color: white;
    transform: translateY(-2px);
}

/* Newsletter Widget */
.newsletter-form input {
    width: 100%;
    padding: 12px 20px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 15px;
    transition: border-color 0.3s ease;
}

.newsletter-form input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.newsletter-form button {
    width: 100%;
    padding: 12px;
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.newsletter-form button:hover {
    transform: translateY(-2px);
}

/* Pagination */
.blog-pagination {
    margin-top: 60px;
}

.pagination {
    justify-content: center;
}

.page-link {
    color: var(--dark-color);
    border: 1px solid #e0e0e0;
    padding: 10px 18px;
    margin: 0 5px;
    border-radius: 8px;
    transition: all 0.3s ease;
}

.page-link:hover {
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    color: white;
    border-color: transparent;
}

.page-item.active .page-link {
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    border-color: transparent;
}

/* Footer */
.blog-footer {
    background: var(--dark-color);
    color: white;
    padding: 60px 0 30px;
    margin-top: 100px;
}

/* Responsive */
@media (max-width: 991px) {
    .blog-sidebar {
        margin-top: 40px;
    }
    
    .blog-header h1 {
        font-size: 2.5rem;
    }
}

@media (max-width: 768px) {
    .blog-post-content {
        padding: 20px;
    }
    
    .blog-title {
        font-size: 1.3rem;
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
                <a href="../index.php#about" class="nav-link">About</a>
                <a href="../index.php#academy" class="nav-link">Academy</a>
                <a href="index.php" class="nav-link active">Blog</a>
                <a href="../index.php#contact" class="nav-link">Contact</a>
                <a href="../../" class="nav-link" style="color: #667eea;">← Back to Platform</a>
            </div>
            <button class="btn btn-outline-primary d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#mobileMenu">
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
            <a href="../index.php#about" class="nav-link mb-3">About</a>
            <a href="../index.php#academy" class="nav-link mb-3">Academy</a>
            <a href="index.php" class="nav-link mb-3 active">Blog</a>
            <a href="../index.php#contact" class="nav-link mb-3">Contact</a>
            <a href="../../" class="nav-link mb-3">← Back to Platform</a>
        </div>
    </div>
</div>

<!-- Blog Header -->
<header class="blog-header">
    <div class="container">
        <h1>Go Models Blog</h1>
        <p class="lead">Industry insights, modeling tips, and success stories from NYC's premier agency</p>
    </div>
</header>

<!-- Blog Content -->
<section class="blog-content">
    <div class="container">
        <div class="row">
            <!-- Blog Posts -->
            <div class="col-lg-8">
                <!-- Blog Post 1 -->
                <article class="blog-post-card">
                    <div class="blog-post-image">
                        <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=400&fit=crop" 
                             alt="Fashion Week 2024">
                        <span class="blog-category-badge">Fashion</span>
                    </div>
                    <div class="blog-post-content">
                        <div class="blog-meta">
                            <span><i class="fas fa-calendar me-1"></i> December 20, 2024</span>
                            <span><i class="fas fa-user me-1"></i> Sarah Mitchell</span>
                            <span><i class="fas fa-comments me-1"></i> 15 Comments</span>
                        </div>
                        <a href="fashion-week-2024.php" class="blog-title">
                            Go Models Takes NYFW 2024: A Celebration of Diversity
                        </a>
                        <p class="blog-excerpt">
                            New York Fashion Week 2024 was a groundbreaking moment for Go Models NYC. Our diverse roster of talent graced the runways of top designers, 
                            showcasing not just fashion, but a powerful message of inclusivity. From our youngest models to our distinguished 50+ talent...
                        </p>
                        <a href="fashion-week-2024.php" class="read-more-btn">
                            Read Full Article <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </article>

                <!-- Blog Post 2 -->
                <article class="blog-post-card">
                    <div class="blog-post-image">
                        <img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=400&fit=crop" 
                             alt="Kids Modeling Guide">
                        <span class="blog-category-badge">Tips & Guides</span>
                    </div>
                    <div class="blog-post-content">
                        <div class="blog-meta">
                            <span><i class="fas fa-calendar me-1"></i> December 15, 2024</span>
                            <span><i class="fas fa-user me-1"></i> Jennifer Lee</span>
                            <span><i class="fas fa-comments me-1"></i> 23 Comments</span>
                        </div>
                        <a href="kids-modeling-guide.php" class="blog-title">
                            The Ultimate Guide to Kids Modeling: What Parents Need to Know
                        </a>
                        <p class="blog-excerpt">
                            Considering modeling opportunities for your child? This comprehensive guide covers everything from safety protocols to maintaining education balance. 
                            At Go Models NYC, we prioritize child welfare above all else, ensuring a positive experience...
                        </p>
                        <a href="kids-modeling-guide.php" class="read-more-btn">
                            Read Full Article <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </article>

                <!-- Blog Post 3 -->
                <article class="blog-post-card">
                    <div class="blog-post-image">
                        <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop" 
                             alt="Fitness Modeling">
                        <span class="blog-category-badge">Industry Trends</span>
                    </div>
                    <div class="blog-post-content">
                        <div class="blog-meta">
                            <span><i class="fas fa-calendar me-1"></i> December 10, 2024</span>
                            <span><i class="fas fa-user me-1"></i> Mike Thompson</span>
                            <span><i class="fas fa-comments me-1"></i> 18 Comments</span>
                        </div>
                        <a href="fitness-modeling-rise.php" class="blog-title">
                            The Rise of Fitness Modeling: Health Meets High Fashion
                        </a>
                        <p class="blog-excerpt">
                            The fitness modeling industry has exploded in 2024, with brands seeking authentic athletes who embody wellness and strength. 
                            Our fitness models aren't just about aesthetics – they're certified trainers, nutritionists, and genuine wellness advocates...
                        </p>
                        <a href="fitness-modeling-rise.php" class="read-more-btn">
                            Read Full Article <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </article>

                <!-- Blog Post 4 -->
                <article class="blog-post-card">
                    <div class="blog-post-image">
                        <img src="https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=800&h=400&fit=crop" 
                             alt="Tattoo Models">
                        <span class="blog-category-badge">Model Spotlight</span>
                    </div>
                    <div class="blog-post-content">
                        <div class="blog-meta">
                            <span><i class="fas fa-calendar me-1"></i> December 5, 2024</span>
                            <span><i class="fas fa-user me-1"></i> Alex Rivera</span>
                            <span><i class="fas fa-comments me-1"></i> 31 Comments</span>
                        </div>
                        <a href="tattoo-models-spotlight.php" class="blog-title">
                            Breaking Barriers: How Tattoo Models Are Reshaping Fashion
                        </a>
                        <p class="blog-excerpt">
                            Once considered taboo in high fashion, tattoo models are now at the forefront of campaigns for luxury brands. 
                            This shift represents more than just aesthetic choices – it's about authenticity, personal expression, and breaking traditional beauty standards...
                        </p>
                        <a href="tattoo-models-spotlight.php" class="read-more-btn">
                            Read Full Article <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </article>

                <!-- Blog Post 5 -->
                <article class="blog-post-card">
                    <div class="blog-post-image">
                        <img src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=400&fit=crop" 
                             alt="50 Plus Models">
                        <span class="blog-category-badge">Success Stories</span>
                    </div>
                    <div class="blog-post-content">
                        <div class="blog-meta">
                            <span><i class="fas fa-calendar me-1"></i> November 28, 2024</span>
                            <span><i class="fas fa-user me-1"></i> Diana Chen</span>
                            <span><i class="fas fa-comments me-1"></i> 27 Comments</span>
                        </div>
                        <a href="50plus-revolution.php" class="blog-title">
                            The 50+ Revolution: Age-Positive Modeling at Go Models
                        </a>
                        <p class="blog-excerpt">
                            Meet the inspiring models over 50 who are proving that beauty, style, and marketability have no expiration date. 
                            From luxury campaigns to lifestyle brands, our mature models are in higher demand than ever before...
                        </p>
                        <a href="50plus-revolution.php" class="read-more-btn">
                            Read Full Article <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </article>

                <!-- Pagination -->
                <nav class="blog-pagination">
                    <ul class="pagination">
                        <li class="page-item disabled">
                            <a class="page-link" href="#"><i class="fas fa-chevron-left"></i></a>
                        </li>
                        <li class="page-item active"><a class="page-link" href="#">1</a></li>
                        <li class="page-item"><a class="page-link" href="#">2</a></li>
                        <li class="page-item"><a class="page-link" href="#">3</a></li>
                        <li class="page-item"><a class="page-link" href="#">4</a></li>
                        <li class="page-item">
                            <a class="page-link" href="#"><i class="fas fa-chevron-right"></i></a>
                        </li>
                    </ul>
                </nav>
            </div>

            <!-- Sidebar -->
            <div class="col-lg-4">
                <aside class="blog-sidebar">
                    <!-- Search Widget -->
                    <div class="sidebar-widget">
                        <h4 class="widget-title">Search</h4>
                        <form class="search-form">
                            <input type="text" placeholder="Search articles...">
                            <button type="submit"><i class="fas fa-search"></i></button>
                        </form>
                    </div>

                    <!-- Categories Widget -->
                    <div class="sidebar-widget">
                        <h4 class="widget-title">Categories</h4>
                        <ul class="category-list">
                            <li>
                                <a href="#">
                                    <span>Fashion & Trends</span>
                                    <span class="category-count">24</span>
                                </a>
                            </li>
                            <li>
                                <a href="#">
                                    <span>Tips & Guides</span>
                                    <span class="category-count">18</span>
                                </a>
                            </li>
                            <li>
                                <a href="#">
                                    <span>Model Spotlights</span>
                                    <span class="category-count">31</span>
                                </a>
                            </li>
                            <li>
                                <a href="#">
                                    <span>Industry News</span>
                                    <span class="category-count">15</span>
                                </a>
                            </li>
                            <li>
                                <a href="#">
                                    <span>Success Stories</span>
                                    <span class="category-count">22</span>
                                </a>
                            </li>
                            <li>
                                <a href="#">
                                    <span>Behind the Scenes</span>
                                    <span class="category-count">12</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <!-- Popular Posts Widget -->
                    <div class="sidebar-widget">
                        <h4 class="widget-title">Popular Posts</h4>
                        
                        <div class="popular-post">
                            <div class="popular-post-image">
                                <img src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=150&h=150&fit=crop" 
                                     alt="Baby Modeling">
                            </div>
                            <div class="popular-post-content">
                                <h6><a href="#">Baby Modeling 101: Getting Started Safely</a></h6>
                                <span class="popular-post-date">November 15, 2024</span>
                            </div>
                        </div>

                        <div class="popular-post">
                            <div class="popular-post-image">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" 
                                     alt="Male Models">
                            </div>
                            <div class="popular-post-content">
                                <h6><a href="#">Top 10 Male Model Poses Every Model Should Know</a></h6>
                                <span class="popular-post-date">November 8, 2024</span>
                            </div>
                        </div>

                        <div class="popular-post">
                            <div class="popular-post-image">
                                <img src="https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=150&h=150&fit=crop" 
                                     alt="Curvy Models">
                            </div>
                            <div class="popular-post-content">
                                <h6><a href="#">Body Positivity: The Curvy Model Movement</a></h6>
                                <span class="popular-post-date">October 25, 2024</span>
                            </div>
                        </div>
                    </div>

                    <!-- Tags Widget -->
                    <div class="sidebar-widget">
                        <h4 class="widget-title">Popular Tags</h4>
                        <div class="tag-cloud">
                            <a href="#">Fashion</a>
                            <a href="#">NYFW</a>
                            <a href="#">Modeling Tips</a>
                            <a href="#">Diversity</a>
                            <a href="#">Kids Models</a>
                            <a href="#">Fitness</a>
                            <a href="#">Portfolio</a>
                            <a href="#">Casting</a>
                            <a href="#">Beauty</a>
                            <a href="#">Runway</a>
                        </div>
                    </div>

                    <!-- Newsletter Widget -->
                    <div class="sidebar-widget">
                        <h4 class="widget-title">Newsletter</h4>
                        <p class="mb-3">Subscribe to get the latest modeling tips and industry news.</p>
                        <form class="newsletter-form">
                            <input type="email" placeholder="Your email address" required>
                            <button type="submit">
                                <i class="fas fa-paper-plane me-2"></i>Subscribe
                            </button>
                        </form>
                    </div>

                    <!-- Social Media Widget -->
                    <div class="sidebar-widget">
                        <h4 class="widget-title">Follow Us</h4>
                        <div class="d-flex gap-2 justify-content-center">
                            <a href="#" class="btn btn-outline-primary btn-sm">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="#" class="btn btn-outline-primary btn-sm">
                                <i class="fab fa-facebook"></i>
                            </a>
                            <a href="#" class="btn btn-outline-primary btn-sm">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="#" class="btn btn-outline-primary btn-sm">
                                <i class="fab fa-linkedin"></i>
                            </a>
                            <a href="#" class="btn btn-outline-primary btn-sm">
                                <i class="fab fa-youtube"></i>
                            </a>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </div>
</section>

<!-- Footer -->
<footer class="blog-footer">
    <div class="container">
        <div class="row">
            <div class="col-lg-4 mb-4">
                <h5 class="text-white mb-3">
                    <i class="fas fa-star me-2"></i>Go Models NYC
                </h5>
                <p class="text-muted">
                    New York's premier modeling agency representing diverse talent across all categories. 
                    Celebrating beauty in all forms since 2009.
                </p>
            </div>
            <div class="col-lg-4 mb-4">
                <h5 class="text-white mb-3">Quick Links</h5>
                <div class="d-flex flex-column gap-2">
                    <a href="../index.php" class="text-muted text-decoration-none">Home</a>
                    <a href="../index.php#categories" class="text-muted text-decoration-none">Model Categories</a>
                    <a href="../index.php#academy" class="text-muted text-decoration-none">Model Academy</a>
                    <a href="../index.php#contact" class="text-muted text-decoration-none">Contact Us</a>
                </div>
            </div>
            <div class="col-lg-4 mb-4">
                <h5 class="text-white mb-3">Blog Categories</h5>
                <div class="d-flex flex-column gap-2">
                    <a href="#" class="text-muted text-decoration-none">Fashion & Trends</a>
                    <a href="#" class="text-muted text-decoration-none">Modeling Tips</a>
                    <a href="#" class="text-muted text-decoration-none">Success Stories</a>
                    <a href="#" class="text-muted text-decoration-none">Industry News</a>
                </div>
            </div>
        </div>
        <hr class="my-4 opacity-25">
        <div class="text-center">
            <p class="text-muted mb-0">
                &copy; 2024 Go Models NYC. All rights reserved. | 
                <a href="../index.php" class="text-muted">Back to Main Site</a> | 
                <a href="../../" class="text-muted">Platform Directory</a>
            </p>
        </div>
    </div>
</footer>

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script>
    // Newsletter form submission
    document.querySelector('.newsletter-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for subscribing! You\'ll receive our latest updates soon.');
        this.reset();
    });

    // Search form submission
    document.querySelector('.search-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const searchTerm = this.querySelector('input').value;
        alert(`Searching for: ${searchTerm}`);
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