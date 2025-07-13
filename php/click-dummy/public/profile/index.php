<?php
// This is a public-facing profile page - no authentication required
$profileUsername = $_GET['u'] ?? 'emma-johnson';
$isPreview = isset($_GET['preview']) && $_GET['preview'] === 'true';

// In a real app, this would fetch from database based on username
$profileData = [
    'username' => 'emma-johnson',
    'name' => 'Emma Johnson',
    'title' => 'Fashion Model',
    'location' => 'New York, NY',
    'bio' => 'Experienced fashion model with 8+ years in the industry. Specializing in high-fashion editorial work and commercial campaigns. Featured in Vogue, Harper\'s Bazaar, and worked with major brands including Nike, H&M, and Zara.',
    'profileImage' => 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face',
    'coverImage' => 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&h=400&fit=crop',
    'stats' => [
        'experience' => '8+ years',
        'completed' => '147',
        'rating' => '4.9',
        'response' => '< 2 hours'
    ],
    'measurements' => [
        'height' => '5\'9"',
        'bust' => '34"',
        'waist' => '24"',
        'hips' => '36"',
        'dress' => '4',
        'shoe' => '8.5',
        'hair' => 'Brown',
        'eyes' => 'Brown'
    ],
    'skills' => ['Fashion Modeling', 'Editorial Work', 'Commercial Campaigns', 'Runway Walking', 'Beauty Shoots', 'Lifestyle Photography'],
    'portfolio' => [
        ['image' => 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop', 'title' => 'Vogue Editorial'],
        ['image' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=800&fit=crop', 'title' => 'Magazine Cover'],
        ['image' => 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop', 'title' => 'Commercial Campaign'],
        ['image' => 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=800&fit=crop', 'title' => 'Fashion Week'],
        ['image' => 'https://images.unsplash.com/photo-1506629905607-c2b01beaa85f?w=600&h=800&fit=crop', 'title' => 'Beauty Editorial'],
        ['image' => 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=800&fit=crop', 'title' => 'Lifestyle Shoot']
    ],
    'experience' => [
        ['title' => 'Lead Model - Vogue Editorial', 'company' => 'Vogue Magazine', 'date' => 'January 2024'],
        ['title' => 'Brand Ambassador - Nike Campaign', 'company' => 'Nike', 'date' => 'November 2023'],
        ['title' => 'Runway Model - Paris Fashion Week', 'company' => 'Various Designers', 'date' => 'September 2023']
    ],
    'rates' => [
        'hourly' => '$150',
        'halfDay' => '$600',
        'fullDay' => '$1,200',
        'custom' => 'Contact for custom projects'
    ],
    'availability' => 'Currently accepting bookings',
    'social' => [
        'instagram' => 'emmajohnson',
        'twitter' => 'emmaj_model',
        'linkedin' => 'emma-johnson-model'
    ]
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($profileData['name']); ?> - Professional Model</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="<?php echo htmlspecialchars($profileData['bio']); ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($profileData['name']); ?> - Professional Model">
    <meta property="og:description" content="<?php echo htmlspecialchars($profileData['bio']); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($profileData['profileImage']); ?>">
    <meta property="og:url" content="https://platform.com/profile/<?php echo htmlspecialchars($profileData['username']); ?>">
    <meta name="twitter:card" content="summary_large_image">
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
    :root {
        --primary-color: #667eea;
        --secondary-color: #764ba2;
        --text-dark: #2d3748;
        --text-light: #718096;
        --bg-light: #f7fafc;
    }

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: var(--text-dark);
        line-height: 1.6;
        background: #ffffff;
    }

    /* Preview Banner */
    .preview-banner {
        background: #fbbf24;
        color: #000;
        text-align: center;
        padding: 0.75rem;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .preview-banner a {
        color: #000;
        font-weight: 600;
        text-decoration: underline;
    }

    /* Header/Hero Section */
    .profile-header {
        position: relative;
        height: 400px;
        background-size: cover;
        background-position: center;
        background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('<?php echo $profileData['coverImage']; ?>');
    }

    .profile-header-content {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 3rem 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.7));
    }

    .profile-avatar {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        border: 5px solid white;
        margin-bottom: 1rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        object-fit: cover;
    }

    .profile-name {
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
        margin-bottom: 0.5rem;
    }

    .profile-title {
        font-size: 1.25rem;
        color: rgba(255,255,255,0.9);
        margin-bottom: 0.5rem;
    }

    .profile-location {
        color: rgba(255,255,255,0.8);
        font-size: 1rem;
    }

    .profile-location i {
        margin-right: 0.5rem;
    }

    /* Stats Section */
    .stats-section {
        background: var(--bg-light);
        padding: 2rem 0;
        border-bottom: 1px solid #e2e8f0;
    }

    .stat-card {
        text-align: center;
        padding: 1rem;
    }

    .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-color);
        margin-bottom: 0.25rem;
    }

    .stat-label {
        color: var(--text-light);
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Main Content */
    .main-content {
        padding: 3rem 0;
    }

    .section-title {
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 1.5rem;
        color: var(--text-dark);
    }

    /* About Section */
    .about-section {
        margin-bottom: 3rem;
    }

    .bio-text {
        font-size: 1.125rem;
        color: var(--text-dark);
        line-height: 1.8;
        margin-bottom: 2rem;
    }

    .skills-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 2rem;
    }

    .skill-tag {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        padding: 0.5rem 1.25rem;
        border-radius: 25px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    /* Measurements Table */
    .measurements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1.5rem;
        background: var(--bg-light);
        padding: 2rem;
        border-radius: 15px;
        margin-bottom: 2rem;
    }

    .measurement-item {
        text-align: center;
    }

    .measurement-label {
        font-size: 0.875rem;
        color: var(--text-light);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
    }

    .measurement-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-dark);
    }

    /* Portfolio Grid */
    .portfolio-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 2rem;
        margin-bottom: 3rem;
    }

    .portfolio-item {
        position: relative;
        border-radius: 15px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
        background: #000;
    }

    .portfolio-item:hover {
        transform: translateY(-10px);
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }

    .portfolio-item img {
        width: 100%;
        height: 400px;
        object-fit: cover;
        transition: opacity 0.3s ease;
    }

    .portfolio-item:hover img {
        opacity: 0.8;
    }

    .portfolio-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.8));
        color: white;
        padding: 1.5rem;
        transform: translateY(100%);
        transition: transform 0.3s ease;
    }

    .portfolio-item:hover .portfolio-overlay {
        transform: translateY(0);
    }

    /* Experience Timeline */
    .experience-timeline {
        position: relative;
        padding-left: 2rem;
        margin-bottom: 3rem;
    }

    .experience-timeline::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(var(--primary-color), var(--secondary-color));
    }

    .experience-item {
        position: relative;
        margin-bottom: 2rem;
        padding-left: 2rem;
    }

    .experience-item::before {
        content: '';
        position: absolute;
        left: -2.5rem;
        top: 0.5rem;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--primary-color);
        border: 3px solid white;
        box-shadow: 0 0 0 3px var(--primary-color);
    }

    .experience-title {
        font-weight: 600;
        font-size: 1.125rem;
        margin-bottom: 0.25rem;
    }

    .experience-company {
        color: var(--text-light);
        margin-bottom: 0.25rem;
    }

    .experience-date {
        font-size: 0.875rem;
        color: var(--text-light);
    }

    /* Rates Section */
    .rates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .rate-card {
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        padding: 2rem;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        transition: transform 0.3s ease;
    }

    .rate-card:hover {
        transform: translateY(-5px);
    }

    .rate-type {
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
        opacity: 0.9;
    }

    .rate-amount {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0;
    }

    /* Contact Section */
    .contact-section {
        background: var(--bg-light);
        padding: 3rem;
        border-radius: 15px;
        text-align: center;
    }

    .contact-button {
        display: inline-block;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        padding: 1rem 3rem;
        border-radius: 50px;
        text-decoration: none;
        font-weight: 600;
        font-size: 1.125rem;
        transition: all 0.3s ease;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }

    .contact-button:hover {
        color: white;
        transform: translateY(-3px);
        box-shadow: 0 15px 40px rgba(102, 126, 234, 0.4);
    }

    .availability-status {
        display: inline-flex;
        align-items: center;
        background: #10b981;
        color: white;
        padding: 0.5rem 1.25rem;
        border-radius: 25px;
        font-size: 0.875rem;
        margin-bottom: 2rem;
    }

    .availability-status::before {
        content: '';
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        margin-right: 0.5rem;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    /* Social Links */
    .social-links {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 2rem;
    }

    .social-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: white;
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
        transition: all 0.3s ease;
        text-decoration: none;
    }

    .social-link:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-3px);
    }

    /* Footer */
    .profile-footer {
        background: var(--text-dark);
        color: white;
        padding: 2rem 0;
        text-align: center;
        margin-top: 5rem;
    }

    .footer-brand {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .footer-text {
        color: rgba(255,255,255,0.7);
        font-size: 0.875rem;
    }

    /* Lightbox */
    .lightbox {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 2000;
        cursor: pointer;
    }

    .lightbox img {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        max-width: 90%;
        max-height: 90%;
        border-radius: 10px;
    }

    .lightbox-close {
        position: absolute;
        top: 20px;
        right: 40px;
        font-size: 2rem;
        color: white;
        cursor: pointer;
        z-index: 2001;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .profile-header {
            height: 300px;
        }
        
        .profile-avatar {
            width: 120px;
            height: 120px;
        }
        
        .profile-name {
            font-size: 2rem;
        }
        
        .portfolio-grid {
            grid-template-columns: 1fr;
        }
        
        .measurements-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    </style>
</head>
<body>
    <?php if ($isPreview): ?>
    <div class="preview-banner">
        <i class="fas fa-eye me-2"></i>
        Preview Mode - This is how your public profile will appear. 
        <a href="/user/profile/index.php">Return to Settings</a>
    </div>
    <div style="height: 50px;"></div>
    <?php endif; ?>

    <!-- Profile Header -->
    <header class="profile-header">
        <div class="profile-header-content">
            <div class="container text-center">
                <img src="<?php echo htmlspecialchars($profileData['profileImage']); ?>" 
                     alt="<?php echo htmlspecialchars($profileData['name']); ?>" 
                     class="profile-avatar">
                <h1 class="profile-name"><?php echo htmlspecialchars($profileData['name']); ?></h1>
                <p class="profile-title"><?php echo htmlspecialchars($profileData['title']); ?></p>
                <p class="profile-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <?php echo htmlspecialchars($profileData['location']); ?>
                </p>
            </div>
        </div>
    </header>

    <!-- Stats Section -->
    <section class="stats-section">
        <div class="container">
            <div class="row">
                <div class="col-6 col-md-3">
                    <div class="stat-card">
                        <div class="stat-value"><?php echo $profileData['stats']['experience']; ?></div>
                        <div class="stat-label">Experience</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-card">
                        <div class="stat-value"><?php echo $profileData['stats']['completed']; ?></div>
                        <div class="stat-label">Jobs Completed</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-card">
                        <div class="stat-value"><?php echo $profileData['stats']['rating']; ?>★</div>
                        <div class="stat-label">Average Rating</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="stat-card">
                        <div class="stat-value"><?php echo $profileData['stats']['response']; ?></div>
                        <div class="stat-label">Response Time</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Main Content -->
    <main class="main-content">
        <div class="container">
            <!-- About Section -->
            <section class="about-section">
                <h2 class="section-title">About Me</h2>
                <p class="bio-text"><?php echo nl2br(htmlspecialchars($profileData['bio'])); ?></p>
                
                <h3 class="h5 mb-3">Skills & Specialties</h3>
                <div class="skills-container">
                    <?php foreach ($profileData['skills'] as $skill): ?>
                        <span class="skill-tag"><?php echo htmlspecialchars($skill); ?></span>
                    <?php endforeach; ?>
                </div>

                <h3 class="h5 mb-3">Physical Attributes</h3>
                <div class="measurements-grid">
                    <?php foreach ($profileData['measurements'] as $label => $value): ?>
                        <div class="measurement-item">
                            <div class="measurement-label"><?php echo ucfirst($label); ?></div>
                            <div class="measurement-value"><?php echo htmlspecialchars($value); ?></div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>

            <!-- Portfolio Section -->
            <section class="portfolio-section">
                <h2 class="section-title">Portfolio</h2>
                <div class="portfolio-grid">
                    <?php foreach ($profileData['portfolio'] as $item): ?>
                        <div class="portfolio-item" onclick="openLightbox('<?php echo htmlspecialchars($item['image']); ?>')">
                            <img src="<?php echo htmlspecialchars($item['image']); ?>" 
                                 alt="<?php echo htmlspecialchars($item['title']); ?>">
                            <div class="portfolio-overlay">
                                <h4><?php echo htmlspecialchars($item['title']); ?></h4>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>

            <!-- Experience Section -->
            <section class="experience-section">
                <h2 class="section-title">Recent Experience</h2>
                <div class="experience-timeline">
                    <?php foreach ($profileData['experience'] as $exp): ?>
                        <div class="experience-item">
                            <h4 class="experience-title"><?php echo htmlspecialchars($exp['title']); ?></h4>
                            <p class="experience-company"><?php echo htmlspecialchars($exp['company']); ?></p>
                            <p class="experience-date"><?php echo htmlspecialchars($exp['date']); ?></p>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>

            <!-- Rates Section -->
            <section class="rates-section">
                <h2 class="section-title">Rates</h2>
                <div class="rates-grid">
                    <div class="rate-card">
                        <div class="rate-type">Hourly Rate</div>
                        <div class="rate-amount"><?php echo htmlspecialchars($profileData['rates']['hourly']); ?></div>
                    </div>
                    <div class="rate-card">
                        <div class="rate-type">Half Day</div>
                        <div class="rate-amount"><?php echo htmlspecialchars($profileData['rates']['halfDay']); ?></div>
                    </div>
                    <div class="rate-card">
                        <div class="rate-type">Full Day</div>
                        <div class="rate-amount"><?php echo htmlspecialchars($profileData['rates']['fullDay']); ?></div>
                    </div>
                    <div class="rate-card">
                        <div class="rate-type">Custom Projects</div>
                        <div class="rate-amount">Contact</div>
                    </div>
                </div>
            </section>

            <!-- Contact Section -->
            <section class="contact-section">
                <div class="availability-status">
                    <?php echo htmlspecialchars($profileData['availability']); ?>
                </div>
                <h2 class="section-title mb-3">Let's Work Together</h2>
                <p class="mb-4">Interested in booking me for your next project? Get in touch!</p>
                <a href="#" class="contact-button" onclick="initiateContact()">
                    <i class="fas fa-envelope me-2"></i>Contact Me
                </a>
                
                <div class="social-links">
                    <?php if (!empty($profileData['social']['instagram'])): ?>
                        <a href="https://instagram.com/<?php echo htmlspecialchars($profileData['social']['instagram']); ?>" 
                           class="social-link" target="_blank" rel="noopener">
                            <i class="fab fa-instagram"></i>
                        </a>
                    <?php endif; ?>
                    <?php if (!empty($profileData['social']['twitter'])): ?>
                        <a href="https://twitter.com/<?php echo htmlspecialchars($profileData['social']['twitter']); ?>" 
                           class="social-link" target="_blank" rel="noopener">
                            <i class="fab fa-twitter"></i>
                        </a>
                    <?php endif; ?>
                    <?php if (!empty($profileData['social']['linkedin'])): ?>
                        <a href="https://linkedin.com/in/<?php echo htmlspecialchars($profileData['social']['linkedin']); ?>" 
                           class="social-link" target="_blank" rel="noopener">
                            <i class="fab fa-linkedin-in"></i>
                        </a>
                    <?php endif; ?>
                </div>
            </section>
        </div>
    </main>

    <!-- Footer -->
    <footer class="profile-footer">
        <div class="container">
            <div class="footer-brand">ModelHub Platform</div>
            <p class="footer-text">© 2024 All rights reserved. Profile powered by ModelHub.</p>
        </div>
    </footer>

    <!-- Lightbox -->
    <div id="lightbox" class="lightbox" onclick="closeLightbox()">
        <span class="lightbox-close">&times;</span>
        <img id="lightbox-img" src="" alt="">
    </div>

    <script>
    function openLightbox(imageSrc) {
        document.getElementById('lightbox').style.display = 'block';
        document.getElementById('lightbox-img').src = imageSrc;
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        document.getElementById('lightbox').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function initiateContact() {
        <?php if ($isPreview): ?>
            alert('Contact feature disabled in preview mode.');
        <?php else: ?>
            // In real app, this would open a contact form or redirect to login
            window.location.href = '/public/auth/login.php?redirect=contact&profile=<?php echo urlencode($profileData['username']); ?>';
        <?php endif; ?>
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Lazy loading for portfolio images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('.portfolio-item img').forEach(img => {
            imageObserver.observe(img);
        });
    }
    </script>
</body>
</html>