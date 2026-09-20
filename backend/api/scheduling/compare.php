<?php
/**
 * GET/POST /api/scheduling/compare.php
 * Evaluates Classical Baseline vs Quantum-Inspired Optimization on active dataset
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/scheduler.php';

try {
    $pdo = Database::getConnection();

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

    // Run Classical
    $classical = DFJSSPScheduler::schedule($jobs, $machines, 'classical');
    // Run Quantum-Inspired
    $quantum = DFJSSPScheduler::schedule($jobs, $machines, 'quantum_inspired');
    // Run Hybrid
    $hybrid = DFJSSPScheduler::schedule($jobs, $machines, 'hybrid');

    Response::success('Comparative benchmark complete', [
        'dataset_label' => 'Active Factory Floor State (' . count($jobs) . ' Jobs, ' . count($machines) . ' Machines)',
        'classical_baseline' => [
            'name' => 'Classical Baseline (SPT / EDD Priority)',
            'makespan' => $classical['makespan'],
            'utilization' => $classical['utilization'],
            'idle_time' => $classical['idle_time'],
            'delayed_jobs' => $classical['delayed_jobs'],
            'execution_time_ms' => $classical['execution_time_ms'],
        ],
        'quantum_inspired' => [
            'name' => 'Quantum-Inspired Optimization (QUBO Energy Minimization)',
            'makespan' => $quantum['makespan'],
            'utilization' => $quantum['utilization'],
            'idle_time' => $quantum['idle_time'],
            'delayed_jobs' => $quantum['delayed_jobs'],
            'execution_time_ms' => $quantum['execution_time_ms'],
        ],
        'hybrid' => [
            'name' => 'Hybrid Heuristic (Classical Seed + Annealing)',
            'makespan' => $hybrid['makespan'],
            'utilization' => $hybrid['utilization'],
            'idle_time' => $hybrid['idle_time'],
            'delayed_jobs' => $hybrid['delayed_jobs'],
            'execution_time_ms' => $hybrid['execution_time_ms'],
        ],
        'advantage' => [
            'makespan_reduction_hours' => round($classical['makespan'] - $quantum['makespan'], 2),
            'makespan_reduction_pct' => $classical['makespan'] > 0 ? round((($classical['makespan'] - $quantum['makespan']) / $classical['makespan']) * 100, 1) : 0,
            'utilization_gain_pct' => round($quantum['utilization'] - $classical['utilization'], 1),
            'idle_time_saved_hours' => round($classical['idle_time'] - $quantum['idle_time'], 2),
            'delay_reduction_jobs' => $classical['delayed_jobs'] - $quantum['delayed_jobs'],
        ],
        'disclaimer' => 'Quantum-Inspired mode simulates quantum annealing energy landscape optimization. No claims of actual quantum hardware execution are made.'
    ]);
} catch (Exception $e) {
    Response::error('Comparison benchmark error: ' . $e->getMessage(), 500, 'COMPARE_ERROR');
}
