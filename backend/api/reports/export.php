<?php
/**
 * GET /api/reports/export.php
 * Generates and downloads CSV reports for schedules, utilization, delays, and comparisons
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';

$type = $_GET['type'] ?? 'schedule';

try {
    $pdo = Database::getConnection();

    if ($type === 'schedule') {
        $stmt = $pdo->query("SELECT so.id, s.version as schedule_version, j.job_number, j.customer_name, j.product_name,
            jo.operation_name, jo.sequence_number, m.machine_code, m.machine_name, so.start_time, so.end_time, so.duration, so.status
            FROM schedule_operations so
            JOIN schedules s ON so.schedule_id = s.id
            JOIN jobs j ON so.job_id = j.id
            JOIN job_operations jo ON so.operation_id = jo.id
            JOIN machines m ON so.machine_id = m.id
            ORDER BY so.schedule_id DESC, so.start_time ASC");
        $rows = $stmt->fetchAll();

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="Quantum_Factory_Schedule_Report_' . date('Ymd_His') . '.csv"');

        $out = fopen('php://output', 'w');
        fputcsv($out, ['Record ID', 'Schedule Version', 'Job Number', 'Customer', 'Product', 'Operation', 'Sequence', 'Machine Code', 'Machine Name', 'Start (Hr)', 'End (Hr)', 'Duration (Hr)', 'Status']);
        foreach ($rows as $r) {
            fputcsv($out, $r);
        }
        fclose($out);
        exit;
    } elseif ($type === 'utilization') {
        $stmt = $pdo->query("SELECT m.machine_code, m.machine_name, m.machine_type, m.status,
            COALESCE(SUM(so.duration), 0) as total_busy_hours,
            COUNT(so.id) as assigned_operations
            FROM machines m
            LEFT JOIN schedule_operations so ON m.id = so.machine_id
            GROUP BY m.id
            ORDER BY m.machine_code ASC");
        $rows = $stmt->fetchAll();

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="Quantum_Factory_Utilization_Report_' . date('Ymd_His') . '.csv"');

        $out = fopen('php://output', 'w');
        fputcsv($out, ['Machine Code', 'Machine Name', 'Type', 'Status', 'Total Busy Hours', 'Assigned Operations']);
        foreach ($rows as $r) {
            fputcsv($out, $r);
        }
        fclose($out);
        exit;
    } else {
        Response::error('Unknown report type requested.', 400);
    }
} catch (Exception $e) {
    Response::error('Report generation error: ' . $e->getMessage(), 500, 'REPORT_ERROR');
}
