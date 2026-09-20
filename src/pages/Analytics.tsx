import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MachineUtilizationData, BottleneckCandidate } from '../types';
import { 
  TrendingUp, 
  AlertTriangle, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  BarChart2, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface AnalyticsProps {
  onNavigateToScheduling: () => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigateToScheduling }) => {
  const [utilizationData, setUtilizationData] = useState<MachineUtilizationData[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckCandidate[]>([]);
  const [horizon, setHorizon] = useState<number>(40.0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [uRes, bRes] = await Promise.all([
        api.getUtilization(),
        api.getBottlenecks(),
      ]);
      setUtilizationData(uRes.machines || []);
      setHorizon(uRes.horizon_hours || 40.0);
      setBottlenecks(bRes || []);
    } catch (err: any) {
      alert('Error fetching analytics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-3" />
        <p className="text-xs">Analyzing machine utilization & bottlenecks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Factory Utilization & Bottleneck Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyze machine capacity loading, queue congestions, and proactive mitigations.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Machine Utilization Load Bars */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              Machine Utilization Load Distribution
            </h2>
            <p className="text-xs text-slate-400">
              Scheduling Horizon: <span className="text-cyan-400 font-mono font-bold">{horizon} Hours</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {utilizationData.map((m) => {
            const isCritical = m.utilization_pct >= 85.0;
            return (
              <div key={m.machine_id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-300">{m.machine_code}</span>
                    <span className="font-semibold text-white">{m.machine_name}</span>
                    {isCritical && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        High Load
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-400">Busy: <strong className="text-slate-200">{m.busy_hours}h</strong></span>
                    <span className="text-slate-400">Idle: <strong className="text-slate-200">{m.idle_hours}h</strong></span>
                    <span className={`font-bold text-sm ${isCritical ? 'text-amber-400' : 'text-cyan-400'}`}>
                      {m.utilization_pct}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${m.utilization_pct}%` }}
                    className={`h-full transition-all duration-500 ${
                      isCritical
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottleneck Candidates & Mitigations */}
      <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Shop Floor Bottleneck Detection & Queue Ranking
            </h2>
            <p className="text-xs text-slate-400">
              Identifies production cells with queue congestion exceeding factory baseline average.
            </p>
          </div>
          <button
            onClick={onNavigateToScheduling}
            className="text-xs text-cyan-400 hover:underline font-semibold"
          >
            Adjust Scheduling Weights &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bottlenecks.map((b) => {
            const isSevere = b.severity === 'CRITICAL_BOTTLENECK';
            const isModerate = b.severity === 'MODERATE_BOTTLENECK';

            return (
              <div
                key={b.machine_id}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isSevere
                    ? 'bg-red-950/20 border-red-500/40'
                    : isModerate
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-cyan-300">{b.machine_code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isSevere
                        ? 'bg-red-500/20 text-red-300'
                        : isModerate
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {b.severity.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white mb-2 truncate">{b.machine_name}</h3>

                  <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Queued Ops:</span>
                      <span className="font-mono font-bold text-white">{b.queue_size} tasks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Load:</span>
                      <span className="font-mono font-bold text-cyan-400">{b.total_load_hours} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ratio vs Avg:</span>
                      <span className="font-mono font-bold text-slate-200">{b.load_ratio_vs_avg}x</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-400 italic">
                  &bull; {b.recommendation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
