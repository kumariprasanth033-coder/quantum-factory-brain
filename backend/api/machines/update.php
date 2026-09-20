<?php
/**
 * POST /api/machines/update.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/validation.php';

$input = Response::getJsonInput();
if (empty($input['id'])) {
    Response::error('Machine ID is required', 400, 'MISSING_ID');
}

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->prepare('UPDATE machines SET 
        machine_name = :name,
        machine_type = :type,
        status = :status,
        capacity = :capacity,
        location = :location,
        maintenance_status = :maint
        WHERE id = :id');
    
    $stmt->execute([
        ':id' => (int)$input['id'],
        ':name' => trim($input['machine_name']),
        ':type' => trim($input['machine_type']),
        ':status' => strtoupper($input['status'] ?? 'AVAILABLE'),
        ':capacity' => max(1, (int)($input['capacity'] ?? 1)),
        ':location' => trim($input['location'] ?? 'Main Shop Floor'),
        ':maint' => trim($input['maintenance_status'] ?? 'Nominal operating condition')
    ]);

    Response::success('Machine updated successfully');
} catch (Exception $e) {
    Response::error('Failed to update machine: ' . $e->getMessage(), 500, 'MACHINE_UPDATE_ERROR');
}
