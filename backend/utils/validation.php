<?php
/**
 * Data Validation Utilities
 */

declare(strict_types=1);

class Validation {
    public static function requireFields(array $data, array $required): ?string {
        foreach ($required as $field) {
            if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
                return "The field '{$field}' is required and cannot be empty.";
            }
        }
        return null;
    }

    public static function sanitizeString(string $input): string {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }

    public static function validatePriority(string $priority): bool {
        return in_array(strtoupper($priority), ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], true);
    }

    public static function validateStatus(string $status, array $allowed): bool {
        return in_array(strtoupper($status), $allowed, true);
    }
}
