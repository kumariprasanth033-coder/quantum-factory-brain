<?php
/**
 * POST /api/jobs/delete.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

$input = Response::getJsonInput();
$jobId = (int)($input['id'] ?? $_GET['id'] ?? 0);
if ($jobId <= 0) {
    Response::error('Valid Job ID is required.', 400, 'INVALID_JOB_ID');
}

try {
    $pdo = Database::getConnection();
    $stmt = $pdo->prepare('DELETE FROM jobs WHERE id = :id');
    $stmt->execute([':id' => $jobId]);

    Response::success('Job order deleted successfully.');
} catch (Exception $e) {
    Response::error('Failed to delete job: ' . $e->getMessage(), 500, 'JOB_DELETE_ERROR');
}
