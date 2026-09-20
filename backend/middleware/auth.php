<?php
/**
 * Authentication Middleware
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../utils/response.php';

class AuthMiddleware {
    public static function check(): array {
        if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
            Response::error('Unauthorized. Please log in to access this resource.', 401, 'AUTH_REQUIRED');
        }

        return [
            'id'    => $_SESSION['user_id'],
            'email' => $_SESSION['user_email'] ?? '',
            'name'  => $_SESSION['user_name'] ?? '',
            'role'  => $_SESSION['user_role'] ?? 'manager',
        ];
    }
}
