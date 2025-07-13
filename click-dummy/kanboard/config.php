<?php

// Database configuration for SQLite
define('DB_DRIVER', 'sqlite');
define('DB_FILENAME', 'data/db.sqlite');

// Enable/disable debug
define('DEBUG', false);

// Enable API authentication
define('API_AUTHENTICATION', true);

// Plugins directory
define('PLUGINS_DIR', __DIR__.'/plugins');

// Enable/disable URL rewrite
define('ENABLE_URL_REWRITE', false);

// Base URL
define('KANBOARD_URL', 'http://localhost:4040/kanboard/');

// Enable hashed URL for public board
define('ENABLE_HASHED_URLS', true);

// Available cache drivers are "file" and "memory"
define('CACHE_DRIVER', 'memory');

// HTTP cache expiration time (5 minutes)
define('HTTP_CACHE_TTL', 300);

// Session duration in second (0 = until the browser is closed)
// See http://php.net/manual/en/session.configuration.php#ini.session.cookie-lifetime
define('SESSION_DURATION', 0);

// HTTP Client
define('HTTP_PROXY_HOSTNAME', '');
define('HTTP_PROXY_PORT', '');
define('HTTP_PROXY_USERNAME', '');
define('HTTP_PROXY_PASSWORD', '');
define('HTTP_PROXY_EXCLUDE', 'localhost');

// LDAP configuration
define('LDAP_AUTH', false);

// Remember me authentication
define('REMEMBER_ME_AUTH', true);

// Enable captcha
define('ENABLE_CAPTCHA', false);

// Enable bruteforce protection
define('BRUTEFORCE_CAPTCHA', 5);
define('BRUTEFORCE_LOCKDOWN', 10);
define('BRUTEFORCE_LOCKDOWN_DURATION', 1800);

// Email configuration
define('MAIL_CONFIGURATION', true);
define('MAIL_FROM', 'kanboard@localhost');
define('MAIL_TRANSPORT', 'smtp');
define('MAIL_SMTP_HOSTNAME', 'mailpit');
define('MAIL_SMTP_PORT', 1025);
define('MAIL_SMTP_USERNAME', '');
define('MAIL_SMTP_PASSWORD', '');
define('MAIL_SMTP_HELO_NAME', null);
define('MAIL_SMTP_ENCRYPTION', null);
define('MAIL_SENDMAIL_COMMAND', '/usr/sbin/sendmail -bs');

// Run automatically database migrations
define('DB_RUN_MIGRATIONS', true);

// Escape html inside markdown text
define('MARKDOWN_ESCAPE_HTML', true);

// API authentication token (can be regenerated in settings)
define('API_AUTHENTICATION_TOKEN', 'ad2d87eaa6de90d0bce2f26d0ee79279a0f7f608cf18d05f3a4556eb60ad');

// Enable/Disable plugin installer (disabled by default for security reasons)
define('PLUGIN_INSTALLER', false);

// Available log drivers: syslog, stderr, stdout, system or file
define('LOG_DRIVER', 'stdout');

// Filename to store file logs
define('LOG_FILE', 'data/logs/app.log');

// Logging level: DEBUG, INFO, WARNING, ERROR
define('LOG_LEVEL', 'ERROR');