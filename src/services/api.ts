import { 
  DashboardStats, 
  Machine, 
  Job, 
  JobOperation,
  Schedule, 
  AlertItem, 
  BottleneckCandidate, 
  MachineUtilizationData, 
  ScheduleComparisonResult,
  SchedulingMode,
  FactoryProfile,
  FactoryMode,
  SystemHealthReport,
  CsvImportType,
  CsvPreviewValidationResult,
  CsvImportCommitResult
} from '../types';

// Same-origin relative /api default
const getApiBaseUrl = (): string => {
  return localStorage.getItem('qfb_api_base_url') || '/api';
};

export const setApiBaseUrl = (url: string) => {
  localStorage.setItem('qfb_api_base_url', url);
};

export const resetApiBaseUrl = () => {
  localStorage.removeItem('qfb_api_base_url');
};

export const getStoredFactoryMode = (): FactoryMode => {
  return (localStorage.getItem('qfb_factory_mode') as FactoryMode) || 'demo';
};

export const setStoredFactoryMode = (mode: FactoryMode) => {
  localStorage.setItem('qfb_factory_mode', mode);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const currentMode = getStoredFactoryMode();
  const token = localStorage.getItem('qfb_auth_token');

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Factory-Mode': currentMode,
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    credentials: 'include',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> || {}),
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.message) errorMsg = errJson.message;
      else if (errJson.error) errorMsg = errJson.error;
    } catch {
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  const json = await response.json();
  if (json.success === false) {
    throw new Error(json.message || 'API request failed');
  }

  return json.data !== undefined ? (json.data as T) : (json as unknown as T);
}

export const api = {
  // System Health
  getHealth: () =>
    request<{
      success: boolean;
      status: string;
      database: string;
      app_name: string;
      version: string;
      timestamp: string;
      active_mode: string;
      factory_name?: string;
    }>('/health'),

  runSystemHealthCheck: () =>
    request<SystemHealthReport>('/system/health-check'),

  // Auth (Sends proper POST request to backend with support for PHP and Node/Express)
  login: async (credentials: { email: string; password: string; role?: string }) => {
    try {
      return await request<{ user: { id: number; name: string; email: string; role: 'admin' | 'manager' | 'operator' }; token?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch (err: any) {
      if (err.message && (err.message.includes('404') || err.message.includes('Not Found'))) {
        return await request<{ user: { id: number; name: string; email: string; role: 'admin' | 'manager' | 'operator' }; token?: string }>('/auth/login.php', {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
      }
      throw err;
    }
  },
  logout: async () => {
    try {
      return await request<null>('/auth/logout', { method: 'POST' });
    } catch {
      return await request<null>('/auth/logout.php', { method: 'POST' }).catch(() => null);
    }
  },
  getSession: async () => {
    try {
      return await request<{ authenticated: boolean; user: any }>('/auth/session');
    } catch {
      return await request<{ authenticated: boolean; user: any }>('/auth/session.php').catch(() => ({
        authenticated: false,
        user: null
      }));
    }
  },

  // Factory Multi-Tenancy & Profile
  getFactoryMode: () =>
    request<{ active_mode: FactoryMode; profile: FactoryProfile; machine_count: number; job_count: number }>('/factory/mode'),
  setFactoryMode: (mode: FactoryMode) => {
    setStoredFactoryMode(mode);
    return request<{ active_mode: FactoryMode; profile: FactoryProfile }>('/factory/mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  },
  getFactoryProfile: () =>
    request<FactoryProfile>('/factory/profile'),
  updateFactoryProfile: (profile: Partial<FactoryProfile>) =>
    request<FactoryProfile>('/factory/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),

  // Dashboard
  getDashboardStats: () =>
    request<DashboardStats & { mode?: string; empty_state?: boolean; setup_checklist?: any; factory_profile?: FactoryProfile }>('/dashboard/stats'),

  // Machines
  getMachines: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return request<Machine[]>(`/machines/list${qs ? `?${qs}` : ''}`);
  },
  createMachine: (data: Partial<Machine>) =>
    request<Machine>('/machines/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMachine: (data: Partial<Machine> & { id: number }) =>
    request<Machine>('/machines/update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMachineStatus: (id: number, status: string) =>
    request<{ id: number; status: string; requires_reoptimization: boolean }>('/machines/status', {
      method: 'POST',
      body: JSON.stringify({ id, status }),
    }),
  deleteMachine: (id: number) =>
    request<null>('/machines/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  // Jobs
  getJobs: (params?: { priority?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.priority) query.append('priority', params.priority);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return request<Job[]>(`/jobs/list${qs ? `?${qs}` : ''}`);
  },
  getJobDetails: (id: number) =>
    request<Job>(`/jobs/details?id=${id}`),
  createJob: (data: Partial<Job>) =>
    request<Job>('/jobs/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateJob: (data: Partial<Job> & { id: number }) =>
    request<Job>('/jobs/update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteJob: (id: number) =>
    request<null>('/jobs/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  // Operations CRUD
  createOperation: (data: {
    job_id: number;
    operation_number?: string;
    operation_name: string;
    processing_time: number;
    sequence_number?: number;
    priority?: string;
    eligible_machines?: any[];
  }) =>
    request<JobOperation>('/operations/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOperation: (data: Partial<JobOperation> & { id: number }) =>
    request<JobOperation>('/operations/update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteOperation: (id: number) =>
    request<null>('/operations/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),
  assignOperationMachines: (operation_id: number, eligible_machines: any[]) =>
    request<JobOperation>('/operations/assign-machines', {
      method: 'POST',
      body: JSON.stringify({ operation_id, eligible_machines }),
    }),

  // Scheduling
  generateSchedule: (mode: SchedulingMode = 'quantum_inspired', weights?: Record<string, number>) =>
    request<Schedule>('/scheduling/generate', {
      method: 'POST',
      body: JSON.stringify({ mode, weights }),
    }),
  reoptimizeSchedule: (mode: SchedulingMode = 'quantum_inspired', reason: string = 'Dynamic Floor Event') =>
    request<{
      schedule_id: number;
      version: string;
      mode: string;
      event_reason: string;
      before: { makespan: number; utilization: number; idle_time: number; delayed_jobs: number };
      after: { makespan: number; utilization: number; idle_time: number; delayed_jobs: number };
      delta: { makespan_diff: number; utilization_diff: number; idle_time_diff: number; delayed_jobs_diff: number };
      schedule_operations: any[];
    }>('/scheduling/reoptimize', {
      method: 'POST',
      body: JSON.stringify({ mode, reason }),
    }),
  getScheduleHistory: () =>
    request<Schedule[]>('/scheduling/history'),
  getActiveSchedule: () =>
    request<Schedule>('/scheduling/active'),
  getGanttSchedule: (params?: { machine_id?: number; job_id?: number; priority?: string }) => {
    const q = new URLSearchParams();
    if (params?.machine_id) q.set('machine_id', String(params.machine_id));
    if (params?.job_id) q.set('job_id', String(params.job_id));
    if (params?.priority) q.set('priority', params.priority);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return request<any>(`/scheduling/gantt.php${qs}`);
  },
  updateScheduleOperation: (data: {
    operation_id?: number;
    schedule_operation_id?: number;
    id?: number;
    target_machine_id: number;
    target_start_time?: number;
    auto_shift?: boolean;
  }) =>
    request<{
      schedule: Schedule;
      updated_operation: any;
      makespan: number;
      utilization: number;
    }>('/scheduling/update-operation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  seedSchedule: () =>
    request<Schedule>('/scheduling/seed', { method: 'POST' }),
  undoSchedule: () =>
    request<Schedule>('/scheduling/undo', { method: 'POST' }),
  restoreSchedule: (id: number) =>
    request<Schedule>(`/scheduling/restore/${id}`, { method: 'POST' }),
  compareSchedulers: () =>
    request<ScheduleComparisonResult>('/scheduling/compare'),

  // Analytics
  getUtilization: () =>
    request<{ horizon_hours: number; machines: MachineUtilizationData[] }>('/analytics/utilization'),
  getBottlenecks: () =>
    request<BottleneckCandidate[]>('/analytics/bottlenecks'),

  // Alerts
  getAlerts: (unreadOnly?: boolean) => {
    const qs = unreadOnly ? '?unread=1' : '';
    return request<AlertItem[]>(`/alerts/list${qs}`);
  },
  markAlertRead: (id?: number) =>
    request<null>('/alerts/mark-read', {
      method: 'POST',
      body: JSON.stringify({ id: id || 0 }),
    }),

  // Demo Seed & Reset
  loadDemoFactory: () =>
    request<any>('/demo/seed', { method: 'POST' }),
  seedDemoData: () =>
    request<any>('/demo/seed', { method: 'POST' }),
  resetDemoData: () =>
    request<any>('/demo/reset', { method: 'POST' }),

  // CSV Factory Data Import
  previewCsvImport: (data: { dataType: CsvImportType; csvContent: string; filename?: string }) =>
    request<CsvPreviewValidationResult>('/import/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  commitCsvImport: (data: { dataType: CsvImportType; validRows: any[] }) =>
    request<CsvImportCommitResult>('/import/commit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Real-Time Factory AI Chatbot (Multi-turn + Grounding)
  sendChatMessage: (data: {
    message: string;
    history?: any[];
    groundingMode?: 'factory' | 'search' | 'maps';
    location?: { latitude: number; longitude: number };
  }) =>
    request<{
      reply: string;
      suggestedAction?: any;
      source?: string;
      modelUsed?: string;
      groundingMode?: 'factory' | 'search' | 'maps';
      sources?: Array<{ title?: string; uri?: string; sourceType?: 'web' | 'maps' }>;
    }>('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Export URLs & Settings Base URLs
  getBaseUrl: () => getApiBaseUrl(),
  setBaseUrl: (url: string) => setApiBaseUrl(url),
  resetBaseUrl: () => resetApiBaseUrl(),
  getExportScheduleUrl: () => `${getApiBaseUrl().replace(/\/+$/, '')}/reports/export?type=schedule`,
  getExportUtilizationUrl: () => `${getApiBaseUrl().replace(/\/+$/, '')}/reports/export?type=utilization`,
  getExportLogsUrl: () => `${getApiBaseUrl().replace(/\/+$/, '')}/reports/export?type=logs`,
};
