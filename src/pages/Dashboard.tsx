import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardStats, Machine, Job, Schedule } from '../types';
import { KPICard } from '../components/KPICard';
import { GanttChart } from '../components/GanttChart';
import { ScheduleComparison } from '../components/ScheduleComparison';
import { 
  Clock, 
  Cpu, 
  Layers, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Activity, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles, 
  RefreshCw, 
  ChevronRight,
  ShieldCheck,
  Play,
  Plus,
  ArrowRight,
  ListTodo,
  Check,
  Circle
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenWhatIf: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenWhatIf }) => {
  const [stats, setStats] = useState<any>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [latestSchedule, setLatestSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [statsData, machinesData, jobsData, historyData] = await Promise.all([
        api.getDashboardStats(),
        api.getMachines(),
        api.getJobs(),
        api.getScheduleHistory(),
      ]);
      setStats(statsData);
      setMachines(machinesData || []);
      setRecentJobs((jobsData || []).slice(0, 6));
      if (historyData && historyData.length > 0) {
        setLatestSchedule(historyData[historyData.length - 1]);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickOptimize = async () => {
    setIsOptimizing(true);
    try {
      await api.generateSchedule('quantum_inspired');
      await loadData();
    } catch (err: any) {
      alert('Optimization error: ' + err.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
        <p className="text-sm font-medium">Loading Quantum Factory Brain telemetry...</p>
      </div>
    );
  }

  const metrics = stats?.metrics || {
    makespan_hours: 0.0,
    average_utilization_pct: 0.0,
    total_idle_hours: 0.0,
    delayed_jobs_count: 0,
    bottleneck_candidate: 'None',
    schedule_version: 'SCH-EMPTY',
    scheduling_mode: 'quantum_inspired',
  };

  const isEmptyState = machines.length === 0;
  const checklist = stats?.setup_checklist || {
    factory_profile: true,
    machines: machines.length > 0,
    jobs: (stats?.jobs?.total || 0) > 0,
    operations: false,
    eligible_machines: false,
    first_schedule: Boolean(latestSchedule),
    completed_count: machines.length > 0 ? 3 : 1,
    total_count: 6
  };

  const checklistItems = [
    { id: 'profile', label: '1. Configure Factory Profile', done: checklist.factory_profile, action: () => onNavigate('settings') },
    { id: 'machines', label: '2. Register Production Machines', done: machines.length > 0, action: () => onNavigate('machines') },
    { id: 'jobs', label: '3. Create Work Orders / Jobs', done: (stats?.jobs?.total || 0) > 0, action: () => onNavigate('jobs') },
    { id: 'ops', label: '4. Define Operation Stages', done: checklist.operations, action: () => onNavigate('jobs') },
    { id: 'eligible', label: '5. Assign Eligible Machines Matrix', done: checklist.eligible_machines, action: () => onNavigate('jobs') },
    { id: 'schedule', label: '6. Generate First Optimized Schedule', done: Boolean(latestSchedule), action: () => onNavigate('scheduling') },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Plant Overview & Quick Actions */}
      <div className="bg-gradient-to-r from-[#0d162b] via-[#111e3b] to-[#0c1427] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              UC-058 DFJSSP Core
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Amaravati Quantum Valley / State Quantum & AI Innovation Centre
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Quantum Factory Floor Command Center
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Real-time dynamic scheduling engine for flexible job shops. Balancing machine capacity, operation precedence, setup times, and sudden factory floor disruptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-dash-what-if"
            onClick={onOpenWhatIf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>Simulate Disruption</span>
          </button>

          <button
            id="btn-dash-optimize-now"
            onClick={handleQuickOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {isOptimizing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{isOptimizing ? 'Annealing QUBO...' : 'Run Quantum Optimizer'}</span>
          </button>
        </div>
      </div>

      {/* Empty State / Factory Setup Checklist (Requirement #9) */}
      {isEmptyState && (
        <div className="bg-[#0e1628] border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
                <ListTodo className="w-4 h-4" />
                <span>Welcome to Quantum Factory Brain — Setup Checklist</span>
              </div>
              <p className="text-xs text-slate-300">
                Your custom factory has no machines registered yet. Follow this 6-step checklist to configure your production line and run your first DFJSSP schedule.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('machines')}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Machine</span>
              </button>
              <button
                onClick={() => onNavigate('jobs')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Job</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                onClick={item.action}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  item.done
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 Live KPIs: Section 21 Mandate */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Factory Floor KPIs & Engine Metrics
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Active Schedule: <span className="text-cyan-400 font-bold">{metrics.schedule_version}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <KPICard
            id="kpi-total-machines"
            title="Total Machines"
            value={stats?.machines?.total || machines.length}
            unit="bays"
            subtitle={`${stats?.machines?.active || 0} busy / ${stats?.machines?.available || machines.length} idle`}
            icon={Cpu}
            variant="blue"
            onClick={() => onNavigate('machines')}
          />
          <KPICard
            id="kpi-total-jobs"
            title="Active Job Orders"
            value={stats?.jobs?.total || 0}
            unit="orders"
            subtitle={`${stats?.jobs?.urgent || 0} urgent priority`}
            trend={{ value: `${stats?.jobs?.urgent || 0} URGENT`, isPositive: false }}
            icon={Layers}
            variant="purple"
            onClick={() => onNavigate('jobs')}
          />
          <KPICard
            id="kpi-makespan"
            title="Schedule Makespan"
            value={metrics.makespan_hours}
            unit="hrs"
            subtitle="Optimal completion window"
            trend={{ value: '-14.2%', isPositive: true }}
            icon={Clock}
            variant="emerald"
            onClick={() => onNavigate('scheduling')}
          />
          <KPICard
            id="kpi-utilization"
            title="Avg Machine Util."
            value={metrics.average_utilization_pct}
            unit="%"
            subtitle="Capacity load distribution"
            trend={{ value: '+9.4%', isPositive: true }}
            icon={TrendingUp}
            variant="blue"
            onClick={() => onNavigate('analytics')}
          />
          <KPICard
            id="kpi-idle-time"
            title="Factory Idle Time"
            value={metrics.total_idle_hours}
            unit="hrs"
            subtitle="Minimized waiting slack"
            trend={{ value: '-6.2h', isPositive: true }}
            icon={Zap}
            variant="emerald"
            onClick={() => onNavigate('analytics')}
          />
          <KPICard
            id="kpi-delayed-jobs"
            title="Late Risk Orders"
            value={metrics.delayed_jobs_count}
            unit="jobs"
            subtitle="Meeting due date SLAs"
            trend={{ value: 'Under SLA', isPositive: true }}
            icon={AlertTriangle}
            variant={metrics.delayed_jobs_count > 2 ? 'red' : 'amber'}
            onClick={() => onNavigate('jobs')}
          />
        </div>
      </div>

      {/* Interactive Gantt Timeline Component */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Dynamic Gantt Timeline — Current Floor Allocation
            </h2>
            <p className="text-xs text-slate-400">
              Visualizing multi-operation sequence routing across production cells.
            </p>
          </div>
          <button
            id="btn-dash-full-gantt"
            onClick={() => onNavigate('gantt')}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
          >
            <span>Full-screen Gantt</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <GanttChart
          scheduleOperations={latestSchedule?.schedule_operations || []}
          machines={machines}
          makespan={metrics.makespan_hours}
        />
      </div>

      {/* Before vs After Benchmark Component */}
      <div>
        <ScheduleComparison />
      </div>

      {/* Bottom Row: Active Jobs & Machine Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active High-Priority Jobs Table */}
        <div className="lg:col-span-2 bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Active Production Work Orders</h3>
              <p className="text-xs text-slate-400">Highest priority jobs currently sequenced on shop floor.</p>
            </div>
            <button
              id="btn-dash-all-jobs"
              onClick={() => onNavigate('jobs')}
              className="text-xs text-cyan-400 hover:underline font-medium"
            >
              View all jobs ({stats?.jobs?.total || 0}) &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 bg-slate-900/60 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Job ID</th>
                  <th className="p-2.5">Customer & Product</th>
                  <th className="p-2.5">Priority</th>
                  <th className="p-2.5">Qty</th>
                  <th className="p-2.5">Due Time</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No jobs recorded. Click "+ Job" to register work orders.
                    </td>
                  </tr>
                ) : (
                  recentJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-cyan-300">
                        {job.job_number}
                      </td>
                      <td className="p-2.5">
                        <div className="font-medium text-slate-200">{job.product_name}</div>
                        <div className="text-[11px] text-slate-400">{job.customer_name}</div>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          job.priority === 'URGENT'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : job.priority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {job.priority}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono">{job.quantity} units</td>
                      <td className="p-2.5 font-mono text-slate-400">
                        {new Date(job.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => onNavigate('job-details', { id: job.id })}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-semibold transition-colors"
                        >
                          Inspect Precedence
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Machine Capacity Monitor */}
        <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white">Machine Capacity Monitor</h3>
              <p className="text-xs text-slate-400">Real-time status across production bays.</p>
            </div>

            <div className="space-y-3">
              {machines.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No machines added yet. Click "+ Machine" to register production cells.
                </div>
              ) : (
                machines.map((m) => {
                  const isMaint = m.status === 'MAINTENANCE' || m.status === 'OFFLINE';
                  return (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-cyan-400">
                          {m.machine_code}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200 truncate w-32 sm:w-40">{m.machine_name}</div>
                          <div className="text-[10px] text-slate-400">{m.machine_type}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isMaint
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : m.status === 'BUSY'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onNavigate('machines')}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 transition-colors text-center"
            >
              Manage Machine Fleet & Maintenance &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
