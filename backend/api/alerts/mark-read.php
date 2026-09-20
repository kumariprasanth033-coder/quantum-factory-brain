<?php
/**
 * POST /api/alerts/mark-read.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

$input = Response::getJsonInput();
$alertId = (int)($input['id'] ?? 0);

try {
    $pdo = Database::getConnection();
    if ($alertId > 0) {
        $stmt = $pdo->prepare('UPDATE alerts SET is_read = 1 WHERE id = :id');
        $stmt->execute([':id' => $alertId]);
    } else {
        $pdo->query('UPDATE alerts SET is_read = 1');
    }

    Response::success('Alerts marked as read');
} catch (Exception $e) {
    Response::error('Failed to update alerts: ' . $e->getMessage(), 500, 'ALERT_UPDATE_ERROR');
}
