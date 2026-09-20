<?php
/**
 * GET /api/health.php
 * Production API Health Check
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    Response::success();
}

$dbStatus = 'disconnected';
$dbMessage = 'Not connected';

try {
    $pdo = Database::getConnection();
    if ($pdo) {
        $stmt = $pdo->query('SELECT 1');
        if ($stmt) {
            $dbStatus = 'connected';
            $dbMessage = 'MySQL connection nominal';
        }
    }
} catch (Throwable $e) {
    $dbStatus = 'disconnected';
    $dbMessage = $e->getMessage();
}

Response::json(
    $dbStatus === 'connected',
    $dbStatus === 'connected' ? 'Quantum Factory Brain API is healthy' : 'API running with database warning',
    [
        'status' => $dbStatus === 'connected' ? 'healthy' : 'degraded',
        'database' => $dbStatus,
        'database_detail' => $dbMessage,
        'app_name' => defined('APP_NAME') ? APP_NAME : 'Quantum Factory Brain',
        'app_version' => defined('APP_VERSION') ? APP_VERSION : '1.0.0-PROD',
        'timestamp' => date('c'),
        'environment' => getenv('APP_ENV') ?: 'production',
        'runtime' => 'PHP ' . PHP_VERSION,
        'server_time_utc' => gmdate('Y-m-d H:i:s')
    ],
    $dbStatus === 'connected' ? 200 : 200
);
