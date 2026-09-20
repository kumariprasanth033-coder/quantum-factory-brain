<?php
/**
 * GET /api/jobs/list.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

try {
    $pdo = Database::getConnection();
    $priority = $_GET['priority'] ?? null;
    $status = $_GET['status'] ?? null;
    $search = $_GET['search'] ?? null;

    $query = "SELECT j.*, 
        (SELECT COUNT(*) FROM job_operations jo WHERE jo.job_id = j.id) as operation_count 
        FROM jobs j WHERE 1=1";
    $params = [];

    if (!empty($priority)) {
        $query .= " AND j.priority = :priority";
        $params[':priority'] = strtoupper($priority);
    }
    if (!empty($status)) {
        $query .= " AND j.status = :status";
        $params[':status'] = strtoupper($status);
    }
    if (!empty($search)) {
        $query .= " AND (j.job_number LIKE :search OR j.customer_name LIKE :search OR j.product_name LIKE :search)";
        $params[':search'] = '%' . $search . '%';
    }

    $query .= " ORDER BY CASE j.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, j.due_date ASC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $jobs = $stmt->fetchAll();

    Response::success('Jobs retrieved successfully', $jobs);
} catch (Exception $e) {
    Response::error('Failed to retrieve jobs: ' . $e->getMessage(), 500, 'JOBS_FETCH_ERROR');
}
