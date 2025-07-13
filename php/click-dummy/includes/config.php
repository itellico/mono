<?php
// Configuration file for the click-dummy application

// Base path configuration - set this to the web root path where the application is served
// For example: '/clickdummy' when served at http://localhost:4040/clickdummy/
// or '' when served at document root
define('APP_BASE_PATH', '');

// Helper function to get the normalized script name relative to the app base path
function getNormalizedScriptName() {
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    
    // Remove the base path from the script name to get the relative path
    if (APP_BASE_PATH && strpos($scriptName, APP_BASE_PATH) === 0) {
        $scriptName = substr($scriptName, strlen(APP_BASE_PATH));
    }
    
    return $scriptName;
}

// Helper function to get the full URL path with base path
function getFullPath($relativePath) {
    return APP_BASE_PATH . $relativePath;
}

// Helper function to get the correct CSS/JS asset path
function getAssetPath($scriptName) {
    // Normalize the script name to remove base path
    $normalizedScript = getNormalizedScriptName();
    
    // For 3-level deep subdirectories like /platform/tenants/plans/index.php
    if (substr_count($normalizedScript, '/') >= 4 && 
        (strpos($normalizedScript, '/platform/') !== false || strpos($normalizedScript, '/tenant/') !== false || 
         strpos($normalizedScript, '/account/') !== false || strpos($normalizedScript, '/user/') !== false || 
         strpos($normalizedScript, '/public/') !== false)) {
        return APP_BASE_PATH . '/assets/';
    }
    
    // For 2-level subdirectories like /platform/tenants/index.php
    if ((strpos($normalizedScript, '/platform/') !== false && strpos($normalizedScript, '/platform/index.php') === false) ||
        (strpos($normalizedScript, '/tenant/') !== false && strpos($normalizedScript, '/tenant/index.php') === false) ||
        (strpos($normalizedScript, '/account/') !== false && strpos($normalizedScript, '/account/index.php') === false) ||
        (strpos($normalizedScript, '/user/') !== false && strpos($normalizedScript, '/user/index.php') === false) ||
        (strpos($normalizedScript, '/public/') !== false && strpos($normalizedScript, '/public/index.php') === false)) {
        return APP_BASE_PATH . '/assets/';
    }
    
    // For main tier directories like /platform/index.php
    if (strpos($normalizedScript, '/platform/') !== false || strpos($normalizedScript, '/tenant/') !== false || 
        strpos($normalizedScript, '/account/') !== false || strpos($normalizedScript, '/user/') !== false || 
        strpos($normalizedScript, '/public/') !== false) {
        return APP_BASE_PATH . '/assets/';
    }
    
    // For root index.php
    return APP_BASE_PATH . '/assets/';
}

// Helper function to get the correct path prefix for navigation links
function getNavPathPrefix() {
    $normalizedScript = getNormalizedScriptName();
    
    // Determine the correct path prefix based on current location
    if (strpos($normalizedScript, '/platform/') !== false ||
        strpos($normalizedScript, '/tenant/') !== false ||
        strpos($normalizedScript, '/account/') !== false ||
        strpos($normalizedScript, '/user/') !== false ||
        strpos($normalizedScript, '/public/') !== false) {
        
        if (substr_count($normalizedScript, '/') >= 4) {
            // 3-level deep like /platform/tenants/plans/index.php
            return '../../';
        } elseif (substr_count($normalizedScript, '/') >= 3) {
            // 2-level deep like /platform/tenants/index.php
            return '../';
        } else {
            // Main tier level like /platform/index.php
            return '';
        }
    }
    
    // For root index.php
    return '';
}

// Helper function to get the home path
function getHomePath() {
    $normalizedScript = getNormalizedScriptName();
    
    if (strpos($normalizedScript, '/platform/') !== false ||
        strpos($normalizedScript, '/tenant/') !== false ||
        strpos($normalizedScript, '/account/') !== false ||
        strpos($normalizedScript, '/user/') !== false ||
        strpos($normalizedScript, '/public/') !== false) {
        
        if (substr_count($normalizedScript, '/') >= 4) {
            // 3-level deep like /platform/tenants/plans/index.php
            return APP_BASE_PATH . '/index.php';
        } elseif (substr_count($normalizedScript, '/') >= 3) {
            // 2-level deep like /platform/tenants/index.php
            return APP_BASE_PATH . '/index.php';
        } else {
            // Main tier level like /platform/index.php
            return APP_BASE_PATH . '/index.php';
        }
    }
    
    // For root index.php
    return APP_BASE_PATH . '/index.php';
}
?>