<?php
/**
 * POST /api/schedules/test.php or /api/scheduling/test.php
 * Deterministic Test Scheduler Endpoint (Step 10 Requirement)
 * Runs a deterministic 3-machine, 3-job DFJSSP optimization test
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/scheduler.php';

try {
    // Deterministic 3 machines
    $testMachines = [
        ['id' => 101, 'machine_code' => 'M01', 'machine_name' => 'CNC Milling 5-Axis', 'status' => 'AVAILABLE'],
        ['id' => 102, 'machine_code' => 'M02', 'machine_name' => 'Wire EDM Precision', 'status' => 'AVAILABLE'],
        ['id' => 103, 'machine_code' => 'M03', 'machine_name' => 'Surface Grinder Ultra', 'status' => 'AVAILABLE'],
    ];

    // Deterministic 3 jobs with multi-operation routing and eligibility
    $testJobs = [
        [
            'id' => 201,
            'job_number' => 'TEST-J1',
            'product_name' => 'Titanium Turbine Blade',
            'priority' => 'HIGH',
            'due_date' => date('Y-m-d H:i:s', time() + 86400 * 3),
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
                    'operation_name' => 'Precision EDM Finish',
                    'sequence_number' => 2,
                    'processing_time' => 2.5,
                    'eligible_machines' => [
                        ['machine_id' => 102, 'processing_time' => 2.5],
                        ['machine_id' => 103, 'processing_time' => 3.0],
                    ],
                ],
            ],
        ],
        [
            'id' => 202,
            'job_number' => 'TEST-J2',
            'product_name' => 'Cryogenic Impeller Hub',
            'priority' => 'URGENT',
            'due_date' => date('Y-m-d H:i:s', time() + 86400 * 2),
            'operations' => [
                [
                    'id' => 303,
                    'operation_name' => 'Hub Milling',
                    'sequence_number' => 1,
                    'processing_time' => 2.0,
                    'eligible_machines' => [
                        ['machine_id' => 101, 'processing_time' => 2.0],
                        ['machine_id' => 103, 'processing_time' => 2.8],
                    ],
                ],
                [
                    'id' => 304,
                    'operation_name' => 'Blade Contouring',
                    'sequence_number' => 2,
                    'processing_time' => 2.0,
                    'eligible_machines' => [
                        ['machine_id' => 102, 'processing_time' => 2.0],
                    ],
                ],
            ],
        ],
        [
            'id' => 203,
            'job_number' => 'TEST-J3',
            'product_name' => 'Combustion Injector Ring',
            'priority' => 'MEDIUM',
            'due_date' => date('Y-m-d H:i:s', time() + 86400 * 4),
            'operations' => [
                [
                    'id' => 305,
                    'operation_name' => 'Ring Roughing',
                    'sequence_number' => 1,
                    'processing_time' => 2.5,
                    'eligible_machines' => [
                        ['machine_id' => 101, 'processing_time' => 2.5],
                        ['machine_id' => 102, 'processing_time' => 3.2],
                    ],
                ],
                [
                    'id' => 306,
                    'operation_name' => 'Optical Lapping',
                    'sequence_number' => 2,
                    'processing_time' => 1.8,
                    'eligible_machines' => [
                        ['machine_id' => 103, 'processing_time' => 1.8],
                    ],
                ],
            ],
        ],
    ];

    // Execute DFJSSP scheduling algorithm directly
    $result = DFJSSPScheduler::schedule($testJobs, $testMachines, 'quantum_inspired', [
        'makespan' => 0.4,
        'delay' => 0.3,
        'idle' => 0.2,
        'bottleneck' => 0.1,
    ]);

    Response::success('Deterministic scheduler test passed successfully', [
        'test_type' => 'deterministic_dfjssp_test',
        'jobs_count' => count($testJobs),
        'machines_count' => count($testMachines),
        'total_operations' => 6,
        'makespan' => $result['makespan'],
        'utilization' => $result['utilization'],
        'idle_time' => $result['idle_time'],
        'delayed_jobs' => $result['delayed_jobs'],
        'execution_time_ms' => $result['execution_time_ms'],
        'solver_name' => $result['solver_name'],
        'schedule_operations_count' => count($result['schedule_operations']),
        'schedule_operations' => $result['schedule_operations'],
    ]);
} catch (Throwable $e) {
    Response::error(
        'Deterministic scheduler test failed: ' . $e->getMessage(),
        500,
        'SCHEDULER_TEST_FAILED',
        ['trace' => $e->getFile() . ':' . $e->getLine()]
    );
}
