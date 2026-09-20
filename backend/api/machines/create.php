<?php
/**
 * POST /api/machines/create.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validation.php';

$input = Response::getJsonInput();
$err = Validation::requireFields($input, ['machine_code', 'machine_name', 'machine_type']);
if ($err) {
    Response::error($err, 400, 'VALIDATION_FAILED');
}

try {
    $pdo = Database::getConnection();
    
    // Check unique code
    $check = $pdo->prepare('SELECT id FROM machines WHERE machine_code = :code LIMIT 1');
    $check->execute([':code' => strtoupper($input['machine_code'])]);
    if ($check->fetch()) {
        Response::error('A machine with code ' . $input['machine_code'] . ' already exists.', 409, 'DUPLICATE_CODE');
    }

    $stmt = $pdo->prepare('INSERT INTO machines (machine_code, machine_name, machine_type, status, capacity, location, maintenance_status) 
        VALUES (:code, :name, :type, :status, :capacity, :location, :maint)');
    
    $stmt->execute([
        ':code' => strtoupper(trim($input['machine_code'])),
        ':name' => trim($input['machine_name']),
        ':type' => trim($input['machine_type']),
        ':status' => strtoupper($input['status'] ?? 'AVAILABLE'),
        ':capacity' => max(1, (int)($input['capacity'] ?? 1)),
        ':location' => trim($input['location'] ?? 'Main Shop Floor'),
        ':maint' => trim($input['maintenance_status'] ?? 'Nominal operating condition')
    ]);

    $id = (int)$pdo->lastInsertId();

    Response::success('Machine registered successfully', ['id' => $id]);
} catch (Exception $e) {
    Response::error('Failed to create machine: ' . $e->getMessage(), 500, 'MACHINE_CREATE_ERROR');
}
