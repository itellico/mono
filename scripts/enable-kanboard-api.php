<?php
// Enable Kanboard API access
// This script needs to be run through the Kanboard instance

// First, let's create a simple PHP info file to verify PHP can access Kanboard
$kanboardPath = '/var/www/html/kanboard';
$configFile = $kanboardPath . '/config.php';

// Check if we can read the config
if (file_exists($configFile)) {
    echo "Config file found at: $configFile\n";
    
    // Check database
    $dbFile = $kanboardPath . '/data/db.sqlite';
    if (file_exists($dbFile)) {
        echo "Database found at: $dbFile\n";
        echo "Database size: " . filesize($dbFile) . " bytes\n";
        
        // Try to connect to the database
        try {
            $db = new PDO('sqlite:' . $dbFile);
            echo "Database connection successful!\n";
            
            // Check if admin user exists
            $stmt = $db->query("SELECT id, username, api_access_token FROM users WHERE username = 'admin'");
            $admin = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($admin) {
                echo "Admin user found: ID=" . $admin['id'] . "\n";
                if (!empty($admin['api_access_token'])) {
                    echo "API token already set: " . substr($admin['api_access_token'], 0, 20) . "...\n";
                } else {
                    echo "No API token set for admin user.\n";
                    
                    // Set the API token
                    $token = 'ad2d87eaa6de90d0bce2f26d0ee79279a0f7f608cf18d05f3a4556eb60ad';
                    $stmt = $db->prepare("UPDATE users SET api_access_token = ? WHERE id = ?");
                    $stmt->execute([$token, $admin['id']]);
                    echo "API token has been set!\n";
                }
            } else {
                echo "Admin user not found!\n";
            }
            
        } catch (PDOException $e) {
            echo "Database error: " . $e->getMessage() . "\n";
        }
    } else {
        echo "Database not found at: $dbFile\n";
    }
} else {
    echo "Config file not found at: $configFile\n";
}