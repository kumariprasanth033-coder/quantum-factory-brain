<?php
/**
 * GET /api/scheduling/history.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->query('SELECT s.*, 
        (SELECT COUNT(*) FROM schedule_operations so WHERE so.schedule_id = s.id) as operation_count 
        FROM schedules s 
        ORDER BY s.id DESC 
        LIMIT 30');
    $history = $stmt->fetchAll();

    Response::success('Schedule history fetched', $history);
} catch (Exception $e) {
    Response::error('Failed to fetch schedule history: ' . $e->getMessage(), 500, 'HISTORY_ERROR');
}
