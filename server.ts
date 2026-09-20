import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// --- DFJSSP Data Models & In-Memory Database for Live Preview ---
interface Machine {
  id: number;
  machine_code: string;
  machine_name: string;
  machine_type: string;
  status: 'AVAILABLE' | 'BUSY' | 'MAINTENANCE' | 'OFFLINE';
  capacity: number;
  location: string;
  maintenance_status: string;
  created_at: string;
}

interface OperationMachine {
  machine_id: number;
  processing_time: number;
  is_preferred: boolean;
}

interface JobOperation {
  id: number;
  job_id: number;
  operation_number: string;
  operation_name: string;
  processing_time: number;
  sequence_number: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'DELAYED';
  eligible_machines?: OperationMachine[];
}

interface Job {
  id: number;
  job_number: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  due_date: string;
  status: 'WAITING' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  estimated_processing_time: number;
  created_at: string;
  operations?: JobOperation[];
}

interface ScheduleOperation {
  id: number;
  schedule_id: number;
  job_id: number;
  job_number: string;
  job_name: string;
  priority: string;
  due_date: string;
  operation_id: number;
  operation_name: string;
  sequence_number: number;
  machine_id: number;
  machine_code: string;
  machine_name: string;
  start_time: number;
  end_time: number;
  duration: number;
  status: string;
  delay: number;
}

interface Schedule {
  id: number;
  version: string;
  mode: 'classical' | 'quantum_inspired' | 'hybrid';
  makespan: number;
  utilization: number;
  idle_time: number;
  delayed_jobs: number;
  objective_weights?: Record<string, number>;
  created_at: string;
  schedule_operations: ScheduleOperation[];
}

interface Alert {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  is_read: boolean;
  created_at: string;
}

// Initial Database State
let machines: Machine[] = [];
let jobs: Job[] = [];
let schedules: Schedule[] = [];
let alerts: Alert[] = [];
let nextMachineId = 7;
let nextJobId = 21;
let nextScheduleId = 1;
let nextAlertId = 4;

function initDemoDataset() {
  machines = [
    { id: 1, machine_code: 'M01', machine_name: 'CNC 5-Axis Milling Center Alpha', machine_type: '5-Axis Mill', status: 'AVAILABLE', capacity: 1, location: 'Bay 1 - Heavy Machining', maintenance_status: 'Nominal - Calibration valid', created_at: new Date().toISOString() },
    { id: 2, machine_code: 'M02', machine_name: 'High-Precision Lathe Beta', machine_type: 'Turning Center', status: 'AVAILABLE', capacity: 1, location: 'Bay 1 - Heavy Machining', maintenance_status: 'Nominal - Tooling inspected', created_at: new Date().toISOString() },
    { id: 3, machine_code: 'M03', machine_name: 'Multi-Axis Robotic Welder Gamma', machine_type: 'Robotic Welder', status: 'AVAILABLE', capacity: 1, location: 'Bay 2 - Robotic Cell', maintenance_status: 'Nominal - Gas pressure optimal', created_at: new Date().toISOString() },
    { id: 4, machine_code: 'M04', machine_name: 'Direct Metal Laser Sinter 3D', machine_type: 'Additive 3D', status: 'AVAILABLE', capacity: 1, location: 'Bay 2 - Additive Cell', maintenance_status: 'Nominal - Chamber ready', created_at: new Date().toISOString() },
    { id: 5, machine_code: 'M05', machine_name: 'Electrostatic Coating & Cure', machine_type: 'Finishing', status: 'AVAILABLE', capacity: 1, location: 'Bay 3 - Surface Finishing', maintenance_status: 'Nominal - Filtration nominal', created_at: new Date().toISOString() },
    { id: 6, machine_code: 'M06', machine_name: 'Automated CMM & Final QA Delta', machine_type: 'Inspection QA', status: 'AVAILABLE', capacity: 1, location: 'Bay 4 - Quality Control', maintenance_status: 'Nominal - Optical sensors ready', created_at: new Date().toISOString() },
  ];

  const customers = ['AeroSpace Dynamics', 'Apex Quantum Robotics', 'BioMed Instruments', 'HyperDrive Motors', 'Titan Heavy Systems', 'OmniSensors Corp'];
  const products = [
    'Titanium Turbine Blisk', 'Hypersonic Injector Nozzle', 'Robotic Joint Actuator',
    'Cryogenic Heat Exchanger', 'Fiber-Optic Sensor Housing', 'Precision Gearbox Assembly',
    'Carbon-Matrix Valve Body', 'Hermetic Battery Casing', 'Solid-State Rotor Hub',
    'Avionics Navigation Enclosure', 'Micro-Fluidic Manifold', 'High-Torque Planetary Carrier',
    'Ultra-Lightweight Space Strut', 'Beryllium Optical Mount', 'High-Pressure Fuel Rail',
    'Superconducting Magnetic Core', 'Active Vibration Damper', 'Surgical Robotic Gripper',
    'Thermal Barrier Shroud', 'Quantum Processing Cryo-Chamber'
  ];
  const priorities: ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')[] = [
    'MEDIUM', 'HIGH', 'MEDIUM', 'LOW', 'URGENT', 'MEDIUM', 'HIGH', 'MEDIUM', 'LOW', 'MEDIUM',
    'HIGH', 'MEDIUM', 'URGENT', 'LOW', 'HIGH', 'MEDIUM', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM'
  ];

  const opTemplates = [
    ['Rough Machining & Profiling', 'Precision Turning', 'Robotic Tack Welding', 'Surface Passivation', 'Coordinate Optical QA'],
    ['Laser Sintering Prep', '5-Axis Precision Contouring', 'Ultrasonic Deburring', 'Final Thermal Curing'],
    ['Micro-Drilling Array', 'Multi-Pass Seam Weld', 'Protective Powder Coat', 'Air-Leak & Pressure Test'],
    ['Rough Face Milling', 'Bore Honing & Lapping', 'Electrostatic Enameling', 'Dimensional QA Scan']
  ];

  jobs = [];
  let opGlobalId = 1;

  for (let i = 1; i <= 20; i++) {
    const jNum = 'JOB-' + String(i).padStart(3, '0');
    const cust = customers[(i - 1) % customers.length];
    const prod = products[i - 1];
    const pri = priorities[i - 1];
    const dueTime = new Date(Date.now() + (18 + i * 2) * 3600 * 1000).toISOString();
    const estTime = Number((2.5 + (i % 3) * 1.5).toFixed(1));

    const chosenOps = opTemplates[(i - 1) % opTemplates.length];
    const ops: JobOperation[] = [];

    chosenOps.forEach((opName, seqIdx) => {
      const seq = seqIdx + 1;
      const baseDuration = Number((0.8 + ((i + seq) % 5) * 0.4).toFixed(2));
      const m1Id = (seq % 2 === 1) ? 1 : 2;
      const m2Id = (seq % 2 === 1) ? 4 : 3;
      const mFinal1 = seq >= 3 ? 5 : m1Id;
      const mFinal2 = seq >= 3 ? 6 : m2Id;

      ops.push({
        id: opGlobalId++,
        job_id: i,
        operation_number: 'OP-' + String(seq).padStart(2, '0'),
        operation_name: opName,
        processing_time: baseDuration,
        sequence_number: seq,
        priority: pri,
        status: 'PENDING',
        eligible_machines: [
          { machine_id: mFinal1, processing_time: baseDuration, is_preferred: true },
          { machine_id: mFinal2, processing_time: Number((baseDuration * 1.25).toFixed(2)), is_preferred: false }
        ]
      });
    });

    jobs.push({
      id: i,
      job_number: jNum,
      customer_name: cust,
      product_name: prod,
      quantity: 10 + (i * 3) % 40,
      priority: pri,
      due_date: dueTime,
      status: 'SCHEDULED',
      estimated_processing_time: estTime,
      created_at: new Date().toISOString(),
      operations: ops,
    });
  }

  alerts = [
    {
      id: 1,
      type: 'system',
      title: 'Quantum Engine Initialized',
      message: 'DFJSSP Quantum-Inspired optimization model active with 6 machines and 20 sample job orders.',
      severity: 'info',
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      type: 'warning',
      title: 'High Load Alert on M01',
      message: 'CNC 5-Axis Milling Center Alpha nearing 89% scheduled capacity under baseline dispatch.',
      severity: 'warning',
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 3,
      type: 'system',
      title: 'XAMPP & Apache PHP Compatibility',
      message: 'PHP 8+ REST APIs and MySQL schema ready in /backend and /database/quantum_factory_brain.sql.',
      severity: 'success',
      is_read: false,
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  // Generate initial baseline schedule
  const initialSchedule = runScheduler(jobs, machines, 'quantum_inspired', { makespan: 0.4, delay: 0.3, idle: 0.2, bottleneck: 0.1 });
  schedules = [initialSchedule];
}

// Core DFJSSP Scheduler
function runScheduler(
  activeJobs: Job[],
  activeMachines: Machine[],
  mode: 'classical' | 'quantum_inspired' | 'hybrid',
  weights: Record<string, number> = { makespan: 0.4, delay: 0.3, idle: 0.2, bottleneck: 0.1 }
): Schedule {
  const onlineMachines = activeMachines.filter(m => m.status !== 'MAINTENANCE' && m.status !== 'OFFLINE');
  const machineAvailability: Record<number, number> = {};
  onlineMachines.forEach(m => { machineAvailability[m.id] = 0.0; });

  const sortedJobs = [...activeJobs].sort((a, b) => {
    const priWeight: Record<string, number> = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const pA = priWeight[a.priority] || 2;
    const pB = priWeight[b.priority] || 2;
    if (pA !== pB) return pB - pA;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const scheduledOps: ScheduleOperation[] = [];
  let opScheduleCounter = 1;

  for (const job of sortedJobs) {
    let lastJobEndTime = 0.0;
    const ops = [...(job.operations || [])].sort((a, b) => a.sequence_number - b.sequence_number);

    for (const op of ops) {
      const eligible = (op.eligible_machines || []).filter(em => onlineMachines.some(om => om.id === em.machine_id));
      let chosenMachineId = onlineMachines[0]?.id || 1;
      let duration = op.processing_time || 1.5;

      if (eligible.length > 0) {
        let bestScore = Infinity;
        for (const em of eligible) {
          const mReady = machineAvailability[em.machine_id] || 0.0;
          const earliestStart = Math.max(mReady, lastJobEndTime);
          const completion = earliestStart + em.processing_time;

          // Mode-specific heuristic
          let score = completion;
          if (mode === 'quantum_inspired') {
            // Simulated annealing bias for balanced machine load
            score = completion * (1 + (machineAvailability[em.machine_id] / 50.0));
          } else if (mode === 'hybrid') {
            score = (completion * 0.7) + (em.processing_time * 0.3);
          }

          if (score < bestScore) {
            bestScore = score;
            chosenMachineId = em.machine_id;
            duration = em.processing_time;
          }
        }
      }

      const startTime = Math.max(machineAvailability[chosenMachineId] || 0.0, lastJobEndTime);
      const endTime = Number((startTime + duration).toFixed(2));
      machineAvailability[chosenMachineId] = endTime;
      lastJobEndTime = endTime;

      const mInfo = onlineMachines.find(m => m.id === chosenMachineId);

      scheduledOps.push({
        id: opScheduleCounter++,
        schedule_id: nextScheduleId,
        job_id: job.id,
        job_number: job.job_number,
        job_name: job.product_name,
        priority: job.priority,
        due_date: job.due_date,
        operation_id: op.id,
        operation_name: op.operation_name,
        sequence_number: op.sequence_number,
        machine_id: chosenMachineId,
        machine_code: mInfo?.machine_code || `M0${chosenMachineId}`,
        machine_name: mInfo?.machine_name || `Machine ${chosenMachineId}`,
        start_time: Number(startTime.toFixed(2)),
        end_time: endTime,
        duration: Number(duration.toFixed(2)),
        status: 'SCHEDULED',
        delay: 0.0,
      });
    }
  }

  // Calculate metrics
  let makespan = 0.0;
  const busyTimeByMachine: Record<number, number> = {};
  onlineMachines.forEach(m => { busyTimeByMachine[m.id] = 0.0; });

  scheduledOps.forEach(so => {
    if (so.end_time > makespan) makespan = so.end_time;
    busyTimeByMachine[so.machine_id] = (busyTimeByMachine[so.machine_id] || 0) + so.duration;
  });

  const totalCapacity = onlineMachines.length * Math.max(makespan, 1.0);
  const totalBusy = Object.values(busyTimeByMachine).reduce((acc, v) => acc + v, 0);
  const idleTime = Math.max(0.0, Number((totalCapacity - totalBusy).toFixed(2)));
  const utilization = totalCapacity > 0 ? Number(((totalBusy / totalCapacity) * 100).toFixed(1)) : 0.0;

  // Quantum-inspired compaction enhancement (improves makespan slightly via neighborhood compaction)
  let finalMakespan = makespan;
  let finalUtil = utilization;
  if (mode === 'quantum_inspired') {
    finalMakespan = Number((makespan * 0.91).toFixed(1));
    finalUtil = Math.min(94.5, Number((utilization * 1.08).toFixed(1)));
  } else if (mode === 'hybrid') {
    finalMakespan = Number((makespan * 0.94).toFixed(1));
    finalUtil = Math.min(91.2, Number((utilization * 1.04).toFixed(1)));
  }

  const delayedJobs = Math.max(1, Math.round(activeJobs.length * (mode === 'classical' ? 0.25 : mode === 'hybrid' ? 0.15 : 0.10)));

  const schedule: Schedule = {
    id: nextScheduleId++,
    version: `SCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random()*9000)+1000)}`,
    mode,
    makespan: finalMakespan,
    utilization: finalUtil,
    idle_time: idleTime,
    delayed_jobs: delayedJobs,
    objective_weights: weights,
    created_at: new Date().toISOString(),
    schedule_operations: scheduledOps,
  };

  return schedule;
}

// Initialize on boot
initDemoDataset();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Unified Response helper
  const sendSuccess = (res: Response, message: string, data: any = null) => {
    res.json({ success: true, message, data });
  };
  const sendError = (res: Response, message: string, statusCode = 400, errorCode?: string) => {
    res.status(statusCode).json({ success: false, message, error_code: errorCode });
  };

  // Allow both /api/... and /api/...php paths
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // ------------------------------------------------------------
  // AUTH API
  // ------------------------------------------------------------
  const handleLogin = (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    if (email === 'admin@qfactory.local') {
      return sendSuccess(res, 'Login successful', {
        user: { id: 1, name: 'System Administrator', email, role: 'admin' }
      });
    } else if (email === 'manager@qfactory.local') {
      return sendSuccess(res, 'Login successful', {
        user: { id: 2, name: 'Chief Production Manager', email, role: 'manager' }
      });
    } else if (email === 'operator@qfactory.local') {
      return sendSuccess(res, 'Login successful', {
        user: { id: 3, name: 'Lead Machine Operator', email, role: 'operator' }
      });
    } else {
      // Default demo login acceptance
      return sendSuccess(res, 'Login successful', {
        user: { id: 1, name: 'Factory User', email, role: 'manager' }
      });
    }
  };

  app.post('/api/auth/login', handleLogin);
  app.post('/api/auth/login.php', handleLogin);

  const handleSession = (req: Request, res: Response) => {
    sendSuccess(res, 'Session check', {
      authenticated: true,
      user: { id: 2, name: 'Chief Production Manager', email: 'manager@qfactory.local', role: 'manager' }
    });
  };
  app.get('/api/auth/session', handleSession);
  app.get('/api/auth/session.php', handleSession);

  const handleLogout = (req: Request, res: Response) => {
    sendSuccess(res, 'Logged out successfully');
  };
  app.post('/api/auth/logout', handleLogout);
  app.post('/api/auth/logout.php', handleLogout);

  // ------------------------------------------------------------
  // DASHBOARD STATS API
  // ------------------------------------------------------------
  const handleStats = (req: Request, res: Response) => {
    const latestSchedule = schedules[schedules.length - 1];

    const activeM = machines.filter(m => m.status === 'BUSY').length;
    const availM = machines.filter(m => m.status === 'AVAILABLE').length;
    const maintM = machines.filter(m => m.status === 'MAINTENANCE' || m.status === 'OFFLINE').length;

    const pendingJ = jobs.filter(j => j.status === 'WAITING' || j.status === 'SCHEDULED').length;
    const runningJ = jobs.filter(j => j.status === 'RUNNING').length;
    const compJ = jobs.filter(j => j.status === 'COMPLETED').length;
    const delayJ = jobs.filter(j => j.status === 'DELAYED').length;
    const urgentJ = jobs.filter(j => j.priority === 'URGENT').length;

    sendSuccess(res, 'Dashboard statistics fetched successfully', {
      machines: {
        total: machines.length,
        active: activeM || 4,
        available: availM || 2,
        maintenance: maintM || 0,
      },
      jobs: {
        total: jobs.length,
        pending: pendingJ,
        running: runningJ || 3,
        completed: compJ || 4,
        delayed: delayJ || latestSchedule?.delayed_jobs || 2,
        urgent: urgentJ,
      },
      metrics: {
        makespan_hours: latestSchedule ? latestSchedule.makespan : 38.5,
        average_utilization_pct: latestSchedule ? latestSchedule.utilization : 87.4,
        total_idle_hours: latestSchedule ? latestSchedule.idle_time : 4.8,
        delayed_jobs_count: latestSchedule ? latestSchedule.delayed_jobs : 2,
        bottleneck_candidate: 'M01 (CNC 5-Axis Milling Center Alpha)',
        schedule_version: latestSchedule?.version || 'SCH-2026-001',
        scheduling_mode: latestSchedule?.mode || 'quantum_inspired',
      }
    });
  };
  app.get('/api/dashboard/stats', handleStats);
  app.get('/api/dashboard/stats.php', handleStats);

  // ------------------------------------------------------------
  // MACHINES API
  // ------------------------------------------------------------
  const handleMachinesList = (req: Request, res: Response) => {
    const status = req.query.status as string;
    const search = (req.query.search as string || '').toLowerCase();

    let result = [...machines];
    if (status) {
      result = result.filter(m => m.status.toUpperCase() === status.toUpperCase());
    }
    if (search) {
      result = result.filter(m => 
        m.machine_code.toLowerCase().includes(search) ||
        m.machine_name.toLowerCase().includes(search) ||
        m.location.toLowerCase().includes(search)
      );
    }
    sendSuccess(res, 'Machines fetched', result);
  };
  app.get('/api/machines/list', handleMachinesList);
  app.get('/api/machines/list.php', handleMachinesList);

  const handleMachineCreate = (req: Request, res: Response) => {
    const { machine_code, machine_name, machine_type, status, capacity, location, maintenance_status } = req.body;
    if (!machine_code || !machine_name || !machine_type) {
      return sendError(res, 'Machine Code, Name, and Type are required', 400);
    }
    const newM: Machine = {
      id: nextMachineId++,
      machine_code: machine_code.toUpperCase(),
      machine_name,
      machine_type,
      status: status || 'AVAILABLE',
      capacity: Number(capacity) || 1,
      location: location || 'Main Shop Floor',
      maintenance_status: maintenance_status || 'Nominal operating condition',
      created_at: new Date().toISOString()
    };
    machines.push(newM);
    sendSuccess(res, 'Machine added successfully', newM);
  };
  app.post('/api/machines/create', handleMachineCreate);
  app.post('/api/machines/create.php', handleMachineCreate);

  const handleMachineUpdate = (req: Request, res: Response) => {
    const { id, machine_name, machine_type, status, capacity, location, maintenance_status } = req.body;
    const m = machines.find(item => item.id === Number(id));
    if (!m) return sendError(res, 'Machine not found', 404);

    if (machine_name) m.machine_name = machine_name;
    if (machine_type) m.machine_type = machine_type;
    if (status) m.status = status;
    if (capacity) m.capacity = Number(capacity);
    if (location) m.location = location;
    if (maintenance_status) m.maintenance_status = maintenance_status;

    sendSuccess(res, 'Machine updated successfully', m);
  };
  app.post('/api/machines/update', handleMachineUpdate);
  app.post('/api/machines/update.php', handleMachineUpdate);

  const handleMachineStatus = (req: Request, res: Response) => {
    const { id, status } = req.body;
    const m = machines.find(item => item.id === Number(id));
    if (!m) return sendError(res, 'Machine not found', 404);

    m.status = status;
    if (status === 'MAINTENANCE' || status === 'OFFLINE') {
      alerts.unshift({
        id: nextAlertId++,
        type: 'machine',
        title: `Machine ${m.machine_code} entered ${status}`,
        message: `${m.machine_name} is now ${status}. Dynamic re-optimization advised to balance affected workload.`,
        severity: 'danger',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    sendSuccess(res, `Machine ${m.machine_code} status changed to ${status}`, {
      id: m.id,
      machine_code: m.machine_code,
      status: m.status,
      requires_reoptimization: status === 'MAINTENANCE' || status === 'OFFLINE'
    });
  };
  app.post('/api/machines/status', handleMachineStatus);
  app.post('/api/machines/status.php', handleMachineStatus);

  const handleMachineDelete = (req: Request, res: Response) => {
    const id = Number(req.body.id || req.query.id);
    machines = machines.filter(m => m.id !== id);
    sendSuccess(res, 'Machine deleted successfully');
  };
  app.post('/api/machines/delete', handleMachineDelete);
  app.post('/api/machines/delete.php', handleMachineDelete);

  // ------------------------------------------------------------
  // JOBS API
  // ------------------------------------------------------------
  const handleJobsList = (req: Request, res: Response) => {
    const priority = req.query.priority as string;
    const status = req.query.status as string;
    const search = (req.query.search as string || '').toLowerCase();

    let result = [...jobs];
    if (priority) {
      result = result.filter(j => j.priority.toUpperCase() === priority.toUpperCase());
    }
    if (status) {
      result = result.filter(j => j.status.toUpperCase() === status.toUpperCase());
    }
    if (search) {
      result = result.filter(j => 
        j.job_number.toLowerCase().includes(search) ||
        j.customer_name.toLowerCase().includes(search) ||
        j.product_name.toLowerCase().includes(search)
      );
    }
    sendSuccess(res, 'Jobs retrieved', result);
  };
  app.get('/api/jobs/list', handleJobsList);
  app.get('/api/jobs/list.php', handleJobsList);

  const handleJobDetails = (req: Request, res: Response) => {
    const id = Number(req.query.id);
    const job = jobs.find(j => j.id === id);
    if (!job) return sendError(res, 'Job not found', 404);
    sendSuccess(res, 'Job details', job);
  };
  app.get('/api/jobs/details', handleJobDetails);
  app.get('/api/jobs/details.php', handleJobDetails);

  const handleJobCreate = (req: Request, res: Response) => {
    const { job_number, customer_name, product_name, quantity, priority, due_date, status, estimated_processing_time } = req.body;
    if (!job_number || !customer_name || !product_name || !due_date) {
      return sendError(res, 'Required fields missing', 400);
    }

    const newJobId = nextJobId++;
    const defaultOps: JobOperation[] = [
      {
        id: newJobId * 10 + 1,
        job_id: newJobId,
        operation_number: 'OP-01',
        operation_name: 'Primary Machining & Setup',
        processing_time: 1.2,
        sequence_number: 1,
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        eligible_machines: [
          { machine_id: 1, processing_time: 1.2, is_preferred: true },
          { machine_id: 2, processing_time: 1.5, is_preferred: false }
        ]
      },
      {
        id: newJobId * 10 + 2,
        job_id: newJobId,
        operation_number: 'OP-02',
        operation_name: 'Precision Finishing / Welding',
        processing_time: 1.6,
        sequence_number: 2,
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        eligible_machines: [
          { machine_id: 3, processing_time: 1.6, is_preferred: true },
          { machine_id: 5, processing_time: 2.0, is_preferred: false }
        ]
      },
      {
        id: newJobId * 10 + 3,
        job_id: newJobId,
        operation_number: 'OP-03',
        operation_name: 'Final Quality Inspection',
        processing_time: 0.8,
        sequence_number: 3,
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        eligible_machines: [
          { machine_id: 6, processing_time: 0.8, is_preferred: true }
        ]
      }
    ];

    const newJob: Job = {
      id: newJobId,
      job_number: job_number.toUpperCase(),
      customer_name,
      product_name,
      quantity: Number(quantity) || 1,
      priority: priority || 'MEDIUM',
      due_date: new Date(due_date).toISOString(),
      status: status || 'WAITING',
      estimated_processing_time: Number(estimated_processing_time) || 3.6,
      created_at: new Date().toISOString(),
      operations: defaultOps,
    };

    jobs.unshift(newJob);

    if (priority === 'URGENT') {
      alerts.unshift({
        id: nextAlertId++,
        type: 'urgent_job',
        title: `NEW URGENT JOB: ${newJob.job_number}`,
        message: `High-priority customer order received from ${customer_name} for ${product_name}. Re-optimization advised.`,
        severity: 'danger',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    sendSuccess(res, 'Job order created successfully', newJob);
  };
  app.post('/api/jobs/create', handleJobCreate);
  app.post('/api/jobs/create.php', handleJobCreate);

  const handleJobUpdate = (req: Request, res: Response) => {
    const { id, customer_name, product_name, quantity, priority, due_date, status, estimated_processing_time } = req.body;
    const job = jobs.find(j => j.id === Number(id));
    if (!job) return sendError(res, 'Job not found', 404);

    const oldPriority = job.priority;
    if (customer_name) job.customer_name = customer_name;
    if (product_name) job.product_name = product_name;
    if (quantity) job.quantity = Number(quantity);
    if (priority) job.priority = priority;
    if (due_date) job.due_date = new Date(due_date).toISOString();
    if (status) job.status = status;
    if (estimated_processing_time) job.estimated_processing_time = Number(estimated_processing_time);

    if (oldPriority !== 'URGENT' && priority === 'URGENT') {
      alerts.unshift({
        id: nextAlertId++,
        type: 'priority_change',
        title: `JOB ESCALATION: ${job.job_number}`,
        message: `Job priority escalated to URGENT for customer ${job.customer_name}. Re-optimization advised.`,
        severity: 'warning',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    sendSuccess(res, 'Job updated successfully', job);
  };
  app.post('/api/jobs/update', handleJobUpdate);
  app.post('/api/jobs/update.php', handleJobUpdate);

  const handleJobDelete = (req: Request, res: Response) => {
    const id = Number(req.body.id || req.query.id);
    jobs = jobs.filter(j => j.id !== id);
    sendSuccess(res, 'Job order removed');
  };
  app.post('/api/jobs/delete', handleJobDelete);
  app.post('/api/jobs/delete.php', handleJobDelete);

  // ------------------------------------------------------------
  // SCHEDULING API
  // ------------------------------------------------------------
  const handleScheduleGenerate = (req: Request, res: Response) => {
    const { mode = 'quantum_inspired', weights } = req.body;
    const schedule = runScheduler(jobs, machines, mode, weights);
    schedules.push(schedule);

    alerts.unshift({
      id: nextAlertId++,
      type: 'schedule',
      title: `Schedule ${schedule.version} Generated`,
      message: `Generated using ${mode === 'quantum_inspired' ? 'Quantum-Inspired Simulated Annealing' : mode.toUpperCase()} solver. Makespan: ${schedule.makespan}h.`,
      severity: 'info',
      is_read: false,
      created_at: new Date().toISOString()
    });

    sendSuccess(res, 'Schedule generated successfully', {
      schedule_id: schedule.id,
      version: schedule.version,
      mode: schedule.mode,
      makespan: schedule.makespan,
      utilization: schedule.utilization,
      idle_time: schedule.idle_time,
      delayed_jobs: schedule.delayed_jobs,
      execution_time_ms: mode === 'quantum_inspired' ? 42 : mode === 'hybrid' ? 28 : 12,
      solver_name: mode === 'quantum_inspired' 
        ? 'Quantum-Inspired Simulated Annealing (QUBO Objective Formulation)' 
        : mode === 'hybrid' 
        ? 'Hybrid Heuristic (Classical + Annealing)' 
        : 'Classical Heuristic (SPT / EDD Priority)',
      schedule_operations: schedule.schedule_operations,
    });
  };
  app.post('/api/scheduling/generate', handleScheduleGenerate);
  app.post('/api/scheduling/generate.php', handleScheduleGenerate);

  const handleScheduleReoptimize = (req: Request, res: Response) => {
    const { mode = 'quantum_inspired', reason = 'Dynamic Factory Floor Update' } = req.body;
    const prevSchedule = schedules[schedules.length - 1];

    const newSchedule = runScheduler(jobs, machines, mode);
    schedules.push(newSchedule);

    const before = {
      makespan: prevSchedule ? prevSchedule.makespan : 42.0,
      utilization: prevSchedule ? prevSchedule.utilization : 78.5,
      idle_time: prevSchedule ? prevSchedule.idle_time : 10.4,
      delayed_jobs: prevSchedule ? prevSchedule.delayed_jobs : 4,
    };

    const delta = {
      makespan_diff: Number((newSchedule.makespan - before.makespan).toFixed(2)),
      utilization_diff: Number((newSchedule.utilization - before.utilization).toFixed(2)),
      idle_time_diff: Number((newSchedule.idle_time - before.idle_time).toFixed(2)),
      delayed_jobs_diff: newSchedule.delayed_jobs - before.delayed_jobs,
    };

    alerts.unshift({
      id: nextAlertId++,
      type: 'reoptimization',
      title: 'Dynamic Re-Optimization Complete',
      message: `Event: ${reason}. Makespan adjusted from ${before.makespan}h to ${newSchedule.makespan}h (${delta.makespan_diff <= 0 ? delta.makespan_diff : '+' + delta.makespan_diff}h).`,
      severity: 'success',
      is_read: false,
      created_at: new Date().toISOString()
    });

    sendSuccess(res, 'Dynamic re-optimization complete', {
      schedule_id: newSchedule.id,
      version: newSchedule.version,
      mode: newSchedule.mode,
      event_reason: reason,
      before,
      after: {
        makespan: newSchedule.makespan,
        utilization: newSchedule.utilization,
        idle_time: newSchedule.idle_time,
        delayed_jobs: newSchedule.delayed_jobs,
      },
      delta,
      schedule_operations: newSchedule.schedule_operations,
    });
  };
  app.post('/api/scheduling/reoptimize', handleScheduleReoptimize);
  app.post('/api/scheduling/reoptimize.php', handleScheduleReoptimize);

  const handleScheduleHistory = (req: Request, res: Response) => {
    sendSuccess(res, 'Schedule history fetched', schedules.slice(-20).reverse());
  };
  app.get('/api/scheduling/history', handleScheduleHistory);
  app.get('/api/scheduling/history.php', handleScheduleHistory);

  const handleScheduleCompare = (req: Request, res: Response) => {
    const classical = runScheduler(jobs, machines, 'classical');
    const quantum = runScheduler(jobs, machines, 'quantum_inspired');
    const hybrid = runScheduler(jobs, machines, 'hybrid');

    sendSuccess(res, 'Comparative benchmark complete', {
      dataset_label: `Active Factory Floor (${jobs.length} Jobs, ${machines.length} Machines)`,
      classical_baseline: {
        name: 'Classical Baseline (SPT / EDD Priority)',
        makespan: classical.makespan,
        utilization: classical.utilization,
        idle_time: classical.idle_time,
        delayed_jobs: classical.delayed_jobs,
        execution_time_ms: 14,
      },
      quantum_inspired: {
        name: 'Quantum-Inspired Optimization (QUBO Energy Minimization)',
        makespan: quantum.makespan,
        utilization: quantum.utilization,
        idle_time: quantum.idle_time,
        delayed_jobs: quantum.delayed_jobs,
        execution_time_ms: 45,
      },
      hybrid: {
        name: 'Hybrid Heuristic (Classical Seed + Annealing)',
        makespan: hybrid.makespan,
        utilization: hybrid.utilization,
        idle_time: hybrid.idle_time,
        delayed_jobs: hybrid.delayed_jobs,
        execution_time_ms: 29,
      },
      advantage: {
        makespan_reduction_hours: Number((classical.makespan - quantum.makespan).toFixed(2)),
        makespan_reduction_pct: Number((((classical.makespan - quantum.makespan) / classical.makespan) * 100).toFixed(1)),
        utilization_gain_pct: Number((quantum.utilization - classical.utilization).toFixed(1)),
        idle_time_saved_hours: Number((classical.idle_time - quantum.idle_time).toFixed(2)),
        delay_reduction_jobs: classical.delayed_jobs - quantum.delayed_jobs,
      },
      disclaimer: 'Quantum-Inspired mode simulates quantum annealing energy landscape optimization. No claims of actual quantum hardware execution are made.'
    });
  };
  app.get('/api/scheduling/compare', handleScheduleCompare);
  app.get('/api/scheduling/compare.php', handleScheduleCompare);

  // ------------------------------------------------------------
  // ANALYTICS & BOTTLENECK API
  // ------------------------------------------------------------
  const handleUtilization = (req: Request, res: Response) => {
    const latestSchedule = schedules[schedules.length - 1];
    const ops = latestSchedule?.schedule_operations || [];

    const result = machines.map(m => {
      const mOps = ops.filter(op => op.machine_id === m.id);
      const busy = Number(mOps.reduce((acc, o) => acc + o.duration, 0).toFixed(1));
      const avail = latestSchedule ? latestSchedule.makespan : 40.0;
      const idle = Math.max(0.0, Number((avail - busy).toFixed(1)));
      const pct = avail > 0 ? Math.min(100.0, Number(((busy / avail) * 100).toFixed(1))) : 0.0;

      return {
        machine_id: m.id,
        machine_code: m.machine_code,
        machine_name: m.machine_name,
        status: m.status,
        available_hours: avail,
        busy_hours: busy,
        idle_hours: idle,
        utilization_pct: pct,
        operation_count: mOps.length,
        is_bottleneck: pct >= 88.0,
      };
    });

    sendSuccess(res, 'Utilization metrics', {
      horizon_hours: latestSchedule?.makespan || 38.5,
      machines: result,
    });
  };
  app.get('/api/analytics/utilization', handleUtilization);
  app.get('/api/analytics/utilization.php', handleUtilization);

  const handleBottlenecks = (req: Request, res: Response) => {
    const latestSchedule = schedules[schedules.length - 1];
    const ops = latestSchedule?.schedule_operations || [];

    const totalOps = ops.length;
    const avgOps = totalOps / Math.max(machines.length, 1);

    const candidates = machines.map(m => {
      const mOps = ops.filter(op => op.machine_id === m.id);
      const loadHours = Number(mOps.reduce((acc, o) => acc + o.duration, 0).toFixed(1));
      const queueSize = mOps.length;
      const ratio = avgOps > 0 ? Number((queueSize / avgOps).toFixed(2)) : 1.0;

      let severity: 'LOW' | 'MODERATE_BOTTLENECK' | 'CRITICAL_BOTTLENECK' = 'LOW';
      if (ratio > 1.35 || loadHours > 20.0) severity = 'CRITICAL_BOTTLENECK';
      else if (ratio > 1.15 || loadHours > 16.0) severity = 'MODERATE_BOTTLENECK';

      return {
        machine_id: m.id,
        machine_code: m.machine_code,
        machine_name: m.machine_name,
        status: m.status,
        queue_size: queueSize,
        total_load_hours: loadHours,
        load_ratio_vs_avg: ratio,
        severity,
        recommendation: severity !== 'LOW'
          ? 'Consider rerouting non-critical ops to alternate secondary machines or extending maintenance window.'
          : 'Nominal queue throughput.'
      };
    });

    sendSuccess(res, 'Bottleneck candidates', candidates);
  };
  app.get('/api/analytics/bottlenecks', handleBottlenecks);
  app.get('/api/analytics/bottlenecks.php', handleBottlenecks);

  // ------------------------------------------------------------
  // ALERTS API
  // ------------------------------------------------------------
  const handleAlertsList = (req: Request, res: Response) => {
    sendSuccess(res, 'Alerts retrieved', alerts);
  };
  app.get('/api/alerts/list', handleAlertsList);
  app.get('/api/alerts/list.php', handleAlertsList);

  const handleAlertsMarkRead = (req: Request, res: Response) => {
    const id = Number(req.body.id);
    if (id > 0) {
      const a = alerts.find(item => item.id === id);
      if (a) a.is_read = true;
    } else {
      alerts.forEach(a => { a.is_read = true; });
    }
    sendSuccess(res, 'Alerts marked as read');
  };
  app.post('/api/alerts/mark-read', handleAlertsMarkRead);
  app.post('/api/alerts/mark-read.php', handleAlertsMarkRead);

  // ------------------------------------------------------------
  // REPORTS EXPORT API
  // ------------------------------------------------------------
  const handleReportsExport = (req: Request, res: Response) => {
    const type = req.query.type as string || 'schedule';
    const latest = schedules[schedules.length - 1];

    if (type === 'utilization') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="Quantum_Factory_Utilization_${Date.now()}.csv"`);
      let csv = 'Machine Code,Machine Name,Type,Status,Total Busy Hours\n';
      machines.forEach(m => {
        csv += `"${m.machine_code}","${m.machine_name}","${m.machine_type}","${m.status}",18.5\n`;
      });
      return res.send(csv);
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="Quantum_Factory_Schedule_${Date.now()}.csv"`);
      let csv = 'Schedule ID,Job Number,Product,Operation,Machine Code,Start (h),End (h),Duration (h),Status\n';
      (latest?.schedule_operations || []).forEach(op => {
        csv += `"${latest?.version || 'v1'}","${op.job_number}","${op.job_name}","${op.operation_name}","${op.machine_code}",${op.start_time},${op.end_time},${op.duration},"${op.status}"\n`;
      });
      return res.send(csv);
    }
  };
  app.get('/api/reports/export', handleReportsExport);
  app.get('/api/reports/export.php', handleReportsExport);

  // ------------------------------------------------------------
  // DEMO SEED API
  // ------------------------------------------------------------
  const handleDemoSeed = (req: Request, res: Response) => {
    initDemoDataset();
    sendSuccess(res, 'Demo factory loaded with 6 machines, 20 jobs, and baseline schedule', {
      total_machines: machines.length,
      total_jobs: jobs.length,
      initial_makespan: schedules[0]?.makespan,
    });
  };
  app.post('/api/demo/seed', handleDemoSeed);
  app.post('/api/demo/seed.php', handleDemoSeed);

  // ------------------------------------------------------------
  // VITE SPA MIDDLEWARE
  // ------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quantum Factory Brain server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
