<?php
/**
 * GET /api/scheduling/active.php
 * Fetches latest active schedule and its operations for Gantt timeline
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

try {
    $pdo = Database::getConnection();

    // 1. Fetch latest schedule
    $stmt = $pdo->query('SELECT * FROM schedules ORDER BY id DESC LIMIT 1');
    $schedule = $stmt->fetch();

    if (!$schedule) {
        Response::error(
            'No active schedule available. Please generate a schedule.',
            404,
            'NO_ACTIVE_SCHEDULE',
            ['solution' => 'Click Generate Schedule on the Dynamic Scheduler page.']
        );
    }

    // 2. Fetch schedule operations
    $opStmt = $pdo->prepare('
        SELECT 
            so.*,
            j.job_number,
            j.product_name AS job_name,
            j.priority,
            j.due_date,
            jo.operation_name,
            jo.sequence_number,
            m.machine_code,
            m.machine_name
        FROM schedule_operations so
        LEFT JOIN jobs j ON so.job_id = j.id
        LEFT JOIN job_operations jo ON so.operation_id = jo.id
        LEFT JOIN machines m ON so.machine_id = m.id
        WHERE so.schedule_id = :sid
        ORDER BY so.machine_id ASC, so.start_time ASC
    ');
    $opStmt->execute([':sid' => $schedule['id']]);
    $operations = $opStmt->fetchAll();

    // Format fields
    $schedule['makespan'] = (float)$schedule['makespan'];
    $schedule['utilization'] = (float)$schedule['utilization'];
    $schedule['idle_time'] = (float)$schedule['idle_time'];
    $schedule['delayed_jobs'] = (int)$schedule['delayed_jobs'];
    $schedule['schedule_operations'] = $operations;
    $schedule['operations'] = $operations; // Compatibility alias

    Response::success('Active schedule retrieved successfully.', $schedule);
} catch (Throwable $e) {
    Response::error(
        'Failed to retrieve active schedule: ' . $e->getMessage(),
        500,
        'ACTIVE_SCHEDULE_FETCH_FAILED',
        ['trace' => $e->getFile() . ':' . $e->getLine()]
    );
}
