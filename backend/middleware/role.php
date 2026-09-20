<?php
/**
 * Role-Based Access Control Middleware
 */

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

class RoleMiddleware {
    public static function requireRole(array $allowedRoles): array {
        $user = AuthMiddleware::check();
        if (!in_array($user['role'], $allowedRoles, true)) {
            Response::error('Forbidden. Your role does not permit this action.', 403, 'INSUFFICIENT_PERMISSIONS');
        }
        return $user;
    }

    public static function requireAdmin(): array {
        return self::requireRole(['admin']);
    }

    public static function requireManager(): array {
        return self::requireRole(['admin', 'manager']);
    }
}
