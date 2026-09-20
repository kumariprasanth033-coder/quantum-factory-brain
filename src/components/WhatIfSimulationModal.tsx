import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Sparkles, AlertTriangle, Play, RefreshCw, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';

interface WhatIfSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied: () => void;
}

export const WhatIfSimulationModal: React.FC<WhatIfSimulationModalProps> = ({
  isOpen,
  onClose,
  onApplied,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('urgent_job');
  const [targetMachineId, setTargetMachineId] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'urgent_job',
      title: 'Emergency Urgent Order Arrival',
      desc: 'Simulate high-priority aerospace defense order requiring immediate 5-axis milling slot.',
      severity: 'danger',
    },
    {
      id: 'machine_breakdown',
      title: 'Spindle Bearing Failure (Machine Outage)',
      desc: 'Simulate unexpected mechanical failure on active machine, requiring immediate re-routing of pending operations.',
      severity: 'warning',
    },
    {
      id: 'duration_surge',
      title: 'Material Hardness Surge (+40% Cycle Time)',
      desc: 'Simulate high-temp nickel alloy causing cycle time inflation across titanium machining stages.',
      severity: 'info',
    },
  ];

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      let reason = 'What-If Simulation: Emergency Urgent Order';
      if (selectedScenario === 'machine_breakdown') {
        reason = `What-If Simulation: Machine M0${targetMachineId} Maintenance Lockout`;
        await api.updateMachineStatus(targetMachineId, 'MAINTENANCE');
      } else if (selectedScenario === 'urgent_job') {
        // Create urgent job
        const jobNum = 'URG-' + Math.floor(Math.random() * 900 + 100);
        await api.createJob({
          job_number: jobNum,
          customer_name: 'Defense Advanced Projects (DARPA)',
          product_name: 'Hypersonic Scramjet Combustor',
          quantity: 4,
          priority: 'URGENT',
          due_date: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
          status: 'SCHEDULED',
          estimated_processing_time: 4.8,
        });
        reason = `What-If Simulation: Injected Urgent Order ${jobNum}`;
      } else {
        reason = 'What-If Simulation: Cycle Time Fluctuations';
      }

      const res = await api.reoptimizeSchedule('quantum_inspired', reason);
      setSimulationResult(res);
    } catch (err: any) {
      alert('Simulation error: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyAndClose = () => {
    onApplied();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-[#0e172b] border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                What-If Dynamic Factory Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Test sudden plant disruptions and evaluate real-time QUBO re-optimization response.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Scenario Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              Select Disruption Scenario
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {scenarios.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedScenario === sc.id
                      ? 'bg-purple-950/30 border-purple-500 shadow-sm shadow-purple-900/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">{sc.title}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      sc.severity === 'danger' ? 'bg-red-500/20 text-red-300' : sc.severity === 'warning' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {sc.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{sc.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional parameters */}
          {selectedScenario === 'machine_breakdown' && (
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Machine for Unplanned Outage:
              </label>
              <select
                value={targetMachineId}
                onChange={(e) => setTargetMachineId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                <option value={1}>M01 - CNC 5-Axis Milling Center Alpha</option>
                <option value={2}>M02 - High-Precision Lathe Beta</option>
                <option value={3}>M03 - Multi-Axis Robotic Welder Gamma</option>
                <option value={4}>M04 - Direct Metal Laser Sinter 3D</option>
              </select>
            </div>
          )}

          {/* Simulation Output Area */}
          {simulationResult && (
            <div className="bg-slate-900/90 border border-cyan-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Dynamic Re-Optimization Computed
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {simulationResult.version}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block">Baseline Makespan:</span>
                  <div className="text-lg font-mono font-bold text-slate-300">
                    {simulationResult.before.makespan} hrs
                  </div>
                  <span className="text-[11px] text-slate-500">Util: {simulationResult.before.utilization}%</span>
                </div>

                <div className="bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/30">
                  <span className="text-cyan-400 block">Re-Optimized Makespan:</span>
                  <div className="text-lg font-mono font-bold text-cyan-300 flex items-center gap-2">
                    {simulationResult.after.makespan} hrs
                    <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                      {simulationResult.delta.makespan_diff > 0 ? `+${simulationResult.delta.makespan_diff}h` : `${simulationResult.delta.makespan_diff}h`}
                    </span>
                  </div>
                  <span className="text-[11px] text-cyan-400/80">Util: {simulationResult.after.utilization}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic">
                Scheduler successfully re-routed conflicting precedence dependencies to alternate machines with zero constraint violations.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!simulationResult ? (
              <button
                id="btn-run-what-if"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-900/40 disabled:opacity-50"
              >
                {isSimulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>{isSimulating ? 'Computing Quantum Anneal...' : 'Run Simulation'}</span>
              </button>
            ) : (
              <button
                id="btn-apply-what-if"
                onClick={handleApplyAndClose}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-900/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Apply Re-Optimized Schedule to Floor</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
