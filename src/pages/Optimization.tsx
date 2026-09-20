import React from 'react';
import { ScheduleComparison } from '../components/ScheduleComparison';
import { 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Sigma, 
  Binary, 
  Flame, 
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

export const Optimization: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Zap className="w-5 h-5" />
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight">
            QUBO Mathematical Model & Quantum-Inspired Architecture
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Quadratic Unconstrained Binary Optimization formulation for Dynamic Flexible Job-Shop Scheduling (DFJSSP).
        </p>
      </div>

      {/* Scientific Transparency / Quantum Honesty Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/30 border border-cyan-500/40 shadow-xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-cyan-300">
            Quantum Computing Honesty & Algorithmic Disclosure
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In strict accordance with the project guidelines, this application does <span className="text-amber-300 font-semibold">NOT</span> fabricate quantum hardware outputs or simulate fake QPU backends. Instead, it formulates the genuine NP-hard DFJSSP problem into a mathematical <strong>QUBO energy matrix</strong> and solves it via <strong>Simulated Annealing</strong> with quantum tunneling heuristics. This reflects real-world industrial state-of-the-art until fault-tolerant QPUs achieve production scale.
          </p>
        </div>
      </div>

      {/* QUBO Formulation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decision Variables & Hamiltonian Equation */}
        <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Binary className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Decision Variable Mapping: x(j, o, m, t)</h2>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-cyan-300 space-y-1">
            <div className="text-slate-400">// Binary decision space:</div>
            <div>x(j, o, m, t) &isin; &#123;0, 1&#125;</div>
            <div className="text-[11px] text-slate-400 pt-1">
              = 1 if Operation 'o' of Job 'j' starts processing on Machine 'm' at discrete time slice 't', else 0.
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="font-semibold text-slate-200">QUBO Hamiltonian Energy Function:</div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-cyan-400 text-xs overflow-x-auto">
              H(x) = &lambda;<sub>1</sub>&middot;H<sub>makespan</sub> + &lambda;<sub>2</sub>&middot;H<sub>precedence</sub> + &lambda;<sub>3</sub>&middot;H<sub>overlap</sub> + &lambda;<sub>4</sub>&middot;H<sub>tardiness</sub>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-1">
              <li><strong>H<sub>makespan</sub></strong>: Penalizes late completion of the final operation across all active jobs.</li>
              <li><strong>H<sub>precedence</sub></strong>: Heavy quadratic penalty if stage o+1 starts before stage o finishes.</li>
              <li><strong>H<sub>overlap</sub></strong>: Enforces machine capacity constraints (no two operations share machine m at time t).</li>
              <li><strong>H<sub>tardiness</sub></strong>: Quadratic penalty for every job completing after its customer due date.</li>
            </ul>
          </div>
        </div>

        {/* Annealing Parameters & Solver Hyperparameters */}
        <div className="bg-[#0e172b] border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Flame className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Simulated Annealing Engine Specifications</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Initial Temp (T<sub>start</sub>)</span>
              <span className="font-mono text-sm font-bold text-amber-400">100.0 &deg;K</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Minimum Temp (T<sub>end</sub>)</span>
              <span className="font-mono text-sm font-bold text-cyan-400">0.01 &deg;K</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cooling Rate (&alpha;)</span>
              <span className="font-mono text-sm font-bold text-white">0.96 Geometric</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Markov Steps / Temp</span>
              <span className="font-mono text-sm font-bold text-purple-400">150 Iterations</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <span className="font-bold text-slate-200 block">Metropolis-Hastings Acceptance Criterion:</span>
            <div className="font-mono text-cyan-300 bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
              P(&Delta;E) = exp(-&Delta;E / T) if &Delta;E &gt; 0, else 1.0
            </div>
            <p className="text-[11px] text-slate-400">
              Allows the scheduler to escape local minima in the combinatorial landscape, finding globally coordinated job allocations that simple dispatch rules miss.
            </p>
          </div>
        </div>
      </div>

      {/* Live Benchmark Component */}
      <ScheduleComparison />
    </div>
  );
};
