<?php
/**
 * GET/POST /api/scheduling/gantt.php
 * Gantt Chart schedule operation data endpoint with filtering and auto-seeding
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/scheduler.php';

try {
    $pdo = Database::getConnection();

    // 1. Fetch machines
    $mStmt = $pdo->query('SELECT * FROM machines ORDER BY id ASC');
    $machines = $mStmt->fetchAll();

    // 2. Fetch latest active schedule
    $sStmt = $pdo->query('SELECT * FROM schedules ORDER BY id DESC LIMIT 1');
    $activeSchedule = $sStmt->fetch();

    $operations = [];

    if ($activeSchedule) {
        $scheduleId = (int)$activeSchedule['id'];
        
        // Fetch operations with joined machine and job data
        $sql = "SELECT 
                    so.*,
                    j.job_number,
                    j.product_name as job_name,
                    j.priority,
                    j.due_date,
                    jo.operation_name,
                    jo.sequence_number,
                    m.machine_code,
                    m.machine_name
                FROM schedule_operations so
                JOIN jobs j ON j.id = so.job_id
                JOIN job_operations jo ON jo.id = so.operation_id
                JOIN machines m ON m.id = so.machine_id
                WHERE so.schedule_id = :sid";
        
        $params = [':sid' => $scheduleId];

        if (!empty($_GET['machine_id'])) {
            $sql .= " AND so.machine_id = :mid";
            $params[':mid'] = (int)$_GET['machine_id'];
        }

        if (!empty($_GET['job_id'])) {
            $sql .= " AND so.job_id = :jid";
            $params[':jid'] = (int)$_GET['job_id'];
        }

        if (!empty($_GET['priority'])) {
            $sql .= " AND j.priority = :pri";
            $params[':pri'] = strtoupper(trim($_GET['priority']));
        }

        $sql .= " ORDER BY so.start_time ASC, so.machine_id ASC";
        $opStmt = $pdo->prepare($sql);
        $opStmt->execute($params);
        $operations = $opStmt->fetchAll();
    }

    Response::success('Gantt schedule operation data retrieved successfully', [
        'schedule_id' => $activeSchedule ? (int)$activeSchedule['id'] : 0,
        'version' => $activeSchedule ? $activeSchedule['version'] : 'SCH-EMPTY',
        'mode' => $activeSchedule ? $activeSchedule['mode'] : 'quantum_inspired',
        'makespan' => $activeSchedule ? (float)$activeSchedule['makespan'] : 0.0,
        'utilization' => $activeSchedule ? (float)$activeSchedule['utilization'] : 0.0,
        'idle_time' => $activeSchedule ? (float)$activeSchedule['idle_time'] : 0.0,
        'delayed_jobs' => $activeSchedule ? (int)$activeSchedule['delayed_jobs'] : 0,
        'schedule' => $activeSchedule ?: null,
        'operations' => $operations,
        'schedule_operations' => $operations,
        'machines' => $machines,
        'total_operations' => count($operations),
    ]);
} catch (Exception $e) {
    Response::error('Failed to retrieve Gantt schedule data: ' . $e->getMessage(), 500, 'GANTT_RETRIEVAL_ERROR');
}
