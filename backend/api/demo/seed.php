<?php
/**
 * POST /api/demo/seed.php
 * Re-seeds the database with 6 flexible machines, 20 multi-operation jobs, machine eligibility options, and initial baseline schedule
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/response.php';
require_once __DIR__ . '/../../utils/scheduler.php';

try {
    $pdo = Database::getConnection();

    // 1. Clear existing schedule, operation_machines, job_operations, jobs, machines
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;
        TRUNCATE TABLE schedule_operations;
        TRUNCATE TABLE schedules;
        TRUNCATE TABLE optimization_runs;
        TRUNCATE TABLE operation_machines;
        TRUNCATE TABLE job_operations;
        TRUNCATE TABLE jobs;
        TRUNCATE TABLE machines;
        TRUNCATE TABLE alerts;
        SET FOREIGN_KEY_CHECKS = 1;");

    // 2. Insert 6 Machines
    $machines = [
        ['M01', 'CNC 5-Axis Milling Center Alpha', 'Milling', 'AVAILABLE', 1, 'Bay 1 - Heavy Machining', 'Nominal - Calibration valid'],
        ['M02', 'High-Precision Lathe Beta', 'Turning', 'AVAILABLE', 1, 'Bay 1 - Heavy Machining', 'Nominal - Tooling inspected'],
        ['M03', 'Multi-Axis Robotic Welder Gamma', 'Welding', 'AVAILABLE', 1, 'Bay 2 - Robotic Cell', 'Nominal - Gas pressure optimal'],
        ['M04', 'Direct Metal Laser Sinter 3D', 'Additive', 'AVAILABLE', 1, 'Bay 2 - Additive Cell', 'Nominal - Chamber ready'],
        ['M05', 'Electrostatic Coating & Cure', 'Finishing', 'AVAILABLE', 1, 'Bay 3 - Surface Finishing', 'Nominal - Filtration nominal'],
        ['M06', 'Automated CMM & Final QA Delta', 'Inspection', 'AVAILABLE', 1, 'Bay 4 - Quality Control', 'Nominal - Optical sensors ready'],
    ];

    $mStmt = $pdo->prepare("INSERT INTO machines (machine_code, machine_name, machine_type, status, capacity, location, maintenance_status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $machineIdMap = [];
    foreach ($machines as $m) {
        $mStmt->execute($m);
        $machineIdMap[$m[0]] = (int)$pdo->lastInsertId();
    }

    // 3. Insert 20 Realistic Manufacturing Jobs with Sequential Operations & Flexible Machine Eligibility
    $customers = ['AeroSpace Dynamics', 'Apex Quantum Robotics', 'BioMed Instruments', 'HyperDrive Motors', 'Titan Heavy Systems', 'OmniSensors Corp'];
    $products = [
        'Titanium Turbine Blisk', 'Hypersonic Injector Nozzle', 'Robotic Joint Actuator',
        'Cryogenic Heat Exchanger', 'Fiber-Optic Sensor Housing', 'Precision Gearbox Assembly',
        'Carbon-Matrix Valve Body', 'Hermetic Battery Casing', 'Solid-State Rotor Hub',
        'Avionics Navigation Enclosure', 'Micro-Fluidic Manifold', 'High-Torque Planetary Carrier',
        'Ultra-Lightweight Space Strut', 'Beryllium Optical Mount', 'High-Pressure Fuel Rail',
        'Superconducting Magnetic Core', 'Active Vibration Damper', 'Surgical Robotic Gripper',
        'Thermal Barrier Shroud', 'Quantum Processing Cryo-Chamber'
    ];

    $priorities = ['MEDIUM', 'HIGH', 'MEDIUM', 'LOW', 'URGENT', 'MEDIUM', 'HIGH', 'MEDIUM', 'LOW', 'MEDIUM', 'HIGH', 'MEDIUM', 'URGENT', 'LOW', 'HIGH', 'MEDIUM', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM'];

    $jStmt = $pdo->prepare("INSERT INTO jobs (job_number, customer_name, product_name, quantity, priority, due_date, status, estimated_processing_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $opStmt = $pdo->prepare("INSERT INTO job_operations (job_id, operation_number, operation_name, processing_time, sequence_number, priority) VALUES (?, ?, ?, ?, ?, ?)");
    $omStmt = $pdo->prepare("INSERT INTO operation_machines (operation_id, machine_id, processing_time, is_preferred) VALUES (?, ?, ?, ?)");

    $opNamesPool = [
        ['Rough Machining & Profiling', 'Precision Turning', 'Robotic Tack Welding', 'Surface Passivation', 'Coordinate Optical QA'],
        ['Laser Sintering Prep', '5-Axis Precision Contouring', 'Ultrasonic Deburring', 'Final Thermal Curing'],
        ['Micro-Drilling Array', 'Multi-Pass Seam Weld', 'Protective Powder Coat', 'Air-Leak & Pressure Test'],
        ['Rough Face Milling', 'Bore Honing & Lapping', 'Electrostatic Enameling', 'Dimensional QA Scan']
    ];

    for ($i = 1; $i <= 20; $i++) {
        $jNum = 'JOB-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT);
        $cust = $customers[($i - 1) % count($customers)];
        $prod = $products[$i - 1];
        $pri = $priorities[$i - 1];
        $dueDate = date('Y-m-d H:i:s', strtotime("+ " . (18 + ($i * 2)) . " hours"));
        $estHours = round(2.5 + ($i % 3) * 1.5, 1);

        $jStmt->execute([$jNum, $cust, $prod, mt_rand(5, 50), $pri, $dueDate, 'SCHEDULED', $estHours]);
        $jobId = (int)$pdo->lastInsertId();

        // Assign 3 to 4 sequential operations
        $chosenOps = $opNamesPool[($i - 1) % count($opNamesPool)];
        foreach ($chosenOps as $seqIdx => $opName) {
            $seq = $seqIdx + 1;
            $baseTime = round(0.8 + (($i + $seq) % 5) * 0.4, 2);
            $opStmt->execute([$jobId, 'OP-' . str_pad((string)$seq, 2, '0', STR_PAD_LEFT), $opName, $baseTime, $seq, $pri]);
            $opId = (int)$pdo->lastInsertId();

            // Flexible assignment: 2 eligible machines with slight duration variance
            // e.g., M01 vs M02, M03 vs M04, etc.
            $primaryMCode = ($seq % 2 === 1) ? 'M01' : 'M02';
            $secondaryMCode = ($seq % 2 === 1) ? 'M04' : 'M03';
            if ($seq >= 3) {
                $primaryMCode = 'M05';
                $secondaryMCode = 'M06';
            }

            $m1Id = $machineIdMap[$primaryMCode];
            $m2Id = $machineIdMap[$secondaryMCode];

            $omStmt->execute([$opId, $m1Id, $baseTime, 1]);
            $omStmt->execute([$opId, $m2Id, round($baseTime * 1.25, 2), 0]);
        }
    }

    // Insert Demo Alerts
    $alertStmt = $pdo->prepare("INSERT INTO alerts (type, title, message, severity, is_read) VALUES (?, ?, ?, ?, ?)");
    $alertStmt->execute(['system', 'Demo Factory Loaded', 'Initialized 6 flexible machines and 20 multi-operation production jobs.', 'info', 0]);
    $alertStmt->execute(['system', 'DFJSSP Constraints Ready', 'Operation precedence graphs and multi-machine eligibility matrix verified.', 'success', 0]);

    Response::success('Demo Factory data loaded successfully.', [
        'total_machines' => 6,
        'total_jobs' => 20,
        'mode' => 'DEMO_DATASET',
    ]);
} catch (Exception $e) {
    Response::error('Failed to seed demo factory data: ' . $e->getMessage(), 500, 'SEED_ERROR');
}
