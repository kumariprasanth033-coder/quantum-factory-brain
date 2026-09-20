<?php
/**
 * GET /api/auth/session.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../utils/response.php';

if (isset($_SESSION['user_id'])) {
    Response::success('Active session', [
        'authenticated' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'email' => $_SESSION['user_email'] ?? '',
            'name' => $_SESSION['user_name'] ?? '',
            'role' => $_SESSION['user_role'] ?? 'manager',
        ]
    ]);
} else {
    Response::success('No active session', [
        'authenticated' => false,
        'user' => null,
    ]);
}
