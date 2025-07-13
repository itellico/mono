<?php
// Include the configuration file
require_once __DIR__ . '/config.php';

function renderHeader($title = "itellico Mono Platform", $user = "Admin User", $role = "Super Admin", $tier = "Platform") {
    // Get the correct paths using the new configuration functions
    $homePath = getHomePath();
    $assetPath = getAssetPath($_SERVER['SCRIPT_NAME']);
    
    return '
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>' . htmlspecialchars($title) . '</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <link href="' . $assetPath . 'css/global.css" rel="stylesheet">
    </head>
    <body>
        <!-- Top Navigation Bar -->
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
            <div class="container-fluid">
                <a class="navbar-brand fw-bold" href="' . $homePath . '">
                    <i class="fas fa-cubes me-2"></i>itellico Mono
                </a>
                <!-- Mobile menu toggle -->
                <button class="mobile-menu-toggle btn btn-outline-light d-md-none me-3" onclick="AppUtils.toggleSidebar()">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="navbar-nav ms-auto">
                    <div class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" 
                                 class="rounded-circle me-2" width="32" height="32" alt="Admin">
                            <div class="text-start">
                                <div class="fw-bold">' . htmlspecialchars($user) . '</div>
                                <small class="text-muted">' . htmlspecialchars($role) . '</small>
                            </div>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#"><i class="fas fa-user me-2"></i>Profile</a></li>
                            <li><a class="dropdown-item" href="#"><i class="fas fa-cog me-2"></i>Settings</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- Main Container -->
        <div class="main-container">
    ';
}
?>