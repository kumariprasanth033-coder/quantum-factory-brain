import { 
  DashboardStats, 
  Machine, 
  Job, 
  Schedule, 
  AlertItem, 
  BottleneckCandidate, 
  MachineUtilizationData, 
  ScheduleComparisonResult,
  SchedulingMode
} from '../types';

// Default to same-origin /api. Can be switched in Settings to http://localhost/quantum_factory_brain/backend/api
const getApiBaseUrl = (): string => {
  return localStorage.getItem('qfb_api_base_url') || '/api';
};

export const setApiBaseUrl = (url: string) => {
  localStorage.setItem('qfb_api_base_url', url);
};

export const resetApiBaseUrl = () => {
  localStorage.removeItem('qfb_api_base_url');
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config: RequestInit = {
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
    } catch {
      // fallback to status text
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  const json = await response.json();
  if (json.success === false) {
    throw new Error(json.message || 'API request failed');
  }

  return json.data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ user: { id: number; name: string; email: string; role: 'admin' | 'manager' | 'operator' } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: () =>
    request<null>('/auth/logout', { method: 'POST' }),
  getSession: () =>
    request<{ authenticated: boolean; user: any }>('/auth/session'),

  // Dashboard
  getDashboardStats: () =>
    request<DashboardStats>('/dashboard/stats'),

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

  // Demo Seed
  loadDemoFactory: () =>
    request<{ total_machines: number; total_jobs: number; initial_makespan: number }>('/demo/seed', {
      method: 'POST',
    }),
  seedDemoData: () =>
    request<{ total_machines: number; total_jobs: number; initial_makespan: number }>('/demo/seed', {
      method: 'POST',
    }),

  // Export URLs & Settings Base URLs
  getBaseUrl: () => getApiBaseUrl(),
  setBaseUrl: (url: string) => setApiBaseUrl(url),
  resetBaseUrl: () => resetApiBaseUrl(),
  getExportScheduleUrl: () => `${getApiBaseUrl().replace(/\/+$/, '')}/reports/export?type=schedule`,
  getExportUtilizationUrl: () => `${getApiBaseUrl().replace(/\/+$/, '')}/reports/export?type=utilization`,
  getExportLogsUrl: () => `${getApiBaseUrl().replace(/\/+$/, '')}/reports/export?type=logs`,
};
