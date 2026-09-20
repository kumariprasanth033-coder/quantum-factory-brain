<?php
/**
 * GET /api/jobs/details.php
 * Fetches job details, its operations in sequence, and eligible machines per operation
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

$jobId = (int)($_GET['id'] ?? 0);
if ($jobId <= 0) {
    Response::error('Valid Job ID is required.', 400, 'INVALID_JOB_ID');
}

try {
    $pdo = Database::getConnection();
    
    // Get job
    $stmt = $pdo->prepare('SELECT * FROM jobs WHERE id = :id');
    $stmt->execute([':id' => $jobId]);
    $job = $stmt->fetch();

    if (!$job) {
        Response::error('Job order not found.', 404, 'NOT_FOUND');
    }

    // Get operations
    $opStmt = $pdo->prepare('SELECT * FROM job_operations WHERE job_id = :jid ORDER BY sequence_number ASC');
    $opStmt->execute([':jid' => $jobId]);
    $operations = $opStmt->fetchAll();

    // Attach eligible machines to each operation
    foreach ($operations as &$op) {
        $emStmt = $pdo->prepare('SELECT om.*, m.machine_code, m.machine_name, m.status as machine_status 
            FROM operation_machines om 
            JOIN machines m ON om.machine_id = m.id 
            WHERE om.operation_id = :opid 
            ORDER BY om.processing_time ASC');
        $emStmt->execute([':opid' => $op['id']]);
        $op['eligible_machines'] = $emStmt->fetchAll();
    }

    $job['operations'] = $operations;

    Response::success('Job details retrieved', $job);
} catch (Exception $e) {
    Response::error('Failed to get job details: ' . $e->getMessage(), 500, 'SERVER_ERROR');
}
