<?php
/**
 * GET /api/analytics/bottlenecks.php
 * Bottleneck detection based on queue length, utilization, and delay impact
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->query("SELECT m.id, m.machine_code, m.machine_name, m.status,
        COUNT(so.id) as queue_size,
        COALESCE(SUM(so.duration), 0) as total_load_hours,
        COALESCE(AVG(so.duration), 0) as avg_op_duration
        FROM machines m
        LEFT JOIN schedule_operations so ON m.id = so.machine_id
        GROUP BY m.id
        ORDER BY total_load_hours DESC");
    $candidates = $stmt->fetchAll();

    $totalFactoryLoad = 0.0;
    foreach ($candidates as $c) {
        $totalFactoryLoad += (float)$c['total_load_hours'];
    }
    $avgLoad = count($candidates) > 0 ? ($totalFactoryLoad / count($candidates)) : 1.0;

    $analysis = [];
    foreach ($candidates as $c) {
        $load = (float)$c['total_load_hours'];
        $ratio = $avgLoad > 0 ? ($load / $avgLoad) : 1.0;
        $severity = 'LOW';
        if ($ratio > 1.35) $severity = 'CRITICAL_BOTTLENECK';
        elseif ($ratio > 1.15) $severity = 'MODERATE_BOTTLENECK';

        $analysis[] = [
            'machine_id' => $c['id'],
            'machine_code' => $c['machine_code'],
            'machine_name' => $c['machine_name'],
            'status' => $c['status'],
            'queue_size' => (int)$c['queue_size'],
            'total_load_hours' => round($load, 1),
            'load_ratio_vs_avg' => round($ratio, 2),
            'severity' => $severity,
            'recommendation' => $severity !== 'LOW' 
                ? 'Consider offloading secondary operations to eligible alternative machines or scheduling preventive buffer.'
                : 'Workload within nominal capacity limits.'
        ];
    }

    Response::success('Bottleneck analysis computed', $analysis);
} catch (Exception $e) {
    Response::error('Bottleneck calculation error: ' . $e->getMessage(), 500, 'BOTTLENECK_ERROR');
}
