import React, { useState } from 'react';
import { api } from '../services/api';
import { SchedulingMode, Schedule, SchedulerDiagnosticResult } from '../types';
import { getApiErrorMessage } from '../utils/errorParser';
import { 
  CalendarClock, 
  Zap, 
  Sliders, 
  TrendingUp, 
  CheckCircle2, 
  RefreshCw, 
  Cpu, 
  Clock, 
  ShieldAlert, 
  Play,
  Sparkles,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Activity,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';

interface SchedulingProps {
  onScheduleGenerated: (schedule: Schedule) => void;
  onNavigateToGantt: () => void;
}

export const Scheduling: React.FC<SchedulingProps> = ({ onScheduleGenerated, onNavigateToGantt }) => {
  const [mode, setMode] = useState<SchedulingMode>('quantum_inspired');
  
  // Weights (normalized to 100%)
  const [wMakespan, setWMakespan] = useState<number>(40);
  const [wDelay, setWDelay] = useState<number>(30);
  const [wIdle, setWIdle] = useState<number>(20);
  const [wBottleneck, setWBottleneck] = useState<number>(10);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [undoStatus, setUndoStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Diagnostics Dry-Run State (/api/diagnostics/scheduler)
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<SchedulerDiagnosticResult | null>(null);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);

  const totalWeight = wMakespan + wDelay + wIdle + wBottleneck;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLastResult(null);
    setUndoStatus(null);
    setErrorMessage(null);
    try {
      const weightsObj = {
        makespan: wMakespan / 100,
        delay: wDelay / 100,
        idle: wIdle / 100,
        bottleneck: wBottleneck / 100,
      };
      const result = await api.generateSchedule(mode, weightsObj);
      setLastResult(result);
      const scheduleObj: Schedule = {
        id: result.schedule_id || result.id || 1,
        version: result.version || 'SCH-OPT',
        mode: result.mode || mode,
        makespan: result.makespan,
        utilization: result.utilization,
        idle_time: result.idle_time,
        delayed_jobs: result.delayed_jobs,
        execution_time_ms: result.execution_time_ms,
        created_at: result.created_at || new Date().toISOString(),
        schedule_operations: result.schedule_operations || [],
      };
      onScheduleGenerated(scheduleObj);
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'Scheduling engine failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDynamicReoptimize = async () => {
    setIsGenerating(true);
    setUndoStatus(null);
    setErrorMessage(null);
    try {
      const result = await api.reoptimizeSchedule(mode, 'Floor Constraint Adjustment');
      setLastResult(result);
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'Re-optimization failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUndoSchedule = async () => {
    setErrorMessage(null);
    try {
      const prev = await api.undoSchedule();
      setLastResult(prev);
      onScheduleGenerated(prev);
      setUndoStatus(`Undo applied: Reverted to schedule ${prev.version} (Makespan: ${prev.makespan}h)`);
      setTimeout(() => setUndoStatus(null), 5000);
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'No previous schedule version available to undo to.');
    }
  };

  const handleRunSchedulerDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setErrorMessage(null);
    try {
      const res = await api.getSchedulerDiagnostics();
      setDiagnosticsResult(res);
      setShowDiagnosticsModal(true);
    } catch (err: any) {
      setErrorMessage(getApiErrorMessage(err) || 'Failed to execute scheduler diagnostics');
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Dynamic DFJSSP Scheduling & Optimization Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Formulate multi-objective trade-offs, configure heuristic models, and optimize operation sequences.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="scheduling-diagnostics-btn"
            onClick={handleRunSchedulerDiagnostics}
            disabled={isRunningDiagnostics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/40 text-xs font-semibold hover:bg-purple-600/30 transition-all shadow-sm disabled:opacity-50"
            title="Run isolated dry-run and validation of machines, jobs, and operations"
          >
            <Activity className={`w-3.5 h-3.5 ${isRunningDiagnostics ? 'animate-spin text-purple-400' : ''}`} />
            <span>{isRunningDiagnostics ? 'Running Diagnostics...' : 'Dry-Run Diagnostics'}</span>
          </button>

          <button
            id="scheduling-undo-btn"
            onClick={handleUndoSchedule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-all shadow-sm"
            title="Undo to previous schedule version"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Last Run</span>
          </button>
        </div>
      </div>

      {undoStatus && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>{undoStatus}</span>
          </div>
          <button onClick={() => setUndoStatus(null)} className="text-amber-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-300 mb-0.5">Scheduling Engine Notice</div>
              <div className="text-slate-300 leading-relaxed">{errorMessage}</div>
            </div>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/60 border border-slate-700/60"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Solvers & Weights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Solver Mode Picker */}
          <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              1. Optimization Solver Architecture
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Classical */}
              <div
                onClick={() => setMode('classical')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  mode === 'classical'
                    ? 'bg-slate-900 border-cyan-500 shadow-sm'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">Classical Priority</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    SPT / EDD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Greedy priority dispatch. Assigns shortest processing times to earliest available machine.
                </p>
              </div>

              {/* Quantum-Inspired (Highlighted) */}
              <div
                onClick={() => setMode('quantum_inspired')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  mode === 'quantum_inspired'
                    ? 'bg-gradient-to-b from-cyan-950/40 to-blue-950/30 border-cyan-400 shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Quantum-Inspired
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    QUBO
                  </span>
                </div>
                <p className="text-[11px] text-cyan-100/70 leading-relaxed">
                  Simulated annealing on formulated QUBO energy matrix. Optimizes makespan and machine idle time globally.
                </p>
              </div>

              {/* Hybrid */}
              <div
                onClick={() => setMode('hybrid')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  mode === 'hybrid'
                    ? 'bg-slate-900 border-indigo-500 shadow-sm'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-300">Hybrid Heuristic</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Dual
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Seeds initial feasible sequence with classical dispatch, then applies local annealing neighborhoods.
                </p>
              </div>
            </div>

            {/* Quantum Disclosure */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Transparent AI Studio implementation: Classical simulated annealing over Quadratic Unconstrained Binary Optimization equations.
              </span>
            </div>
          </div>

          {/* Multi-Objective Weights Sliders */}
          <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                2. Multi-Objective Function Weights
              </h2>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                totalWeight === 100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Total: {totalWeight}%
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Weight 1: Makespan */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="font-semibold text-slate-200">w1: Minimize Total Makespan</span>
                  <span className="font-mono font-bold text-cyan-400">{wMakespan}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={wMakespan}
                  onChange={(e) => setWMakespan(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Weight 2: Job Delay */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="font-semibold text-slate-200">w2: Minimize Due Date Tardiness / Delays</span>
                  <span className="font-mono font-bold text-purple-400">{wDelay}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={wDelay}
                  onChange={(e) => setWDelay(Number(e.target.value))}
                  className="w-full accent-purple-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Weight 3: Idle Time */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="font-semibold text-slate-200">w3: Minimize Machine Idle Time</span>
                  <span className="font-mono font-bold text-emerald-400">{wIdle}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={wIdle}
                  onChange={(e) => setWIdle(Number(e.target.value))}
                  className="w-full accent-emerald-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Weight 4: Bottleneck Load */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="font-semibold text-slate-200">w4: Level Bottleneck Machine Utilization</span>
                  <span className="font-mono font-bold text-amber-400">{wBottleneck}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={wBottleneck}
                  onChange={(e) => setWBottleneck(Number(e.target.value))}
                  className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Trigger Button */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                id="btn-reopt-trigger"
                onClick={handleDynamicReoptimize}
                disabled={isGenerating}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
              >
                Dynamic Re-Optimize Floor
              </button>

              <button
                id="btn-generate-schedule"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{isGenerating ? 'Annealing Energy Matrix...' : 'Generate Optimized Schedule'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Engine Telemetry Output */}
        <div className="space-y-6">
          <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Solver Execution Telemetry
            </h2>

            {lastResult ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-cyan-300">Generated Schedule</span>
                    <span className="font-mono text-cyan-400 font-semibold">{lastResult.version}</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-white mt-2">
                    {lastResult.makespan || lastResult.after?.makespan} <span className="text-xs text-slate-400">hours</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Target completion time across all active operations
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Utilization Rate:</span>
                    <span className="font-mono font-bold text-white">
                      {lastResult.utilization || lastResult.after?.utilization}%
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Factory Idle Slack:</span>
                    <span className="font-mono font-bold text-white">
                      {lastResult.idle_time || lastResult.after?.idle_time} hrs
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Delayed Jobs:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {lastResult.delayed_jobs !== undefined ? lastResult.delayed_jobs : lastResult.after?.delayed_jobs}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Solve Latency:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {lastResult.execution_time_ms || 42} ms
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    id="btn-undo-solver-result"
                    onClick={handleUndoSchedule}
                    className="py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    title="Undo to previous schedule"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo Run</span>
                  </button>

                  <button
                    onClick={onNavigateToGantt}
                    className="py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Gantt Chart</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                <CalendarClock className="w-8 h-8 mx-auto text-slate-600" />
                <p>Configure objective weights and click Generate Schedule to run the solver.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostics Modal */}
      {showDiagnosticsModal && diagnosticsResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b1329] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  diagnosticsResult.status === 'HEALTHY' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : diagnosticsResult.status === 'WARNING'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Scheduler Diagnostics Dry-Run
                    </h2>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      diagnosticsResult.status === 'HEALTHY'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : diagnosticsResult.status === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {diagnosticsResult.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Endpoint: <code className="text-cyan-300 font-mono">/api/diagnostics/scheduler</code> • Dry-run execution across candidate resources
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {/* Recommendation Banner */}
              <div className={`p-4 rounded-xl border ${
                diagnosticsResult.status === 'HEALTHY'
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                  : diagnosticsResult.status === 'WARNING'
                  ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}>
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  {diagnosticsResult.status === 'HEALTHY' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  Diagnostic Finding & Recommendation
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {diagnosticsResult.recommendation}
                </div>
              </div>

              {/* 3-Column Validation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Machines */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Machines Fleet</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                      diagnosticsResult.machines_validation.status === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {diagnosticsResult.machines_validation.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>Total Registered: <span className="text-white font-semibold font-mono">{diagnosticsResult.machines_validation.total_count}</span></div>
                    <div>Available/Idle: <span className="text-cyan-400 font-semibold font-mono">{diagnosticsResult.machines_validation.available_count}</span></div>
                  </div>
                  {diagnosticsResult.machines_validation.issues.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 text-[10px] text-rose-300 space-y-0.5">
                      {diagnosticsResult.machines_validation.issues.map((iss, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <XCircle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                          <span>{iss}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Jobs */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Work Orders</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                      diagnosticsResult.jobs_validation.status === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : diagnosticsResult.jobs_validation.status === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {diagnosticsResult.jobs_validation.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>Total Jobs: <span className="text-white font-semibold font-mono">{diagnosticsResult.jobs_validation.total_count}</span></div>
                    <div>Schedulable: <span className="text-cyan-400 font-semibold font-mono">{diagnosticsResult.jobs_validation.schedulable_count}</span></div>
                  </div>
                  {diagnosticsResult.jobs_validation.issues.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 text-[10px] text-amber-300 space-y-0.5">
                      {diagnosticsResult.jobs_validation.issues.map((iss, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <span>{iss}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Operations & Eligibility */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Routing Eligibility</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${
                      diagnosticsResult.operations_validation.status === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {diagnosticsResult.operations_validation.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>Total Operations: <span className="text-white font-semibold font-mono">{diagnosticsResult.operations_validation.total_count}</span></div>
                    <div>With Eligible Machines: <span className="text-cyan-400 font-semibold font-mono">{diagnosticsResult.operations_validation.with_eligible_machines}</span></div>
                  </div>
                  {diagnosticsResult.operations_validation.issues.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 text-[10px] text-rose-300 space-y-0.5">
                      {diagnosticsResult.operations_validation.issues.map((iss, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <XCircle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                          <span>{iss}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dry-Run Execution Metrics */}
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-400" />
                    Isolated Dry-Run Execution Outcome
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Latency: <strong className="text-cyan-400">{diagnosticsResult.dry_run_result.execution_time_ms} ms</strong>
                  </span>
                </div>

                {diagnosticsResult.dry_run_result.dry_run_success ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Makespan</div>
                      <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                        {diagnosticsResult.dry_run_result.makespan ?? diagnosticsResult.dry_run_result.details?.makespan ?? 0}h
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Utilization</div>
                      <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                        {diagnosticsResult.dry_run_result.utilization ?? diagnosticsResult.dry_run_result.details?.utilization ?? 0}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Operations</div>
                      <div className="text-base font-bold text-purple-300 font-mono mt-0.5">
                        {diagnosticsResult.dry_run_result.operations_scheduled ?? diagnosticsResult.dry_run_result.details?.operations_scheduled ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <div className="text-[10px] text-slate-400 uppercase font-mono">Algorithm Status</div>
                      <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
                        FEASIBLE
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                    Failed to compute dry-run schedule: {diagnosticsResult.dry_run_result.error || 'Solver formulation violation'}
                  </div>
                )}
              </div>

              {/* Warnings and Errors details */}
              {(diagnosticsResult.errors.length > 0 || diagnosticsResult.warnings.length > 0) && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-200">Identified Gaps</div>
                  {diagnosticsResult.errors.map((err, i) => (
                    <div key={`err-${i}`} className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                  {diagnosticsResult.warnings.map((wrn, i) => (
                    <div key={`wrn-${i}`} className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{wrn}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                {diagnosticsResult.request_id ? `Req ID: ${diagnosticsResult.request_id}` : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunSchedulerDiagnostics}
                  disabled={isRunningDiagnostics}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Activity className={`w-3.5 h-3.5 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
                  <span>Re-test Diagnostics</span>
                </button>
                <button
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
