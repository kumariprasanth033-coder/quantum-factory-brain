<?php
/**
 * GET /api/machines/list.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

try {
    $pdo = Database::getConnection();
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;

    $query = "SELECT m.*, 
        (SELECT COUNT(*) FROM schedule_operations so WHERE so.machine_id = m.id AND so.status = 'ACTIVE') as active_tasks,
        (SELECT COALESCE(SUM(so.duration), 0) FROM schedule_operations so WHERE so.machine_id = m.id) as scheduled_workload_hours
        FROM machines m WHERE 1=1";
    $params = [];

    if (!empty($status)) {
        $query .= " AND m.status = :status";
        $params[':status'] = $status;
    }

    if (!empty($search)) {
        $query .= " AND (m.machine_code LIKE :search OR m.machine_name LIKE :search OR m.location LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    $query .= " ORDER BY m.machine_code ASC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $machines = $stmt->fetchAll();

    Response::success('Machines fetched successfully', $machines);
} catch (Exception $e) {
    Response::error('Failed to fetch machines: ' . $e->getMessage(), 500, 'MACHINE_FETCH_ERROR');
}
