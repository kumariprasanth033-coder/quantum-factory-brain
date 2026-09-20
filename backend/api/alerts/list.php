<?php
/**
 * GET /api/alerts/list.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->query('SELECT * FROM alerts ORDER BY id DESC LIMIT 50');
    $alerts = $stmt->fetchAll();

    Response::success('Alerts retrieved', $alerts);
} catch (Exception $e) {
    Response::error('Failed to get alerts: ' . $e->getMessage(), 500, 'ALERTS_ERROR');
}
