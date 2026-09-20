<?php
/**
 * POST /api/scheduling/reoptimize.php
 * Triggers dynamic re-optimization with before vs after comparison
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/scheduler.php';

$input = Response::getJsonInput();
$mode = strtolower(trim($input['mode'] ?? 'quantum_inspired'));
$eventReason = trim($input['reason'] ?? 'Dynamic Factory Event Re-Optimization');

try {
    $pdo = Database::getConnection();

    // 1. Fetch previous schedule for before-after delta
    $prevStmt = $pdo->query('SELECT * FROM schedules ORDER BY id DESC LIMIT 1');
    $previousSchedule = $prevStmt->fetch();

    $beforeMetrics = [
        'makespan'     => $previousSchedule ? (float)$previousSchedule['makespan'] : 45.0,
        'utilization'  => $previousSchedule ? (float)$previousSchedule['utilization'] : 76.5,
        'idle_time'    => $previousSchedule ? (float)$previousSchedule['idle_time'] : 12.0,
        'delayed_jobs' => $previousSchedule ? (int)$previousSchedule['delayed_jobs'] : 5,
    ];

    // 2. Fetch machines and jobs
    $mStmt = $pdo->query('SELECT * FROM machines ORDER BY id ASC');
    $machines = $mStmt->fetchAll();

    $jStmt = $pdo->query("SELECT * FROM jobs WHERE status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY id ASC");
    $jobs = $jStmt->fetchAll();

    foreach ($jobs as &$job) {
        $opStmt = $pdo->prepare('SELECT * FROM job_operations WHERE job_id = :jid ORDER BY sequence_number ASC');
        $opStmt->execute([':jid' => $job['id']]);
        $ops = $opStmt->fetchAll();

        foreach ($ops as &$op) {
            $emStmt = $pdo->prepare('SELECT machine_id, processing_time FROM operation_machines WHERE operation_id = :opid');
            $emStmt->execute([':opid' => $op['id']]);
            $op['eligible_machines'] = $emStmt->fetchAll();
        }
        $job['operations'] = $ops;
    }

    // 3. Re-run scheduling
    $scheduleResult = DFJSSPScheduler::schedule($jobs, $machines, $mode);

    // 4. Save new schedule
    $versionNum = 'REOPT-' . date('Ymd-His');
    $insSched = $pdo->prepare('INSERT INTO schedules (version, mode, makespan, utilization, idle_time, delayed_jobs) 
        VALUES (:ver, :mode, :ms, :ut, :id, :dj)');
    $insSched->execute([
        ':ver'  => $versionNum,
        ':mode' => $mode,
        ':ms'   => $scheduleResult['makespan'],
        ':ut'   => $scheduleResult['utilization'],
        ':id'   => $scheduleResult['idle_time'],
        ':dj'   => $scheduleResult['delayed_jobs'],
    ]);
    $newScheduleId = (int)$pdo->lastInsertId();

    // 5. Save schedule operations
    $insOp = $pdo->prepare('INSERT INTO schedule_operations (schedule_id, job_id, operation_id, machine_id, start_time, end_time, duration, status, delay) 
        VALUES (:sid, :jid, :oid, :mid, :st, :et, :dur, :stt, :dl)');

    foreach ($scheduleResult['schedule_operations'] as $sop) {
        $insOp->execute([
            ':sid' => $newScheduleId,
            ':jid' => $sop['job_id'],
            ':oid' => $sop['operation_id'],
            ':mid' => $sop['machine_id'],
            ':st'  => $sop['start_time'],
            ':et'  => $sop['end_time'],
            ':dur' => $sop['duration'],
            ':stt' => $sop['status'],
            ':dl'  => $sop['delay'],
        ]);
    }

    // 6. Record alert
    $alert = $pdo->prepare('INSERT INTO alerts (type, title, message, severity) VALUES (:type, :title, :msg, :sev)');
    $alert->execute([
        ':type' => 'reoptimization',
        ':title' => 'Dynamic Re-Optimization Complete',
        ':msg' => "Reason: {$eventReason}. New makespan: {$scheduleResult['makespan']}h (Prev: {$beforeMetrics['makespan']}h).",
        ':sev' => 'success'
    ]);

    Response::success('Dynamic re-optimization complete.', [
        'schedule_id' => $newScheduleId,
        'version' => $versionNum,
        'mode' => $mode,
        'event_reason' => $eventReason,
        'before' => $beforeMetrics,
        'after' => [
            'makespan' => $scheduleResult['makespan'],
            'utilization' => $scheduleResult['utilization'],
            'idle_time' => $scheduleResult['idle_time'],
            'delayed_jobs' => $scheduleResult['delayed_jobs'],
        ],
        'delta' => [
            'makespan_diff' => round($scheduleResult['makespan'] - $beforeMetrics['makespan'], 2),
            'utilization_diff' => round($scheduleResult['utilization'] - $beforeMetrics['utilization'], 2),
            'idle_time_diff' => round($scheduleResult['idle_time'] - $beforeMetrics['idle_time'], 2),
            'delayed_jobs_diff' => $scheduleResult['delayed_jobs'] - $beforeMetrics['delayed_jobs'],
        ],
        'schedule_operations' => $scheduleResult['schedule_operations'],
    ]);
} catch (Exception $e) {
    Response::error('Dynamic re-optimization failed: ' . $e->getMessage(), 500, 'REOPT_FAILED');
}
