<?php
/**
 * POST /api/jobs/create.php
 * Creates job and optional default sequential operations with eligible machines
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validation.php';

$input = Response::getJsonInput();
$err = Validation::requireFields($input, ['job_number', 'customer_name', 'product_name', 'due_date']);
if ($err) {
    Response::error($err, 400, 'VALIDATION_FAILED');
}

try {
    $pdo = Database::getConnection();
    
    // Check duplicate
    $check = $pdo->prepare('SELECT id FROM jobs WHERE job_number = :jn LIMIT 1');
    $check->execute([':jn' => trim($input['job_number'])]);
    if ($check->fetch()) {
        Response::error('A job order with number ' . $input['job_number'] . ' already exists.', 409, 'DUPLICATE_JOB');
    }

    $priority = strtoupper($input['priority'] ?? 'MEDIUM');
    $status = strtoupper($input['status'] ?? 'WAITING');

    $stmt = $pdo->prepare('INSERT INTO jobs (job_number, customer_name, product_name, quantity, priority, due_date, status, estimated_processing_time) 
        VALUES (:jn, :cn, :pn, :qty, :pri, :due, :st, :est)');
    
    $stmt->execute([
        ':jn' => trim($input['job_number']),
        ':cn' => trim($input['customer_name']),
        ':pn' => trim($input['product_name']),
        ':qty' => max(1, (int)($input['quantity'] ?? 1)),
        ':pri' => $priority,
        ':due' => date('Y-m-d H:i:s', strtotime($input['due_date'])),
        ':st'  => $status,
        ':est' => (float)($input['estimated_processing_time'] ?? 3.5)
    ]);

    $jobId = (int)$pdo->lastInsertId();

    // If operations provided in request, insert them
    if (!empty($input['operations']) && is_array($input['operations'])) {
        foreach ($input['operations'] as $index => $opData) {
            $seq = $index + 1;
            $opStmt = $pdo->prepare('INSERT INTO job_operations (job_id, operation_number, operation_name, processing_time, sequence_number, priority) 
                VALUES (:jid, :onum, :oname, :ptime, :seq, :pri)');
            $opNum = 'OP-' . str_pad((string)$seq, 2, '0', STR_PAD_LEFT);
            $opStmt->execute([
                ':jid' => $jobId,
                ':onum' => $opNum,
                ':oname' => trim($opData['operation_name'] ?? ('Stage ' . $seq)),
                ':ptime' => (float)($opData['processing_time'] ?? 1.5),
                ':seq' => $seq,
                ':pri' => $priority
            ]);
            $opId = (int)$pdo->lastInsertId();

            if (!empty($opData['eligible_machine_ids']) && is_array($opData['eligible_machine_ids'])) {
                $emStmt = $pdo->prepare('INSERT INTO operation_machines (operation_id, machine_id, processing_time, is_preferred) VALUES (:opid, :mid, :ptime, :pref)');
                foreach ($opData['eligible_machine_ids'] as $mId) {
                    $emStmt->execute([
                        ':opid' => $opId,
                        ':mid' => (int)$mId,
                        ':ptime' => (float)($opData['processing_time'] ?? 1.5),
                        ':pref' => true
                    ]);
                }
            }
        }
    }

    // Trigger alert if urgent job
    if ($priority === 'URGENT') {
        $alert = $pdo->prepare('INSERT INTO alerts (type, title, message, severity) VALUES (:type, :title, :msg, :sev)');
        $alert->execute([
            ':type' => 'urgent_job',
            ':title' => "NEW URGENT JOB: {$input['job_number']}",
            ':msg' => "Customer {$input['customer_name']} placed urgent order for {$input['product_name']}. Re-optimization advised.",
            ':sev' => 'danger'
        ]);
    }

    Response::success('Job order created successfully', ['id' => $jobId, 'job_number' => $input['job_number']]);
} catch (Exception $e) {
    Response::error('Failed to create job order: ' . $e->getMessage(), 500, 'JOB_CREATE_ERROR');
}
