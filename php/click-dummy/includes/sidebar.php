<?php
// Include the configuration file
require_once __DIR__ . '/config.php';

function renderSidebar($tier, $items, $currentPage = '') {
    $tierColors = [
        'Platform' => 'primary',
        'Tenant' => 'success', 
        'Account' => 'info',
        'User' => 'warning',
        'Public' => 'secondary'
    ];
    
    $color = $tierColors[$tier] ?? 'primary';
    
    $sidebar = '
    <nav class="sidebar bg-dark text-white">
        <div class="sidebar-header">
            <h5 class="text-center mb-1 text-white">' . htmlspecialchars($tier) . ' Dashboard</h5>
            <small class="text-center d-block" style="color: #adb5bd;">Tier ' . (array_search($tier, array_keys($tierColors)) + 1) . '</small>
        </div>
        <div class="sidebar-content">
            <ul class="nav flex-column list-unstyled">';
    
    foreach ($items as $item) {
        $isActive = ($item['href'] ?? '') === $currentPage;
        $activeClass = $isActive ? "active bg-{$color} rounded" : '';
        $href = isset($item['href']) ? $item['href'] : '#';
        
        $isSubItem = strpos($item['label'], '└') === 0;
        $subItemClass = $isSubItem ? 'ps-3 small' : '';
        $isSeparator = isset($item['separator']) && $item['separator'] === true;
        
        if ($isSeparator) {
            $sidebar .= '
                <li class="nav-item mt-3 mb-2">
                    <hr>
                    <div class="text-muted text-uppercase fw-bold">' . htmlspecialchars($item['label']) . '</div>
                </li>';
        } else {
            $sidebar .= '
                <li class="nav-item">
                    <a class="nav-link ' . $activeClass . ' ' . $subItemClass . '" href="' . htmlspecialchars($href) . '">
                        <i class="' . htmlspecialchars($item['icon']) . '"></i>
                        <span>' . htmlspecialchars($item['label']) . '</span>
                    </a>
                </li>';
        }
    }
    
    $sidebar .= '
            </ul>
        </div>
        <div class="sidebar-footer p-3 border-top border-secondary">';
    
    // Use the new configuration function for home path
    $homePath = getHomePath();
    
    $sidebar .= '
            <a href="' . $homePath . '" class="btn btn-outline-light btn-sm w-100">
                <i class="fas fa-home me-2"></i> Back to Home
            </a>
        </div>
    </nav>';
    
    return $sidebar;
}

function getPlatformSidebarItems() {
    $normalizedScript = getNormalizedScriptName();
    $pathPrefix = getNavPathPrefix();
    $platformBase = APP_BASE_PATH . '/platform/';
    
    return [
        ['label' => 'Dashboard', 'icon' => 'fas fa-tachometer-alt', 'href' => $platformBase . 'index.php'],
        ['label' => 'Architecture Overview', 'icon' => 'fas fa-sitemap', 'href' => $platformBase . 'overview.php'],
        
        // MULTI-BRAND MANAGEMENT  
        ['label' => 'Brand Management', 'icon' => 'fas fa-layer-group', 'href' => $platformBase . 'brands/brand-manager.php'],
        ['label' => 'Industry Templates', 'icon' => 'fas fa-code-branch', 'href' => $platformBase . 'industry-templates/template-library.php'],
        ['label' => 'Cross-Brand Integration', 'icon' => 'fas fa-network-wired', 'href' => $platformBase . 'cross-brand/integration-hub.php'],
        
        // GLOBAL RESOURCES
        ['label' => 'Global Resources', 'icon' => 'fas fa-cube', 'href' => '#', 'separator' => true],
        
        // Global Resources (Platform-Level)
        ['label' => 'Global Option Sets', 'icon' => 'fas fa-list-ul', 'href' => $platformBase . 'resources/option-sets.php'],
        ['label' => 'System Categories', 'icon' => 'fas fa-folder', 'href' => $platformBase . 'resources/categories.php'],
        ['label' => 'System Tags', 'icon' => 'fas fa-tags', 'href' => $platformBase . 'resources/tags.php'],
        ['label' => 'Industry Installers', 'icon' => 'fas fa-download', 'href' => $platformBase . 'installers/industry-setup.php'],
        
        // Access Control
        ['label' => 'Access Control', 'icon' => 'fas fa-shield-alt', 'href' => '#', 'separator' => true],
        ['label' => 'Permission Matrix', 'icon' => 'fas fa-th', 'href' => $platformBase . 'access-control/permission-matrix.php'],
        ['label' => 'Roles', 'icon' => 'fas fa-user-tag', 'href' => $platformBase . 'access-control/roles.php'],
        ['label' => 'Permissions', 'icon' => 'fas fa-key', 'href' => $platformBase . 'access-control/permissions.php'],
        
        // Features & Limits
        ['label' => 'Features & Limits', 'icon' => 'fas fa-puzzle-piece', 'href' => '#', 'separator' => true],
        ['label' => 'Features', 'icon' => 'fas fa-cog', 'href' => $platformBase . 'plans/feature-builder.php'],
        ['label' => 'Feature Sets', 'icon' => 'fas fa-layer-group', 'href' => $platformBase . 'plans/feature-set-builder.php'],
        ['label' => 'Dependency Manager', 'icon' => 'fas fa-project-diagram', 'href' => $platformBase . 'features/dependency-manager.php'],
        ['label' => 'Limits', 'icon' => 'fas fa-sliders-h', 'href' => $platformBase . 'plans/limits-builder.php'],
        ['label' => 'Resolution Rules', 'icon' => 'fas fa-gavel', 'href' => $platformBase . 'limits/resolution-rules.php'],
        
        // SUBSCRIPTION MANAGEMENT
        ['label' => 'Subscription Management', 'icon' => 'fas fa-credit-card', 'href' => '#', 'separator' => true],
        ['label' => 'Subscription Plans', 'icon' => 'fas fa-shopping-cart', 'href' => $platformBase . 'plans/index.php'],
        ['label' => '└ Unified Builder', 'icon' => 'fas fa-magic', 'href' => $platformBase . 'plans/unified-builder.php'],
        ['label' => '└ Plan Builder', 'icon' => 'fas fa-tools', 'href' => $platformBase . 'plans/plan-builder.php'],
        
        // BILLING & MONETIZATION
        ['label' => 'Billing & Monetization', 'icon' => 'fas fa-dollar-sign', 'href' => '#', 'separator' => true],
        ['label' => 'Add-on Pricing', 'icon' => 'fas fa-plus-circle', 'href' => $platformBase . 'billing/addon-pricing.php'],
        ['label' => 'Revenue Analytics', 'icon' => 'fas fa-chart-line', 'href' => $platformBase . 'revenue/index.php'],
        
        // BRAND/TENANT MANAGEMENT
        ['label' => 'Brand/Tenant Management', 'icon' => 'fas fa-building', 'href' => '#', 'separator' => true],
        ['label' => 'All Tenants (Brands)', 'icon' => 'fas fa-building', 'href' => $platformBase . 'tenants/index.php'],
        ['label' => 'Cross-Tenant API', 'icon' => 'fas fa-exchange-alt', 'href' => $platformBase . 'cross-brand/api-management.php'],
        
        // DEVELOPER TOOLS
        ['label' => 'Developer Tools', 'icon' => 'fas fa-code', 'href' => '#', 'separator' => true],
        ['label' => 'API Documentation', 'icon' => 'fas fa-book', 'href' => $platformBase . 'api/docs.php'],
        ['label' => 'Static Pages Guide', 'icon' => 'fas fa-file-code', 'href' => $platformBase . 'docs/static-pages.php'],
        
        // CONTENT MANAGEMENT
        ['label' => 'Content Management', 'icon' => 'fas fa-file-alt', 'href' => '#', 'separator' => true],
        ['label' => 'Media Library', 'icon' => 'fas fa-images', 'href' => $platformBase . 'media/index.php'],
        ['label' => '└ Media Localization', 'icon' => 'fas fa-globe', 'href' => $platformBase . 'media/localization.php'],
        ['label' => 'Blog System', 'icon' => 'fas fa-blog', 'href' => $platformBase . 'blog/index.php'],
        
        // SYSTEM MANAGEMENT
        ['label' => 'System Management', 'icon' => 'fas fa-cogs', 'href' => '#', 'separator' => true],
        ['label' => 'Translation System', 'icon' => 'fas fa-language', 'href' => $platformBase . 'translations/index.php'],
        ['label' => 'Template Engine', 'icon' => 'fas fa-code', 'href' => $platformBase . 'template-engine/index.php'],
        ['label' => 'API Management', 'icon' => 'fas fa-plug', 'href' => $platformBase . 'api/index.php'],
        ['label' => 'System Monitoring', 'icon' => 'fas fa-heartbeat', 'href' => $platformBase . 'monitoring/index.php'],
        ['label' => 'Workflows', 'icon' => 'fas fa-project-diagram', 'href' => $platformBase . 'workflows/index.php'],
        
        // PLATFORM ADMINISTRATION
        ['label' => 'Platform Administration', 'icon' => 'fas fa-shield-alt', 'href' => '#', 'separator' => true],
        ['label' => 'Content Moderation', 'icon' => 'fas fa-shield-alt', 'href' => $platformBase . 'moderation/index.php'],
        ['label' => 'Audit Dashboard', 'icon' => 'fas fa-history', 'href' => $platformBase . 'audit/index.php'],
        ['label' => 'Support Tickets', 'icon' => 'fas fa-ticket-alt', 'href' => $platformBase . 'support/index.php'],
        ['label' => 'Operations', 'icon' => 'fas fa-tools', 'href' => $platformBase . 'operations/index.php'],
        ['label' => 'Documentation', 'icon' => 'fas fa-book', 'href' => $platformBase . 'docs/index.php'],
        ['label' => 'Platform Settings', 'icon' => 'fas fa-cog', 'href' => $platformBase . 'settings/index.php']
    ];
}

function getTenantSidebarItems() {
    $normalizedScript = getNormalizedScriptName();
    $pathPrefix = getNavPathPrefix();
    $tenantBase = APP_BASE_PATH . '/tenant/';
    
    return [
        ['label' => 'Tenant Dashboard', 'icon' => 'fas fa-tachometer-alt', 'href' => $tenantBase . 'index.php'],
        ['label' => 'Professional Database', 'icon' => 'fas fa-users', 'href' => $tenantBase . 'talent/index.php'],
        ['label' => 'Generic Gig System', 'icon' => 'fas fa-bullhorn', 'href' => $tenantBase . 'castings/index.php'],
        ['label' => 'Applications', 'icon' => 'fas fa-file-alt', 'href' => $tenantBase . 'applications/index.php'],
        ['label' => 'Industry Marketplace', 'icon' => 'fas fa-store', 'href' => $tenantBase . 'marketplace/index.php'],
        
        // TENANT CONFIGURATION (Industry-Specific)
        ['label' => 'Tenant Configuration', 'icon' => 'fas fa-cogs', 'href' => '#', 'separator' => true],
        ['label' => 'Categories & Tags', 'icon' => 'fas fa-folder', 'href' => $tenantBase . 'categories/index.php'],
        ['label' => 'Industry Workflows', 'icon' => 'fas fa-project-diagram', 'href' => $tenantBase . 'workflows/index.php'],
        ['label' => 'Gig Templates', 'icon' => 'fas fa-layer-group', 'href' => $tenantBase . 'gig-templates/template-manager.php'],
        ['label' => 'Translations', 'icon' => 'fas fa-language', 'href' => $tenantBase . 'translations/index.php'],
        
        // CROSS-TENANT INTEGRATION
        ['label' => 'Cross-Tenant Features', 'icon' => 'fas fa-network-wired', 'href' => '#', 'separator' => true],
        ['label' => 'Data Sharing API', 'icon' => 'fas fa-share-alt', 'href' => $tenantBase . 'cross-brand/data-sharing.php'],
        ['label' => 'Cross-Tenant Requests', 'icon' => 'fas fa-exchange-alt', 'href' => $tenantBase . 'cross-brand/api-requests.php'],
        
        // CONTENT MANAGEMENT
        ['label' => 'Content Management', 'icon' => 'fas fa-file-alt', 'href' => '#', 'separator' => true],
        ['label' => 'Media Library', 'icon' => 'fas fa-images', 'href' => $tenantBase . 'media/index.php'],
        ['label' => 'Blog', 'icon' => 'fas fa-blog', 'href' => $tenantBase . 'blocks/index.php'],
        ['label' => 'Categories', 'icon' => 'fas fa-folder', 'href' => $tenantBase . 'categories/index.php'],
        ['label' => 'Tags & Labels', 'icon' => 'fas fa-tags', 'href' => $tenantBase . 'tags/index.php'],
        
        // ADMINISTRATION
        ['label' => 'Administration', 'icon' => 'fas fa-cogs', 'href' => '#', 'separator' => true],
        ['label' => 'Content Moderation', 'icon' => 'fas fa-shield-alt', 'href' => $tenantBase . 'moderation/index.php'],
        ['label' => 'API & Integrations', 'icon' => 'fas fa-plug', 'href' => $tenantBase . 'integrations/index.php'],
        ['label' => 'Analytics', 'icon' => 'fas fa-chart-bar', 'href' => $tenantBase . 'analytics/index.php'],
        ['label' => 'Audit Logs', 'icon' => 'fas fa-history', 'href' => $tenantBase . 'audit/index.php'],
        ['label' => 'Settings', 'icon' => 'fas fa-cog', 'href' => $tenantBase . 'settings/index.php']
    ];
}

function getAccountSidebarItems() {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $pathPrefix = '';
    
    if (strpos($scriptName, '/account/') !== false) {
        if (substr_count($scriptName, '/') >= 4) {
            $pathPrefix = '../../';
        } elseif (substr_count($scriptName, '/') >= 3 && strpos($scriptName, '/account/index.php') === false) {
            $pathPrefix = '../';
        }
    }
    
    return [
        ['label' => 'Account Types Demo', 'icon' => 'fas fa-tachometer-alt', 'href' => $pathPrefix . 'index.php'],
        ['label' => 'Agency Account', 'icon' => 'fas fa-building', 'href' => $pathPrefix . 'agency/index.php'],
        ['label' => 'Professional Account', 'icon' => 'fas fa-camera', 'href' => $pathPrefix . 'professional/index.php'],
        ['label' => 'Talent Account', 'icon' => 'fas fa-user', 'href' => $pathPrefix . 'talent/index.php'],
        ['label' => 'Guardian Account', 'icon' => 'fas fa-users', 'href' => $pathPrefix . 'guardian/index.php'],
        
        // ACCOUNT-LEVEL CUSTOMIZATION (Only Place for Custom Fields)
        ['label' => 'Account Customization', 'icon' => 'fas fa-cogs', 'href' => '#', 'separator' => true],
        ['label' => 'Custom Field Manager', 'icon' => 'fas fa-sliders-h', 'href' => $pathPrefix . 'custom-fields/field-manager.php'],
        ['label' => 'Cross-Tenant Discovery', 'icon' => 'fas fa-search', 'href' => $pathPrefix . 'cross-brand/talent-discovery.php'],
        ['label' => 'Account Billing', 'icon' => 'fas fa-credit-card', 'href' => $pathPrefix . 'billing/index.php']
    ];
}

function getAgencySidebarItems() {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $pathPrefix = '';
    
    if (strpos($scriptName, '/account/') !== false) {
        if (substr_count($scriptName, '/') >= 4) {
            $pathPrefix = '../../';
        } elseif (substr_count($scriptName, '/') >= 3 && strpos($scriptName, '/account/index.php') === false) {
            $pathPrefix = '../';
        }
    }
    
    return [
        ['label' => 'Agency Dashboard', 'icon' => 'fas fa-tachometer-alt', 'href' => $pathPrefix . 'agency/index.php'],
        ['label' => 'Generic Gig Projects', 'icon' => 'fas fa-project-diagram', 'href' => $pathPrefix . 'projects/index.php'],
        ['label' => 'Professional Roster', 'icon' => 'fas fa-users', 'href' => $pathPrefix . 'talent/index.php'],
        ['label' => 'Cross-Tenant Search', 'icon' => 'fas fa-search', 'href' => $pathPrefix . 'search/index.php'],
        ['label' => 'Team Management', 'icon' => 'fas fa-user-friends', 'href' => $pathPrefix . 'team/index.php'],
        
        // CONTENT & MEDIA
        ['label' => 'Content & Media', 'icon' => 'fas fa-images', 'href' => '#', 'separator' => true],
        ['label' => 'Media Library', 'icon' => 'fas fa-images', 'href' => $pathPrefix . 'media/index.php'],
        
        // ACCOUNT SETTINGS
        ['label' => 'Account Settings', 'icon' => 'fas fa-cogs', 'href' => '#', 'separator' => true],
        ['label' => 'Activity Logs', 'icon' => 'fas fa-history', 'href' => $pathPrefix . 'audit/index.php'],
        ['label' => 'Settings', 'icon' => 'fas fa-cog', 'href' => $pathPrefix . 'settings/index.php'],
        ['label' => 'Account Types', 'icon' => 'fas fa-exchange-alt', 'href' => '#', 'separator' => true],
        ['label' => '🏢 Agency Account', 'icon' => 'fas fa-building', 'href' => $pathPrefix . 'agency/index.php'],
        ['label' => '📷 Professional Account', 'icon' => 'fas fa-camera', 'href' => $pathPrefix . 'professional/index.php'],
        ['label' => '👤 Talent Account', 'icon' => 'fas fa-user', 'href' => $pathPrefix . 'talent/index.php'],
        ['label' => '👨‍👩‍👧‍👦 Guardian Account', 'icon' => 'fas fa-users', 'href' => $pathPrefix . 'guardian/index.php']
    ];
}

function getProfessionalSidebarItems() {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $pathPrefix = '';
    
    if (strpos($scriptName, '/account/') !== false) {
        if (substr_count($scriptName, '/') >= 4) {
            $pathPrefix = '../../';
        } elseif (substr_count($scriptName, '/') >= 3 && strpos($scriptName, '/account/index.php') === false) {
            $pathPrefix = '../';
        }
    }
    
    return [
        ['label' => 'Professional Dashboard', 'icon' => 'fas fa-tachometer-alt', 'href' => $pathPrefix . 'professional/index.php'],
        ['label' => 'Portfolio', 'icon' => 'fas fa-images', 'href' => $pathPrefix . 'professional/portfolio.php'],
        ['label' => 'Bookings', 'icon' => 'fas fa-calendar-check', 'href' => $pathPrefix . 'professional/bookings.php'],
        ['label' => 'Service Packages', 'icon' => 'fas fa-box', 'href' => $pathPrefix . 'professional/services.php'],
        ['label' => 'Calendar', 'icon' => 'fas fa-calendar', 'href' => $pathPrefix . 'professional/calendar.php'],
        ['label' => 'Client Messages', 'icon' => 'fas fa-envelope', 'href' => $pathPrefix . 'professional/messages.php'],
        ['label' => 'Earnings', 'icon' => 'fas fa-dollar-sign', 'href' => $pathPrefix . 'professional/earnings.php'],
        ['label' => 'Activity History', 'icon' => 'fas fa-history', 'href' => $pathPrefix . 'professional/activity.php'],
        ['label' => 'Settings', 'icon' => 'fas fa-cog', 'href' => $pathPrefix . 'professional/settings.php'],
        ['label' => 'Account Types', 'icon' => 'fas fa-exchange-alt', 'href' => '#', 'separator' => true],
        ['label' => '🏢 Agency Account', 'icon' => 'fas fa-building', 'href' => $pathPrefix . 'agency/index.php'],
        ['label' => '📷 Professional Account', 'icon' => 'fas fa-camera', 'href' => $pathPrefix . 'professional/index.php'],
        ['label' => '👤 Talent Account', 'icon' => 'fas fa-user', 'href' => $pathPrefix . 'talent/index.php'],
        ['label' => '👨‍👩‍👧‍👦 Guardian Account', 'icon' => 'fas fa-users', 'href' => $pathPrefix . 'guardian/index.php']
    ];
}

function getTalentSidebarItems() {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $pathPrefix = '';
    
    if (strpos($scriptName, '/account/') !== false) {
        if (substr_count($scriptName, '/') >= 4) {
            $pathPrefix = '../../';
        } elseif (substr_count($scriptName, '/') >= 3 && strpos($scriptName, '/account/index.php') === false) {
            $pathPrefix = '../';
        }
    }
    
    return [
        ['label' => 'Professional Dashboard', 'icon' => 'fas fa-tachometer-alt', 'href' => $pathPrefix . 'talent/index.php'],
        ['label' => 'Digital Profile Card', 'icon' => 'fas fa-id-card', 'href' => $pathPrefix . 'talent/profile.php'],
        ['label' => 'Professional Showcase', 'icon' => 'fas fa-images', 'href' => $pathPrefix . 'talent/portfolio.php'],
        ['label' => 'Bookings & Gigs', 'icon' => 'fas fa-calendar-alt', 'href' => $pathPrefix . 'talent/bookings.php'],
        ['label' => 'Availability', 'icon' => 'fas fa-calendar', 'href' => $pathPrefix . 'talent/availability.php'],
        ['label' => 'Gig Applications', 'icon' => 'fas fa-file-alt', 'href' => $pathPrefix . 'talent/applications.php'],
        ['label' => 'Messages', 'icon' => 'fas fa-envelope', 'href' => $pathPrefix . 'talent/messages.php'],
        ['label' => 'Earnings', 'icon' => 'fas fa-dollar-sign', 'href' => $pathPrefix . 'talent/earnings.php'],
        ['label' => 'My Activity', 'icon' => 'fas fa-history', 'href' => $pathPrefix . 'talent/activity.php'],
        ['label' => 'Billing & Subscription', 'icon' => 'fas fa-credit-card', 'href' => '#', 'separator' => true],
        ['label' => 'My Subscription', 'icon' => 'fas fa-shopping-cart', 'href' => $pathPrefix . 'subscription/index.php'],
        ['label' => 'Billing History', 'icon' => 'fas fa-receipt', 'href' => $pathPrefix . 'subscription/invoices.php'],
        ['label' => 'Settings', 'icon' => 'fas fa-cog', 'href' => $pathPrefix . 'talent/settings.php'],
        ['label' => 'Account Types', 'icon' => 'fas fa-exchange-alt', 'href' => '#', 'separator' => true],
        ['label' => '🏢 Agency Account', 'icon' => 'fas fa-building', 'href' => $pathPrefix . 'agency/index.php'],
        ['label' => '📷 Professional Account', 'icon' => 'fas fa-camera', 'href' => $pathPrefix . 'professional/index.php'],
        ['label' => '👤 Talent Account', 'icon' => 'fas fa-user', 'href' => $pathPrefix . 'talent/index.php'],
        ['label' => '👨‍👩‍👧‍👦 Guardian Account', 'icon' => 'fas fa-users', 'href' => $pathPrefix . 'guardian/index.php']
    ];
}

function getGuardianSidebarItems() {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $pathPrefix = '';
    
    if (strpos($scriptName, '/account/') !== false) {
        if (substr_count($scriptName, '/') >= 4) {
            $pathPrefix = '../../';
        } elseif (substr_count($scriptName, '/') >= 3 && strpos($scriptName, '/account/index.php') === false) {
            $pathPrefix = '../';
        }
    }
    
    return [
        ['label' => 'Guardian Dashboard', 'icon' => 'fas fa-tachometer-alt', 'href' => $pathPrefix . 'guardian/index.php'],
        ['label' => 'Multi-Tenant Profiles', 'icon' => 'fas fa-users-cog', 'href' => $pathPrefix . 'guardian/profiles.php'],
        ['label' => 'Cross-Industry Calendar', 'icon' => 'fas fa-calendar-alt', 'href' => $pathPrefix . 'guardian/calendar.php'],
        ['label' => 'All Brand Bookings', 'icon' => 'fas fa-list-alt', 'href' => $pathPrefix . 'guardian/bookings.php'],
        ['label' => 'Cross-Tenant Controls', 'icon' => 'fas fa-shield-alt', 'href' => $pathPrefix . 'guardian/protections.php'],
        ['label' => 'Multi-Industry Reviews', 'icon' => 'fas fa-file-signature', 'href' => $pathPrefix . 'guardian/applications.php'],
        ['label' => 'Consolidated Earnings', 'icon' => 'fas fa-piggy-bank', 'href' => $pathPrefix . 'guardian/earnings.php'],
        ['label' => 'Family Messages', 'icon' => 'fas fa-envelope', 'href' => $pathPrefix . 'guardian/messages.php'],
        ['label' => 'Cross-Brand Monitoring', 'icon' => 'fas fa-history', 'href' => $pathPrefix . 'guardian/activity.php'],
        ['label' => 'Guardian Settings', 'icon' => 'fas fa-cog', 'href' => $pathPrefix . 'guardian/settings.php'],
        ['label' => '← Back to Account Types', 'icon' => 'fas fa-arrow-left', 'href' => $pathPrefix . 'index.php']
    ];
}

function getUserSidebarItems() {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $pathPrefix = '';
    
    if (strpos($scriptName, '/user/') !== false) {
        if (substr_count($scriptName, '/') >= 4) {
            $pathPrefix = '../../';
        } elseif (substr_count($scriptName, '/') >= 3 && strpos($scriptName, '/user/index.php') === false) {
            $pathPrefix = '../';
        }
    }
    
    return [
        ['label' => 'Dashboard', 'icon' => 'fas fa-tachometer-alt', 'href' => $pathPrefix . 'index.php'],
        ['label' => 'Profile', 'icon' => 'fas fa-user', 'href' => $pathPrefix . 'profile/index.php'],
        ['label' => 'Profile Card', 'icon' => 'fas fa-id-card', 'href' => $pathPrefix . 'comp-card/index.php'],
        ['label' => 'Showcase', 'icon' => 'fas fa-images', 'href' => $pathPrefix . 'portfolio/index.php'],
        ['label' => 'Gig Applications', 'icon' => 'fas fa-file-alt', 'href' => $pathPrefix . 'applications/index.php'],
        ['label' => 'Messages', 'icon' => 'fas fa-envelope', 'href' => $pathPrefix . 'messages/index.php'],
        ['label' => 'Calendar', 'icon' => 'fas fa-calendar', 'href' => $pathPrefix . 'calendar/index.php'],
        
        // CROSS-TENANT/MULTI-BRAND FEATURES
        ['label' => 'Cross-Tenant Features', 'icon' => 'fas fa-network-wired', 'href' => '#', 'separator' => true],
        ['label' => 'Multi-Tenant Profile', 'icon' => 'fas fa-share-alt', 'href' => $pathPrefix . 'cross-industry/profile-showcase.php'],
        ['label' => 'Cross-Industry Network', 'icon' => 'fas fa-users', 'href' => $pathPrefix . 'networking/professional-network.php'],
        ['label' => 'Multi-Industry Gigs', 'icon' => 'fas fa-briefcase', 'href' => $pathPrefix . 'gigs/cross-industry.php'],
        
        // CONTENT & MEDIA
        ['label' => 'Content & Media', 'icon' => 'fas fa-images', 'href' => '#', 'separator' => true],
        ['label' => 'My Media Library', 'icon' => 'fas fa-images', 'href' => $pathPrefix . 'media/index.php'],
        
        // ACCOUNT
        ['label' => 'Account', 'icon' => 'fas fa-user-cog', 'href' => '#', 'separator' => true],
        ['label' => 'Content Flagging', 'icon' => 'fas fa-flag', 'href' => $pathPrefix . 'moderation/index.php'],
        ['label' => 'My Activity', 'icon' => 'fas fa-history', 'href' => $pathPrefix . 'activity/index.php'],
        ['label' => 'Settings', 'icon' => 'fas fa-cog', 'href' => $pathPrefix . 'settings/index.php']
    ];
}
?>