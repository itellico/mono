<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fitness Models - Athletic & Wellness - Go Models NYC</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Certified fitness models, athletes, and wellness professionals in NYC. From bodybuilding to yoga, find elite fitness talent for your athletic brand campaigns.">
    <meta name="keywords" content="fitness models, athletes, bodybuilding, yoga, crossfit, personal trainers, sports models, NYC, wellness professionals">
    
    <!-- Stylesheets -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>

<style>
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.fitness-hero {
    background: linear-gradient(rgba(255,69,0,0.8), rgba(255,140,0,0.8)), 
                url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&h=600&fit=crop') center/cover;
    padding: 120px 0 80px;
    color: white;
}

.fitness-card {
    border: none;
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    position: relative;
}

.fitness-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.fitness-badge {
    position: absolute;
    top: 15px;
    right: 15px;
    background: linear-gradient(45deg, #ff4500, #ff8c00);
    color: white;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: bold;
    z-index: 2;
}

.specialty-chip {
    background: #fff3cd;
    color: #856404;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    margin: 2px;
    display: inline-block;
}

.certification-badge {
    background: linear-gradient(45deg, #28a745, #20c997);
    color: white;
    padding: 4px 8px;
    border-radius: 10px;
    font-size: 0.7rem;
    margin: 2px;
}

.fitness-stats {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 10px;
    border-left: 4px solid #ff4500;
}

.filter-tab {
    background: white;
    border: 2px solid #e9ecef;
    border-radius: 25px;
    padding: 0.75rem 1.5rem;
    margin: 0.25rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    color: #495057;
}

.filter-tab:hover,
.filter-tab.active {
    background: #ff4500;
    color: white;
    border-color: #ff4500;
    transform: scale(1.05);
}

.workout-demo {
    position: relative;
    border-radius: 15px;
    overflow: hidden;
    cursor: pointer;
}

.workout-demo::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.3);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.workout-demo:hover::after {
    opacity: 1;
}

.play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255,255,255,0.9);
    border-radius: 50%;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.workout-demo:hover .play-button {
    opacity: 1;
}

.nutrition-info {
    background: linear-gradient(135deg, #ff4500, #ff8c00);
    color: white;
    padding: 2rem;
    border-radius: 20px;
    margin: 2rem 0;
}

.athlete-achievement {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    border-left: 5px solid #ff4500;
    margin-bottom: 1rem;
}

.body-type-filter {
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 20px;
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    cursor: pointer;
    transition: all 0.3s ease;
    color: #856404;
}

.body-type-filter:hover,
.body-type-filter.active {
    background: #ffc107;
    color: #212529;
    transform: scale(1.05);
}
</style>

<!-- Navigation -->
<nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
    <div class="container">
        <a class="navbar-brand fw-bold" href="index.php" style="background: linear-gradient(45deg, #ff69b4, #8a2be2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            <i class="fas fa-star me-2"></i>Go Models NYC
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item"><a class="nav-link" href="index.php">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="index.php#categories">All Categories</a></li>
                <li class="nav-item"><a class="nav-link active" href="#">Fitness Models</a></li>
            </ul>
            <div class="d-flex">
                <a href="index.php#categories" class="btn btn-outline-primary me-2">Browse All</a>
                <a href="index.php#register" class="btn btn-primary">Join Us</a>
            </div>
        </div>
    </div>
</nav>

<!-- Fitness Hero -->
<section class="fitness-hero">
    <div class="container text-center">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <h1 class="display-4 fw-bold mb-3">Fitness Models</h1>
                <p class="lead mb-4">Athletic • Wellness • Nutrition • Certified Professionals</p>
                <div class="d-flex justify-content-center gap-3 mb-4 flex-wrap">
                    <span class="badge bg-light text-dark px-3 py-2">🏋️ 89 Active Athletes</span>
                    <span class="badge bg-light text-dark px-3 py-2">📋 Certified Trainers</span>
                    <span class="badge bg-light text-dark px-3 py-2">🥇 Competition Winners</span>
                    <span class="badge bg-light text-dark px-3 py-2">⚡ Premium Brands</span>
                </div>
                <div class="mt-4">
                    <a href="#models" class="btn btn-light btn-lg me-3">
                        <i class="fas fa-dumbbell me-2"></i>View Athletes
                    </a>
                    <a href="#book" class="btn btn-outline-light btn-lg">
                        <i class="fas fa-calendar me-2"></i>Book Now
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Filter Tabs -->
<section class="container my-5">
    <div class="row justify-content-center">
        <div class="col-lg-10">
            <div class="bg-light rounded-pill p-4 mb-4">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <div class="input-group">
                            <input type="text" class="form-control form-control-lg rounded-pill" 
                                   placeholder="Search fitness models by name, specialty, or achievement..." id="fitnessSearch">
                            <button class="btn btn-primary rounded-pill" type="button" onclick="searchFitnessModels()">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-4 text-center">
                        <select class="form-select form-select-lg" id="sortFilter">
                            <option value="featured">Sort by Featured</option>
                            <option value="experience">Experience Level</option>
                            <option value="rate">Rate (Low to High)</option>
                            <option value="rating">Rating</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Specialty Filters -->
            <div class="text-center mb-4">
                <h6 class="fw-bold mb-3">Fitness Specialties</h6>
                <div class="d-flex justify-content-center gap-2 flex-wrap">
                    <span class="filter-tab active" data-specialty="all">All Athletes</span>
                    <span class="filter-tab" data-specialty="bodybuilding">Bodybuilding</span>
                    <span class="filter-tab" data-specialty="yoga">Yoga</span>
                    <span class="filter-tab" data-specialty="crossfit">CrossFit</span>
                    <span class="filter-tab" data-specialty="running">Running</span>
                    <span class="filter-tab" data-specialty="swimming">Swimming</span>
                    <span class="filter-tab" data-specialty="dance">Dance Fitness</span>
                </div>
            </div>
            
            <!-- Body Type Filters -->
            <div class="text-center">
                <h6 class="fw-bold mb-3">Body Types</h6>
                <div class="d-flex justify-content-center gap-2 flex-wrap">
                    <span class="body-type-filter active" data-body="all">All Types</span>
                    <span class="body-type-filter" data-body="lean">Lean Athletic</span>
                    <span class="body-type-filter" data-body="muscular">Muscular</span>
                    <span class="body-type-filter" data-body="toned">Toned</span>
                    <span class="body-type-filter" data-body="endurance">Endurance</span>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Fitness Models Grid -->
<section id="models" class="container my-5">
    <div class="text-center mb-5">
        <h2 class="fw-bold">Our Elite Fitness Models</h2>
        <p class="text-muted">Certified athletes and wellness professionals</p>
    </div>
    
    <div class="row g-4" id="fitnessModelsGrid">
        <!-- Fitness Model 1 -->
        <div class="col-lg-4 col-md-6 fitness-model-item" data-specialty="bodybuilding" data-body="muscular">
            <div class="card fitness-card">
                <div class="position-relative">
                    <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop" 
                         class="card-img-top" style="height: 350px; object-fit: cover;" alt="Jake Thompson">
                    <div class="fitness-badge">💪 Bodybuilder</div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">Jake Thompson</h5>
                    <div class="fitness-stats mb-3">
                        <small><strong>Age:</strong> 28 • <strong>Height:</strong> 6'0" • <strong>Weight:</strong> 185 lbs</small><br>
                        <small><strong>Body Fat:</strong> 8% • <strong>Experience:</strong> 6 years</small>
                    </div>
                    
                    <div class="mb-3">
                        <div class="certification-badge">NASM Certified</div>
                        <div class="certification-badge">Competition Winner</div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="specialty-chip">Bodybuilding</div>
                        <div class="specialty-chip">Supplements</div>
                        <div class="specialty-chip">Athletic Wear</div>
                    </div>
                    
                    <div class="row small text-muted mb-3">
                        <div class="col-6">💪 6 years experience</div>
                        <div class="col-6">🏆 12 competitions</div>
                        <div class="col-6">📸 45 campaigns</div>
                        <div class="col-6">💰 $350/hour</div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="text-warning">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            <small class="text-muted">(4.9)</small>
                        </div>
                        <button class="btn btn-primary btn-sm">View Profile</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Fitness Model 2 -->
        <div class="col-lg-4 col-md-6 fitness-model-item" data-specialty="yoga" data-body="lean">
            <div class="card fitness-card">
                <div class="position-relative">
                    <img src="https://images.unsplash.com/photo-1506629905607-c2b01beaa85f?w=400&h=500&fit=crop" 
                         class="card-img-top" style="height: 350px; object-fit: cover;" alt="Maya Chen">
                    <div class="fitness-badge">🧘 Yoga Expert</div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">Maya Chen</h5>
                    <div class="fitness-stats mb-3">
                        <small><strong>Age:</strong> 26 • <strong>Height:</strong> 5'6" • <strong>Weight:</strong> 125 lbs</small><br>
                        <small><strong>Flexibility:</strong> Advanced • <strong>Experience:</strong> 8 years</small>
                    </div>
                    
                    <div class="mb-3">
                        <div class="certification-badge">RYT-500 Certified</div>
                        <div class="certification-badge">Meditation Guide</div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="specialty-chip">Yoga</div>
                        <div class="specialty-chip">Wellness</div>
                        <div class="specialty-chip">Meditation</div>
                    </div>
                    
                    <div class="row small text-muted mb-3">
                        <div class="col-6">🧘 8 years experience</div>
                        <div class="col-6">📚 Yoga instructor</div>
                        <div class="col-6">📸 32 campaigns</div>
                        <div class="col-6">💰 $275/hour</div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="text-warning">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            <small class="text-muted">(4.8)</small>
                        </div>
                        <button class="btn btn-primary btn-sm">View Profile</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Fitness Model 3 -->
        <div class="col-lg-4 col-md-6 fitness-model-item" data-specialty="crossfit" data-body="toned">
            <div class="card fitness-card">
                <div class="position-relative">
                    <img src="https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=500&fit=crop" 
                         class="card-img-top" style="height: 350px; object-fit: cover;" alt="Alex Rivera">
                    <div class="fitness-badge">🔥 CrossFit</div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">Alex Rivera</h5>
                    <div class="fitness-stats mb-3">
                        <small><strong>Age:</strong> 30 • <strong>Height:</strong> 5'8" • <strong>Weight:</strong> 145 lbs</small><br>
                        <small><strong>Body Fat:</strong> 15% • <strong>Experience:</strong> 5 years</small>
                    </div>
                    
                    <div class="mb-3">
                        <div class="certification-badge">CrossFit L2</div>
                        <div class="certification-badge">Nutrition Coach</div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="specialty-chip">CrossFit</div>
                        <div class="specialty-chip">Functional Fitness</div>
                        <div class="specialty-chip">HIIT</div>
                    </div>
                    
                    <div class="row small text-muted mb-3">
                        <div class="col-6">🔥 5 years experience</div>
                        <div class="col-6">🏆 Regional qualifier</div>
                        <div class="col-6">📸 28 campaigns</div>
                        <div class="col-6">💰 $300/hour</div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="text-warning">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            <small class="text-muted">(4.7)</small>
                        </div>
                        <button class="btn btn-primary btn-sm">View Profile</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Fitness Model 4 -->
        <div class="col-lg-4 col-md-6 fitness-model-item" data-specialty="running" data-body="endurance">
            <div class="card fitness-card">
                <div class="position-relative">
                    <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop" 
                         class="card-img-top" style="height: 350px; object-fit: cover;" alt="Marcus Johnson">
                    <div class="fitness-badge">🏃 Marathon Runner</div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">Marcus Johnson</h5>
                    <div class="fitness-stats mb-3">
                        <small><strong>Age:</strong> 32 • <strong>Height:</strong> 6'1" • <strong>Weight:</strong> 165 lbs</small><br>
                        <small><strong>Marathon PR:</strong> 2:45 • <strong>Experience:</strong> 10 years</small>
                    </div>
                    
                    <div class="mb-3">
                        <div class="certification-badge">USATF Certified</div>
                        <div class="certification-badge">Boston Qualifier</div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="specialty-chip">Running</div>
                        <div class="specialty-chip">Endurance</div>
                        <div class="specialty-chip">Athletic Gear</div>
                    </div>
                    
                    <div class="row small text-muted mb-3">
                        <div class="col-6">🏃 10 years experience</div>
                        <div class="col-6">🏅 25 marathons</div>
                        <div class="col-6">📸 38 campaigns</div>
                        <div class="col-6">💰 $325/hour</div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="text-warning">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            <small class="text-muted">(4.8)</small>
                        </div>
                        <button class="btn btn-primary btn-sm">View Profile</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Fitness Model 5 -->
        <div class="col-lg-4 col-md-6 fitness-model-item" data-specialty="swimming" data-body="lean">
            <div class="card fitness-card">
                <div class="position-relative">
                    <img src="https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=400&h=500&fit=crop" 
                         class="card-img-top" style="height: 350px; object-fit: cover;" alt="Sophia Martinez">
                    <div class="fitness-badge">🏊 Swimmer</div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">Sophia Martinez</h5>
                    <div class="fitness-stats mb-3">
                        <small><strong>Age:</strong> 24 • <strong>Height:</strong> 5'7" • <strong>Weight:</strong> 135 lbs</small><br>
                        <small><strong>Stroke:</strong> Freestyle • <strong>Experience:</strong> 12 years</small>
                    </div>
                    
                    <div class="mb-3">
                        <div class="certification-badge">NCAA D1</div>
                        <div class="certification-badge">Swim Coach</div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="specialty-chip">Swimming</div>
                        <div class="specialty-chip">Water Sports</div>
                        <div class="specialty-chip">Swimwear</div>
                    </div>
                    
                    <div class="row small text-muted mb-3">
                        <div class="col-6">🏊 12 years experience</div>
                        <div class="col-6">🏆 College champion</div>
                        <div class="col-6">📸 22 campaigns</div>
                        <div class="col-6">💰 $280/hour</div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="text-warning">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            <small class="text-muted">(4.9)</small>
                        </div>
                        <button class="btn btn-primary btn-sm">View Profile</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Fitness Model 6 -->
        <div class="col-lg-4 col-md-6 fitness-model-item" data-specialty="dance" data-body="toned">
            <div class="card fitness-card">
                <div class="position-relative">
                    <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=500&fit=crop" 
                         class="card-img-top" style="height: 350px; object-fit: cover;" alt="Zoe Williams">
                    <div class="fitness-badge">💃 Dance Fitness</div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">Zoe Williams</h5>
                    <div class="fitness-stats mb-3">
                        <small><strong>Age:</strong> 25 • <strong>Height:</strong> 5'5" • <strong>Weight:</strong> 120 lbs</small><br>
                        <small><strong>Style:</strong> Contemporary • <strong>Experience:</strong> 15 years</small>
                    </div>
                    
                    <div class="mb-3">
                        <div class="certification-badge">Dance Instructor</div>
                        <div class="certification-badge">Pilates Certified</div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="specialty-chip">Dance Fitness</div>
                        <div class="specialty-chip">Pilates</div>
                        <div class="specialty-chip">Flexibility</div>
                    </div>
                    
                    <div class="row small text-muted mb-3">
                        <div class="col-6">💃 15 years experience</div>
                        <div class="col-6">🎭 Professional dancer</div>
                        <div class="col-6">📸 35 campaigns</div>
                        <div class="col-6">💰 $290/hour</div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="text-warning">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                            <small class="text-muted">(4.8)</small>
                        </div>
                        <button class="btn btn-primary btn-sm">View Profile</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="text-center mt-5">
        <button class="btn btn-outline-primary btn-lg" onclick="loadMoreFitnessModels()">
            <i class="fas fa-plus me-2"></i>Load More Fitness Models
        </button>
    </div>
</section>

<!-- Workout Demonstrations -->
<section class="bg-light py-5">
    <div class="container">
        <div class="text-center mb-5">
            <h2 class="fw-bold">Workout Demonstrations</h2>
            <p class="text-muted">See our models in action with professional workout videos</p>
        </div>
        
        <div class="row g-4">
            <div class="col-lg-4">
                <div class="workout-demo position-relative">
                    <img src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop" 
                         class="img-fluid rounded" alt="HIIT Workout">
                    <div class="play-button">
                        <i class="fas fa-play text-primary fa-lg"></i>
                    </div>
                </div>
                <h5 class="mt-3 fw-bold">HIIT Training Demo</h5>
                <p class="text-muted">High-intensity interval training with Alex Rivera</p>
            </div>
            
            <div class="col-lg-4">
                <div class="workout-demo position-relative">
                    <img src="https://images.unsplash.com/photo-1506629905607-c2b01beaa85f?w=400&h=300&fit=crop" 
                         class="img-fluid rounded" alt="Yoga Flow">
                    <div class="play-button">
                        <i class="fas fa-play text-primary fa-lg"></i>
                    </div>
                </div>
                <h5 class="mt-3 fw-bold">Yoga Flow Session</h5>
                <p class="text-muted">Morning yoga routine with Maya Chen</p>
            </div>
            
            <div class="col-lg-4">
                <div class="workout-demo position-relative">
                    <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop" 
                         class="img-fluid rounded" alt="Strength Training">
                    <div class="play-button">
                        <i class="fas fa-play text-primary fa-lg"></i>
                    </div>
                </div>
                <h5 class="mt-3 fw-bold">Strength Training</h5>
                <p class="text-muted">Bodybuilding routine with Jake Thompson</p>
            </div>
        </div>
    </div>
</section>

<!-- Achievements Section -->
<section class="container my-5">
    <div class="text-center mb-5">
        <h2 class="fw-bold">Model Achievements</h2>
        <p class="text-muted">Competition results and certifications</p>
    </div>
    
    <div class="row g-4">
        <div class="col-lg-4">
            <div class="athlete-achievement">
                <div class="d-flex align-items-center mb-3">
                    <div class="feature-icon me-3" style="width: 60px; height: 60px; background: linear-gradient(45deg, #ffd700, #ffed4a);">
                        <i class="fas fa-trophy text-white fa-lg"></i>
                    </div>
                    <div>
                        <h6 class="fw-bold mb-0">Jake Thompson</h6>
                        <small class="text-muted">Bodybuilding Champion</small>
                    </div>
                </div>
                <p class="mb-0">🥇 1st Place - NYC Bodybuilding Championship 2024</p>
                <p class="mb-0">🥈 2nd Place - East Coast Classic 2023</p>
                <p class="mb-0">🏆 Mr. Manhattan Title Winner 2022</p>
            </div>
        </div>
        
        <div class="col-lg-4">
            <div class="athlete-achievement">
                <div class="d-flex align-items-center mb-3">
                    <div class="feature-icon me-3" style="width: 60px; height: 60px; background: linear-gradient(45deg, #28a745, #20c997);">
                        <i class="fas fa-medal text-white fa-lg"></i>
                    </div>
                    <div>
                        <h6 class="fw-bold mb-0">Marcus Johnson</h6>
                        <small class="text-muted">Marathon Runner</small>
                    </div>
                </div>
                <p class="mb-0">🏃 Boston Marathon Qualifier - 2:45:32</p>
                <p class="mb-0">🏅 NYC Marathon Finisher (5x)</p>
                <p class="mb-0">🥉 3rd Place - Brooklyn Half Marathon</p>
            </div>
        </div>
        
        <div class="col-lg-4">
            <div class="athlete-achievement">
                <div class="d-flex align-items-center mb-3">
                    <div class="feature-icon me-3" style="width: 60px; height: 60px; background: linear-gradient(45deg, #007bff, #17a2b8);">
                        <i class="fas fa-swimming-pool text-white fa-lg"></i>
                    </div>
                    <div>
                        <h6 class="fw-bold mb-0">Sophia Martinez</h6>
                        <small class="text-muted">Competitive Swimmer</small>
                    </div>
                </div>
                <p class="mb-0">🏊 NCAA Division I All-American</p>
                <p class="mb-0">🥇 State Championship Winner (4x)</p>
                <p class="mb-0">🏆 College Record Holder - 200m Freestyle</p>
            </div>
        </div>
    </div>
</section>

<!-- Nutrition Information -->
<section class="nutrition-info">
    <div class="container text-center">
        <h2 class="fw-bold mb-3">Nutrition & Wellness Expertise</h2>
        <p class="lead mb-4">Our fitness models aren't just athletes - they're certified nutrition and wellness professionals</p>
        
        <div class="row g-4">
            <div class="col-lg-3 col-md-6">
                <div class="feature-icon mx-auto mb-3" style="background: rgba(255,255,255,0.2);">
                    <i class="fas fa-apple-alt text-white fa-2x"></i>
                </div>
                <h5 class="fw-bold">Nutrition Coaching</h5>
                <p>65% of our fitness models are certified nutrition coaches</p>
            </div>
            
            <div class="col-lg-3 col-md-6">
                <div class="feature-icon mx-auto mb-3" style="background: rgba(255,255,255,0.2);">
                    <i class="fas fa-pills text-white fa-2x"></i>
                </div>
                <h5 class="fw-bold">Supplement Knowledge</h5>
                <p>Expert understanding of sports supplements and wellness products</p>
            </div>
            
            <div class="col-lg-3 col-md-6">
                <div class="feature-icon mx-auto mb-3" style="background: rgba(255,255,255,0.2);">
                    <i class="fas fa-heart text-white fa-2x"></i>
                </div>
                <h5 class="fw-bold">Wellness Lifestyle</h5>
                <p>Authentic advocates for healthy living and mental wellness</p>
            </div>
            
            <div class="col-lg-3 col-md-6">
                <div class="feature-icon mx-auto mb-3" style="background: rgba(255,255,255,0.2);">
                    <i class="fas fa-chart-line text-white fa-2x"></i>
                </div>
                <h5 class="fw-bold">Results Tracking</h5>
                <p>Data-driven approach to fitness and measurable results</p>
            </div>
        </div>
    </div>
</section>

<!-- Call to Action -->
<section id="book" class="bg-gradient-primary py-5" style="background: linear-gradient(135deg, #ff4500, #ff8c00);">
    <div class="container text-center text-white">
        <h2 class="fw-bold mb-3">Ready to Book Elite Fitness Models?</h2>
        <p class="lead mb-4">Certified athletes and wellness professionals for your next campaign</p>
        
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="row g-3">
                    <div class="col-md-4">
                        <a href="#contact" class="btn btn-light btn-lg w-100">
                            <i class="fas fa-phone me-2"></i>Call Now
                        </a>
                    </div>
                    <div class="col-md-4">
                        <a href="#" class="btn btn-outline-light btn-lg w-100">
                            <i class="fas fa-envelope me-2"></i>Email Us
                        </a>
                    </div>
                    <div class="col-md-4">
                        <a href="index.php#register" class="btn btn-outline-light btn-lg w-100">
                            <i class="fas fa-dumbbell me-2"></i>Join Our Athletes
                        </a>
                    </div>
                </div>
                
                <div class="mt-4">
                    <small class="opacity-75">
                        <i class="fas fa-shield-alt me-1"></i>
                        Certified trainers • Nutrition experts • Competition winners • Professional athletes
                    </small>
                </div>
            </div>
        </div>
    </div>
</section>

<script>
// Filter functionality
document.addEventListener('DOMContentLoaded', function() {
    const specialtyFilters = document.querySelectorAll('.filter-tab');
    const bodyTypeFilters = document.querySelectorAll('.body-type-filter');
    const fitnessModels = document.querySelectorAll('.fitness-model-item');
    
    // Specialty filtering
    specialtyFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            specialtyFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            const selectedSpecialty = this.getAttribute('data-specialty');
            filterModels();
        });
    });
    
    // Body type filtering
    bodyTypeFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            bodyTypeFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            const selectedBodyType = this.getAttribute('data-body');
            filterModels();
        });
    });
    
    function filterModels() {
        const activeSpecialty = document.querySelector('.filter-tab.active').getAttribute('data-specialty');
        const activeBodyType = document.querySelector('.body-type-filter.active').getAttribute('data-body');
        
        fitnessModels.forEach(model => {
            const modelSpecialty = model.getAttribute('data-specialty');
            const modelBodyType = model.getAttribute('data-body');
            
            const specialtyMatch = activeSpecialty === 'all' || modelSpecialty === activeSpecialty;
            const bodyTypeMatch = activeBodyType === 'all' || modelBodyType === activeBodyType;
            
            if (specialtyMatch && bodyTypeMatch) {
                model.style.display = 'block';
            } else {
                model.style.display = 'none';
            }
        });
    }
});

// Search functionality
function searchFitnessModels() {
    const searchTerm = document.getElementById('fitnessSearch').value.toLowerCase();
    const fitnessModels = document.querySelectorAll('.fitness-model-item');
    
    fitnessModels.forEach(model => {
        const modelText = model.textContent.toLowerCase();
        if (modelText.includes(searchTerm)) {
            model.style.display = 'block';
        } else {
            model.style.display = 'none';
        }
    });
}

// Load more functionality
function loadMoreFitnessModels() {
    alert('Loading more fitness models... (This would load additional models in a real application)');
}

// Search on Enter key
document.getElementById('fitnessSearch').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchFitnessModels();
    }
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

// Workout video demo click handlers
document.querySelectorAll('.workout-demo').forEach(demo => {
    demo.addEventListener('click', function() {
        alert('Video demonstration would play here in a real application');
    });
});

// Sort functionality
document.getElementById('sortFilter').addEventListener('change', function() {
    const sortValue = this.value;
    console.log('Sorting by:', sortValue);
    // In a real application, this would sort the models accordingly
});
</script>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

</body>
</html>