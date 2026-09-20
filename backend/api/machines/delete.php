<?php
/**
 * POST /api/machines/delete.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

$input = Response::getJsonInput();
$id = (int)($input['id'] ?? $_GET['id'] ?? 0);

if ($id <= 0) {
    Response::error('Valid Machine ID is required.', 400, 'INVALID_ID');
}

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->prepare('DELETE FROM machines WHERE id = :id');
    $stmt->execute([':id' => $id]);

    Response::success('Machine deleted successfully.');
} catch (Exception $e) {
    Response::error('Failed to delete machine: ' . $e->getMessage(), 500, 'DELETE_ERROR');
}
