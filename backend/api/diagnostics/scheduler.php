<?php
/**
 * GET /api/diagnostics/scheduler.php or POST /api/diagnostics/scheduler.php
 * Diagnostic API Endpoint that performs a dry-run of the scheduling algorithm
 * using minimal dataset and validates database/active store records.
 * Returns structured validation results for machines, jobs, operations, and algorithm dry-run.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/scheduler.php';

$requestId = Response::getRequestId();
$errors = [];
$warnings = [];

// Structure validation checks
$dbConnected = false;
$machinesValidation = [
    'status' => 'PENDING',
    'total_count' => 0,
    'available_count' => 0,
    'machines' => [],
    'issues' => [],
];

$jobsValidation = [
    'status' => 'PENDING',
    'total_count' => 0,
    'schedulable_count' => 0,
    'jobs' => [],
    'issues' => [],
];

$operationsValidation = [
    'status' => 'PENDING',
    'total_count' => 0,
    'with_eligible_machines' => 0,
    'issues' => [],
];

$dryRunResult = [
    'status' => 'PENDING',
    'algorithm' => 'quantum_inspired',
    'dry_run_success' => false,
    'execution_time_ms' => 0,
    'makespan' => 0.0,
    'utilization' => 0.0,
    'operations_scheduled' => 0,
    'details' => null,
];

try {
    // 1. Database Connectivity Validation
    $pdo = null;
    try {
        $pdo = Database::getConnection();
        $dbConnected = true;
    } catch (Throwable $dbErr) {
        $warnings[] = 'Remote database connection not available: ' . $dbErr->getMessage() . '. Running dry-run with isolated validation dataset.';
    }

    $machines = [];
    $jobs = [];

    if ($dbConnected && $pdo) {
        // Fetch Machines
        $mStmt = $pdo->query('SELECT id, machine_code, machine_name, machine_type, status, capacity FROM machines ORDER BY id ASC');
        $machines = $mStmt->fetchAll();

        // Fetch Jobs
        $jStmt = $pdo->query("SELECT id, job_number, product_name, priority, status, due_date FROM jobs WHERE status NOT IN ('COMPLETED', 'CANCELLED') ORDER BY id ASC");
        $rawJobs = $jStmt->fetchAll();

        foreach ($rawJobs as $j) {
            // Fetch operations with eligibility
            $opStmt = $pdo->prepare('
                SELECT o.id, o.operation_name, o.sequence_number, o.processing_time
                FROM job_operations o
                WHERE o.job_id = :jid
                ORDER BY o.sequence_number ASC
            ');
            $opStmt->execute([':jid' => $j['id']]);
            $ops = $opStmt->fetchAll();

            $formattedOps = [];
            foreach ($ops as $op) {
                $elStmt = $pdo->prepare('
                    SELECT machine_id, processing_time, is_preferred
                    FROM operation_machine_eligibility
                    WHERE operation_id = :opid
                ');
                $elStmt->execute([':opid' => $op['id']]);
                $elMachines = $elStmt->fetchAll();

                $formattedOps[] = [
                    'id' => (int)$op['id'],
                    'operation_name' => $op['operation_name'],
                    'sequence_number' => (int)$op['sequence_number'],
                    'processing_time' => (float)$op['processing_time'],
                    'eligible_machines' => $elMachines,
                ];
            }

            $j['operations'] = $formattedOps;
            $jobs[] = $j;
        }
    }

    // Fallback minimal validation dataset if DB has 0 records
    $usedFallbackDataset = false;
    if (empty($machines) || empty($jobs)) {
        $usedFallbackDataset = true;
        $machines = [
            ['id' => 101, 'machine_code' => 'M01', 'machine_name' => 'CNC Milling 5-Axis', 'status' => 'AVAILABLE', 'capacity' => 1],
            ['id' => 102, 'machine_code' => 'M02', 'machine_name' => 'Wire EDM Precision', 'status' => 'AVAILABLE', 'capacity' => 1],
            ['id' => 103, 'machine_code' => 'M03', 'machine_name' => 'Surface Grinder Ultra', 'status' => 'AVAILABLE', 'capacity' => 1],
        ];

        $jobs = [
            [
                'id' => 201,
                'job_number' => 'DIAG-J1',
                'product_name' => 'Turbine Blade Housing',
                'priority' => 'HIGH',
                'status' => 'WAITING',
                'operations' => [
                    [
                        'id' => 301,
                        'operation_name' => 'Rough Milling',
                        'sequence_number' => 1,
                        'processing_time' => 3.0,
                        'eligible_machines' => [
                            ['machine_id' => 101, 'processing_time' => 3.0],
                            ['machine_id' => 102, 'processing_time' => 4.0],
                        ],
                    ],
                    [
                        'id' => 302,
                        'operation_name' => 'Finish Lapping',
                        'sequence_number' => 2,
                        'processing_time' => 2.0,
                        'eligible_machines' => [
                            ['machine_id' => 102, 'processing_time' => 2.0],
                            ['machine_id' => 103, 'processing_time' => 2.5],
                        ],
                    ],
                ],
            ],
            [
                'id' => 202,
                'job_number' => 'DIAG-J2',
                'product_name' => 'Impeller Shaft',
                'priority' => 'URGENT',
                'status' => 'WAITING',
                'operations' => [
                    [
                        'id' => 303,
                        'operation_name' => 'Shaft Milling',
                        'sequence_number' => 1,
                        'processing_time' => 2.5,
                        'eligible_machines' => [
                            ['machine_id' => 101, 'processing_time' => 2.5],
                            ['machine_id' => 103, 'processing_time' => 3.0],
                        ],
                    ],
                ],
            ],
        ];
    }

    // 2. Validate Machines
    $machinesValidation['total_count'] = count($machines);
    $availableCount = 0;
    $machineIdSet = [];
    foreach ($machines as $m) {
        $mId = (int)$m['id'];
        $machineIdSet[$mId] = true;
        $isAvail = ($m['status'] === 'AVAILABLE' || $m['status'] === 'IDLE' || $m['status'] === 'RUNNING');
        if ($isAvail) $availableCount++;
        $machinesValidation['machines'][] = [
            'id' => $mId,
            'machine_code' => $m['machine_code'] ?? 'M-UNKNOWN',
            'status' => $m['status'] ?? 'UNKNOWN',
            'is_schedulable' => $isAvail,
        ];
    }
    $machinesValidation['available_count'] = $availableCount;
    if ($availableCount === 0) {
        $machinesValidation['status'] = 'FAIL';
        $machinesValidation['issues'][] = 'No available machines found for assignment.';
        $errors[] = 'Zero available machines found.';
    } else {
        $machinesValidation['status'] = 'PASS';
    }

    // 3. Validate Jobs & Operations
    $jobsValidation['total_count'] = count($jobs);
    $totalOps = 0;
    $opsWithEligible = 0;

    foreach ($jobs as $j) {
        $jOps = $j['operations'] ?? [];
        $jobIssues = [];

        if (empty($jOps)) {
            $jobIssues[] = 'Job has no configured operations.';
            $errors[] = 'Job ' . ($j['job_number'] ?? $j['id']) . ' contains no operations.';
        } else {
            foreach ($jOps as $op) {
                $totalOps++;
                $pTime = (float)($op['processing_time'] ?? 0);
                $el = $op['eligible_machines'] ?? [];

                if ($pTime <= 0) {
                    $jobIssues[] = 'Operation ' . ($op['operation_name'] ?? $op['id']) . ' has non-positive processing time: ' . $pTime;
                    $operationsValidation['issues'][] = 'Operation ' . ($op['operation_name'] ?? $op['id']) . ' processing time must be > 0.';
                }

                // Check eligible machines against existing machines
                $validEligible = 0;
                foreach ($el as $candidate) {
                    $cId = (int)($candidate['machine_id'] ?? 0);
                    if (isset($machineIdSet[$cId])) {
                        $validEligible++;
                    }
                }

                if ($validEligible > 0) {
                    $opsWithEligible++;
                } else {
                    $jobIssues[] = 'Operation ' . ($op['operation_name'] ?? $op['id']) . ' has no valid eligible machines registered in machine registry.';
                    $operationsValidation['issues'][] = 'Operation ' . ($op['operation_name'] ?? $op['id']) . ' has 0 matching eligible machines.';
                }
            }
        }

        $isSchedulable = empty($jobIssues);
        if ($isSchedulable) {
            $jobsValidation['schedulable_count']++;
        }

        $jobsValidation['jobs'][] = [
            'id' => $j['id'],
            'job_number' => $j['job_number'] ?? 'JOB-UNKNOWN',
            'priority' => $j['priority'] ?? 'MEDIUM',
            'operations_count' => count($jOps),
            'is_schedulable' => $isSchedulable,
            'issues' => $jobIssues,
        ];
    }

    $jobsValidation['status'] = ($jobsValidation['schedulable_count'] > 0) ? 'PASS' : 'FAIL';
    $operationsValidation['total_count'] = $totalOps;
    $operationsValidation['with_eligible_machines'] = $opsWithEligible;
    $operationsValidation['status'] = ($totalOps > 0 && $opsWithEligible === $totalOps) ? 'PASS' : (empty($operationsValidation['issues']) ? 'PASS' : 'FAIL');

    // 4. Perform Minimal Dry-Run of DFJSSP Scheduling Algorithm
    $t0 = microtime(true);
    $dryRunOutput = DFJSSPScheduler::schedule($jobs, $machines, 'quantum_inspired', [
        'makespan' => 0.4,
        'delay' => 0.3,
        'idle' => 0.2,
        'bottleneck' => 0.1,
    ]);
    $t1 = microtime(true);

    $dryRunResult['dry_run_success'] = true;
    $dryRunResult['status'] = 'PASS';
    $dryRunResult['execution_time_ms'] = (int)round(($t1 - $t0) * 1000);
    $dryRunResult['makespan'] = (float)$dryRunOutput['makespan'];
    $dryRunResult['utilization'] = (float)$dryRunOutput['utilization'];
    $dryRunResult['operations_scheduled'] = count($dryRunOutput['schedule_operations'] ?? []);
    $dryRunResult['details'] = [
        'solver_name' => $dryRunOutput['solver_name'] ?? 'DFJSSP Quantum-Inspired Solver',
        'idle_time' => $dryRunOutput['idle_time'] ?? 0.0,
        'delayed_jobs' => $dryRunOutput['delayed_jobs'] ?? 0,
        'used_fallback_dataset' => $usedFallbackDataset,
    ];

    $overallStatus = (empty($errors) && $dryRunResult['dry_run_success']) ? 'HEALTHY' : 'DEGRADED';

    Response::json(
        true,
        'Diagnostic scheduler dry-run completed successfully.',
        [
            'status' => $overallStatus,
            'request_id' => $requestId,
            'timestamp' => date('c'),
            'database_connected' => $dbConnected,
            'machines_validation' => $machinesValidation,
            'jobs_validation' => $jobsValidation,
            'operations_validation' => $operationsValidation,
            'dry_run_result' => $dryRunResult,
            'errors' => $errors,
            'warnings' => $warnings,
            'recommendation' => empty($errors)
                ? 'Scheduler algorithm and data structures are nominal. Schedule generation is operational.'
                : 'Identified configuration gaps that impede schedule generation. Inspect errors array.'
        ],
        200
    );

} catch (Throwable $e) {
    Response::json(
        false,
        'Diagnostic scheduler dry-run failed: ' . $e->getMessage(),
        [
            'status' => 'FAIL',
            'request_id' => $requestId,
            'timestamp' => date('c'),
            'database_connected' => $dbConnected,
            'machines_validation' => $machinesValidation,
            'jobs_validation' => $jobsValidation,
            'operations_validation' => $operationsValidation,
            'dry_run_result' => [
                'status' => 'FAIL',
                'dry_run_success' => false,
                'error_message' => $e->getMessage(),
                'trace' => $e->getFile() . ':' . $e->getLine(),
            ],
            'errors' => array_merge($errors, [$e->getMessage()]),
            'warnings' => $warnings,
        ],
        200,
        'DIAGNOSTIC_SCHEDULER_DRY_RUN_FAILED',
        ['trace' => $e->getFile() . ':' . $e->getLine()]
    );
}
