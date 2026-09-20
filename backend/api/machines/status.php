<?php
/**
 * POST /api/machines/status.php
 * Change machine status (e.g. into MAINTENANCE or AVAILABLE) and record alert
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

$input = Response::getJsonInput();
if (empty($input['id']) || empty($input['status'])) {
    Response::error('Machine ID and new status are required.', 400, 'MISSING_PARAMS');
}

$machineId = (int)$input['id'];
$newStatus = strtoupper(trim($input['status']));
$allowed = ['AVAILABLE', 'BUSY', 'MAINTENANCE', 'OFFLINE'];

if (!in_array($newStatus, $allowed, true)) {
    Response::error('Invalid machine status. Allowed: ' . implode(', ', $allowed), 400, 'INVALID_STATUS');
}

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->prepare('SELECT machine_code, machine_name FROM machines WHERE id = :id');
    $stmt->execute([':id' => $machineId]);
    $machine = $stmt->fetch();

    if (!$machine) {
        Response::error('Machine not found.', 404, 'NOT_FOUND');
    }

    $upd = $pdo->prepare('UPDATE machines SET status = :status WHERE id = :id');
    $upd->execute([':status' => $newStatus, ':id' => $machineId]);

    // Insert alert for factory floor if entering maintenance or offline
    if ($newStatus === 'MAINTENANCE' || $newStatus === 'OFFLINE') {
        $alertStmt = $pdo->prepare('INSERT INTO alerts (type, title, message, severity) VALUES (:type, :title, :msg, :sev)');
        $alertStmt->execute([
            ':type' => 'machine',
            ':title' => "Machine {$machine['machine_code']} entered {$newStatus}",
            ':msg' => "{$machine['machine_name']} is currently unavailable for processing. Dynamic schedule re-optimization required.",
            ':sev' => 'danger'
        ]);
    }

    Response::success("Machine {$machine['machine_code']} status updated to {$newStatus}.", [
        'id' => $machineId,
        'machine_code' => $machine['machine_code'],
        'status' => $newStatus,
        'requires_reoptimization' => in_array($newStatus, ['MAINTENANCE', 'OFFLINE'], true)
    ]);
} catch (Exception $e) {
    Response::error('Failed to change machine status: ' . $e->getMessage(), 500, 'SERVER_ERROR');
}
