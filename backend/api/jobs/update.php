<?php
/**
 * POST /api/jobs/update.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validation.php';

$input = Response::getJsonInput();
$jobId = (int)($input['id'] ?? 0);
if ($jobId <= 0) {
    Response::error('Valid Job ID is required.', 400, 'INVALID_JOB_ID');
}

try {
    $pdo = Database::getConnection();
    
    // Check previous priority for urgent alert
    $prev = $pdo->prepare('SELECT priority, job_number FROM jobs WHERE id = :id');
    $prev->execute([':id' => $jobId]);
    $oldJob = $prev->fetch();

    $newPriority = strtoupper($input['priority'] ?? 'MEDIUM');

    $stmt = $pdo->prepare('UPDATE jobs SET 
        customer_name = :cn,
        product_name = :pn,
        quantity = :qty,
        priority = :pri,
        due_date = :due,
        status = :st,
        estimated_processing_time = :est
        WHERE id = :id');

    $stmt->execute([
        ':id'  => $jobId,
        ':cn'  => trim($input['customer_name']),
        ':pn'  => trim($input['product_name']),
        ':qty' => max(1, (int)($input['quantity'] ?? 1)),
        ':pri' => $newPriority,
        ':due' => date('Y-m-d H:i:s', strtotime($input['due_date'])),
        ':st'  => strtoupper($input['status'] ?? 'WAITING'),
        ':est' => (float)($input['estimated_processing_time'] ?? 3.5),
    ]);

    // If upgraded to URGENT, add alert
    if ($oldJob && $oldJob['priority'] !== 'URGENT' && $newPriority === 'URGENT') {
        $alert = $pdo->prepare('INSERT INTO alerts (type, title, message, severity) VALUES (:type, :title, :msg, :sev)');
        $alert->execute([
            ':type' => 'priority_change',
            ':title' => "JOB PRIORITY ESCALATION: {$oldJob['job_number']}",
            ':msg' => "Job priority escalated from {$oldJob['priority']} to URGENT. Dynamic schedule re-optimization recommended.",
            ':sev' => 'warning'
        ]);
    }

    Response::success('Job updated successfully');
} catch (Exception $e) {
    Response::error('Failed to update job: ' . $e->getMessage(), 500, 'JOB_UPDATE_ERROR');
}
