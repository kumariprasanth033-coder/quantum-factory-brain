export type MachineStatus = 'AVAILABLE' | 'BUSY' | 'MAINTENANCE' | 'OFFLINE';
export type JobPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type JobStatus = 'WAITING' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
export type SchedulingMode = 'classical' | 'quantum_inspired' | 'hybrid';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'operator';
  status?: string;
}

export interface Machine {
  id: number;
  machine_code: string;
  machine_name: string;
  machine_type: string;
  status: MachineStatus;
  capacity: number;
  location: string;
  maintenance_status: string;
  created_at?: string;
  active_tasks?: number;
  scheduled_workload_hours?: number;
}

export interface OperationMachine {
  id?: number;
  machine_id: number;
  processing_time: number;
  is_preferred?: boolean;
  machine_code?: string;
  machine_name?: string;
  machine_status?: MachineStatus;
}

export interface JobOperation {
  id: number;
  job_id: number;
  operation_number: string;
  operation_name: string;
  processing_time: number;
  sequence_number: number;
  priority: JobPriority;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'DELAYED';
  eligible_machines?: OperationMachine[];
}

export interface Job {
  id: number;
  job_number: string;
  customer_name: string;
  product_name: string;
  quantity: number;
  priority: JobPriority;
  due_date: string;
  status: JobStatus;
  estimated_processing_time: number;
  created_at?: string;
  operation_count?: number;
  operations?: JobOperation[];
}

export interface ScheduleOperation {
  id: number;
  schedule_id: number;
  job_id: number;
  job_number: string;
  job_name: string;
  priority: JobPriority;
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
  eligible_machine_ids?: number[];
  eligible_machines?: { machine_id: number; machine_code?: string; machine_name?: string }[];
}

export interface Schedule {
  id: number;
  version: string;
  mode: SchedulingMode;
  scheduling_mode?: SchedulingMode;
  makespan: number;
  utilization: number;
  idle_time: number;
  delayed_jobs: number;
  execution_time_ms?: number;
  objective_weights?: {
    makespan: number;
    delay: number;
    idle: number;
    bottleneck: number;
  };
  created_at: string;
  schedule_operations?: ScheduleOperation[];
}

export interface DashboardStats {
  machines: {
    total: number;
    active: number;
    available: number;
    maintenance: number;
  };
  jobs: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    delayed: number;
    urgent: number;
  };
  metrics: {
    makespan_hours: number;
    average_utilization_pct: number;
    total_idle_hours: number;
    delayed_jobs_count: number;
    bottleneck_candidate: string;
    schedule_version: string;
    scheduling_mode: string;
  };
}

export interface BottleneckCandidate {
  machine_id: number;
  machine_code: string;
  machine_name: string;
  status: MachineStatus;
  queue_size: number;
  total_load_hours: number;
  load_ratio_vs_avg: number;
  severity: 'LOW' | 'MODERATE_BOTTLENECK' | 'CRITICAL_BOTTLENECK';
  recommendation: string;
}

export interface MachineUtilizationData {
  machine_id: number;
  machine_code: string;
  machine_name: string;
  status: MachineStatus;
  available_hours: number;
  busy_hours: number;
  idle_hours: number;
  utilization_pct: number;
  operation_count: number;
  is_bottleneck: boolean;
}

export interface AlertItem {
  id: number;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success' | 'CRITICAL' | 'WARNING' | 'INFO';
  is_read: boolean;
  created_at: string;
}

export interface ScheduleComparisonResult {
  dataset_label: string;
  classical_baseline: {
    name: string;
    makespan: number;
    utilization: number;
    idle_time: number;
    delayed_jobs: number;
    execution_time_ms: number;
  };
  quantum_inspired: {
    name: string;
    makespan: number;
    utilization: number;
    idle_time: number;
    delayed_jobs: number;
    execution_time_ms: number;
  };
  hybrid: {
    name: string;
    makespan: number;
    utilization: number;
    idle_time: number;
    delayed_jobs: number;
    execution_time_ms: number;
  };
  advantage: {
    makespan_reduction_hours: number;
    makespan_reduction_pct: number;
    utilization_gain_pct: number;
    idle_time_saved_hours: number;
    delay_reduction_jobs: number;
  };
  disclaimer: string;
}

export type FactoryMode = 'demo' | 'custom';

export interface FactoryProfile {
  id?: number;
  factory_code: string;
  factory_name: string;
  industry: string;
  location: string;
  contact_email: string;
  working_hours: string;
  time_zone: string;
  is_demo?: boolean;
}

export interface SetupChecklist {
  factory_profile: boolean;
  machines: boolean;
  jobs: boolean;
  operations: boolean;
  eligible_machines: boolean;
  first_schedule: boolean;
  completed_count: number;
  total_count: number;
}

export interface SystemHealthTestResult {
  id: string;
  category: 'AUTHENTICATION' | 'DATABASE' | 'MACHINES' | 'JOBS' | 'SCHEDULING' | 'ANALYTICS' | 'DEPLOYMENT';
  test_name: string;
  endpoint: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  execution_time_ms: number;
  details?: string;
  error_message?: string;
  suggested_fix?: string;
}

export interface SystemHealthReport {
  timestamp: string;
  overall_status: 'HEALTHY' | 'WARNING' | 'DEGRADED';
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  warning_tests: number;
  environment: string;
  database_status: string;
  api_version: string;
  tests: SystemHealthTestResult[];
}

