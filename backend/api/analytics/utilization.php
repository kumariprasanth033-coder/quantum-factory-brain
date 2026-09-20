<?php
/**
 * GET /api/analytics/utilization.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

try {
    $pdo = Database::getConnection();

    // Get machines with scheduled times
    $stmt = $pdo->query("SELECT m.id, m.machine_code, m.machine_name, m.status,
        COALESCE(SUM(so.duration), 0) as busy_hours,
        COUNT(so.id) as operation_count
        FROM machines m
        LEFT JOIN schedule_operations so ON m.id = so.machine_id
        GROUP BY m.id
        ORDER BY m.machine_code ASC");
    $machines = $stmt->fetchAll();

    // Find max busy hours or assume standard 48h scheduling horizon
    $maxMakespan = 40.0;
    foreach ($machines as $m) {
        if ($m['busy_hours'] > $maxMakespan) {
            $maxMakespan = (float)$m['busy_hours'];
        }
    }

    $utilizationData = [];
    foreach ($machines as $m) {
        $busy = round((float)$m['busy_hours'], 1);
        $avail = round($maxMakespan, 1);
        $idle = max(0.0, round($avail - $busy, 1));
        $pct = $avail > 0 ? round(($busy / $avail) * 100, 1) : 0.0;

        $utilizationData[] = [
            'machine_id' => $m['id'],
            'machine_code' => $m['machine_code'],
            'machine_name' => $m['machine_name'],
            'status' => $m['status'],
            'available_hours' => $avail,
            'busy_hours' => $busy,
            'idle_hours' => $idle,
            'utilization_pct' => min(100.0, $pct),
            'operation_count' => (int)$m['operation_count'],
            'is_bottleneck' => $pct >= 88.0,
        ];
    }

    Response::success('Utilization analytics retrieved', [
        'horizon_hours' => $maxMakespan,
        'machines' => $utilizationData,
    ]);
} catch (Exception $e) {
    Response::error('Failed to compute utilization: ' . $e->getMessage(), 500, 'ANALYTICS_ERROR');
}
