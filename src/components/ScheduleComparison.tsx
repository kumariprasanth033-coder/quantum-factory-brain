import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ScheduleComparisonResult } from '../types';
import { Zap, Clock, TrendingUp, ShieldAlert, Cpu, CheckCircle2, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';

export const ScheduleComparison: React.FC = () => {
  const [data, setData] = useState<ScheduleComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.compareSchedulers();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to benchmark schedulers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
        <p className="text-sm font-medium">Running Classical vs Quantum-Inspired Optimization Benchmark...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-950/30 border border-red-800 rounded-xl p-6 text-red-300">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Benchmark Execution Error
        </div>
        <p className="text-xs mt-1">{error}</p>
        <button
          onClick={fetchComparison}
          className="mt-3 px-3 py-1.5 bg-red-800/40 border border-red-700 rounded-lg text-xs font-semibold hover:bg-red-800/60"
        >
          Retry Benchmark
        </button>
      </div>
    );
  }

  const { classical_baseline, quantum_inspired, hybrid, advantage } = data;

  return (
    <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Title & Quantum Honesty Disclaimer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-white tracking-tight">
              Optimization Benchmark: Classical vs. Quantum-Inspired
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comparing standard Shortest Processing Time (SPT) dispatch heuristics against Quadratic Unconstrained Binary Optimization (QUBO) annealing.
          </p>
        </div>

        <button
          onClick={fetchComparison}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Run Comparison</span>
        </button>
      </div>

      {/* Honest Quantum Computing Disclosure Box */}
      <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-cyan-300 block">Scientific Transparency & Integrity Statement</span>
          <span className="text-slate-300">
            This module evaluates genuine algorithmic simulated annealing on a formulated Quadratic Unconstrained Binary Optimization (QUBO) energy matrix. No claims of quantum supremacy or physical QPU hardware execution are fabricated. Algorithms simulate quantum tunneling heuristics classically.
          </span>
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Classical Baseline */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Classical Baseline
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
              Heuristic / SPT
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-500">Makespan (Hours)</span>
              <div className="text-2xl font-bold font-mono text-slate-200">{classical_baseline.makespan} hrs</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/50 p-2 rounded-lg">
                <span className="text-slate-500 block">Machine Util.</span>
                <span className="font-mono font-bold text-slate-300">{classical_baseline.utilization}%</span>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg">
                <span className="text-slate-500 block">Idle Hours</span>
                <span className="font-mono font-bold text-slate-300">{classical_baseline.idle_time} hrs</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-500">Delayed Jobs:</span>
              <span className="font-mono text-amber-400 font-bold">{classical_baseline.delayed_jobs}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Solve Latency:</span>
              <span className="font-mono">{classical_baseline.execution_time_ms} ms</span>
            </div>
          </div>
        </div>

        {/* Quantum-Inspired Optimization (Winner Card) */}
        <div className="bg-gradient-to-b from-cyan-950/30 to-blue-950/20 border-2 border-cyan-500/50 rounded-xl p-5 relative overflow-hidden shadow-lg shadow-cyan-950/50">
          <div className="absolute top-0 right-0 bg-cyan-500 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-bl-lg font-mono">
            Optimal
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Quantum-Inspired
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-cyan-300/80">Makespan (Hours)</span>
              <div className="text-2xl font-bold font-mono text-cyan-300 flex items-center gap-2">
                {quantum_inspired.makespan} hrs
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  -{advantage.makespan_reduction_pct}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-cyan-900/30 border border-cyan-500/20 p-2 rounded-lg">
                <span className="text-cyan-400 block">Machine Util.</span>
                <span className="font-mono font-bold text-white">{quantum_inspired.utilization}%</span>
              </div>
              <div className="bg-cyan-900/30 border border-cyan-500/20 p-2 rounded-lg">
                <span className="text-cyan-400 block">Idle Hours</span>
                <span className="font-mono font-bold text-white">{quantum_inspired.idle_time} hrs</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-cyan-800/40">
              <span className="text-cyan-300/80">Delayed Jobs:</span>
              <span className="font-mono text-emerald-400 font-bold">{quantum_inspired.delayed_jobs}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-cyan-300/80">
              <span>QUBO Annealing Time:</span>
              <span className="font-mono">{quantum_inspired.execution_time_ms} ms</span>
            </div>
          </div>
        </div>

        {/* Hybrid Solver */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider font-mono">
              Hybrid Solver
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
              Classical + QUBO
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-500">Makespan (Hours)</span>
              <div className="text-2xl font-bold font-mono text-slate-200">{hybrid.makespan} hrs</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/50 p-2 rounded-lg">
                <span className="text-slate-500 block">Machine Util.</span>
                <span className="font-mono font-bold text-slate-300">{hybrid.utilization}%</span>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg">
                <span className="text-slate-500 block">Idle Hours</span>
                <span className="font-mono font-bold text-slate-300">{hybrid.idle_time} hrs</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-500">Delayed Jobs:</span>
              <span className="font-mono text-cyan-400 font-bold">{hybrid.delayed_jobs}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Solve Latency:</span>
              <span className="font-mono">{hybrid.execution_time_ms} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Value Summary Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Makespan Saved</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {advantage.makespan_reduction_hours} Hours
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Throughput Gain</span>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
            +{advantage.utilization_gain_pct}%
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Idle Hours Slashed</span>
          <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
            {advantage.idle_time_saved_hours} Hours
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-semibold">Late Orders Prevented</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
            {advantage.delay_reduction_jobs} Jobs
          </div>
        </div>
      </div>
    </div>
  );
};
