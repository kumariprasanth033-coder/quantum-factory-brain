<?php
/**
 * Unified JSON Response Helpers
 */

declare(strict_types=1);

class Response {
    public static function json(bool $success, string $message, mixed $data = null, int $statusCode = 200, ?string $errorCode = null, mixed $details = null): void {
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        
        http_response_code($statusCode);

        $payload = [
            'success' => $success,
            'message' => $message,
            'data'    => $data,
        ];

        if (!$success) {
            if ($errorCode !== null) {
                $payload['error_code'] = $errorCode;
            }
            if ($details !== null) {
                $payload['details'] = $details;
            }
        }

        echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(string $message = 'Success', mixed $data = null): void {
        self::json(true, $message, $data, 200);
    }

    public static function error(string $message = 'Error', int $statusCode = 400, ?string $errorCode = null, mixed $details = null, mixed $data = null): void {
        self::json(false, $message, $data, $statusCode, $errorCode, $details);
    }

    public static function getJsonInput(): array {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return $_POST ?: [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
}
