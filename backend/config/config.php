<?php
/**
 * Quantum Factory Brain - Configuration
 * UC-058: Dynamic Flexible Job-Shop Scheduling (DFJSSP)
 */

declare(strict_types=1);

// Error reporting for production/development
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Database credentials for XAMPP default
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'quantum_factory_brain');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// App & Session settings
define('APP_NAME', 'Quantum Factory Brain');
define('APP_VERSION', '1.0.0-PROD');
define('SESSION_LIFETIME', 86400); // 24 hours

// Session setup
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', '1');
    ini_set('session.use_only_cookies', '1');
    session_start();
}
